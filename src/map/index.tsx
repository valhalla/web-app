import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { connect } from 'react-redux';
import Map, {
  Marker,
  Source,
  Layer,
  Popup,
  type MapRef,
  NavigationControl,
} from 'react-map-gl/maplibre';
import type { MaplibreTerradrawControl } from '@watergis/maplibre-gl-terradraw';
import type maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import axios from 'axios';
import * as R from 'ramda';
import { throttle } from 'throttle-debounce';
import { Button, Label, Icon, Popup as SemanticPopup } from 'semantic-ui-react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
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
import { formatDuration } from '@/utils/date-time';
import HeightGraph from '@/components/heightgraph';
import { DrawControl } from './draw-control';
import './map.css';
import { convertDDToDMS } from './utils';
import type { LastCenterStorageValue } from './types';
import type { RootState } from '@/store';
import type { AnyAction } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';
import type { DirectionsState } from '@/reducers/directions';
import type { IsochroneState } from '@/reducers/isochrones';
import type { Profile } from '@/reducers/common';
import type { ParsedDirectionsGeometry, Summary } from '@/common/types';
import type { Feature, FeatureCollection, LineString } from 'geojson';

// Import the style JSON
import mapStyle from './style.json';

const centerCoords = process.env.REACT_APP_CENTER_COORDS!.split(',');

let center: [number, number] = [
  parseFloat(centerCoords[1] || '13.393707'),
  parseFloat(centerCoords[0] || '52.51831'),
];

let zoom_initial = 10;

if (localStorage.getItem('last_center')) {
  try {
    const last_center = JSON.parse(
      localStorage.getItem('last_center')!
    ) as LastCenterStorageValue;

    // Validate coordinates: lng must be -180 to 180, lat must be -90 to 90
    const lng = last_center.center[1];
    const lat = last_center.center[0];

    if (
      typeof lng === 'number' &&
      typeof lat === 'number' &&
      lng >= -180 &&
      lng <= 180 &&
      lat >= -90 &&
      lat <= 90
    ) {
      center = [lng, lat];
      zoom_initial = last_center.zoom_level;
    } else {
      // Invalid coordinates, clear localStorage and use defaults
      console.warn('Invalid coordinates in localStorage, using defaults');
      localStorage.removeItem('last_center');
    }
  } catch {
    // Invalid JSON, clear localStorage
    console.warn('Invalid localStorage data, using defaults');
    localStorage.removeItem('last_center');
  }
}

// Remove maxBounds to allow navigation anywhere in the world
// The old env var had invalid values for MapLibre (-1e7, 1e7 are not valid longitudes)
const maxBounds: [[number, number], [number, number]] | undefined = undefined;

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
  coordinates: number[][];
  showDirectionsPanel: boolean;
  showSettings: boolean;
}

interface MarkerData {
  id: string;
  lng: number;
  lat: number;
  type: 'waypoint' | 'isocenter';
  index?: number;
  title?: string;
  color?: string;
  shape?: string;
  number?: string;
}

