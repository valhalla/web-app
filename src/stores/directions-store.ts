import type { ActiveWaypoint } from '@/components/types';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  createRouteResultSlice,
  type RouteResultSlice,
} from './route-result-slice';

export interface Waypoint {
  id: string;
  geocodeResults: ActiveWaypoint[];
  userInput: string;
}

interface LatLng {
  lng: number;
  lat: number;
}

const createEmptyWaypoint = (id: string): Waypoint => ({
  id,
  geocodeResults: [],
  userInput: '',
});

export const defaultWaypoints: Waypoint[] = [
  createEmptyWaypoint('0'),
  createEmptyWaypoint('1'),
];

const getNextWaypointId = (waypoints: Waypoint[]): string => {
  const maxIndex = Math.max(...waypoints.map((wp) => parseInt(wp.id, 10)));
  return (isFinite(maxIndex) ? maxIndex + 1 : 0).toString();
};

const hasActiveRoute = (waypoints: Waypoint[]): boolean =>
  waypoints.filter(
    (wp) =>
      wp.geocodeResults.length > 0 && wp.geocodeResults.some((r) => r.selected)
  ).length >= 2;

interface DirectionsState {
  waypoints: Waypoint[];
  selectedAddresses: string | (Waypoint | null)[];
  isOptimized: boolean;
}

interface DirectionsActions {
  receiveGeocodeResults: (params: {
    index: number;
    addresses: ActiveWaypoint[];
  }) => void;
  updateTextInput: (params: {
    inputValue: string;
    index: number;
    addressindex?: number;
  }) => void;
  clearWaypoints: () => void;
  emptyWaypoint: (params: { index: number }) => void;
  setWaypoint: (waypoints: Waypoint[]) => void;
  addWaypointAtIndex: (params: { index: number; placeholder?: LatLng }) => void;
  addEmptyWaypointToEnd: () => void;
  doRemoveWaypoint: (params: { index: number }) => void;
  updatePlaceholderAddressAtIndex: (
    index: number,
    lng: number,
    lat: number
  ) => void;
  setIsOptimized: (isOptimized: boolean) => void;
}

type DirectionsStore = RouteResultSlice & DirectionsState & DirectionsActions;

export const useDirectionsStore = create<DirectionsStore>()(
  devtools(
    immer((set) => ({
      ...createRouteResultSlice(set),
      waypoints: defaultWaypoints,
      selectedAddresses: '',
      isOptimized: false,

      receiveGeocodeResults: ({ index, addresses }) =>
        set(
          (state) => {
            if (state.waypoints[index]) {
              state.waypoints[index].geocodeResults = addresses;
              state.isOptimized = false;
            }
          },
          undefined,
          'receiveGeocodeResults'
        ),

      updateTextInput: ({ inputValue, index, addressindex }) =>
        set(
          (state) => {
            state.selectedAddresses = state.waypoints.flatMap((wp) =>
              wp.geocodeResults.map((_, i) => (i === addressindex ? wp : null))
            );

            if (state.waypoints[index]) {
              state.waypoints[index].userInput = inputValue;
              state.waypoints[index].geocodeResults = state.waypoints[
                index
              ].geocodeResults.map((result, j) => ({
                ...result,
                selected: j === addressindex,
              }));
              state.isOptimized = false;
            }
          },
          undefined,
          'updateTextInput'
        ),

      clearWaypoints: () =>
        set(
          (state) => {
            state.waypoints = [...defaultWaypoints];
            state.isOptimized = false;
          },
          undefined,
          'clearWaypoints'
        ),

      emptyWaypoint: ({ index }) =>
        set(
          (state) => {
            if (state.waypoints[index]) {
              state.waypoints[index].userInput = '';
              state.waypoints[index].geocodeResults = [];
              state.isOptimized = false;
            }
          },
          undefined,
          'emptyWaypoint'
        ),

      setWaypoint: (waypoints) =>
        set(
          (state) => {
            state.waypoints = waypoints;
          },
          undefined,
          'setWaypoint'
        ),

      addWaypointAtIndex: ({ index, placeholder }) =>
        set(
          (state) => {
            const id = getNextWaypointId(state.waypoints);

            const newWaypoint: Waypoint = placeholder
              ? {
                  id,
                  geocodeResults: [
                    {
                      title: '',
                      displaylnglat: [placeholder.lng, placeholder.lat],
                      sourcelnglat: [placeholder.lng, placeholder.lat],
                      key: index,
                      addressindex: index,
                    },
                  ],
                  userInput: `${placeholder.lng.toFixed(6)}, ${placeholder.lat.toFixed(6)}`,
                }
              : createEmptyWaypoint(id);

            state.waypoints.splice(index, 0, newWaypoint);
            state.isOptimized = false;
          },
          undefined,
          'addWaypointAtIndex'
        ),

      addEmptyWaypointToEnd: () =>
        set(
          (state) => {
            state.waypoints.push(
              createEmptyWaypoint((state.waypoints.length + 1).toString())
            );
            state.isOptimized = false;
          },
          undefined,
          'addEmptyWaypointToEnd'
        ),

      doRemoveWaypoint: ({ index }) =>
        set(
          (state) => {
            if (state.waypoints.length > 2) {
              state.waypoints.splice(index, 1);
            } else if (state.waypoints[index]) {
              state.waypoints[index].userInput = '';
              state.waypoints[index].geocodeResults = [];
            }

            state.isOptimized = false;

            if (!hasActiveRoute(state.waypoints)) {
              state.successful = false;
              state.inclineDeclineTotal = undefined;
              state.results.data = null;
            }
          },
          undefined,
          'doRemoveWaypoint'
        ),

      updatePlaceholderAddressAtIndex: (index, lng, lat) =>
        set(
          (state) => {
            if (state.waypoints[index]) {
              state.waypoints[index].geocodeResults = [
                {
                  title: '',
                  displaylnglat: [lng, lat],
                  sourcelnglat: [lng, lat],
                  key: index,
                  addressindex: index,
                  selected: true,
                },
              ];
              state.waypoints[index].userInput =
                `${lng.toFixed(6)}, ${lat.toFixed(6)}`;
              state.isOptimized = false;
            }
          },
          undefined,
          'updatePlaceholderAddressAtIndex'
        ),

      setIsOptimized: (isOptimized) =>
        set(
          (state) => {
            state.isOptimized = isOptimized;
          },
          undefined,
          'setIsOptimized'
        ),
    })),
    { name: 'directions-store' }
  )
);
