import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Map, {
  Marker,
  Popup,
  type MapRef,
  NavigationControl,
} from 'react-map-gl/maplibre';
import type { MaplibreTerradrawControl } from '@watergis/maplibre-gl-terradraw';
import type maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import axios from 'axios';
import { throttle } from 'throttle-debounce';
import {
  fetchReverseGeocode,
  updateInclineDeclineTotal,
} from '@/actions/directions-actions';
import { fetchReverseGeocodeIso } from '@/actions/isochrones-actions';
import { updateSettings } from '@/actions/common-actions';
import {
  VALHALLA_OSM_URL,
  buildHeightRequest,
  buildLocateRequest,
} from '@/utils/valhalla';
import { buildHeightgraphData } from '@/utils/heightgraph';
import HeightGraph from '@/components/heightgraph';
import { DrawControl } from './draw-control';
import type { AppDispatch, RootState } from '@/store';
import type { ParsedDirectionsGeometry, Summary } from '@/components/types';
import type { Feature, FeatureCollection, LineString } from 'geojson';
import { Button } from '@/components/ui/button';

import mapStyle from './style.json';
import cartoStyle from './carto.json';
import { MapStyleControl, getInitialMapStyle } from './map-style-control';
import { RouteLines } from './parts/route-lines';
import { HighlightSegment } from './parts/highlight-segment';
import { IsochronePolygons } from './parts/isochrone-polygons';
import { IsochroneLocations } from './parts/isochrone-locations';
import { HeightgraphHoverMarker } from './parts/heightgraph-hover-marker';
import { BrandLogos } from './parts/brand-logos';
import { MapInfoPopup } from './parts/map-info-popup';
import { MapContextMenu } from './parts/map-context-menu';
import { RouteHoverPopup } from './parts/route-hover-popup';
import { MarkerIcon, type MarkerColor } from './parts/marker-icon';
import { maxBounds, routeObjects } from './constants';
import { getInitialMapPosition, LAST_CENTER_KEY } from './utils';

const { center, zoom: zoom_initial } = getInitialMapPosition();

interface MarkerData {
  id: string;
  lng: number;
  lat: number;
  type: 'waypoint' | 'isocenter';
  index?: number;
  title?: string;
  color?: MarkerColor;
  shape?: string;
  number?: string;
}

