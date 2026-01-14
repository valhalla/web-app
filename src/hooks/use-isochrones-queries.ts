import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

import type {
  ActiveWaypoint,
  Center,
  ValhallaIsochroneResponse,
} from '@/components/types';
import { getValhallaUrl, buildIsochronesRequest } from '@/utils/valhalla';
import {
  reverse_geocode,
  forward_geocode,
  parseGeocodeResponse,
} from '@/utils/nominatim';
import { filterProfileSettings } from '@/utils/filter-profile-settings';
import { calcArea } from '@/utils/geom';
import { useCommonStore } from '@/stores/common-store';
import { useIsochronesStore } from '@/stores/isochrones-store';
import { router } from '@/routes';

async function fetchIsochrones() {
  const { geocodeResults, maxRange, interval, denoise, generalize } =
    useIsochronesStore.getState();
  const profile = router.state.location.search.profile;
  const { settings: rawSettings } = useCommonStore.getState();

  const settings = filterProfileSettings(profile || 'bicycle', rawSettings);
  const center = geocodeResults.find((result) => result.selected);

  if (!center) {
    return null;
  }

  const valhallaRequest = buildIsochronesRequest({
    profile: profile || 'bicycle',
    center: center as Center,
    // @ts-expect-error todo: initial settings and filtered settings types mismatch
    settings,
    maxRange,
    denoise,
    generalize,
    interval,
  });

  const { data } = await axios.get<ValhallaIsochroneResponse>(
    getValhallaUrl() + '/isochrone',
    {
      params: { json: JSON.stringify(valhallaRequest.json) },
      headers: { 'Content-Type': 'application/json' },
    }
  );

  // Calculate area for each feature
  data.features.forEach((feature) => {
    if (feature.properties) {
      feature.properties.area = calcArea(feature);
    }
  });

  return data;
}

export function useIsochronesQuery() {
  const showLoading = useCommonStore((state) => state.showLoading);

  return useQuery({
    queryKey: ['isochrones'],
    queryFn: async () => {
      showLoading(true);
      try {
        const data = await fetchIsochrones();
        if (data) {
          useIsochronesStore.setState((state) => {
            state.results.data = data;
            state.successful = true;
          });
        }
        return data;
      } catch (error) {
        useIsochronesStore.setState((state) => {
          state.results.data = null;
          state.successful = false;
        });

        if (axios.isAxiosError(error) && error.response) {
          const response = error.response;
          toast.warning(`${response.data.status}`, {
            description: `${response.data.error}`,
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

async function fetchReverseGeocode(lng: number, lat: number) {
  const response = await reverse_geocode(lng, lat);
  const addresses = parseGeocodeResponse(response.data, [lng, lat]);

  if (addresses.length === 0) {
    toast.warning('No addresses', {
      description: 'Sorry, no addresses can be found.',
      position: 'bottom-center',
      duration: 5000,
      closeButton: true,
    });
  }

  return addresses as ActiveWaypoint[];
}

export function useReverseGeocodeIsochrones() {
  const updateTextInput = useIsochronesStore((state) => state.updateTextInput);
  const receiveGeocodeResults = useIsochronesStore(
    (state) => state.receiveGeocodeResults
  );
  const zoomTo = useCommonStore((state) => state.zoomTo);

  const reverseGeocode = async (lng: number, lat: number) => {
    // Set placeholder immediately
    const placeholderAddresses: ActiveWaypoint[] = [
      {
        selected: true,
        title: '',
        displaylnglat: [lng, lat],
        sourcelnglat: [lng, lat],
        key: 0,
        addressindex: 0,
      },
    ];

    receiveGeocodeResults(placeholderAddresses);
    updateTextInput({
      userInput: `${lng.toFixed(6)}, ${lat.toFixed(6)}`,
      addressIndex: 0,
    });
    zoomTo([[lat, lng]]);

    try {
      const addresses = await fetchReverseGeocode(lng, lat);
      receiveGeocodeResults(addresses);
      updateTextInput({
        userInput: addresses[0]?.title || '',
        addressIndex: 0,
      });
      return addresses;
    } catch (error) {
      console.error('Reverse geocode error:', error);
      throw error;
    }
  };

  return { reverseGeocode };
}

async function fetchForwardGeocode(
  userInput: string,
  lngLat?: [number, number]
): Promise<ActiveWaypoint[]> {
  if (lngLat) {
    return [
      {
        title: lngLat.toString(),
        key: 0,
        selected: false,
        addresslnglat: lngLat,
        sourcelnglat: lngLat,
        displaylnglat: lngLat,
        addressindex: 0,
      },
    ];
  }

  const response = await forward_geocode(userInput);
  const addresses = parseGeocodeResponse(response.data);

  if (addresses.length === 0) {
    toast.warning('No addresses', {
      description: 'Sorry, no addresses can be found.',
      position: 'bottom-center',
      duration: 5000,
      closeButton: true,
    });
  }

  return addresses as ActiveWaypoint[];
}

export function useForwardGeocodeIsochrones() {
  const receiveGeocodeResults = useIsochronesStore(
    (state) => state.receiveGeocodeResults
  );

  const forwardGeocode = async (
    userInput: string,
    lngLat?: [number, number]
  ) => {
    try {
      const addresses = await fetchForwardGeocode(userInput, lngLat);
      receiveGeocodeResults(addresses);
      return addresses;
    } catch (error) {
      console.error('Forward geocode error:', error);
      throw error;
    }
  };

  return { forwardGeocode };
}
