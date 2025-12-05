import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import axios from 'axios';
import { toast } from 'sonner';

import {
  reverse_geocode,
  forward_geocode,
  parseGeocodeResponse,
} from '@/utils/nominatim';
import { VALHALLA_OSM_URL, buildIsochronesRequest } from '@/utils/valhalla';
import { filterProfileSettings } from '@/utils/filter-profile-settings';
import { calcArea } from '@/utils/geom';
import { useCommonStore } from '@/stores/common-store';
import { router } from '@/routes';
import type {
  ActiveWaypoint,
  Center,
  ValhallaIsochroneResponse,
} from '@/components/types';

interface IsochroneResult {
  data: ValhallaIsochroneResponse | null;
  show: boolean;
}

interface IsochroneState {
  successful: boolean;
  userInput: string;
  geocodeResults: ActiveWaypoint[];
  selectedAddress: ActiveWaypoint | null;
  maxRange: number;
  interval: number;
  denoise: number;
  generalize: number;
  results: IsochroneResult;
}

interface IsochroneActions {
  clearIsos: () => void;
  toggleShowOnMap: (show: boolean) => void;
  updateTextInput: (params: {
    userInput: string;
    addressIndex?: number;
  }) => void;
  updateSettings: (params: {
    name: 'maxRange' | 'interval' | 'denoise' | 'generalize';
    value: number;
  }) => void;
  receiveGeocodeResults: (addresses: ActiveWaypoint[]) => void;

  makeIsochronesRequest: () => void;
  fetchReverseGeocodeIso: (lng: number, lat: number) => void;
  fetchGeocode: (userInput: string, lngLat?: [number, number]) => void;
}

type IsochroneStore = IsochroneState & IsochroneActions;

const serverMapping: Record<string, string> = {
  [VALHALLA_OSM_URL!]: 'OSM',
};

export const useIsochronesStore = create<IsochroneStore>()(
  devtools(
    immer((set, get) => ({
      successful: false,
      userInput: '',
      geocodeResults: [],
      selectedAddress: null,
      maxRange: 10,
      interval: 10,
      denoise: 0.1,
      generalize: 0,
      results: { data: null, show: true },

      clearIsos: () =>
        set(
          (state) => {
            state.successful = false;
            state.userInput = '';
            state.geocodeResults = [];
            state.selectedAddress = null;
            state.results = { data: null, show: true };
          },
          undefined,
          'clearIsos'
        ),

      toggleShowOnMap: (show) =>
        set(
          (state) => {
            state.results.show = show;
          },
          undefined,
          'toggleShowOnMap'
        ),

      updateTextInput: ({ userInput, addressIndex }) =>
        set(
          (state) => {
            state.userInput = userInput;

            if (
              addressIndex !== undefined &&
              state.geocodeResults[addressIndex]
            ) {
              state.selectedAddress = state.geocodeResults[addressIndex];
              state.geocodeResults = state.geocodeResults.map((result, i) => ({
                ...result,
                selected: i === addressIndex,
              }));
            }
          },
          undefined,
          'updateTextInput'
        ),

      updateSettings: ({ name, value }) =>
        set(
          (state) => {
            state[name] = value;
          },
          undefined,
          'updateSettings'
        ),

      receiveGeocodeResults: (addresses) =>
        set(
          (state) => {
            state.geocodeResults = addresses;
          },
          undefined,
          'receiveGeocodeResults'
        ),

      // Async actions
      makeIsochronesRequest: () => {
        const { geocodeResults, maxRange, interval, denoise, generalize } =
          get();
        const profile = router.state.location.search.profile;
        const { settings: rawSettings, showLoading } =
          useCommonStore.getState();

        const settings = filterProfileSettings(
          profile || 'bicycle',
          rawSettings
        );

        const center = geocodeResults.find((result) => result.selected);

        if (!center) return;

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

        showLoading(true);

        axios
          .get<ValhallaIsochroneResponse>(VALHALLA_OSM_URL + '/isochrone', {
            params: { json: JSON.stringify(valhallaRequest.json) },
            headers: { 'Content-Type': 'application/json' },
          })
          .then(({ data }) => {
            data.features.forEach((feature) => {
              if (feature.properties) {
                feature.properties.area = calcArea(feature);
              }
            });

            set((state) => {
              state.results.data = data;
              state.successful = true;
            });
          })
          .catch(({ response }) => {
            set((state) => {
              state.results.data = null;
              state.successful = false;
            });

            toast.warning(`${response.data.status}`, {
              description: `${serverMapping[VALHALLA_OSM_URL!]}: ${response.data.error}`,
              position: 'bottom-center',
              duration: 5000,
              closeButton: true,
            });
          })
          .finally(() => {
            setTimeout(() => showLoading(false), 500);
          });
      },

      fetchReverseGeocodeIso: (lng, lat) => {
        const {
          updateTextInput,
          receiveGeocodeResults,
          makeIsochronesRequest,
        } = get();
        const { zoomTo } = useCommonStore.getState();

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

        reverse_geocode(lng, lat)
          .then((response) => {
            const addresses = parseGeocodeResponse(response.data, [lng, lat]);

            if (addresses.length === 0) {
              toast.warning('No addresses', {
                description: 'Sorry, no addresses can be found.',
                position: 'bottom-center',
                duration: 5000,
                closeButton: true,
              });
            }

            receiveGeocodeResults(addresses as ActiveWaypoint[]);
            updateTextInput({
              userInput: addresses[0]?.title || '',
              addressIndex: 0,
            });
            makeIsochronesRequest();
          })
          .catch(console.error);
      },

      fetchGeocode: (userInput, lngLat) => {
        const { receiveGeocodeResults } = get();

        if (lngLat) {
          const addresses: ActiveWaypoint[] = [
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

          receiveGeocodeResults(addresses);
        } else {
          forward_geocode(userInput)
            .then((response) => {
              const addresses = parseGeocodeResponse(response.data);

              if (addresses.length === 0) {
                toast.warning('No addresses', {
                  description: 'Sorry, no addresses can be found.',
                  position: 'bottom-center',
                  duration: 5000,
                  closeButton: true,
                });
              }

              receiveGeocodeResults(addresses as ActiveWaypoint[]);
            })
            .catch(console.error);
        }
      },
    })),
    { name: 'isochrone-store' }
  )
);
