import axios from 'axios';
import {
  ADD_WAYPOINT,
  CLEAR_WAYPOINTS,
  RECEIVE_GEOCODE_RESULTS,
  SET_WAYPOINT,
  UPDATE_TEXTINPUT,
  EMPTY_WAYPOINT,
  INSERT_WAYPOINT,
  RECEIVE_ROUTE_RESULTS,
  CLEAR_ROUTES,
  TOGGLE_PROVIDER_ISO,
  HIGHLIGHT_MNV,
  ZOOM_TO_MNV,
  UPDATE_INCLINE_DECLINE,
} from './types';

import { reverse_geocode, parseGeocodeResponse } from '@/utils/nominatim';

import {
  VALHALLA_OSM_URL,
  buildDirectionsRequest,
  parseDirectionsGeometry,
} from '@/utils/valhalla';

import {
  showLoading,
  filterProfileSettings,
  updatePermalink,
  zoomTo,
} from './common-actions';

import type {
  ActiveWaypoint,
  NominationResponse,
  ParsedDirectionsGeometry,
  ThunkResult,
  ValhallaRouteResponse,
} from '@/components/types';
import { toast } from 'sonner';

interface LatLng {
  lng: number;
  lat: number;
}

interface FetchReverseGeocodePermaObject {
  index: number;
  latLng: LatLng;
}

interface FetchReverseGeocodeObject {
  index: number;
  fromDrag?: boolean;
  latLng: LatLng;
}

interface UpdateTextInputObject {
  inputValue: string;
  index: number;
  addressindex?: number;
}

interface ReceiveGeocodeResultsObject {
  addresses: ActiveWaypoint[];
  index: number;
}

interface Waypoint {
  id: string;
  geocodeResults: ActiveWaypoint[];
  userInput: string;
}

interface ValhallaRequest {
  json: Record<string, unknown>;
}

interface HighlightSegment {
  startIndex: number;
  endIndex: number;
  alternate?: number;
}

interface ZoomObject {
  index: number;
  timeNow: number;
}

const serverMapping: Record<string, string> = {
  [VALHALLA_OSM_URL!]: 'OSM',
};

export const makeRequest = (): ThunkResult => (dispatch, getState) => {
  dispatch(updatePermalink());
  const { waypoints } = getState().directions;
  const { profile, dateTime } = getState().common;
  let { settings } = getState().common;
  // if 2 results are selected
  const activeWaypoints = getActiveWaypoints(waypoints);
  if (activeWaypoints.length >= 2) {
    // @ts-expect-error todo: this is not correct. initial settings and filtered settings are not the same but we are changing in later.
    // we should find a better way to do this.
    settings = filterProfileSettings(profile, settings);
    const valhallaRequest = buildDirectionsRequest({
      profile,
      activeWaypoints,
      // @ts-expect-error todo: this is not correct. initial settings and filtered settings are not the same but we are changing in later.
      // we should find a better way to do this.
      settings,
      dateTime,
    });
    dispatch(fetchValhallaDirections(valhallaRequest));
  }
};

const getActiveWaypoints = (waypoints: Waypoint[]): ActiveWaypoint[] => {
  const activeWaypoints: ActiveWaypoint[] = [];
  for (const waypoint of waypoints) {
    if (waypoint.geocodeResults.length > 0) {
      for (const result of waypoint.geocodeResults) {
        if (result.selected) {
          activeWaypoints.push(result);
          break;
        }
      }
    }
  }
  return activeWaypoints;
};

