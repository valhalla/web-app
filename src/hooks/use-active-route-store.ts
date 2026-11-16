import { useParams } from '@tanstack/react-router';
import { useStore } from 'zustand';
import { useDirectionsStore } from '@/stores/directions-store';
import { useRoundTripStore } from '@/stores/round-trip-store';
import type { RouteResultSlice } from '@/stores/route-result-slice';

/**
 * Selects from the store whose route the map and route cards currently show:
 * the round trip on the round trip tab, the directions everywhere else.
 */
export function useActiveRouteStore<T>(
  selector: (state: RouteResultSlice) => T
): T {
  const { activeTab } = useParams({ from: '/$activeTab' });
  const activeRouteStore =
    activeTab === 'round-trip' ? useRoundTripStore : useDirectionsStore;
  return useStore(activeRouteStore, selector);
}
