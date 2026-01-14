import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { useDirectionsStore } from '@/stores/directions-store';
import {
  getValhallaUrl,
  buildOptimizedRouteRequest,
  parseDirectionsGeometry,
} from '@/utils/valhalla';
import { filterProfileSettings } from '@/utils/filter-profile-settings';
import { useCommonStore } from '@/stores/common-store';
import { router } from '@/routes';
import type { ValhallaOptimizedRouteResponse } from '@/components/types';
import type { Waypoint } from '@/stores/directions-store';
import { getDirectionsLanguage } from '@/utils/directions-language';

export function useOptimizedRouteQuery() {
  const waypoints = useDirectionsStore((state) => state.waypoints);
  const setWaypoint = useDirectionsStore((state) => state.setWaypoint);
  const receiveRouteResults = useDirectionsStore(
    (state) => state.receiveRouteResults
  );
  const setIsOptimized = useDirectionsStore((state) => state.setIsOptimized);
  const zoomTo = useCommonStore((state) => state.zoomTo);
  const { settings: rawSettings } = useCommonStore.getState();

  const mutation = useMutation({
    mutationFn: async () => {
      const relevantWaypoints: Waypoint[] = [];

      const activeWaypoints = waypoints.flatMap((wp) => {
        const selected = wp.geocodeResults.filter((r) => r.selected);
        if (selected.length > 0) {
          relevantWaypoints.push(wp);
        }
        return selected;
      });

      if (activeWaypoints.length < 4) {
        throw new Error('Not enough waypoints to optimize');
      }

      const profile = router.state.location.search.profile || 'bicycle';
      const settings = filterProfileSettings(profile, rawSettings);
      const language = getDirectionsLanguage();
      const request = buildOptimizedRouteRequest({
        profile,
        activeWaypoints,
        // @ts-expect-error todo: initial settings and filtered settings types mismatch
        settings,
        language,
      });
      const { data } = await axios.get<ValhallaOptimizedRouteResponse>(
        `${getValhallaUrl()}/optimized_route`,
        { params: { json: JSON.stringify(request.json) } }
      );

      const processedData = {
        ...data,
        id: data.id ?? 'valhalla_optimized_route',
        decodedGeometry: parseDirectionsGeometry(data),
      };

      return { data: processedData, relevantWaypoints };
    },
    onSuccess: ({ data, relevantWaypoints }) => {
      const newWaypoints: Waypoint[] = [];
      const locations = data.trip.locations;
      locations.forEach((loc) => {
        if (typeof loc.original_index === 'number') {
          const original = relevantWaypoints[loc.original_index];
          if (original) {
            newWaypoints.push(original);
          }
        }
      });
      setWaypoint(newWaypoints);
      setIsOptimized(true);
      receiveRouteResults({ data });
      zoomTo(data.decodedGeometry);
      toast.success('Route optimized successfully');
    },
    onError: (error) => {
      console.error('Optimization error:', error);
      toast.error('Failed to optimize route');
    },
  });

  return {
    optimizeRoute: mutation.mutate,
    isPending: mutation.isPending,
  };
}
