import type { ParsedDirectionsGeometry } from '@/components/types';

export interface HighlightSegment {
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

export interface RouteResultState {
  successful: boolean;
  highlightSegment: HighlightSegment;
  zoomObj: ZoomObj;
  results: RouteResult;
  inclineDeclineTotal?: InclineDeclineTotal;
  activeRouteIndex: number;
}

export interface RouteResultActions {
  updateInclineDecline: (inclineDeclineTotal: InclineDeclineTotal) => void;
  toggleShowOnMap: (params: { show: boolean; idx: number }) => void;
  clearRoutes: () => void;
  receiveRouteResults: (params: { data: ParsedDirectionsGeometry }) => void;
  highlightManeuver: (fromTo: HighlightSegment) => void;
  zoomToManeuver: (zoomObj: ZoomObj) => void;
  setActiveRouteIndex: (index: number) => void;
}

export type RouteResultSlice = RouteResultState & RouteResultActions;

// `set` of a store using the immer + devtools middlewares
type ImmerDevtoolsSet = (
  updater: (state: RouteResultState) => void,
  replace: undefined,
  action: string
) => void;

/**
 * Route result state and actions shared by every store that renders a
 * Valhalla /route-like response (directions, round trip), so the map layers,
 * route cards and maneuver lists work with either of them.
 */
export const createRouteResultSlice = (
  set: ImmerDevtoolsSet
): RouteResultSlice => ({
  successful: false,
  highlightSegment: { startIndex: -1, endIndex: -1, alternate: -1 },
  zoomObj: { index: -1, timeNow: -1 },
  results: { data: null, show: { '0': true } },
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

  setActiveRouteIndex: (index) =>
    set(
      (state) => {
        state.activeRouteIndex = index;
      },
      undefined,
      'setActiveRouteIndex'
    ),
});
