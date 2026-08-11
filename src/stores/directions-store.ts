import type {
  ActiveWaypoint,
  ParsedDirectionsGeometry,
} from '@/components/types';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface Waypoint {
  id: string;
  geocodeResults: ActiveWaypoint[];
  selectedAddress: ActiveWaypoint | null;
  userInput: string;
}

interface HighlightSegment {
  startIndex: number;
  endIndex: number;
  alternate: number;
}

interface ZoomObj {
  index: number;
  timeNow: number;
}

interface RouteResult {
  data: ParsedDirectionsGeometry | null;
  show: Record<string, boolean>;
}

interface InclineDeclineTotal {
  [key: string]: unknown;
}

interface LatLng {
  lng: number;
  lat: number;
}

const createEmptyWaypoint = (id: string): Waypoint => ({
  id,
  geocodeResults: [],
  selectedAddress: null,
  userInput: '',
});

export const defaultWaypoints: Waypoint[] = [
  createEmptyWaypoint('0'),
  createEmptyWaypoint('1'),
];

/** An address for a raw coordinate pair, i.e. one that was never geocoded. */
export const createCoordinateAddress = (
  lng: number,
  lat: number
): ActiveWaypoint => {
  const lngLat: [number, number] = [lng, lat];
  return {
    title: `${lng.toFixed(6)}, ${lat.toFixed(6)}`,
    addresslnglat: lngLat,
    sourcelnglat: lngLat,
    displaylnglat: lngLat,
    key: 0,
    addressindex: 0,
  };
};

const getNextWaypointId = (waypoints: Waypoint[]): string => {
  const maxIndex = Math.max(...waypoints.map((wp) => parseInt(wp.id, 10)));
  return (isFinite(maxIndex) ? maxIndex + 1 : 0).toString();
};

const hasActiveRoute = (waypoints: Waypoint[]): boolean =>
  waypoints.filter((wp) => wp.selectedAddress).length >= 2;

export interface DirectionsState {
  successful: boolean;
  highlightSegment: HighlightSegment;
  waypoints: Waypoint[];
  zoomObj: ZoomObj;
  results: RouteResult;
  inclineDeclineTotal?: InclineDeclineTotal;
  isOptimized: boolean;
  activeRouteIndex: number;
}

interface DirectionsActions {
  updateInclineDecline: (inclineDeclineTotal: InclineDeclineTotal) => void;
  toggleShowOnMap: (params: { show: boolean; idx: number }) => void;
  clearRoutes: () => void;
  receiveRouteResults: (params: { data: ParsedDirectionsGeometry }) => void;
  receiveGeocodeResults: (params: {
    index: number;
    addresses: ActiveWaypoint[];
  }) => void;
  selectAddress: (params: { index: number; address: ActiveWaypoint }) => void;
  clearWaypoints: () => void;
  emptyWaypoint: (params: { index: number }) => void;
  setWaypoint: (waypoints: Waypoint[]) => void;
  addWaypointAtIndex: (params: { index: number; placeholder?: LatLng }) => void;
  addEmptyWaypointToEnd: () => void;
  doRemoveWaypoint: (params: { index: number }) => void;
  highlightManeuver: (fromTo: HighlightSegment) => void;
  zoomToManeuver: (zoomObj: ZoomObj) => void;
  setIsOptimized: (isOptimized: boolean) => void;
  setActiveRouteIndex: (index: number) => void;
}

type DirectionsStore = DirectionsState & DirectionsActions;

export const useDirectionsStore = create<DirectionsStore>()(
  devtools(
    immer((set) => ({
      successful: false,
      highlightSegment: { startIndex: -1, endIndex: -1, alternate: -1 },
      waypoints: defaultWaypoints,
      zoomObj: { index: -1, timeNow: -1 },
      results: { data: null, show: { '0': true } },
      isOptimized: false,
      activeRouteIndex: 0,

      updateInclineDecline: (inclineDeclineTotal) =>
        set(
          (state) => {
            state.inclineDeclineTotal = inclineDeclineTotal;
          },
          undefined,
          'updateInclineDecline'
        ),

      toggleShowOnMap: ({ idx, show }) =>
        set(
          (state) => {
            state.results.show[idx] = show;
          },
          undefined,
          'toggleShowOnMap'
        ),

      clearRoutes: () =>
        set(
          (state) => {
            state.successful = false;
            state.inclineDeclineTotal = undefined;
            state.results.data = null;
            state.activeRouteIndex = 0;
          },
          undefined,
          'clearRoutes'
        ),

      receiveRouteResults: ({ data }) =>
        set(
          (state) => {
            const show: Record<string, boolean> = { '0': true };
            data.alternates?.forEach((_, i) => (show[i + 1] = true));

            state.successful = true;
            state.inclineDeclineTotal = undefined;
            state.results = { data, show };
            state.activeRouteIndex = 0;
          },
          undefined,
          'receiveRouteResults'
        ),

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

      selectAddress: ({ index, address }) =>
        set(
          (state) => {
            if (state.waypoints[index]) {
              state.waypoints[index].selectedAddress = address;
              state.waypoints[index].userInput = address.title;
              state.isOptimized = false;
            }
          },
          undefined,
          'selectAddress'
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
              state.waypoints[index].selectedAddress = null;
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
            const newWaypoint = createEmptyWaypoint(
              getNextWaypointId(state.waypoints)
            );

            if (placeholder) {
              const address = createCoordinateAddress(
                placeholder.lng,
                placeholder.lat
              );
              newWaypoint.selectedAddress = address;
              newWaypoint.userInput = address.title;
            }

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
              createEmptyWaypoint(getNextWaypointId(state.waypoints))
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
              state.waypoints[index].selectedAddress = null;
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

      highlightManeuver: (fromTo) =>
        set(
          (state) => {
            const { startIndex, endIndex } = state.highlightSegment;
            const isToggleOff =
              startIndex === fromTo.startIndex && endIndex === fromTo.endIndex;

            state.highlightSegment = isToggleOff
              ? { startIndex: -1, endIndex: -1, alternate: fromTo.alternate }
              : fromTo;
          },
          undefined,
          'highlightManeuver'
        ),

      zoomToManeuver: (zoomObj) =>
        set(
          (state) => {
            state.zoomObj = zoomObj;
          },
          undefined,
          'zoomToManeuver'
        ),

      setIsOptimized: (isOptimized) =>
        set(
          (state) => {
            state.isOptimized = isOptimized;
          },
          undefined,
          'setIsOptimized'
        ),

      setActiveRouteIndex: (index) =>
        set(
          (state) => {
            state.activeRouteIndex = index;
          },
          undefined,
          'setActiveRouteIndex'
        ),
    })),
    { name: 'directions-store' }
  )
);
