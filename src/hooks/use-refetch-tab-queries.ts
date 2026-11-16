import { useCallback } from 'react';
import { useParams } from '@tanstack/react-router';
import { useDirectionsQuery } from '@/hooks/use-directions-queries';
import { useIsochronesQuery } from '@/hooks/use-isochrones-queries';
import { useRoundTripQuery } from '@/hooks/use-round-trip-queries';

/**
 * Refetch functions of the tabs that query Valhalla, keyed by tab.
 */
export function useTabRefetchers() {
  const { refetch: refetchDirections } = useDirectionsQuery();
  const { refetch: refetchIsochrones } = useIsochronesQuery();
  const { refetch: refetchRoundTrip } = useRoundTripQuery();

  return {
    directions: refetchDirections,
    isochrones: refetchIsochrones,
    'round-trip': refetchRoundTrip,
  };
}

/**
 * Refetches the query of the active tab; a no-op on tabs without one.
 */
export function useRefetchActiveTab() {
  const { activeTab } = useParams({ from: '/$activeTab' });
  const tabRefetchers = useTabRefetchers();
  const refetchActiveTab =
    tabRefetchers[activeTab as keyof typeof tabRefetchers];

  return useCallback(() => {
    refetchActiveTab?.();
  }, [refetchActiveTab]);
}