const MapComponent = ({
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
  const [popupLngLat, setPopupLngLat] = useState<{
    lng: number;
    lat: number;
  } | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
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

  const mapRef = useRef<MapRef>(null);
  const drawRef = useRef<MaplibreTerradrawControl | null>(null);

  // Throttle heightgraph hover updates for better performance
  const throttledSetHeightgraphHoverDistance = useMemo(
    () => throttle(50, setHeightgraphHoverDistance),
    []
  );

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

  const handleCopy = useCallback(() => {
    setHasCopied(true);
    setTimeout(() => {
      setHasCopied(false);
    }, 1000);
  }, []);

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

    if (!R.equals(heightPayload, heightPayloadNew)) {
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
      // Check if TerraDraw is in an active drawing mode
      if (drawRef.current) {
        const terraDrawInstance = drawRef.current.getTerraDrawInstance();
        if (terraDrawInstance) {
          const mode = terraDrawInstance.getMode();
          if (mode === 'polygon' || mode === 'select' || mode === 'delete') {
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
    [getHeight]
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
    localStorage.setItem('last_center', last_center);
  }, []);

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

  const MarkerIcon = ({
    color,
    number,
  }: {
    color: string;
    number?: string;
  }) => {
    const markerColors: Record<string, string> = {
      green: '#28a745',
      purple: '#6f42c1',
      blue: '#007bff',
    };

    const bgColor = markerColors[color] || markerColors.green;

    return (
      <div
        style={{
          width: '35px',
          height: '45px',
          position: 'relative',
          cursor: 'pointer',
        }}
      >
        <svg
          width="35"
          height="45"
          viewBox="0 0 35 45"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
        >
          <path
            d="M17.5,0 C7.8,0 0,7.8 0,17.5 C0,30.6 17.5,45 17.5,45 S35,30.6 35,17.5 C35,7.8 27.2,0 17.5,0 Z"
            fill={bgColor}
            stroke="#fff"
            strokeWidth="2"
          />
        </svg>
        {number && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '0',
              width: '35px',
              textAlign: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '16px',
              pointerEvents: 'none',
            }}
          >
            {number}
          </div>
        )}
      </div>
    );
  };

  const MapPopup = (isInfo: boolean) => {
    if (!popupLngLat) {
      return null;
    }

    return (
      <React.Fragment>
        {isInfo ? (
          <React.Fragment>
            <div>
              <Button.Group basic size="tiny">
                <SemanticPopup
                  size="tiny"
                  content="Longitude, Latitude"
                  trigger={
                    <Button
                      compact
                      content={
                        popupLngLat.lng.toFixed(6) +
                        ', ' +
                        popupLngLat.lat.toFixed(6)
                      }
                      data-testid="dd-button"
                    />
                  }
                />
                <CopyToClipboard
                  text={
                    popupLngLat.lng.toFixed(6) +
                    ',' +
                    popupLngLat.lat.toFixed(6)
                  }
                  onCopy={handleCopy}
                >
                  <Button compact data-testid="dd-copy-button" icon="copy" />
                </CopyToClipboard>
              </Button.Group>
            </div>

            <div className="mt1 flex">
              <Button.Group basic size="tiny">
                <SemanticPopup
                  size="tiny"
                  content="Latitude, Longitude"
                  trigger={
                    <Button
                      compact
                      content={
                        popupLngLat.lat.toFixed(6) +
                        ', ' +
                        popupLngLat.lng.toFixed(6)
                      }
                      data-testid="latlng-button"
                    />
                  }
                />
                <CopyToClipboard
                  text={
                    popupLngLat.lat.toFixed(6) +
                    ',' +
                    popupLngLat.lng.toFixed(6)
                  }
                  onCopy={handleCopy}
                >
                  <Button
                    compact
                    data-testid="latlng-copy-button"
                    icon="copy"
                  />
                </CopyToClipboard>
              </Button.Group>
            </div>
            <div className="mt1 flex">
              <Button.Group basic size="tiny">
                <SemanticPopup
                  size="tiny"
                  content="Latitude, Longitude"
                  trigger={
                    <Button
                      compact
                      content={
                        convertDDToDMS(popupLngLat.lat) +
                        ' N ' +
                        convertDDToDMS(popupLngLat.lng) +
                        ' E'
                      }
                      data-testid="dms-button"
                    />
                  }
                />
                <CopyToClipboard
                  text={
                    convertDDToDMS(popupLngLat.lat) +
                    ' N ' +
                    convertDDToDMS(popupLngLat.lng) +
                    ' E'
                  }
                  onCopy={handleCopy}
                >
                  <Button compact data-testid="dms-copy-button" icon="copy" />
                </CopyToClipboard>
              </Button.Group>
            </div>

            <div className="mt1">
              <Button.Group basic size="tiny">
                <SemanticPopup
                  size="tiny"
                  content="Calls Valhalla's Locate API"
                  trigger={
                    <Button
                      onClick={() =>
                        getLocate(popupLngLat.lng, popupLngLat.lat)
                      }
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
                    data-testid="locate-point-copy-button"
                    icon="copy"
                  />
                </CopyToClipboard>
              </Button.Group>
            </div>
            <div className="mt1">
              <Button.Group basic size="tiny">
                <SemanticPopup
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
                      "lon": ${popupLngLat.lng.toFixed(6)},
                      "lat": ${popupLngLat.lat.toFixed(6)}
                    }`}
                  onCopy={handleCopy}
                >
                  <Button
                    compact
                    data-testid="location-json-copy-button"
                    icon="copy"
                  />
                </CopyToClipboard>
              </Button.Group>
            </div>
            <div className="mt1 flex justify-between">
              <SemanticPopup
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
          <React.Fragment>
            <Button.Group
              data-testid="button-group-right-context"
              size="small"
              basic
              vertical
            >
              <Button compact onClick={() => handleAddWaypoint(0)}>
                Directions from here
              </Button>
              <Button compact onClick={() => handleAddWaypoint(1)}>
                Add as via point
              </Button>
              <Button compact onClick={() => handleAddWaypoint(-1)}>
                Directions to here
              </Button>
            </Button.Group>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Button.Group size="small" basic vertical>
              <Button onClick={handleAddIsoWaypoint}>Set center here</Button>
            </Button.Group>
          </React.Fragment>
        )}
      </React.Fragment>
    );
  };

  return (
    <React.Fragment>
      <div>
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          onMoveEnd={handleMoveEnd}
          onClick={handleMapClick}
          onContextMenu={handleMapContextMenu}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          interactiveLayerIds={['routes-line']}
          mapStyle={mapStyle as unknown as maplibregl.StyleSpecification}
          style={{ width: '100%', height: '100vh' }}
          maxBounds={maxBounds}
          minZoom={2}
          maxZoom={18}
          data-testid="map"
        >
          <NavigationControl position="top-right" />
          <DrawControl
            position="top-right"
            onUpdate={updateExcludePolygons}
            controlRef={drawRef}
          />

          {/* Route lines */}
          {routeGeoJSON && (
            <Source id="routes" type="geojson" data={routeGeoJSON}>
              {/* White outline */}
              <Layer
                id="routes-outline"
                type="line"
                paint={{
                  'line-color': '#FFF',
                  'line-width': 9,
                  'line-opacity': 1,
                }}
              />
              {/* Colored line */}
              <Layer
                id="routes-line"
                type="line"
                paint={{
                  'line-color': ['get', 'color'],
                  'line-width': 5,
                  'line-opacity': 1,
                }}
              />
            </Source>
          )}

          {/* Highlight segment */}
          {highlightSegmentGeoJSON && (
            <Source
              id="highlight-segment"
              type="geojson"
              data={highlightSegmentGeoJSON}
            >
              <Layer
                id="highlight-segment-line"
                type="line"
                paint={{
                  'line-color': 'yellow',
                  'line-width': 4,
                  'line-opacity': 1,
                }}
              />
            </Source>
          )}

          {/* Isochrone polygons */}
          {isochroneGeoJSON && (
            <Source id="isochrones" type="geojson" data={isochroneGeoJSON}>
              <Layer
                id="isochrones-fill"
                type="fill"
                paint={{
                  'fill-color': ['get', 'fill'],
                  'fill-opacity': 0.4,
                }}
              />
              <Layer
                id="isochrones-outline"
                type="line"
                paint={{
                  'line-color': '#fff',
                  'line-width': 1,
                  'line-opacity': 1,
                }}
              />
            </Source>
          )}

          {/* Isochrone locations */}
          {isoLocationsGeoJSON && (
            <Source
              id="iso-locations"
              type="geojson"
              data={isoLocationsGeoJSON}
            >
              <Layer
                id="iso-locations-circle"
                type="circle"
                paint={{
                  'circle-radius': 6,
                  'circle-color': '#fff',
                  'circle-stroke-color': '#000',
                  'circle-stroke-width': 2,
                }}
              />
            </Source>
          )}

          {/* Markers */}
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

          {/* Heightgraph hover marker */}
          {useMemo(() => {
            if (
              heightgraphHoverDistance !== null &&
              heightgraphData.length > 0
            ) {
              // The heightgraph data has coordinates as [lng, lat, elevation, distance]
              // Find the coordinate closest to the hovered distance
              let closestCoord = null;
              let minDistanceDiff = Infinity;

              for (const feature of heightgraphData[0]?.features || []) {
                if (feature.geometry.type === 'LineString') {
                  const coords = feature.geometry.coordinates as number[][];
                  for (const coord of coords) {
                    const [lng, lat, , distance] = coord;
                    if (distance !== undefined) {
                      const diff = Math.abs(
                        distance - heightgraphHoverDistance
                      );
                      if (diff < minDistanceDiff) {
                        minDistanceDiff = diff;
                        closestCoord = [lng ?? 0, lat ?? 0];
                      }
                    }
                  }
                }
              }

              if (closestCoord) {
                return (
                  <Marker
                    longitude={closestCoord[0] ?? 0}
                    latitude={closestCoord[1] ?? 0}
                    anchor="center"
                  >
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: 'blue',
                        border: '3px solid white',
                        boxShadow: '0 0 8px rgba(0,0,0,0.5)',
                      }}
                    />
                  </Marker>
                );
              }
            }
            return null;
          }, [heightgraphHoverDistance, heightgraphData])}

          {/* Popup */}
          {showPopup && popupLngLat && (
            <Popup
              longitude={popupLngLat.lng}
              latitude={popupLngLat.lat}
              anchor="bottom"
              onClose={() => {
                setShowPopup(false);
                setHasCopied(false);
                setLocate([]);
              }}
              closeOnClick={false}
              maxWidth="none"
            >
              {MapPopup(showInfoPopup)}
            </Popup>
          )}

          {/* Route hover popup */}
          {routeHoverPopup && (
            <Popup
              longitude={routeHoverPopup.lng}
              latitude={routeHoverPopup.lat}
              anchor="bottom"
              closeButton={false}
              closeOnClick={false}
              maxWidth="none"
            >
              {/* todo: update styling with tailwind when we migrate to it */}
              <div style={{ padding: '4px 8px', minWidth: '120px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    marginBottom: '4px',
                    color: '#666',
                  }}
                >
                  Route Summary
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginBottom: '2px',
                  }}
                >
                  <Icon
                    name="arrows alternate horizontal"
                    size="small"
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontSize: '13px' }}>
                    {`${routeHoverPopup.summary.length.toFixed(
                      routeHoverPopup.summary.length > 1000 ? 0 : 1
                    )} km`}
                  </span>
                </div>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Icon name="clock" size="small" style={{ margin: 0 }} />
                  <span style={{ fontSize: '13px' }}>
                    {formatDuration(routeHoverPopup.summary.time)}
                  </span>
                </div>
              </div>
            </Popup>
          )}

          {/* Brand logos */}
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '10px',
              zIndex: 1,
              display: 'flex',
              gap: '10px',
            }}
          >
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
        </Map>

        <button
          className="ui primary button"
          id="osm-button"
          onClick={handleOpenOSM}
        >
          Open OSM
        </button>

        {/* Height graph */}
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
      </div>
    </React.Fragment>
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

export default connect(mapStateToProps)(MapComponent);
