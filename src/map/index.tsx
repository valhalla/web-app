import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
import * as R from 'ramda';
import { Button, Label, Icon, Popup } from 'semantic-ui-react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import MapGL, {
  GeolocateControl,
  NavigationControl,
  Marker,
  Popup as MapPopup,
  Source,
  Layer,
  type MapRef,
  type ViewStateChangeEvent,
} from 'react-map-gl/maplibre';
import maplibregl, { type MapLayerMouseEvent } from 'maplibre-gl';
import {
  fetchReverseGeocode,
  updateInclineDeclineTotal,
  highlightManeuver,
} from '@/actions/directions-actions';
import { fetchReverseGeocodeIso } from '@/actions/isochrones-actions';
import { updateSettings } from '@/actions/common-actions';
import {
  VALHALLA_OSM_URL,
  buildHeightRequest,
  buildLocateRequest,
} from '@/utils/valhalla';
import { buildHeightgraphData } from '@/utils/heightgraph';
// import { formatDuration } from '@/utils/date-time';
import './map.css';
import { convertDDToDMS } from './utils';
import styleJson from '@/map/style.json';
import type { Feature, FeatureCollection, LineString } from 'geojson';
import { TerraDraw } from 'terra-draw';
import makeResizable from '@/utils/resizable';
import type { LastCenterStorageValue } from './types';
import type { RootState } from '@/store';
import type { AnyAction } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';
import type { DirectionsState } from '@/reducers/directions';
import type { IsochroneState } from '@/reducers/isochrones';
import type { Profile } from '@/reducers/common';
import type { ParsedDirectionsGeometry } from '@/common/types';
import { DrawControl } from './draw-control';
import HeightGraph from '@/components/height-graph';

// Layer IDs for MapLibre layers
const LAYER_IDS = {
  routeBg: 'route-bg',
  routeFg: 'route-fg',
  altBgPrefix: 'alt-bg-',
  altFgPrefix: 'alt-fg-',
  highlight: 'route-highlight',
  isoFill: 'iso-fill',
  isoOutline: 'iso-outline',
  isoLocations: 'iso-locations',
};

const routeObjects = {
  [VALHALLA_OSM_URL!]: {
    color: '#0066ff',
    alternativeColor: '#66a3ff',
    name: 'OSM',
  },
};

interface MapProps {
  dispatch: ThunkDispatch<RootState, unknown, AnyAction>;
  directions: DirectionsState;
  isochrones: IsochroneState;
  profile: Profile;
  activeTab: number;
  // Using any to preserve existing store shape while supporting [lat,lng][] arrays
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  coordinates: any;
  showDirectionsPanel: boolean;
  showSettings: boolean;
}

