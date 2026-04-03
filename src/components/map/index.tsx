import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import { useParams, useSearch, useNavigate } from '@tanstack/react-router';
import {
  Map,
  Marker,
  Popup,
  type MapRef,
  NavigationControl,
  GeolocateControl,
  type GeolocateErrorEvent,
} from 'react-map-gl/maplibre';
import type { MaplibreTerradrawControl } from '@watergis/maplibre-gl-terradraw';
import type maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { throttle } from 'throttle-debounce';
import { getValhallaUrl, buildHeightRequest } from '@/utils/valhalla';
import { buildHeightgraphData } from '@/utils/heightgraph';
import HeightGraph from '@/components/heightgraph';
import { DrawControl } from './draw-control';
import type { Summary } from '@/components/types';
import type { FeatureCollection } from 'geojson';
import RoutingIcon from '@/images/routing_icon_minimal_bw.svg?url';
import IsochronesIcon from '@/images/isochrones_icon_minimal_bw.svg?url';
import MvtIcon from '@/images/mvt_icon_minimal_bw.svg?url';
import OSMIcon from '@/images/osm_icon.png';
import { ToolButton } from './parts/tool-button';

import { MapStyleControl } from './map-style-control';
import { getInitialMapStyle, getCustomStyle, getMapStyleUrl } from './utils';
import {
  CLICK_DELAY_MS,
  DEFAULT_MAP_STYLE_ID,
  DOUBLE_TAP_THRESHOLD_MS,
} from './constants';
import type { MapStyleType } from './types';
import { RouteLines } from './parts/route-lines';
import { HighlightSegment } from './parts/highlight-segment';
import { IsochronePolygons } from './parts/isochrone-polygons';
import { IsochroneLocations } from './parts/isochrone-locations';
import { HeightgraphHoverMarker } from './parts/heightgraph-hover-marker';
import { BrandLogos } from './parts/brand-logos';
import { MapInfoPopup } from './parts/map-info-popup';
import { MapContextMenu } from './parts/map-context-menu';
import { RouteHoverPopup } from './parts/route-hover-popup';
import { TilesInfoPopup } from './parts/tiles-info-popup';
import {
  VALHALLA_EDGES_LAYER_ID,
  VALHALLA_NODES_LAYER_ID,
  VALHALLA_SHORTCUTS_LAYER_ID,
  VALHALLA_ACCESS_RESTRICTIONS_PERMANENT_LAYER_ID,
  VALHALLA_ACCESS_RESTRICTIONS_TIMED_LAYER_ID,
} from '@/components/tiles/valhalla-layers';
import { MarkerIcon, type MarkerColor } from './parts/marker-icon';
import { maxBounds } from './constants';
import { getInitialMapPosition, LAST_CENTER_KEY } from './utils';
import { useCommonStore } from '@/stores/common-store';
import { useDirectionsStore } from '@/stores/directions-store';
import { useIsochronesStore } from '@/stores/isochrones-store';
import {
  useDirectionsQuery,
  useReverseGeocodeDirections,
} from '@/hooks/use-directions-queries';
import {
  useIsochronesQuery,
  useReverseGeocodeIsochrones,
} from '@/hooks/use-isochrones-queries';
import { toast } from 'sonner';

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
  const { activeTab } = useParams({ from: '/$activeTab' });
  const navigate = useNavigate({ from: '/$activeTab' });
  const coordinates = useCommonStore((state) => state.coordinates);
  const directionsPanelOpen = useCommonStore(
    (state) => state.directionsPanelOpen
  );
  const toggleDirections = useCommonStore((state) => state.toggleDirections);
  const updateSettings = useCommonStore((state) => state.updateSettings);
  const setMapReady = useCommonStore((state) => state.setMapReady);
  const { style } = useSearch({ from: '/$activeTab' });
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [showContextPopup, setShowContextPopup] = useState(false);
  const [isHeightLoading, setIsHeightLoading] = useState(false);
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
  const waypoints = useDirectionsStore((state) => state.waypoints);
  const directionResults = useDirectionsStore((state) => state.results);
  const directionsSuccessful = useDirectionsStore((state) => state.successful);
  const updateInclineDecline = useDirectionsStore(
    (state) => state.updateInclineDecline
  );
  const setActiveRouteIndex = useDirectionsStore(
    (state) => state.setActiveRouteIndex
  );

  const { refetch: refetchDirections } = useDirectionsQuery();
  const { refetch: refetchIsochrones } = useIsochronesQuery();
  const { reverseGeocode: reverseGeocodeDirections } =
    useReverseGeocodeDirections();
  const { reverseGeocode: reverseGeocodeIsochrones } =
    useReverseGeocodeIsochrones();
  const [heightgraphHoverDistance, setHeightgraphHoverDistance] = useState<
    number | null
  >(null);
  const [routeHoverPopup, setRouteHoverPopup] = useState<{
    lng: number;
    lat: number;
    summary: Summary;
  } | null>(null);
  const [tilesPopup, setTilesPopup] = useState<{
    lng: number;
    lat: number;
    features: MapGeoJSONFeature[];
  } | null>(null);
  const [viewState, setViewState] = useState({
    longitude: center[0],
    latitude: center[1],
    zoom: zoom_initial,
  });
  const [currentMapStyle, setCurrentMapStyle] = useState<MapStyleType>(
    getInitialMapStyle(style)
  );
  const [customStyleData, setCustomStyleData] =
    useState<maplibregl.StyleSpecification | null>(() => getCustomStyle());

  const resolvedMapStyle = useMemo(() => {
    if (currentMapStyle === 'custom') {
      return customStyleData ?? getMapStyleUrl('shortbread');
    }
    return getMapStyleUrl(currentMapStyle);
  }, [
    currentMapStyle,
    customStyleData,
  ]) as unknown as maplibregl.StyleSpecification;

  const mapRef = useRef<MapRef>(null);
  const drawRef = useRef<MaplibreTerradrawControl | null>(null);
  const touchStartTimeRef = useRef<number | null>(null);
  const touchLocationRef = useRef<{ x: number; y: number } | null>(null);
  const handledLongPressRef = useRef<boolean>(false);
  const clickStateRef = useRef<{
    timer: ReturnType<typeof setTimeout> | null;
    pendingLngLat: { lng: number; lat: number } | null;
    lastTapTime: number;
  }>({
    timer: null,
    pendingLngLat: null,
    lastTapTime: 0,
  });

  const cancelPendingClick = useCallback(() => {
    if (clickStateRef.current.timer) {
      clearTimeout(clickStateRef.current.timer);
      clickStateRef.current.timer = null;
      clickStateRef.current.pendingLngLat = null;
    }
  }, []);

  const throttledSetHeightgraphHoverDistance = useMemo(
    () => throttle(50, setHeightgraphHoverDistance),
    []
  );

  const handleStyleChange = useCallback((style: MapStyleType) => {
    setCurrentMapStyle(style);

    const url = new URL(window.location.href);
    if (style !== DEFAULT_MAP_STYLE_ID) {
      url.searchParams.set('style', style);
    } else {
      url.searchParams.delete('style');
    }
    window.history.replaceState({}, '', url.toString());
  }, []);

  const handleCustomStyleLoaded = useCallback(
    (styleData: maplibregl.StyleSpecification) => {
      setCustomStyleData(styleData);
      setCurrentMapStyle('custom');

      const url = new URL(window.location.href);
      url.searchParams.set('style', 'custom');
      window.history.replaceState({}, '', url.toString());
    },
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

    updateSettings('exclude_polygons', excludePolygons as unknown as string);

    if (activeTab === 'directions') {
      refetchDirections();
    } else {
      refetchIsochrones();
    }
  }, [activeTab, refetchDirections, updateSettings, refetchIsochrones]);

  const updateWaypointPosition = useCallback(
    (object: { latLng: { lat: number; lng: number }; index: number }) => {
      reverseGeocodeDirections(
        object.latLng.lng,
        object.latLng.lat,
        object.index
      ).then(() => {
        refetchDirections();
      });
    },
    [reverseGeocodeDirections, refetchDirections]
  );

  const updateIsoPosition = useCallback(
    (lng: number, lat: number) => {
      reverseGeocodeIsochrones(lng, lat).then(() => {
        refetchIsochrones();
      });
    },
    [reverseGeocodeIsochrones, refetchIsochrones]
  );

  const handleOpenOSM = useCallback(() => {
    if (!mapRef.current) return;
    const { lng, lat } = mapRef.current.getCenter();
    const zoom = Math.round(mapRef.current.getZoom());
    const osmURL = `https://www.openstreetmap.org/#map=${zoom}/${lat}/${lng}`;
    window.open(osmURL, '_blank');
  }, []);

  const handleNavigateToTab = useCallback(
    (tab: string) => {
      if (!directionsPanelOpen) {
        toggleDirections();
      }
      navigate({ params: { activeTab: tab } });
    },
    [directionsPanelOpen, toggleDirections, navigate]
  );

  const getHeight = useCallback(async (lng: number, lat: number) => {
    setIsHeightLoading(true);

    try {
      const response = await fetch(`${getValhallaUrl()}/height`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildHeightRequest([[lat, lng]])),
      });

      if (!response.ok) {
        throw new Error('Could not fetch resource');
      }

      const data = await response.json();

      if ('height' in data) {
        setElevation(data.height[0] + ' m');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsHeightLoading(false);
    }
  }, []);

  const handleAddWaypoint = useCallback(
    (index: number) => {
      if (!popupLngLat) return;
      setShowContextPopup(false);

      updateWaypointPosition({
        latLng: { lat: popupLngLat.lat, lng: popupLngLat.lng },
        index,
      });
    },
    [popupLngLat, updateWaypointPosition]
  );

  const handleAddIsoWaypoint = useCallback(() => {
    if (!popupLngLat) return;
    setShowContextPopup(false);
    updateIsoPosition(popupLngLat.lng, popupLngLat.lat);
  }, [popupLngLat, updateIsoPosition]);

  const getHeightData = useCallback(async () => {
    if (!directionResults.data?.decodedGeometry) return;

    const heightPayloadNew = buildHeightRequest(
      directionResults.data.decodedGeometry as [number, number][]
    );

    if (JSON.stringify(heightPayload) !== JSON.stringify(heightPayloadNew)) {
      setIsHeightLoading(true);
      setHeightPayload(heightPayloadNew);

      try {
        const response = await fetch(`${getValhallaUrl()}/height`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(heightPayloadNew),
        });

        if (!response.ok) {
          throw new Error('Could not fetch resource');
        }

        const data = await response.json();

        const reversedGeometry = JSON.parse(
          JSON.stringify(directionResults.data?.decodedGeometry)
        ).map((pair: number[]) => {
          return [...pair.reverse()];
        });
        const heightData = buildHeightgraphData(
          reversedGeometry,
          data.range_height
        );
        const { inclineTotal, declineTotal } = heightData[0]!.properties;
        updateInclineDecline({
          inclineTotal,
          declineTotal,
        });
        setHeightgraphData(heightData);
      } catch (error) {
        console.error(error);
      } finally {
        setIsHeightLoading(false);
      }
    }
  }, [directionResults, heightPayload, updateInclineDecline]);

  // Update markers when waypoints or isochrone centers change
  const geocodeResults = useIsochronesStore((state) => state.geocodeResults);
  const markers = useMemo(() => {
    const newMarkers: MarkerData[] = [];

    // Add waypoint markers
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

    return newMarkers;
  }, [waypoints, geocodeResults]);

  //Stores the route content
  const lastZoomedCoordKeyRef = useRef<string | null>(null);

  useEffect(() => {
    //When a route is cleared resets the key to null
    if (!coordinates || coordinates.length === 0) {
      lastZoomedCoordKeyRef.current = null;
      return;
    }

    //If No Cordinates then return early
    if (!mapRef.current) return;

    //First Point
    const firstCoord = coordinates[0];
    if (!firstCoord || !firstCoord[0] || !firstCoord[1]) return;

    //Last Point
    const lastCoord = coordinates[coordinates.length - 1]!;

    const coordKey =
      coordinates.length +
      ':' +
      firstCoord[0] +
      ',' +
      firstCoord[1] +
      ':' +
      lastCoord[0] +
      ',' +
      lastCoord[1];
    //Compare with what was last zoomed
    if (coordKey === lastZoomedCoordKeyRef.current) return;
    //Store thr new Key
    lastZoomedCoordKeyRef.current = coordKey;

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

    //Read panel from the store directly
    //avoids re-running the effect when panels open or close
    const state = useCommonStore.getState();
    const dpOpen = state.directionsPanelOpen;
    const spOpen = state.settingsPanelOpen;

    const paddingTopLeft = [
      window.innerWidth < 550 ? 80 : dpOpen ? 450 : 80,
      80,
    ];
    const paddingBottomRight = [
      window.innerWidth < 550 ? 80 : spOpen ? 450 : 80,
      80,
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
    //only rerun when coordinates change
    //panel change no longer rerun this
  }, [coordinates]);

  const handleMapTilesClick = useCallback(
    (event: maplibregl.MapLayerMouseEvent) => {
      if (!mapRef.current) return;

      const map = mapRef.current.getMap();

      const availableLayers = [
        VALHALLA_EDGES_LAYER_ID,
        VALHALLA_NODES_LAYER_ID,
        VALHALLA_SHORTCUTS_LAYER_ID,
        VALHALLA_ACCESS_RESTRICTIONS_PERMANENT_LAYER_ID,
        VALHALLA_ACCESS_RESTRICTIONS_TIMED_LAYER_ID,
      ].filter((layerId) => map.getLayer(layerId));

      if (availableLayers.length === 0) return;

      const features = map.queryRenderedFeatures(event.point, {
        layers: availableLayers,
      });

      const { lng, lat } = event.lngLat;

      if (features && features.length > 0) {
        setTilesPopup({ lng, lat, features });
      }
    },
    []
  );

  const handleMapClick = useCallback(
    (event: maplibregl.MapLayerMouseEvent) => {
      // Prevent click if we just handled a long press
      if (handledLongPressRef.current) {
        handledLongPressRef.current = false;
        return;
      }

      if (showContextPopup) {
        setShowContextPopup(false);
        return;
      }

      if (showInfoPopup) {
        setShowInfoPopup(false);
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

      // Check if click is on a route line
      const routeFeature = event.features?.find(
        (f) => f.layer?.id === 'routes-line'
      );

      if (
        routeFeature &&
        typeof routeFeature.properties?.routeIndex === 'number'
      ) {
        setActiveRouteIndex(routeFeature.properties.routeIndex);
        return;
      }

      const { lngLat } = event;

      cancelPendingClick();

      // store the pending location in ref to avoid stale closure issues
      clickStateRef.current.pendingLngLat = lngLat;

      // delay showing popup to distinguish single click from double-click/double-tap
      clickStateRef.current.timer = setTimeout(() => {
        const pendingLngLat = clickStateRef.current.pendingLngLat;
        if (pendingLngLat) {
          if (activeTab === 'tiles') {
            handleMapTilesClick(event);
          } else {
            setPopupLngLat(pendingLngLat);
            setShowInfoPopup(true);
            getHeight(pendingLngLat.lng, pendingLngLat.lat);
          }
        }
        clickStateRef.current.timer = null;
        clickStateRef.current.pendingLngLat = null;
      }, CLICK_DELAY_MS);
    },
    [
      getHeight,
      showInfoPopup,
      showContextPopup,
      cancelPendingClick,
      activeTab,
      handleMapTilesClick,
      setActiveRouteIndex,
    ]
  );

  // handle double-click to cancel the pending single-click popup
  const handleMapDblClick = useCallback(() => {
    cancelPendingClick();
  }, [cancelPendingClick]);

  // cleanup timeout on unmount
  useEffect(() => {
    return () => {
      cancelPendingClick();
    };
  }, [cancelPendingClick]);

  const handleMapContextMenu = useCallback(
    (event: { lngLat: { lng: number; lat: number } }) => {
      if (activeTab === 'tiles') return;

      const { lngLat } = event;
      setPopupLngLat(lngLat);
      setShowInfoPopup(false);
      setShowContextPopup(true);
    },
    [activeTab]
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

  const handleTouchStart = useCallback(
    (event: maplibregl.MapTouchEvent) => {
      if (activeTab === 'tiles') return;

      const now = Date.now();
      const touchCount = event.originalEvent.touches.length;

      // multi-finger touch (pinch-to-zoom, etc.) - cancel any pending click popup
      if (touchCount > 1) {
        cancelPendingClick();
        return;
      }

      touchStartTimeRef.current = now;
      touchLocationRef.current = { x: event.point.x, y: event.point.y };
      handledLongPressRef.current = false;

      // detect double-tap: if two single-finger taps occur within threshold, cancel pending click
      if (now - clickStateRef.current.lastTapTime < DOUBLE_TAP_THRESHOLD_MS) {
        cancelPendingClick();
      }
      clickStateRef.current.lastTapTime = now;
    },
    [cancelPendingClick, activeTab]
  );

  const handleTouchEnd = useCallback(
    (event: maplibregl.MapTouchEvent) => {
      if (activeTab === 'tiles') return;

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
    [handleMapContextMenu, activeTab]
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
      if (!mapRef.current || showInfoPopup) return; // Don't show if click popup is visible

      const features = event.features;
      // Check if we're hovering over the routes-line layer
      const isOverRoute =
        features &&
        features.length > 0 &&
        features[0]?.layer?.id === 'routes-line';

      const isOverTiles =
        features &&
        features.length > 0 &&
        (features[0]?.layer?.id === VALHALLA_EDGES_LAYER_ID ||
          features[0]?.layer?.id === VALHALLA_NODES_LAYER_ID ||
          features[0]?.layer?.id === VALHALLA_SHORTCUTS_LAYER_ID ||
          features[0]?.layer?.id ===
            VALHALLA_ACCESS_RESTRICTIONS_PERMANENT_LAYER_ID ||
          features[0]?.layer?.id ===
            VALHALLA_ACCESS_RESTRICTIONS_TIMED_LAYER_ID);

      if (isOverRoute) {
        onRouteLineHover(event);
      } else if (isOverTiles) {
        const map = mapRef.current.getMap();
        map.getCanvas().style.cursor = 'pointer';
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
    [showInfoPopup, routeHoverPopup, onRouteLineHover]
  );

  const handleMouseLeave = useCallback(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    map.getCanvas().style.cursor = '';
    setRouteHoverPopup(null);
  }, []);

  const handleGeolocateError = useCallback((error: GeolocateErrorEvent) => {
    let defaultMessage = "We couldn't get your location. Please try again.";
    if (error.PERMISSION_DENIED) {
      defaultMessage =
        "We couldn't get your location. Please check your browser settings and allow location access.";
    }

    toast.error(defaultMessage);
  }, []);

  return (
    <>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onMoveEnd={handleMoveEnd}
        onLoad={() => setMapReady(true)}
        onClick={handleMapClick}
        onDblClick={handleMapDblClick}
        onContextMenu={handleMapContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        interactiveLayerIds={
          activeTab === 'tiles'
            ? [
                VALHALLA_EDGES_LAYER_ID,
                VALHALLA_NODES_LAYER_ID,
                VALHALLA_SHORTCUTS_LAYER_ID,
                VALHALLA_ACCESS_RESTRICTIONS_PERMANENT_LAYER_ID,
                VALHALLA_ACCESS_RESTRICTIONS_TIMED_LAYER_ID,
              ]
            : ['routes-line']
        }
        mapStyle={resolvedMapStyle}
        style={{ width: '100%', height: '100vh' }}
        maxBounds={maxBounds}
        minZoom={2}
        maxZoom={18}
        data-testid="map"
        id="mainMap"
      >
        <NavigationControl />
        <GeolocateControl onError={handleGeolocateError} />
        <DrawControl onUpdate={updateExcludePolygons} controlRef={drawRef} />
        <MapStyleControl
          customStyleData={customStyleData}
          onStyleChange={handleStyleChange}
          onCustomStyleLoaded={handleCustomStyleLoaded}
        />
        <RouteLines />
        <HighlightSegment />
        <IsochronePolygons />
        <IsochroneLocations />
        {markers.map((marker) => (
          <Marker
            anchor="bottom"
            key={marker.id}
            longitude={marker.lng}
            latitude={marker.lat}
            draggable={true}
            onDragEnd={(e) => {
              if (marker.type === 'waypoint') {
                updateWaypointPosition({
                  latLng: { lat: e.lngLat.lat, lng: e.lngLat.lng },
                  index: marker.index ?? 0,
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

        {showContextPopup && popupLngLat && (
          <Popup
            longitude={popupLngLat.lng}
            latitude={popupLngLat.lat}
            closeButton={false}
            closeOnClick={false}
            maxWidth="none"
          >
            <MapContextMenu
              activeTab={activeTab}
              onAddWaypoint={handleAddWaypoint}
              onAddIsoWaypoint={handleAddIsoWaypoint}
              popupLocation={popupLngLat}
            />
          </Popup>
        )}

        {showInfoPopup && popupLngLat && (
          <Popup
            longitude={popupLngLat.lng}
            latitude={popupLngLat.lat}
            closeButton={false}
            closeOnClick={false}
            maxWidth="none"
          >
            <MapInfoPopup
              popupLngLat={popupLngLat}
              elevation={elevation}
              isHeightLoading={isHeightLoading}
              onClose={() => {
                setShowInfoPopup(false);
              }}
            />
          </Popup>
        )}

        {routeHoverPopup && (
          <RouteHoverPopup
            lng={routeHoverPopup.lng}
            lat={routeHoverPopup.lat}
            summary={routeHoverPopup.summary}
          />
        )}

        {tilesPopup && (
          <Popup
            longitude={tilesPopup.lng}
            latitude={tilesPopup.lat}
            closeButton={false}
            maxWidth="none"
            onClose={() => setTilesPopup(null)}
          >
            <TilesInfoPopup
              features={tilesPopup.features}
              onClose={() => setTilesPopup(null)}
            />
          </Popup>
        )}

        <BrandLogos />

        <div className="absolute bottom-10 right-4 z-10 flex flex-col gap-2">
          <HeightGraph
            data={heightgraphData}
            disabled={!directionsSuccessful}
            width={
              directionsPanelOpen
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
          <ToolButton
            title="Open on osm.org"
            icon={
              <img
                src={OSMIcon}
                width={28}
                height={28}
                alt="openstreetmap.org link"
              />
            }
            onClick={handleOpenOSM}
            data-testid="osm-button"
          />
        </div>
      </Map>

      <div
        className="absolute top-4 left-4 z-10 flex flex-col gap-2"
        aria-label="Panel shortcuts"
      >
        <ToolButton
          title="Directions"
          icon={
            <img src={RoutingIcon} width={42} height={42} alt="Directions" />
          }
          onClick={() => handleNavigateToTab('directions')}
          data-testid="tab-directions-button"
        />
        <ToolButton
          title="Isochrones"
          icon={
            <img src={IsochronesIcon} width={42} height={42} alt="Isochrones" />
          }
          onClick={() => handleNavigateToTab('isochrones')}
          data-testid="tab-isochrones-button"
        />
        <ToolButton
          title="Tiles"
          icon={<img src={MvtIcon} width={42} height={42} alt="Tiles" />}
          onClick={() => handleNavigateToTab('tiles')}
          data-testid="tab-tiles-button"
        />
      </div>
    </>
  );
};