const fetchValhallaDirections =
  (valhallaRequest: ValhallaRequest): ThunkResult =>
  (dispatch) => {
    dispatch(showLoading(true));

    const config = {
      params: { json: JSON.stringify(valhallaRequest.json) },
      headers: {
        'Content-Type': 'application/json',
      },
    };
    axios
      .get<ValhallaRouteResponse>(VALHALLA_OSM_URL + '/route', config)
      .then(({ data }) => {
        (data as ParsedDirectionsGeometry).decodedGeometry =
          parseDirectionsGeometry(data);

        if (data.alternates) {
          for (let i = 0; i < data.alternates.length; i++) {
            const alternate = data.alternates[i];

            if (alternate) {
              (data.alternates[i] as ParsedDirectionsGeometry).decodedGeometry =
                parseDirectionsGeometry(alternate);
            }
          }
        }
        dispatch(
          registerRouteResponse(
            VALHALLA_OSM_URL!,
            data as ParsedDirectionsGeometry
          )
        );
        dispatch(zoomTo((data as ParsedDirectionsGeometry).decodedGeometry));
      })
      .catch(({ response }) => {
        let error_msg = response.data.error;
        if (response.data.error_code === 154) {
          error_msg += ` for ${valhallaRequest.json.costing}.`;
        }
        dispatch(clearRoutes(VALHALLA_OSM_URL!));
        toast.warning(`${response.data.status}`, {
          description: `${serverMapping[VALHALLA_OSM_URL!]}: ${error_msg}`,
          position: 'bottom-center',
          duration: 5000,
          closeButton: true,
        });
      })
      .finally(() => {
        setTimeout(() => {
          dispatch(showLoading(false));
        }, 500);
      });
  };

export const registerRouteResponse = (
  provider: string,
  data: ParsedDirectionsGeometry
) => ({
  type: RECEIVE_ROUTE_RESULTS,
  payload: {
    provider,
    data,
  },
});

export const clearRoutes = (provider?: string) => ({
  type: CLEAR_ROUTES,
  payload: provider,
});

const placeholderAddress =
  (index: number, lng: number, lat: number): ThunkResult =>
  (dispatch) => {
    // placeholder until geocoder is complete
    // will add latLng to input field
    const addresses: ActiveWaypoint[] = [
      {
        title: '',
        displaylnglat: [lng, lat],
        sourcelnglat: [lng, lat],
        key: index,
        addressindex: index,
      },
    ];
    dispatch(receiveGeocodeResults({ addresses, index: index }));
    dispatch(
      updateTextInput({
        inputValue: [lng.toFixed(6), lat.toFixed(6)].join(', '),
        index: index,
        addressindex: 0,
      })
    );
  };

export const fetchReverseGeocodePerma =
  (object: FetchReverseGeocodePermaObject): ThunkResult =>
  (dispatch) => {
    const { index } = object;
    const { lng, lat } = object.latLng;

    if (index > 1) {
      dispatch(doAddWaypoint(false));
    }

    dispatch(placeholderAddress(index, lng, lat));

    reverse_geocode(lng, lat)
      .then((response) => {
        dispatch(
          processGeocodeResponse(response.data, index, true, [lng, lat], false)
        );
      })
      .catch((error) => {
        console.log(error);
      });
  };

export const fetchReverseGeocode =
  (object: FetchReverseGeocodeObject): ThunkResult =>
  (dispatch, getState) => {
    //dispatch(requestGeocodeResults({ index: object.index, reverse: true }))
    const { waypoints } = getState().directions;

    let { index } = object;
    const { fromDrag } = object;
    const { lng, lat } = object.latLng;

    if (index === -1) {
      index = waypoints.length - 1;
    } else if (index === 1 && !fromDrag) {
      // insert waypoint from context menu
      dispatch(doAddWaypoint(true));

      index = waypoints.length - 2;
    }

    dispatch(placeholderAddress(index, lng, lat));

    reverse_geocode(lng, lat)
      .then((response) => {
        dispatch(
          processGeocodeResponse(response.data, index, true, [lng, lat])
        );
      })
      .catch((error) => {
        console.log(error);
      });
    // .finally(() => {
    //   // always executed
    // })
  };

