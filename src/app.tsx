import { useEffect, useMemo, useRef } from 'react';
import { useParams, useSearch } from '@tanstack/react-router';
import { MapProvider } from 'react-map-gl/maplibre';
import { MapComponent } from './components/map';
import { RoutePlanner } from './components/route-planner';
import { SettingsPanel } from './components/settings-panel/settings-panel';
import { Toaster } from '@/components/ui/sonner';
import {
  useDirectionsQuery,
  useReverseGeocodeDirections,
} from '@/hooks/use-directions-queries';
import { useCommonStore } from '@/stores/common-store';
import { useDirectionsStore } from '@/stores/directions-store';
import { isValidCoordinates } from '@/utils/geom';

export const App = () => {
  const { activeTab } = useParams({ from: '/$activeTab' });
  const { wps } = useSearch({ from: '/$activeTab' });
  const { refetch: refetchDirections } = useDirectionsQuery();
  const { reverseGeocode } = useReverseGeocodeDirections();
  const mapReady = useCommonStore((state) => state.mapReady);
  const waypoints = useDirectionsStore((state) => state.waypoints);
  const initialWpsRef = useRef(wps);
  const urlWaypointsLoadedRef = useRef(false);
  const urlRouteRenderedRef = useRef(false);

  const activeWaypointCount = useMemo(
    () =>
      waypoints.filter((wp) =>
        wp.geocodeResults.some((result) => result.selected)
      ).length,
    [waypoints]
  );

  useEffect(() => {
    const initialWps = initialWpsRef.current;

    if (
      activeTab !== 'directions' ||
      !initialWps ||
      urlWaypointsLoadedRef.current
    ) {
      return;
    }

    urlWaypointsLoadedRef.current = true;
    console.info('[App] Hydrating directions from URL search params', {
      wps: initialWps,
    });

    const coordinates = initialWps.split(',').map(Number);
    let hasValidWaypoint = false;

    for (let i = 0; i < coordinates.length; i += 2) {
      const lng = coordinates[i];
      const lat = coordinates[i + 1];

      if (
        lng === undefined ||
        lat === undefined ||
        Number.isNaN(lng) ||
        Number.isNaN(lat) ||
        !isValidCoordinates(lat, lng)
      ) {
        continue;
      }

      hasValidWaypoint = true;

      void reverseGeocode(lng, lat, i / 2, { isPermalink: true }).catch(
        (error) => {
          console.error('[App] Failed to hydrate waypoint from URL', error);
        }
      );
    }

    if (!hasValidWaypoint) {
      console.debug(
        '[App] No valid route coordinates found in URL search params'
      );
    }
  }, [activeTab, reverseGeocode]);

  useEffect(() => {
    const initialWps = initialWpsRef.current;

    if (
      activeTab !== 'directions' ||
      !initialWps ||
      !mapReady ||
      urlRouteRenderedRef.current ||
      activeWaypointCount < 2
    ) {
      return;
    }

    urlRouteRenderedRef.current = true;
    console.info('[App] Auto-rendering route from URL search params', {
      activeWaypointCount,
    });

    void refetchDirections().catch((error) => {
      console.error('[App] Failed to auto-render route from URL', error);
      urlRouteRenderedRef.current = false;
    });
  }, [activeTab, activeWaypointCount, mapReady, refetchDirections]);

  return (
    <MapProvider>
      <MapComponent />
      <RoutePlanner />
      <SettingsPanel />
      <Toaster position="bottom-center" duration={5000} richColors />
    </MapProvider>
  );
};