const Map = ({
  dispatch,
  directions,
  isochrones,
  profile,
  activeTab,
  coordinates,
  showDirectionsPanel,
  showSettings,
}: MapProps) => {
  const [showPopup, setShowPopup] = useState(false);
  const [isLocateLoading, setIsLocateLoading] = useState(false);
  const [isHeightLoading, setIsHeightLoading] = useState(false);
  const [locate, setLocate] = useState([]);
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [latLng, setLatLng] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [hasCopied, setHasCopied] = useState(false);
  const [elevation, setElevation] = useState('');
  const [showHeightGraph, setShowHeightGraph] = useState(false);
  const [heightSeries, setHeightSeries] = useState<
    { d: number; h: number }[] | null
  >(null);
  const heightPanelRef = useRef<HTMLDivElement | null>(null);
  const [heightPayload, setHeightPayload] = useState<{
    range: boolean;
    shape: { lat: number; lon: number }[];
    id: string;
  } | null>(null);

  const mapRef = useRef<MapRef>(null);
  const drawRef = useRef<TerraDraw | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const updateExcludePolygons = useCallback(() => {
    const excludePolygons: GeoJSON.GeoJSON[] = [];
    if (drawRef.current) {
      const snapshot = drawRef.current.getSnapshot() as unknown as {
        geometry?: { type?: string; coordinates?: number[][][] };
      }[];
      for (const feature of snapshot) {
        const geom = feature?.geometry as
          | { type?: string; coordinates?: number[][][] }
          | undefined;
        if (geom?.type === 'Polygon' && Array.isArray(geom.coordinates)) {
          // Use outer ring only for exclusion
          const ring = geom.coordinates[0];
          if (Array.isArray(ring)) {
            // Convert to GeoJSON Polygon format
            excludePolygons.push({
              type: 'Polygon',
              coordinates: [ring],
            } as GeoJSON.Polygon);
          }
        }
      }
    }
    const name = 'exclude_polygons';
    const value = excludePolygons;
    dispatch(
      updateSettings({
        name,
        value,
      })
    );
  }, [dispatch]);

  const updateWaypointPosition = useCallback(
    (object) => {
      dispatch(fetchReverseGeocode(object));
    },
    [dispatch]
  );

  const updateIsoPosition = useCallback(
    (coord) => {
      dispatch(fetchReverseGeocodeIso(coord.lng, coord.lat));
    },
    [dispatch]
  );

  const handleCopy = useCallback(() => {
    setHasCopied(true);
    setTimeout(() => {
      setHasCopied(false);
    }, 1000);
  }, []);

  const handleOpenOSM = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const center = map.getCenter();
    const zoom = map.getZoom();
    const osmURL = `https://www.openstreetmap.org/#map=${zoom}/${center.lat}/${center.lng}`;
    window.open(osmURL, '_blank');
  }, []);

  const getHeight = useCallback((position) => {
    setIsHeightLoading(true);
    axios
      .post(
        VALHALLA_OSM_URL + '/height',
        buildHeightRequest([[position.lat, position.lng]]),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      .then(({ data }) => {
        if (!isMountedRef.current) return;
        if ('height' in data) setElevation(data.height[0] + ' m');
      })
      .catch(({ response }) => {
        console.log(response);
      })
      .finally(() => {
        if (!isMountedRef.current) return;
        setIsHeightLoading(false);
      });
  }, []);

  const getLocate = useCallback(
    (position) => {
      setIsLocateLoading(true);
      axios
        .post(
          VALHALLA_OSM_URL + '/locate',
          buildLocateRequest(position, profile),
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        .then(({ data }) => {
          if (!isMountedRef.current) return;
          setLocate(data);
        })
        .catch(({ response }) => {
          console.log(response);
        })
        .finally(() => {
          if (!isMountedRef.current) return;
          setIsLocateLoading(false);
        });
    },
    [profile]
  );

  const handleAddWaypoint = useCallback(
    (_data, e) => {
      setShowPopup(false);
      updateWaypointPosition({
        latLng: latLng,
        index: e.index,
      });
    },
    [latLng, updateWaypointPosition]
  );

  const handleAddIsoWaypoint = useCallback(() => {
    setShowPopup(false);
    updateIsoPosition(latLng);
  }, [latLng, updateIsoPosition]);

  const getHeightData = useCallback(() => {
    const { results } = directions;
    const res = results[VALHALLA_OSM_URL!]?.data as
      | ParsedDirectionsGeometry
      | undefined;

    // Guard: no route decoded geometry available yet
    if (!res?.decodedGeometry || res.decodedGeometry.length === 0) {
      return;
    }

    const heightPayloadNew = buildHeightRequest(
      res.decodedGeometry as [number, number][]
    );

    if (!R.equals(heightPayload, heightPayloadNew)) {
      if (isMountedRef.current) setIsHeightLoading(true);
      if (isMountedRef.current) setHeightPayload(heightPayloadNew);
      axios
        .post(VALHALLA_OSM_URL + '/height', heightPayloadNew, {
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then(({ data }) => {
          if (!isMountedRef.current) return;
          // lets build geojson object with steepness for the height graph
          const reversedGeometry = JSON.parse(
            JSON.stringify(res.decodedGeometry)
          ).map((pair: number[]) => {
            return [...pair.reverse()];
          });
          const heightData = buildHeightgraphData(
            reversedGeometry,
            data.range_height
          );
          // Save series for graph rendering
          if (Array.isArray(data.range_height)) {
            const series = (data.range_height as [number, number][])?.map(
              (p) => ({ d: p[0], h: p[1] })
            );
            setHeightSeries(series || null);
          }
          const { inclineTotal, declineTotal } = heightData[0]!.properties;
          dispatch(
            updateInclineDeclineTotal({
              inclineTotal,
              declineTotal,
            })
          );

          // If you have a custom height graph, you can render using heightData here.
        })
        .catch(({ response }) => {
          console.log(response);
        })
        .finally(() => {
          if (!isMountedRef.current) return;
          setIsHeightLoading(false);
        });
    }
  }, [directions, heightPayload, dispatch]);

  // Clear highlight and hover marker when panel hides or component unmounts
  useEffect(() => {
    if (!showHeightGraph) {
      dispatch(
        highlightManeuver({ startIndex: -1, endIndex: -1, alternate: -1 })
      );
      setHoverMarker(null);
    }
    return () => {
      dispatch(
        highlightManeuver({ startIndex: -1, endIndex: -1, alternate: -1 })
      );
      setHoverMarker(null);
    };
  }, [showHeightGraph, dispatch]);

  // When toggled open and a route exists, fetch height data
  useEffect(() => {
    if (showHeightGraph) {
      getHeightData();
    }
  }, [showHeightGraph, getHeightData]);

  // Make the height panel resizable when mounted
  useEffect(() => {
    const el = heightPanelRef.current;
    if (!el) return;
    const resizer = makeResizable(el, {
      handles: 'w, n, nw',
      minWidth: 380,
      minHeight: 140,
      applyInlineSize: false,
    });
    return () => {
      if (resizer && typeof resizer.destroy === 'function') resizer.destroy();
    };
  }, [showHeightGraph]);

  // Map update functions
  const zoomToCoordinates = useCallback(() => {
    const maxZoom = coordinates.length === 1 ? 11 : 18;
    const paddingTopLeft = [
      (screen.width || 1200) < 550 ? 50 : showDirectionsPanel ? 420 : 50,
      50,
    ];

    const paddingBottomRight = [
      (screen.width || 1200) < 550 ? 50 : showSettings ? 420 : 50,
      50,
    ];

    const map = mapRef.current?.getMap();
    if (!map || !coordinates || (coordinates as unknown[]).length === 0) return;
    const pairs = coordinates as unknown as number[][];
    if (!Array.isArray(pairs[0])) return;
    // coordinates are [lat,lng]; MapLibre expects [lng,lat]
    const lngLats = (pairs as number[][]).map(([lat, lng]) => [lng, lat]);
    const lons = lngLats.map((p) => Number(p[0]));
    const lats = lngLats.map((p) => Number(p[1]));
    const minLng = Math.min(...lons);
    const maxLng = Math.max(...lons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      {
        padding: {
          top: paddingTopLeft[1]!,
          left: paddingTopLeft[0]!,
          right: paddingBottomRight[0]!,
          bottom: paddingBottomRight[1]!,
        },
        maxZoom,
      }
    );
  }, [coordinates, showDirectionsPanel, showSettings]);

  const [flashMarker, setFlashMarker] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [hoverMarker, setHoverMarker] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const zoomTo = useCallback(
    (idx) => {
      const { results } = directions;
      if (!results[VALHALLA_OSM_URL!]?.data?.decodedGeometry) {
        return;
      }
      const coords = results[VALHALLA_OSM_URL!]!.data.decodedGeometry;
      const map = mapRef.current?.getMap();
      if (!map || !coords[idx]) {
        return;
      }
      const [lat, lng] = coords[idx] as [number, number];
      map.easeTo({ center: [lng, lat], zoom: 17 });
      setFlashMarker({ lat, lng });
      setTimeout(() => setFlashMarker(null), 1000);
    },
    [directions]
  );

  // Tooltips are now handled by native MapLibre cursor/HTML overlays if needed

  // Handle map layers updates
  // highlight rendering handled via derived geojson

  // markers rendered directly in JSX

  // marker rendered directly in JSX

  // isochrones rendered via Source/Layer

  // routes rendered via Source/Layer

  // Effect for handling map updates based on prop changes (no-op, rendering is reactive)
  useEffect(() => {
    // reactive rendering; no imperative updates here
  }, [
    directions.selectedAddresses,
    directions.successful,
    directions.results,
    directions.highlightSegment,
    isochrones.selectedAddress,
    isochrones.successful,
    isochrones.results,
  ]);

  // Effect for coordinates changes
  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      zoomToCoordinates();
    }
  }, [coordinates, zoomToCoordinates]);

  // Effect for zoom object changes
  useEffect(() => {
    if (
      directions.zoomObj &&
      directions.zoomObj.index !== undefined &&
      directions.zoomObj.timeNow
    ) {
      zoomTo(directions.zoomObj.index);
    }
  }, [directions.zoomObj, zoomTo]);

  // Derived GeoJSON for routes and highlight
  const routeGeoJson: FeatureCollection | null = useMemo(() => {
    const res = directions.results[VALHALLA_OSM_URL!]?.data as
      | ParsedDirectionsGeometry
      | undefined;
    const show = directions.results[VALHALLA_OSM_URL!]?.show || {};
    if (!res || !res.decodedGeometry || !show['-1']) return null;
    const coords = res.decodedGeometry.map(([lat, lng]) => [lng, lat]);
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: coords } as LineString,
          properties: { type: 'main', summary: res.trip?.summary },
        } as Feature,
      ],
    } as FeatureCollection;
  }, [directions]);

  const alternateGeoJson: FeatureCollection | null = useMemo(() => {
    const res = directions.results[VALHALLA_OSM_URL!]?.data as
      | ParsedDirectionsGeometry
      | undefined;
    const show = directions.results[VALHALLA_OSM_URL!]?.show || {};
    if (!res || !res.alternates) return null;
    const features: Feature[] = [];
    res.alternates.forEach((alt, i) => {
      if (!show[i]) return;
      const g = (alt as ParsedDirectionsGeometry).decodedGeometry;
      if (!g) return;
      const coords = g.map(([lat, lng]) => [lng, lat]);
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords } as LineString,
        properties: { altIndex: i, summary: alt.trip?.summary },
      } as Feature);
    });
    return { type: 'FeatureCollection', features } as FeatureCollection;
  }, [directions]);

  const highlightGeoJson: FeatureCollection | null = useMemo(() => {
    const { highlightSegment, results } = directions;
    const res = results[VALHALLA_OSM_URL!]?.data as
      | ParsedDirectionsGeometry
      | undefined;
    if (!highlightSegment || !res) return null;
    const { startIndex, endIndex, alternate } = highlightSegment;
    let coordsSrc: number[][] | undefined;
    if (alternate === -1) {
      coordsSrc = res.decodedGeometry;
    } else {
      const alt = res.alternates?.[alternate] as
        | ParsedDirectionsGeometry
        | undefined;
      coordsSrc = alt?.decodedGeometry;
    }
    if (!coordsSrc || startIndex < 0 || endIndex < 0) return null;
    const slice = coordsSrc
      .slice(startIndex, endIndex + 1)
      .map(([lat, lng]) => [lng, lat]);
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: slice } as LineString,
          properties: {},
        } as Feature,
      ],
    } as FeatureCollection;
  }, [directions]);

  const isochronesGeo: FeatureCollection | null = useMemo(() => {
    const res = isochrones.results[VALHALLA_OSM_URL!]
      ?.data as unknown as FeatureCollection;
    const show = isochrones.results[VALHALLA_OSM_URL!]?.show;
    if (!res || !show) return null;
    return res as FeatureCollection;
  }, [isochrones]);

  const onMapContextMenu = useCallback((e: MapLayerMouseEvent) => {
    setHasCopied(false);
    setLocate([]);
    setLatLng({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    setShowInfoPopup(false);
    setShowPopup(true);
  }, []);

  const onMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      // Disable map click interactions while drawing polygons
      if (drawRef.current && typeof drawRef.current.getMode === 'function') {
        const mode = drawRef.current.getMode();
        if (mode === 'polygon') {
          return;
        }
      }
      setHasCopied(false);
      setLocate([]);
      const pos = { lat: e.lngLat.lat, lng: e.lngLat.lng };
      getHeight(pos);
      setLatLng(pos);
      setShowInfoPopup(true);
      setShowPopup(true);
    },
    [getHeight]
  );

  const onMoveEnd = useCallback((e: ViewStateChangeEvent) => {
    const c = e.target.getCenter();
    const zoom_level = e.target.getZoom();
    const last_center = JSON.stringify({
      center: [c.lat, c.lng],
      zoom_level,
    });
    localStorage.setItem('last_center', last_center);
  }, []);

  const initialViewState = useMemo(() => {
    const zoom = 10;
    const centerCoords = process.env.REACT_APP_CENTER_COORDS!.split(',');
    const center = [
      parseFloat(centerCoords[0] || '52.51831'),
      parseFloat(centerCoords[1] || '13.393707'),
    ];

    if (localStorage.getItem('last_center')) {
      const last_center = JSON.parse(
        localStorage.getItem('last_center')!
      ) as LastCenterStorageValue;

      return {
        longitude: last_center.center[1],
        latitude: last_center.center[0],
        zoom: last_center.zoom_level,
      };
    }

    return { longitude: center[1], latitude: center[0], zoom: zoom };
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <MapGL
        ref={mapRef}
        initialViewState={initialViewState}
        // onLoad={handleMapLoad}
        onContextMenu={onMapContextMenu}
        onClick={onMapClick}
        onMoveEnd={onMoveEnd}
        style={{ width: '100%', height: '100%' }}
        mapStyle={styleJson as unknown as maplibregl.StyleSpecification}
        maxZoom={18}
        minZoom={2}
      >
        <GeolocateControl
          positionOptions={{ enableHighAccuracy: true }}
          showAccuracyCircle={false}
        />
        <NavigationControl position="top-right" />
        <div
          className="maplibregl-ctrl maplibregl-ctrl-group"
          style={{ position: 'absolute', bottom: 88, right: 10, zIndex: 1 }}
          title="Height Graph"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowHeightGraph((s) => !s);
          }}
        >
          <button type="button">HG</button>
        </div>
        <DrawControl
          setTerraDraw={(td) => {
            drawRef.current = td;
          }}
          onFinish={updateExcludePolygons}
        />

        {/* Brands */}
        <div style={{ position: 'absolute', bottom: 20, left: 10, zIndex: 1 }}>
          <a
            href="https://fossgis.de/news/2021-11-12_funding_valhalla/"
            target="_blank"
            rel="noreferrer"
          >
            <div className="fossgis-logo" />
          </a>
          <a
            href="https://github.com/valhalla/valhalla"
            target="_blank"
            rel="noreferrer"
          >
            <div className="valhalla-logo" />
          </a>
        </div>

        {/* Main route */}
        {routeGeoJson && (
          <Source id="route" type="geojson" data={routeGeoJson}>
            <Layer
              id={LAYER_IDS.routeBg}
              type="line"
              paint={{
                'line-color': '#FFFFFF',
                'line-width': 9,
                'line-opacity': 1,
              }}
            />
            <Layer
              id={LAYER_IDS.routeFg}
              type="line"
              paint={{
                'line-color': routeObjects[VALHALLA_OSM_URL!]!.color,
                'line-width': 5,
                'line-opacity': 1,
              }}
            />
          </Source>
        )}

        {/* Alternates */}
        {alternateGeoJson && alternateGeoJson.features.length > 0 && (
          <Source id="alternates" type="geojson" data={alternateGeoJson}>
            <Layer
              id="alt-bg"
              type="line"
              paint={{
                'line-color': '#FFFFFF',
                'line-width': 9,
                'line-opacity': 1,
              }}
            />
            <Layer
              id="alt-fg"
              type="line"
              paint={{
                'line-color': routeObjects[VALHALLA_OSM_URL!]!.alternativeColor,
                'line-width': 5,
                'line-opacity': 1,
              }}
            />
          </Source>
        )}

        {/* Highlight segment (keep mounted) */}
        <Source
          id="highlight"
          type="geojson"
          data={
            highlightGeoJson ||
            ({ type: 'FeatureCollection', features: [] } as FeatureCollection)
          }
        >
          <Layer
            id={LAYER_IDS.highlight}
            type="line"
            paint={{
              'line-color': '#ffff00',
              'line-width': 8,
              'line-opacity': 1,
              'line-blur': 0.2,
            }}
          />
        </Source>

        {/* Isochrones */}
        {isochronesGeo &&
          isochrones.successful &&
          isochrones.results[VALHALLA_OSM_URL!]?.show && (
            <Source id="isochrones" type="geojson" data={isochronesGeo}>
              <Layer
                id={LAYER_IDS.isoFill}
                type="fill"
                paint={{
                  'fill-color': ['coalesce', ['get', 'color'], '#ffffff'],
                  'fill-opacity': 0.9,
                }}
              />
              <Layer
                id={LAYER_IDS.isoOutline}
                type="line"
                paint={{ 'line-color': '#ffffff', 'line-width': 1 }}
              />
              <Layer
                id={LAYER_IDS.isoLocations}
                type="circle"
                filter={['==', ['get', 'type'], 'location']}
                paint={{
                  'circle-radius': 6,
                  'circle-color': '#ffffff',
                  'circle-stroke-width': 1,
                  'circle-stroke-color': '#000000',
                }}
              />
            </Source>
          )}

        {/* Waypoints markers */}
        {directions.waypoints.map((waypoint, idx) => {
          const selected = waypoint.geocodeResults.find((a) => a.selected);
          if (!selected) return null;
          const [lon, lat] = selected.displaylnglat;
          return (
            <Marker
              key={`wp-${idx}`}
              longitude={lon}
              latitude={lat}
              draggable
              onDragEnd={(e) =>
                updateWaypointPosition({
                  latLng: { lat: e.lngLat.lat, lng: e.lngLat.lng },
                  index: idx,
                  fromDrag: true,
                })
              }
            >
              <div
                style={{
                  background: '#34a853',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                {idx + 1}
              </div>
            </Marker>
          );
        })}

        {/* Iso center marker */}
        {isochrones.geocodeResults.map((addr, i) =>
          addr.selected ? (
            <Marker
              key={`iso-${i}`}
              longitude={addr.displaylnglat[0]}
              latitude={addr.displaylnglat[1]}
              draggable
              onDragEnd={(e) =>
                updateIsoPosition({ lat: e.lngLat.lat, lng: e.lngLat.lng })
              }
            >
              <div
                style={{
                  background: 'purple',
                  color: '#fff',
                  borderRadius: 4,
                  padding: '2px 6px',
                  fontWeight: 700,
                }}
              >
                ★ 1
              </div>
            </Marker>
          ) : null
        )}

        {/* Flash marker for zoomTo */}
        {flashMarker && (
          <Marker longitude={flashMarker.lng} latitude={flashMarker.lat}>
            <div
              style={{
                background: 'blue',
                color: 'white',
                borderRadius: '50%',
                width: 18,
                height: 18,
              }}
            />
          </Marker>
        )}

        {/* Hover marker for height graph */}
        {hoverMarker && (
          <Marker longitude={hoverMarker.lng} latitude={hoverMarker.lat}>
            <div
              style={{
                background: '#111',
                opacity: 0.9,
                borderRadius: '50%',
                width: 12,
                height: 12,
                border: '2px solid #fff',
                boxShadow: '0 0 4px rgba(0,0,0,0.4)',
              }}
            />
          </Marker>
        )}

        {/* Context/Info Popup */}
        {showPopup && latLng && (
          <MapPopup
            longitude={latLng.lng}
            latitude={latLng.lat}
            closeOnClick={false}
            onClose={() => setShowPopup(false)}
            anchor="bottom"
          >
            {showInfoPopup ? (
              <React.Fragment>
                <div>
                  <Button.Group basic size="tiny">
                    <Popup
                      size="tiny"
                      content="Longitude, Latitude"
                      trigger={
                        <Button
                          compact
                          content={
                            latLng.lng.toFixed(6) + ', ' + latLng.lat.toFixed(6)
                          }
                          data-testid="dd-button"
                        />
                      }
                    />
                    <CopyToClipboard
                      text={latLng.lng.toFixed(6) + ',' + latLng.lat.toFixed(6)}
                      onCopy={handleCopy}
                    >
                      <Button compact icon="copy" />
                    </CopyToClipboard>
                  </Button.Group>
                </div>

                <div className="mt1 flex">
                  <Button.Group basic size="tiny">
                    <Popup
                      size="tiny"
                      content="Latitude, Longitude"
                      trigger={
                        <Button
                          compact
                          content={
                            latLng.lat.toFixed(6) + ', ' + latLng.lng.toFixed(6)
                          }
                          data-testid="latlng-button"
                        />
                      }
                    />
                    <CopyToClipboard
                      text={latLng.lat.toFixed(6) + ',' + latLng.lng.toFixed(6)}
                      onCopy={handleCopy}
                    >
                      <Button compact icon="copy" />
                    </CopyToClipboard>
                  </Button.Group>
                </div>
                <div className="mt1 flex">
                  <Button.Group basic size="tiny">
                    <Popup
                      size="tiny"
                      content="Latitude, Longitude"
                      trigger={
                        <Button
                          compact
                          content={
                            convertDDToDMS(latLng.lat) +
                            ' N ' +
                            convertDDToDMS(latLng.lng) +
                            ' E'
                          }
                          data-testid="dms-button"
                        />
                      }
                    />
                    <CopyToClipboard
                      text={
                        convertDDToDMS(latLng.lat) +
                        ' N ' +
                        convertDDToDMS(latLng.lng) +
                        ' E'
                      }
                      onCopy={handleCopy}
                    >
                      <Button compact icon="copy" />
                    </CopyToClipboard>
                  </Button.Group>
                </div>

                <div className="mt1">
                  <Button.Group basic size="tiny">
                    <Popup
                      size="tiny"
                      content="Calls Valhalla's Locate API"
                      trigger={
                        <Button
                          onClick={() => getLocate(latLng)}
                          compact
                          loading={isLocateLoading}
                          icon="cogs"
                          content="Locate Point"
                        />
                      }
                    />
                    <CopyToClipboard
                      text={JSON.stringify(locate)}
                      onCopy={handleCopy}
                    >
                      <Button
                        disabled={locate.length === 0}
                        compact
                        icon="copy"
                      />
                    </CopyToClipboard>
                  </Button.Group>
                </div>
                <div className="mt1">
                  <Button.Group basic size="tiny">
                    <Popup
                      size="tiny"
                      content="Copies a Valhalla location object to clipboard which you can use for your API requests"
                      trigger={
                        <Button
                          compact
                          icon="map marker alternate"
                          content="Valhalla Location JSON"
                        />
                      }
                    />
                    <CopyToClipboard
                      text={`{
                      "lon": ${latLng.lng.toFixed(6)},
                      "lat": ${latLng.lat.toFixed(6)}
                    }`}
                      onCopy={handleCopy}
                    >
                      <Button compact icon="copy" />
                    </CopyToClipboard>
                  </Button.Group>
                </div>
                <div className="mt1 flex justify-between">
                  <Popup
                    size="tiny"
                    content="Elevation at this point"
                    trigger={
                      <Button
                        basic
                        compact
                        size="tiny"
                        loading={isHeightLoading}
                        icon="resize vertical"
                        content={elevation}
                        data-testid="elevation-button"
                      />
                    }
                  />

                  <div>
                    {hasCopied && (
                      <Label size="mini" basic color="green">
                        <Icon name="checkmark" /> copied
                      </Label>
                    )}
                  </div>
                </div>
              </React.Fragment>
            ) : activeTab === 0 ? (
              <Button.Group
                data-testid="button-group-right-context"
                size="small"
                basic
                vertical
              >
                <Button compact index={0} onClick={handleAddWaypoint}>
                  Directions from here
                </Button>
                <Button compact index={1} onClick={handleAddWaypoint}>
                  Add as via point
                </Button>
                <Button compact index={-1} onClick={handleAddWaypoint}>
                  Directions to here
                </Button>
              </Button.Group>
            ) : (
              <Button.Group size="small" basic vertical>
                <Button index={0} onClick={handleAddIsoWaypoint}>
                  Set center here
                </Button>
              </Button.Group>
            )}
          </MapPopup>
        )}

        <button
          className="ui primary button"
          id="osm-button"
          onClick={handleOpenOSM}
        >
          Open OSM
        </button>
      </MapGL>

      {/* Height Graph Panel */}
      {showHeightGraph && heightSeries && (
        <div
          ref={heightPanelRef}
          className="heightgraph-panel"
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 90,
            transform: 'translateX(-50%)',
            width: 640,
            height: 180,
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: 6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            padding: 10,
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
            }}
          >
            <strong>Height Graph</strong>
            <button
              className="ui button"
              style={{ padding: '2px 6px' }}
              onClick={() => setShowHeightGraph(false)}
              title="Close"
            >
              ×
            </button>
          </div>
          <HeightGraph
            series={heightSeries}
            width={620}
            height={130}
            onHoverIndex={(idx) => {
              const res = directions.results[VALHALLA_OSM_URL!]?.data as
                | ParsedDirectionsGeometry
                | undefined;
              if (!res?.decodedGeometry || idx < 0) return;
              const last = Math.max(
                0,
                Math.min(res.decodedGeometry.length - 2, idx)
              );
              const a = res.decodedGeometry[last]!;
              dispatch(
                highlightManeuver({
                  startIndex: last,
                  endIndex: last + 1,
                  alternate: -1,
                })
              );
              setHoverMarker({ lat: a[0]!, lng: a[1]! });
            }}
            onLeave={() => {
              dispatch(
                highlightManeuver({
                  startIndex: -1,
                  endIndex: -1,
                  alternate: -1,
                })
              );
              setHoverMarker(null);
            }}
          />
        </div>
      )}
    </div>
  );
};

const mapStateToProps = (state: RootState) => {
  const { directions, isochrones, common } = state;
  const { activeTab, profile, coordinates, showDirectionsPanel, showSettings } =
    common;
  return {
    directions,
    isochrones,
    profile,
    coordinates,
    activeTab,
    showDirectionsPanel,
    showSettings,
  };
};

export default connect(mapStateToProps)(Map);
