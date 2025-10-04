/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// todo: disabling these eslint rules temporarily until state management is overhauled

import {
  RECEIVE_GEOCODE_RESULTS_ISO,
  REQUEST_GEOCODE_RESULTS_ISO,
  RECEIVE_ISOCHRONE_RESULTS,
  UPDATE_SETTINGS_ISO,
  UPDATE_TEXTINPUT_ISO,
  TOGGLE_PROVIDER_ISO,
  CLEAR_ISOS,
} from '@/actions/types';

import { VALHALLA_OSM_URL } from '../utils/valhalla';
import type { AnyAction } from 'redux';
import type { ActiveWaypoint, ValhallaIsochroneResponse } from '@/common/types';

interface IsochroneResult {
  data: ValhallaIsochroneResponse;
  show: boolean;
}

export interface IsochroneState {
  successful: boolean;
  userInput: string;
  isFetching: boolean;
  geocodeResults: ActiveWaypoint[];
  selectedAddress: string;
  maxRange: number;
  interval: number;
  denoise: number;
  generalize: number;
  results: Record<string, IsochroneResult>;
}

const initialState: IsochroneState = {
  successful: false,
  userInput: '',
  isFetching: false,
  geocodeResults: [],
  selectedAddress: '',
  maxRange: 10,
  interval: 10,
  denoise: 0.1,
  generalize: 0,
  results: {
    [VALHALLA_OSM_URL!]: {
      data: {},
      show: true,
    } as IsochroneResult,
  },
};

export const isochrones = (
  state: IsochroneState = initialState,
  action: AnyAction
): IsochroneState => {
  const { type, payload } = action;
  switch (type) {
    case CLEAR_ISOS:
      return {
        ...state,
        successful: false,
        userInput: '',
        geocodeResults: [],
        selectedAddress: '',
        results: initialState.results,
      };

    case TOGGLE_PROVIDER_ISO:
      return {
        ...state,
        results: {
          ...state.results,
          [action.payload.provider]: {
            ...state.results[action.payload.provider],
            show: payload.show,
          },
        },
      };
    case RECEIVE_ISOCHRONE_RESULTS:
      return {
        ...state,
        results: {
          ...state.results,
          [action.payload.provider]: {
            ...state.results[action.payload.provider],
            data: action.payload.data,
          },
        },
        successful: true,
      };

    case UPDATE_SETTINGS_ISO:
      return {
        ...state,
        [payload.maxRangeName]: payload.value,
        [payload.intervalName]: payload.value,
        [payload.generalizeName]: payload.value,
        [payload.denoiseName]: payload.value,
      };

    case UPDATE_TEXTINPUT_ISO:
      return {
        ...state,
        userInput: payload.userInput,
        selectedAddress: state.geocodeResults[
          action.payload.addressindex
        ] as any,
        geocodeResults: state.geocodeResults.map((result, i) =>
          i === action.payload.addressindex
            ? { ...result, selected: true }
            : { ...result, selected: false }
        ),
      };

    case RECEIVE_GEOCODE_RESULTS_ISO:
      return {
        ...state,
        geocodeResults: payload as ActiveWaypoint[],
        isFetching: false,
      };

    case REQUEST_GEOCODE_RESULTS_ISO:
      return {
        ...state,
        isFetching: true,
      };

    default:
      return state;
  }
};
