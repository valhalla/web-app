import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ActiveWaypoint } from '@/components/types';
import {
  createRouteResultSlice,
  type RouteResultSlice,
} from './route-result-slice';

export interface RoundTripSettings {
  /** desired length in kilometers */
  distance: number;
  /** accepted deviation from `distance` in percent */
  distanceTolerance: number;
  /** direction the round trip heads out to, in degrees clockwise from north */
  heading: number;
  /** width of the sector around `heading` the round trip may turn in, in degrees */
  headingTolerance: number;
}

export const roundTripSettingsInit: RoundTripSettings = {
  distance: 20,
  distanceTolerance: 10,
  heading: 0,
  headingTolerance: 45,
};

interface RoundTripState extends RoundTripSettings {
  userInput: string;
  geocodeResults: ActiveWaypoint[];
}

interface RoundTripActions {
  clearRoundTrip: () => void;
  updateTextInput: (params: {
    userInput: string;
    addressIndex?: number;
  }) => void;
  receiveGeocodeResults: (addresses: ActiveWaypoint[]) => void;
  updateSettings: (params: {
    name: keyof RoundTripSettings;
    value: number;
  }) => void;
}

type RoundTripStore = RouteResultSlice & RoundTripState & RoundTripActions;

export const useRoundTripStore = create<RoundTripStore>()(
  devtools(
    immer((set) => ({
      ...createRouteResultSlice(set),
      ...roundTripSettingsInit,
      userInput: '',
      geocodeResults: [],

      clearRoundTrip: () =>
        set(
          (state) => {
            state.userInput = '';
            state.geocodeResults = [];
            state.successful = false;
            state.inclineDeclineTotal = undefined;
            state.results.data = null;
          },
          undefined,
          'clearRoundTrip'
        ),

      updateTextInput: ({ userInput, addressIndex }) =>
        set(
          (state) => {
            state.userInput = userInput;
            if (
              addressIndex !== undefined &&
              state.geocodeResults[addressIndex]
            ) {
              state.geocodeResults = state.geocodeResults.map((address, i) => ({
                ...address,
                selected: i === addressIndex,
              }));
            }
          },
          undefined,
          'updateTextInput'
        ),

      receiveGeocodeResults: (addresses) =>
        set(
          (state) => {
            state.geocodeResults = addresses;
          },
          undefined,
          'receiveGeocodeResults'
        ),

      updateSettings: ({ name, value }) =>
        set(
          (state) => {
            state[name] = value;
          },
          undefined,
          'updateSettings'
        ),
    })),
    { name: 'round-trip-store' }
  )
);
