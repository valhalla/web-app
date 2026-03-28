import type {
  ActiveWaypoint,
  ParsedDirectionsGeometry,
} from '@/components/types';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface TraceRouteWaypoint {
  id: 'start' | 'end';
  geocodeResults: ActiveWaypoint[];
  userInput: string;
}

interface TraceRouteResult {
  data: ParsedDirectionsGeometry | null;
  show: Record<string, boolean>;
}

const createEmptyWaypoint = (id: 'start' | 'end'): TraceRouteWaypoint => ({
  id,
  geocodeResults: [],
  userInput: '',
});

const createDefaultWaypoints = (): [TraceRouteWaypoint, TraceRouteWaypoint] => [
  createEmptyWaypoint('start'),
  createEmptyWaypoint('end'),
];

const createWaypointFromLatLng = (
  id: 'start' | 'end',
  lng: number,
  lat: number,
  key: number
): TraceRouteWaypoint => ({
  id,
  geocodeResults: [
    {
      title: '',
      displaylnglat: [lng, lat],
      sourcelnglat: [lng, lat],
      key,
      addressindex: key,
      selected: true,
    },
  ],
  userInput: `${lng.toFixed(6)}, ${lat.toFixed(6)}`,
});

const normalizeTwoWaypoints = (
  waypoints: TraceRouteWaypoint[]
): [TraceRouteWaypoint, TraceRouteWaypoint] => {
  const start = waypoints[0]
    ? { ...waypoints[0], id: 'start' as const }
    : createEmptyWaypoint('start');
  const end = waypoints[1]
    ? { ...waypoints[1], id: 'end' as const }
    : createEmptyWaypoint('end');

  return [start, end];
};

export interface TraceRouteState {
  successful: boolean;
  results: TraceRouteResult;
  activeRouteIndex: number;
  waypoints: [TraceRouteWaypoint, TraceRouteWaypoint];
  inputGeometry: number[][] | null;
}

interface TraceRouteActions {
  clearTraceRoute: () => void;
  receiveTraceRouteResults: (params: {
    data: ParsedDirectionsGeometry;
  }) => void;

  setInputGeometry: (coords: number[][] | null) => void;

  setWaypoints: (waypoints: TraceRouteWaypoint[]) => void;
  clearWaypoints: () => void;
  setActiveRouteIndex: (index: number) => void;
  toggleShowOnMap: (params: { show: boolean; idx: number }) => void;
}

type TraceRouteStore = TraceRouteState & TraceRouteActions;

export const useTraceRouteStore = create<TraceRouteStore>()(
  devtools(
    immer((set) => ({
      successful: false,
      results: { data: null, show: { '0': true } },
      activeRouteIndex: 0,
      waypoints: createDefaultWaypoints(),

      // NEW
      inputGeometry: null,

      clearTraceRoute: () =>
        set(
          (state) => {
            state.successful = false;
            state.results.data = null;
            state.results.show = { '0': true };
            state.activeRouteIndex = 0;
            state.waypoints = createDefaultWaypoints();

            // NEW
            state.inputGeometry = null;
          },
          undefined,
          'clearTraceRoute'
        ),

      receiveTraceRouteResults: ({ data }) =>
        set(
          (state) => {
            const show: Record<string, boolean> = { '0': true };
            data.alternates?.forEach((_, i) => (show[i + 1] = true));

            const locations = data.trip.locations ?? [];
            const startLocation = locations[0];
            const endLocation = locations[locations.length - 1];

            state.successful = true;
            state.results = { data, show };
            state.activeRouteIndex = 0;

            state.waypoints = [
              startLocation
                ? createWaypointFromLatLng(
                    'start',
                    startLocation.lon,
                    startLocation.lat,
                    0
                  )
                : createEmptyWaypoint('start'),
              endLocation
                ? createWaypointFromLatLng(
                    'end',
                    endLocation.lon,
                    endLocation.lat,
                    1
                  )
                : createEmptyWaypoint('end'),
            ];
          },
          undefined,
          'receiveTraceRouteResults'
        ),

      // NEW
      setInputGeometry: (coords) =>
        set(
          (state) => {
            state.inputGeometry = coords;
          },
          undefined,
          'setInputGeometry'
        ),

      setWaypoints: (waypoints) =>
        set(
          (state) => {
            state.waypoints = normalizeTwoWaypoints(waypoints);
          },
          undefined,
          'setWaypoints'
        ),

      clearWaypoints: () =>
        set(
          (state) => {
            state.waypoints = createDefaultWaypoints();
          },
          undefined,
          'clearWaypoints'
        ),

      setActiveRouteIndex: (index) =>
        set(
          (state) => {
            state.activeRouteIndex = index;
          },
          undefined,
          'setActiveRouteIndex'
        ),

      toggleShowOnMap: ({ idx, show }) =>
        set(
          (state) => {
            state.results.show[idx] = show;
          },
          undefined,
          'toggleShowOnMap'
        ),
    })),
    { name: 'trace-route-store' }
  )
);
