import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  ActiveWaypoint,
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
}

type IsochroneStore = IsochroneState & IsochroneActions;

export const useIsochronesStore = create<IsochroneStore>()(
  devtools(
    immer((set) => ({
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
    })),
    { name: 'isochrone-store' }
  )
);