const processGeocodeResponse =
  (
    data: NominationResponse,
    index: number,
    reverse?: boolean,
    lngLat?: [number, number],
    permaLast?: boolean
  ): ThunkResult =>
  (dispatch) => {
    const addresses = parseGeocodeResponse(data, lngLat!);
    if (addresses.length === 0) {
      toast.warning(`No addresses`, {
        description: 'Sorry, no addresses can be found.',
        position: 'bottom-center',
        duration: 5000,
        closeButton: true,
      });
    }
    dispatch(
      receiveGeocodeResults({ addresses: addresses as ActiveWaypoint[], index })
    );

    if (reverse) {
      dispatch(
        updateTextInput({
          inputValue: addresses[0]?.title || '',
          index: index,
          addressindex: 0,
        })
      );
      if (permaLast === undefined) {
        dispatch(makeRequest());
        dispatch(updatePermalink());
      } else if (permaLast) {
        dispatch(makeRequest());
        dispatch(updatePermalink());
      }
    }
  };

export const receiveGeocodeResults = (object: ReceiveGeocodeResultsObject) => ({
  type: RECEIVE_GEOCODE_RESULTS,
  payload: object,
});

export const updateTextInput = (object: UpdateTextInputObject) => ({
  type: UPDATE_TEXTINPUT,
  payload: object,
});

export const doRemoveWaypoint =
  (index?: number): ThunkResult =>
  (dispatch, getState) => {
    if (index === undefined) {
      dispatch(clearWaypoints());
      Array(2)
        .fill(null)
        .map(() => dispatch(doAddWaypoint(false)));
    } else {
      let waypoints = getState().directions.waypoints;
      if (waypoints.length > 2) {
        dispatch(clearWaypoints(index));
        dispatch(makeRequest());
      } else {
        dispatch(emptyWaypoint(index));
      }
      waypoints = getState().directions.waypoints;
      if (getActiveWaypoints(waypoints).length < 2) {
        dispatch(clearRoutes(VALHALLA_OSM_URL!));
      }
    }
    dispatch(updatePermalink());
  };

export const highlightManeuver =
  (fromTo: HighlightSegment): ThunkResult =>
  (dispatch, getState) => {
    const highlightSegment = getState().directions.highlightSegment;
    // this is dehighlighting
    if (
      highlightSegment.startIndex === fromTo.startIndex &&
      highlightSegment.endIndex === fromTo.endIndex
    ) {
      fromTo.startIndex = -1;
      fromTo.endIndex = -1;
    }

    dispatch({
      type: HIGHLIGHT_MNV,
      payload: fromTo,
    });
  };

export const zoomToManeuver = (zoomObj: ZoomObject) => ({
  type: ZOOM_TO_MNV,
  payload: zoomObj,
});

export const clearWaypoints = (index?: number) => ({
  type: CLEAR_WAYPOINTS,
  payload: { index: index },
});

export const emptyWaypoint = (index: number) => ({
  type: EMPTY_WAYPOINT,
  payload: { index: index },
});

export const updateInclineDeclineTotal = (object: Record<string, unknown>) => ({
  type: UPDATE_INCLINE_DECLINE,
  payload: object,
});

export const doAddWaypoint =
  (doInsert?: boolean): ThunkResult =>
  (dispatch, getState) => {
    const waypoints = getState().directions.waypoints;
    let maxIndex = Math.max(
      ...waypoints.map((wp: Waypoint) => {
        return parseInt(wp.id, 10);
      })
    );
    maxIndex = isFinite(maxIndex) === false ? 0 : maxIndex + 1;

    const emptyWaypoint: Waypoint = {
      id: maxIndex.toString(),
      geocodeResults: [],
      userInput: '',
    };

    if (doInsert) {
      dispatch(insertWaypoint(emptyWaypoint));
    } else {
      dispatch(addWaypoint(emptyWaypoint));
    }
  };

const insertWaypoint = (waypoint: Waypoint) => ({
  type: INSERT_WAYPOINT,
  payload: waypoint,
});

export const addWaypoint = (waypoint: Waypoint) => ({
  type: ADD_WAYPOINT,
  payload: waypoint,
});

export const setWaypoints = (waypoints: Waypoint[]) => ({
  type: SET_WAYPOINT,
  payload: waypoints,
});

export const showProvider = (
  provider: string,
  show: boolean,
  idx?: number
) => ({
  type: TOGGLE_PROVIDER_ISO,
  payload: {
    provider,
    show,
    idx,
  },
});