export const MapComponent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { profile, activeTab, coordinates, showDirectionsPanel, showSettings } =
    useSelector((state: RootState) => state.common);
  const directions = useSelector((state: RootState) => state.directions);
  const isochrones = useSelector((state: RootState) => state.isochrones);
  const [showPopup, setShowPopup] = useState(false);
  const [isLocateLoading, setIsLocateLoading] = useState(false);
  const [isHeightLoading, setIsHeightLoading] = useState(false);
  const [locate, setLocate] = useState([]);
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [popupLngLat, setPopupLngLat] = useState<{
    lng: number;
    lat: number;
  } | null>(null);
  const [elevation, setElevation] = useState('');
  const [heightPayload, setHeightPayload] = useState<{
    range: boolean;
    shape: { lat: number; lon: number }[];
    id: string;
  } | null>(null);
  const [heightgraphData, setHeightgraphData] = useState<FeatureCollection[]>(
    []
  );
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [routeGeoJSON, setRouteGeoJSON] = useState<FeatureCollection | null>(
    null
  );
  const [isochroneGeoJSON, setIsochroneGeoJSON] =
    useState<FeatureCollection | null>(null);
  const [isoLocationsGeoJSON, setIsoLocationsGeoJSON] =
    useState<FeatureCollection | null>(null);
  const [highlightSegmentGeoJSON, setHighlightSegmentGeoJSON] =
    useState<Feature<LineString> | null>(null);
  const [heightgraphHoverDistance, setHeightgraphHoverDistance] = useState<
    number | null
  >(null);
  const [routeHoverPopup, setRouteHoverPopup] = useState<{
    lng: number;
    lat: number;
    summary: Summary;
  } | null>(null);
  const [viewState, setViewState] = useState({
    longitude: center[0],
    latitude: center[1],
    zoom: zoom_initial,
  });
  const [currentMapStyle, setCurrentMapStyle] = useState<
    'shortbread' | 'carto'
  >(getInitialMapStyle);

  const mapRef = useRef<MapRef>(null);
  const drawRef = useRef<MaplibreTerradrawControl | null>(null);
  const touchStartTimeRef = useRef<number | null>(null);
  const touchLocationRef = useRef<{ x: number; y: number } | null>(null);
  const handledLongPressRef = useRef<boolean>(false);

  const throttledSetHeightgraphHoverDistance = useMemo(
    () => throttle(50, setHeightgraphHoverDistance),
    []
  );

  const handleStyleChange = useCallback((style: 'shortbread' | 'carto') => {
    setCurrentMapStyle(style);

    // Update URL params (only add 'style' param if not shortbread)
    const url = new URL(window.location.href);
    if (style === 'carto') {
      url.searchParams.set('style', 'carto');
    } else {
      // Remove style param for shortbread (it's the default)
      url.searchParams.delete('style');
    }
    window.history.replaceState({}, '', url.toString());
  }, []);

  const updateExcludePolygons = useCallback(() => {
    if (!drawRef.current) return;
    const terraDrawInstance = drawRef.current.getTerraDrawInstance();
    if (!terraDrawInstance) return;

    const snapshot = terraDrawInstance.getSnapshot();
    const excludePolygons: number[][][] = [];

    snapshot.forEach((feature) => {
      if (feature.geometry.type === 'Polygon') {
        const coords = feature.geometry.coordinates[0];
        if (coords) {
          const lngLatArray = coords.map((coord) => [
            coord[0] ?? 0,
            coord[1] ?? 0,
          ]);
          excludePolygons.push(lngLatArray);
        }
      }
    });

    dispatch(
      updateSettings({
        name: 'exclude_polygons',
        value: excludePolygons as unknown as string,
      })
    );
  }, [dispatch]);

  const updateWaypointPosition = useCallback(
    (object: {
      latLng: { lat: number; lng: number };
      index: number;
      fromDrag?: boolean;
    }) => {
      dispatch(fetchReverseGeocode(object));
    },
    [dispatch]
  );

  const updateIsoPosition = useCallback(
    (lng: number, lat: number) => {
      dispatch(fetchReverseGeocodeIso(lng, lat));
    },
    [dispatch]
  );

  const handleOpenOSM = useCallback(() => {
    if (!mapRef.current) return;
    const { lng, lat } = mapRef.current.getCenter();
    const zoom = mapRef.current.getZoom();
    const osmURL = `https://www.openstreetmap.org/#map=${zoom}/${lat}/${lng}`;
    window.open(osmURL, '_blank');
  }, []);

  const getHeight = useCallback((lng: number, lat: number) => {
    setIsHeightLoading(true);
    axios
      .post(VALHALLA_OSM_URL + '/height', buildHeightRequest([[lat, lng]]), {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then(({ data }) => {
        if ('height' in data) {
          setElevation(data.height[0] + ' m');
        }
      })
      .catch(({ response }) => {
        console.log(response);
      })
      .finally(() => {
        setIsHeightLoading(false);
      });
  }, []);

  const getLocate = useCallback(
    (lng: number, lat: number) => {
      setIsLocateLoading(true);
      axios
        .post(
          VALHALLA_OSM_URL + '/locate',
          buildLocateRequest({ lng, lat }, profile),
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        .then(({ data }) => {
          setLocate(data);
        })
        .catch(({ response }) => {
          console.log(response);
        })
        .finally(() => {
          setIsLocateLoading(false);
        });
    },
    [profile]
  );

  const handleAddWaypoint = useCallback(
    (index: number) => {
      if (!popupLngLat) return;
      setShowPopup(false);
      updateWaypointPosition({
        latLng: { lat: popupLngLat.lat, lng: popupLngLat.lng },
        index: index,
      });
    },
    [popupLngLat, updateWaypointPosition]
  );

  const handleAddIsoWaypoint = useCallback(() => {
    if (!popupLngLat) return;
    setShowPopup(false);
    updateIsoPosition(popupLngLat.lng, popupLngLat.lat);
  }, [popupLngLat, updateIsoPosition]);

  const getHeightData = useCallback(() => {
    const { results } = directions;

    if (!results[VALHALLA_OSM_URL!]?.data?.decodedGeometry) return;

    const heightPayloadNew = buildHeightRequest(
      results[VALHALLA_OSM_URL!]!.data.decodedGeometry as [number, number][]
    );

    if (JSON.stringify(heightPayload) !== JSON.stringify(heightPayloadNew)) {
      setIsHeightLoading(true);
      setHeightPayload(heightPayloadNew);
      axios
        .post(VALHALLA_OSM_URL + '/height', heightPayloadNew, {
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then(({ data }) => {
          const reversedGeometry = JSON.parse(
            JSON.stringify(results[VALHALLA_OSM_URL!]!.data.decodedGeometry)
          ).map((pair: number[]) => {
            return [...pair.reverse()];
          });
          const heightData = buildHeightgraphData(
            reversedGeometry,
            data.range_height
          );
          const { inclineTotal, declineTotal } = heightData[0]!.properties;
          dispatch(
            updateInclineDeclineTotal({
              inclineTotal,
              declineTotal,
            })
          );
          setHeightgraphData(heightData);
        })
        .catch(({ response }) => {
          console.log(response);
        })
        .finally(() => {
          setIsHeightLoading(false);
        });
    }
  }, [directions, heightPayload, dispatch]);

  // Update markers when waypoints or isochrone centers change
  useEffect(() => {
    const newMarkers: MarkerData[] = [];

    // Add waypoint markers
    const { waypoints } = directions;
    waypoints.forEach((waypoint, index) => {
      waypoint.geocodeResults.forEach((address) => {
        if (address.selected) {
          newMarkers.push({
            id: `waypoint-${index}`,
            lng: address.displaylnglat[0],
            lat: address.displaylnglat[1],
            type: 'waypoint',
            index: index,
            title: address.title,
            color: 'green',
            number: (index + 1).toString(),
          });
        }
      });
    });

    // Add isochrone center marker
    const { geocodeResults } = isochrones;
    geocodeResults.forEach((address) => {
      if (address.selected) {
        newMarkers.push({
          id: 'iso-center',
          lng: address.displaylnglat[0],
          lat: address.displaylnglat[1],
          type: 'isocenter',
          title: address.title,
          color: 'purple',
          shape: 'star',
          number: '1',
        });
      }
    });

    setMarkers(newMarkers);
  }, [
    directions.selectedAddresses,
    isochrones.selectedAddress,
    directions.waypoints,
    isochrones.geocodeResults,
  ]);

  // Update route lines
  useEffect(() => {
    const { results } = directions;

    if (
      !results[VALHALLA_OSM_URL!]?.data ||
      Object.keys(results[VALHALLA_OSM_URL!]!.data).length === 0 ||
      !directions.successful
    ) {
      setRouteGeoJSON(null);
      return;
    }

    const response = results[VALHALLA_OSM_URL!]!.data;
    const showRoutes = results[VALHALLA_OSM_URL!]!.show || {};
    const features: Feature<LineString>[] = [];

    // Add alternates
    if (response.alternates) {
      response.alternates.forEach((alternate, i) => {
        if (!showRoutes[i]) return;
        const coords = (alternate! as ParsedDirectionsGeometry)!
          .decodedGeometry;
        const summary = alternate!.trip.summary;

        features.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: coords.map((c) => [c[1] ?? 0, c[0] ?? 0]),
          },
          properties: {
            color: routeObjects[VALHALLA_OSM_URL!]!.alternativeColor,
            type: 'alternate',
            summary,
          },
        });
      });
    }

    // Add main route
    if (showRoutes[-1] !== false) {
      const coords = response.decodedGeometry;
      const summary = response.trip.summary;

      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coords.map((c) => [c[1] ?? 0, c[0] ?? 0]),
        },
        properties: {
          color: routeObjects[VALHALLA_OSM_URL!]!.color,
          type: 'main',
          summary,
        },
      });
    }

    setRouteGeoJSON({
      type: 'FeatureCollection',
      features,
    });
  }, [directions.results, directions.successful]);

  // Update isochrones
  useEffect(() => {
    const { results } = isochrones;

    if (!results || !isochrones.successful) {
      setIsochroneGeoJSON(null);
      setIsoLocationsGeoJSON(null);
      return;
    }

    const isoFeatures: Feature[] = [];
    const locationFeatures: Feature[] = [];

    for (const provider of [VALHALLA_OSM_URL]) {
      if (
        results[provider!]?.data &&
        Object.keys(results[provider!]!.data).length > 0 &&
        results[provider!]!.show
      ) {
        for (const feature of results[provider!]!.data.features) {
          if (['Polygon', 'MultiPolygon'].includes(feature.geometry.type)) {
            isoFeatures.push({
              ...feature,
              properties: {
                ...feature.properties,
                fillColor: feature.properties?.fill || '#6200ea',
              },
            });
          } else {
            // locations
            if (feature.properties!.type !== 'input') {
              locationFeatures.push(feature);
            }
          }
        }
      }
    }

    setIsochroneGeoJSON({
      type: 'FeatureCollection',
      features: isoFeatures,
    });

    setIsoLocationsGeoJSON({
      type: 'FeatureCollection',
      features: locationFeatures,
    });
  }, [isochrones.results, isochrones.successful]);

  // Update highlight segment
  useEffect(() => {
    const { highlightSegment, results } = directions;

    if (!highlightSegment || !results[VALHALLA_OSM_URL!]?.data) {
      setHighlightSegmentGeoJSON(null);
      return;
    }

    const { startIndex, endIndex, alternate } = highlightSegment;

    let coords;
    if (alternate == -1) {
      coords = results[VALHALLA_OSM_URL!]!.data.decodedGeometry;
    } else {
      if (!results[VALHALLA_OSM_URL!]!.data.alternates?.[alternate]) {
        setHighlightSegmentGeoJSON(null);
        return;
      }
      coords = (results[VALHALLA_OSM_URL!]!.data.alternates?.[
        alternate
      ] as ParsedDirectionsGeometry)!.decodedGeometry;
    }

    if (startIndex > -1 && endIndex > -1 && coords) {
      setHighlightSegmentGeoJSON({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coords
            .slice(startIndex, endIndex + 1)
            .map((c) => [c[1] ?? 0, c[0] ?? 0]),
        },
        properties: {},
      });
    } else {
      setHighlightSegmentGeoJSON(null);
    }
  }, [directions.highlightSegment, directions.results]);

  // Zoom to coordinates
  useEffect(() => {
    if (coordinates && coordinates.length > 0 && mapRef.current) {
      const firstCoord = coordinates[0];
      if (!firstCoord || !firstCoord[0] || !firstCoord[1]) return;

      const bounds: [[number, number], [number, number]] = coordinates.reduce<
        [[number, number], [number, number]]
      >(
        (acc, coord) => {
          if (!coord || !coord[0] || !coord[1]) return acc;
          return [
            [Math.min(acc[0][0], coord[1]), Math.min(acc[0][1], coord[0])],
            [Math.max(acc[1][0], coord[1]), Math.max(acc[1][1], coord[0])],
          ];
        },
        [
          [firstCoord[1], firstCoord[0]],
          [firstCoord[1], firstCoord[0]],
        ]
      );

      const paddingTopLeft = [
        screen.width < 550 ? 50 : showDirectionsPanel ? 420 : 50,
        50,
      ];

      const paddingBottomRight = [
        screen.width < 550 ? 50 : showSettings ? 420 : 50,
        50,
      ];

      mapRef.current.fitBounds(bounds, {
        padding: {
          top: paddingTopLeft[1] as number,
          bottom: paddingBottomRight[1] as number,
          left: paddingTopLeft[0] as number,
          right: paddingBottomRight[0] as number,
        },
        maxZoom: coordinates.length === 1 ? 11 : 18,
      });
    }
  }, [coordinates, showDirectionsPanel, showSettings]);

  // Handle map click
  const handleMapClick = useCallback(
    (event: { lngLat: { lng: number; lat: number } }) => {
      // Prevent click if we just handled a long press
      if (handledLongPressRef.current) {
        handledLongPressRef.current = false;
        return;
      }

      // If context menu is open, just close it
      if (showPopup && !showInfoPopup) {
        setShowPopup(false);
        return;
      }

      // Check if TerraDraw is in an active drawing mode
      if (drawRef.current) {
        const terraDrawInstance = drawRef.current.getTerraDrawInstance();
        if (terraDrawInstance) {
          const mode = terraDrawInstance.getMode();
          if (
            mode === 'polygon' ||
            mode === 'select' ||
            mode === 'delete-selection'
          ) {
            return;
          }
        }
      }

      const { lngLat } = event;
      setPopupLngLat(lngLat);
      setShowPopup(true);
      setShowInfoPopup(true);
      getHeight(lngLat.lng, lngLat.lat);
    },
    [getHeight, showPopup, showInfoPopup]
  );

  // Handle map context menu
  const handleMapContextMenu = useCallback(
    (event: { lngLat: { lng: number; lat: number } }) => {
      const { lngLat } = event;
      setPopupLngLat(lngLat);
      setShowPopup(true);
      setShowInfoPopup(false);
    },
    []
  );

  // Handle move end to save position
  const handleMoveEnd = useCallback(() => {
    if (!mapRef.current) return;
    const { lng, lat } = mapRef.current.getCenter();
    const zoom = mapRef.current.getZoom();

    const last_center = JSON.stringify({
      center: [lat, lng],
      zoom_level: zoom,
    });
    localStorage.setItem(LAST_CENTER_KEY, last_center);
  }, []);

  const handleTouchStart = useCallback((event: maplibregl.MapTouchEvent) => {
    touchStartTimeRef.current = new Date().getTime();
    touchLocationRef.current = { x: event.point.x, y: event.point.y };
    handledLongPressRef.current = false;
  }, []);

  const handleTouchEnd = useCallback(
    (event: maplibregl.MapTouchEvent) => {
      const longTouchTimeMS = 100;
      const acceptableMoveDistance = 20;

      if (touchStartTimeRef.current && touchLocationRef.current) {
        const touchTime = new Date().getTime() - touchStartTimeRef.current;
        const didNotMoveMap =
          Math.abs(event.point.x - touchLocationRef.current.x) <
            acceptableMoveDistance &&
          Math.abs(event.point.y - touchLocationRef.current.y) <
            acceptableMoveDistance;

        if (touchTime > longTouchTimeMS && didNotMoveMap) {
          if (drawRef.current) {
            const terraDrawInstance = drawRef.current.getTerraDrawInstance();
            if (terraDrawInstance) {
              const mode = terraDrawInstance.getMode();
              if (
                mode === 'polygon' ||
                mode === 'select' ||
                mode === 'delete-selection'
              ) {
                touchStartTimeRef.current = null;
                touchLocationRef.current = null;
                return;
              }
            }
          }

          handledLongPressRef.current = true;
          handleMapContextMenu({ lngLat: event.lngLat });
        }
      }

      touchStartTimeRef.current = null;
      touchLocationRef.current = null;
    },
    [handleMapContextMenu]
  );

  // Handle route line hover
  const onRouteLineHover = useCallback(
    (event: maplibregl.MapLayerMouseEvent) => {
      if (!mapRef.current) return;

      const map = mapRef.current.getMap();
      map.getCanvas().style.cursor = 'pointer';

      const feature = event.features?.[0];
      if (feature && feature.properties?.summary) {
        // Parse the summary if it's a string
        const summary =
          typeof feature.properties.summary === 'string'
            ? JSON.parse(feature.properties.summary)
            : feature.properties.summary;

        setRouteHoverPopup({
          lng: event.lngLat.lng,
          lat: event.lngLat.lat,
          summary: summary as Summary,
        });
      }
    },
    []
  );

  const handleMouseMove = useCallback(
    (event: maplibregl.MapLayerMouseEvent) => {
      if (!mapRef.current || showPopup) return; // Don't show if click popup is visible

      const features = event.features;
      // Check if we're hovering over the routes-line layer
      const isOverRoute =
        features &&
        features.length > 0 &&
        features[0]?.layer?.id === 'routes-line';

      if (isOverRoute) {
        onRouteLineHover(event);
      } else {
        // Clear popup and cursor when not over route
        if (routeHoverPopup) {
          setRouteHoverPopup(null);
        }
        const map = mapRef.current.getMap();
        if (map.getCanvas().style.cursor === 'pointer') {
          map.getCanvas().style.cursor = '';
        }
      }
    },
    [showPopup, routeHoverPopup, onRouteLineHover]
  );

  const handleMouseLeave = useCallback(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    map.getCanvas().style.cursor = '';
    setRouteHoverPopup(null);
  }, []);

  return (
    <Map
      ref={mapRef}
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      onMoveEnd={handleMoveEnd}
      onClick={handleMapClick}
      onContextMenu={handleMapContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      interactiveLayerIds={['routes-line']}
      mapStyle={
        (currentMapStyle === 'carto'
          ? cartoStyle
          : mapStyle) as unknown as maplibregl.StyleSpecification
      }
      style={{ width: '100%', height: '100vh' }}
      maxBounds={maxBounds}
      minZoom={2}
      maxZoom={18}
      data-testid="map"
    >
      <NavigationControl />
      <DrawControl onUpdate={updateExcludePolygons} controlRef={drawRef} />
      <MapStyleControl onStyleChange={handleStyleChange} />
      {routeGeoJSON && <RouteLines data={routeGeoJSON} />}
      {highlightSegmentGeoJSON && (
        <HighlightSegment data={highlightSegmentGeoJSON} />
      )}
      {isochroneGeoJSON && <IsochronePolygons data={isochroneGeoJSON} />}
      {isoLocationsGeoJSON && <IsochroneLocations data={isoLocationsGeoJSON} />}
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          longitude={marker.lng}
          latitude={marker.lat}
          anchor="bottom"
          draggable={true}
          onDragEnd={(e) => {
            if (marker.type === 'waypoint') {
              updateWaypointPosition({
                latLng: { lat: e.lngLat.lat, lng: e.lngLat.lng },
                index: marker.index ?? 0,
                fromDrag: true,
              });
            } else if (marker.type === 'isocenter') {
              updateIsoPosition(e.lngLat.lng, e.lngLat.lat);
            }
          }}
        >
          <MarkerIcon color={marker.color!} number={marker.number} />
        </Marker>
      ))}

      <HeightgraphHoverMarker
        hoverDistance={heightgraphHoverDistance}
        heightgraphData={heightgraphData}
      />

      {/* Popup */}
      {showPopup && popupLngLat && (
        <Popup
          longitude={popupLngLat.lng}
          latitude={popupLngLat.lat}
          anchor="bottom"
          onClose={() => {
            setShowPopup(false);
            setLocate([]);
          }}
          closeButton={false}
          closeOnClick={false}
          maxWidth="none"
        >
          {showInfoPopup ? (
            <MapInfoPopup
              popupLngLat={popupLngLat}
              elevation={elevation}
              isHeightLoading={isHeightLoading}
              isLocateLoading={isLocateLoading}
              locate={locate}
              onLocate={getLocate}
              onClose={() => {
                setShowPopup(false);
                setLocate([]);
              }}
            />
          ) : (
            <MapContextMenu
              activeTab={activeTab}
              onAddWaypoint={handleAddWaypoint}
              onAddIsoWaypoint={handleAddIsoWaypoint}
            />
          )}
        </Popup>
      )}

      {routeHoverPopup && (
        <RouteHoverPopup
          lng={routeHoverPopup.lng}
          lat={routeHoverPopup.lat}
          summary={routeHoverPopup.summary}
        />
      )}

      <BrandLogos />

      <Button
        className="absolute bottom-10 right-3 z-10"
        id="osm-button"
        onClick={handleOpenOSM}
      >
        Open OSM
      </Button>

      {directions.successful && (
        <HeightGraph
          data={heightgraphData}
          width={
            showDirectionsPanel
              ? window.innerWidth * 0.75
              : window.innerWidth * 0.9
          }
          height={200}
          onExpand={(expanded) => {
            if (expanded) {
              getHeightData();
            }
          }}
          onHighlight={throttledSetHeightgraphHoverDistance}
        />
      )}
    </Map>
  );
};
