import { useCallback, useEffect, useRef } from 'react';

import { Waypoints } from './waypoints/waypoint-list';

import { SettingsFooter } from '@/components/settings-footer';
import { DateTimePicker } from '@/components/date-time-picker';
import { Separator } from '@/components/ui/separator';

import { useCommonStore } from '@/stores/common-store';
import type { ParsedDirectionsGeometry } from '@/components/types';
import { Button } from '@/components/ui/button';
import { MapPinPlus, MapPinXInside } from 'lucide-react';
import { RouteCard } from './route-card';
import { parseUrlParams } from '@/utils/parse-url-params';
import { isValidCoordinates } from '@/utils/geom';
import { useNavigate } from '@tanstack/react-router';
import {
  defaultWaypoints,
  useDirectionsStore,
} from '@/stores/directions-store';
import {
  useDirectionsQuery,
  useReverseGeocodeDirections,
} from '@/hooks/use-directions-queries';
import { useOptimizedRouteQuery } from '@/hooks/use-optimized-route-query';
import { Sparkles } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const DirectionsControl = () => {
  const waypoints = useDirectionsStore((state) => state.waypoints);
  const results = useDirectionsStore((state) => state.results);
  const addEmptyWaypointToEnd = useDirectionsStore(
    (state) => state.addEmptyWaypointToEnd
  );
  const clearWaypoints = useDirectionsStore((state) => state.clearWaypoints);
  const clearRoutes = useDirectionsStore((state) => state.clearRoutes);
  const initialUrlParams = useRef(parseUrlParams());
  const urlParamsProcessed = useRef(false);
  const navigate = useNavigate({ from: '/$activeTab' });
  const updateDateTime = useCommonStore((state) => state.updateDateTime);
  const dateTime = useCommonStore((state) => state.dateTime);
  const { refetch: refetchDirections } = useDirectionsQuery();
  const { reverseGeocode } = useReverseGeocodeDirections();
  const { optimizeRoute, isPending: isOptimizing } = useOptimizedRouteQuery();
  const isOptimized = useDirectionsStore((state) => state.isOptimized);

  useEffect(() => {
    if (urlParamsProcessed.current) return;

    const wpsParam = initialUrlParams.current.wps;

    if (wpsParam) {
      const coordinates = wpsParam.split(',').map(Number);

      for (let i = 0; i < coordinates.length; i += 2) {
        const lng = coordinates[i]!;
        const lat = coordinates[i + 1]!;

        if (!isValidCoordinates(lat, lng) || isNaN(lng) || isNaN(lat)) continue;

        const index = i / 2;
        reverseGeocode(lng, lat, index, { isPermalink: true });
      }
      refetchDirections();
    }

    urlParamsProcessed.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const wps: number[] = [];

    for (const wp of waypoints) {
      for (const result of wp.geocodeResults) {
        if (result.selected && result.sourcelnglat) {
          wps.push(result.sourcelnglat[0], result.sourcelnglat[1]);
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
  }, [waypoints, navigate]);

  const handleDateTimeChange = useCallback(
    (field: 'type' | 'value', value: string) => {
      updateDateTime(field, value);
      refetchDirections();
    },
    [updateDateTime, refetchDirections]
  );

  const handleAddWaypoint = useCallback(() => {
    addEmptyWaypointToEnd();
  }, [addEmptyWaypointToEnd]);

  const handleRemoveWaypoints = useCallback(() => {
    clearWaypoints();
    clearRoutes();
  }, [clearWaypoints, clearRoutes]);

  const activeWaypointsCount = waypoints.filter((wp) =>
    wp.geocodeResults.some((r) => r.selected)
  ).length;

  return (
    <>
      <div className="flex flex-col gap-3 border rounded-md p-2">
        <Waypoints />
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={handleAddWaypoint}
            data-testid="add-waypoint-button"
            className="w-full shrink"
          >
            <MapPinPlus className="size-5" />
            Add Waypoint
          </Button>
          <Button
            variant="destructive-outline"
            onClick={handleRemoveWaypoints}
            data-testid="reset-waypoints-button"
            className="w-full shrink"
            disabled={
              JSON.stringify(waypoints) === JSON.stringify(defaultWaypoints)
            }
          >
            <MapPinXInside className="size-5" />
            Reset Waypoints
          </Button>
        </div>
        <Tooltip open={activeWaypointsCount >= 4 ? false : undefined}>
          <TooltipTrigger asChild>
            <span>
              <Button
                variant="outline"
                onClick={() => optimizeRoute()}
                disabled={
                  activeWaypointsCount < 4 || isOptimizing || isOptimized
                }
                className="w-full"
              >
                <Sparkles className="size-4" />
                Optimize Route
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>You should have at least 4 waypoints to optimize the route</p>
          </TooltipContent>
        </Tooltip>
        <DateTimePicker
          type={dateTime.type}
          value={dateTime.value}
          onChange={handleDateTimeChange}
        />
        <Separator />
        <SettingsFooter />
      </div>
      {results.data && (
        <div>
          <h3 className="font-bold mb-2">Directions</h3>
          <div className="flex flex-col gap-3">
            <RouteCard data={results.data} index={-1} />
            {results.data.alternates?.map((alternate, index) => (
              <RouteCard
                data={alternate as ParsedDirectionsGeometry}
                key={alternate.id}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};
