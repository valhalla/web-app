import { useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useDirectionsStore } from '@/stores/directions-store';
import {
  useDirectionsQuery,
  useSetWaypointFromCoords,
} from '@/hooks/use-directions-queries';
import { parseUrlParams } from '@/utils/parse-url-params';
import { isValidCoordinates } from '@/utils/geom';

/**
 * Hydrates directions waypoints from the `wps` URL param once and keeps the
 * URL in sync with the selected waypoints afterwards.
 *
 * Must be called from an always-mounted component: the directions panel
 * content is unmounted while the sidebar is closed (default on mobile).
 */
export function useDirectionsPermalink(enabled: boolean) {
  const waypoints = useDirectionsStore((state) => state.waypoints);
  const urlParamsProcessed = useRef(false);
  const navigate = useNavigate({ from: '/$activeTab' });
  const { refetch: refetchDirections } = useDirectionsQuery();
  const { setWaypointFromCoords } = useSetWaypointFromCoords();

  useEffect(() => {
    if (!enabled || urlParamsProcessed.current) return;
    urlParamsProcessed.current = true;

    const alreadyHydrated = useDirectionsStore
      .getState()
      .waypoints.some((wp) => wp.geocodeResults.some((r) => r.selected));
    if (alreadyHydrated) return;

    const wpsParam = parseUrlParams().wps;
    if (!wpsParam) return;

    const coordinates = wpsParam.split(',').map(Number);
    for (let i = 0; i < coordinates.length; i += 2) {
      const lng = coordinates[i]!;
      const lat = coordinates[i + 1]!;

      if (!isValidCoordinates(lat, lng) || isNaN(lng) || isNaN(lat)) continue;

      setWaypointFromCoords(lng, lat, i / 2, { isPermalink: true });
    }
    refetchDirections();
  }, [enabled, setWaypointFromCoords, refetchDirections]);

  useEffect(() => {
    if (!enabled) return;

    const wps: number[] = [];
    for (const wp of waypoints) {
      for (const geocodeResult of wp.geocodeResults) {
        if (geocodeResult.selected && geocodeResult.sourcelnglat) {
          wps.push(
            geocodeResult.sourcelnglat[0],
            geocodeResult.sourcelnglat[1]
          );
        }
      }
    }

    navigate({
      search: (prev) => ({
        ...prev,
        wps: wps.length > 0 ? wps.join(',') : undefined,
      }),
      replace: true,
    });
  }, [enabled, waypoints, navigate]);
}
