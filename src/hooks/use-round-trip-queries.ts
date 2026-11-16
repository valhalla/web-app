import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import type {
  ActiveWaypoint,
  ParsedDirectionsGeometry,
  ValhallaRouteResponse,
} from '@/components/types';
import {
  getValhallaUrl,
  buildRoundTripRequest,
  parseDirectionsGeometry,
  showValhallaWarnings,
  VALHALLA_CLIENT_HEADERS,
} from '@/utils/valhalla';
import { reverse_geocode, parseGeocodeResponse } from '@/utils/nominatim';
import { filterProfileSettings } from '@/utils/filter-profile-settings';
import { getDirectionsLanguage } from '@/utils/directions-language';
import { useCommonStore } from '@/stores/common-store';
import { useRoundTripStore } from '@/stores/round-trip-store';
import { router } from '@/routes';

async function fetchRoundTrip() {
  const {
    geocodeResults,
    distance,
    distanceTolerance,
    heading,
    headingTolerance,
  } = useRoundTripStore.getState();
  const start = geocodeResults.find((address) => address.selected);
  if (!start) {
    return null;
  }

  const profile = router.state.location.search.profile || 'bicycle';
  const { settings: rawSettings } = useCommonStore.getState();
  const settings = filterProfileSettings(profile, rawSettings);

  const valhallaRequest = buildRoundTripRequest({
    profile,
    start,
    // @ts-expect-error todo: initial settings and filtered settings types mismatch
    settings,
    language: getDirectionsLanguage(),
    roundTripSettings: {
      distance,
      distanceTolerance,
      heading,
      headingTolerance,
    },
  });
  const params = new URLSearchParams({
    json: JSON.stringify(valhallaRequest.json),
  });

  const response = await fetch(`${getValhallaUrl()}/round_trip?${params}`, {
    headers: {
      'Content-Type': 'application/json',
      ...VALHALLA_CLIENT_HEADERS,
    },
  });

  if (!response.ok) {
    const errorResponse = await response.json().catch(() => ({}));
    throw new Error(errorResponse.error || 'Could not fetch round trip');
  }

  const roundTrip: ValhallaRouteResponse = await response.json();
  (roundTrip as ParsedDirectionsGeometry).decodedGeometry =
    parseDirectionsGeometry(roundTrip);

  showValhallaWarnings(roundTrip.trip.warnings);

  return roundTrip as ParsedDirectionsGeometry;
}

export function useRoundTripQuery() {
  const showLoading = useCommonStore((state) => state.showLoading);
  const zoomTo = useCommonStore((state) => state.zoomTo);
  const receiveRouteResults = useRoundTripStore(
    (state) => state.receiveRouteResults
  );
  const clearRoutes = useRoundTripStore((state) => state.clearRoutes);

  return useQuery({
    queryKey: ['round-trip'],
    queryFn: async () => {
      showLoading(true);
      try {
        const roundTrip = await fetchRoundTrip();
        if (roundTrip) {
          receiveRouteResults({ data: roundTrip });
          zoomTo(roundTrip.decodedGeometry);
        }
        return roundTrip;
      } catch (error) {
        clearRoutes();
        if (error instanceof Error) {
          toast.warning('Error', {
            description: error.message,
            position: 'bottom-center',
            duration: 5000,
            closeButton: true,
          });
        }
        throw error;
      } finally {
        setTimeout(() => showLoading(false), 500);
      }
    },
    enabled: false,
    retry: false,
  });
}

/**
 * Sets the round trip start to the given coordinates right away and replaces
 * it with the nearest address once Nominatim answers.
 */
export function useSetRoundTripStart() {
  const receiveGeocodeResults = useRoundTripStore(
    (state) => state.receiveGeocodeResults
  );
  const updateTextInput = useRoundTripStore((state) => state.updateTextInput);

  const setRoundTripStart = async (lng: number, lat: number) => {
    const coordinatesAddress: ActiveWaypoint = {
      selected: true,
      title: '',
      displaylnglat: [lng, lat],
      sourcelnglat: [lng, lat],
      key: 0,
      addressindex: 0,
    };
    receiveGeocodeResults([coordinatesAddress]);
    updateTextInput({
      userInput: `${lng.toFixed(6)}, ${lat.toFixed(6)}`,
      addressIndex: 0,
    });

    try {
      const response = await reverse_geocode(lng, lat);
      const addresses = parseGeocodeResponse(response.data, [
        lng,
        lat,
      ]) as ActiveWaypoint[];
      if (addresses.length > 0) {
        receiveGeocodeResults(addresses);
        updateTextInput({ userInput: addresses[0]!.title, addressIndex: 0 });
      }
    } catch (error) {
      // the coordinates are still a valid start
      console.error('Reverse geocode error:', error);
    }
  };

  return { setRoundTripStart };
}
