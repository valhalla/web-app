import axios from 'axios';
import {
  UPDATE_TEXTINPUT_ISO,
  UPDATE_SETTINGS_ISO,
  RECEIVE_GEOCODE_RESULTS_ISO,
  REQUEST_GEOCODE_RESULTS_ISO,
  TOGGLE_PROVIDER_ISO,
  RECEIVE_ISOCHRONE_RESULTS,
  CLEAR_ISOS,
} from './types';
import {
  reverse_geocode,
  forward_geocode,
  parseGeocodeResponse,
} from '@/utils/nominatim';
import { VALHALLA_OSM_URL, buildIsochronesRequest } from '@/utils/valhalla';

import {
  sendMessage,
  showLoading,
  updatePermalink,
  filterProfileSettings,
} from './common-actions';
import { calcArea } from '@/utils/geom';
import type {
  ActiveWaypoint,
  Center,
  NominatimResponse,
  ThunkResult,
  UpdateIsoSettingsObject,
  ValhallaIsochroneResponse,
  ValhallaRouteErrorResponse,
} from '@/common/types';

interface UpdateTextInputObject {
  userInput: string;
  addressindex?: number;
}

const serverMapping = {
  [VALHALLA_OSM_URL!]: 'OSM',
};

export const makeIsochronesRequest =
  (): ThunkResult => (dispatch, getState) => {
    const { geocodeResults, maxRange, interval, denoise, generalize } =
      getState().isochrones;
    const { profile } = getState().common;
    let { settings } = getState().common;

    // @ts-expect-error todo: this is not correct. initial settings and filtered settings are not the same but we are changing in later.
    // we should find a better way to do this.
    settings = filterProfileSettings(profile, settings);

    // console.log(settings)

    // if center is selected
    const center: ActiveWaypoint | undefined = geocodeResults.find(
      (result) => result.selected
    );

    if (center !== undefined) {
      const valhallaRequest = buildIsochronesRequest({
        profile,
        center: center as Center,
        // @ts-expect-error todo: this is not correct. initial settings and filtered settings are not the same but we are changing in later.
        // we should find a better way to do this.
        settings,
        maxRange,
        denoise,
        generalize,
        interval,
      });
      dispatch(fetchValhallaIsochrones(valhallaRequest));
    }
  };

const fetchValhallaIsochrones =
  (valhallaRequest: ReturnType<typeof buildIsochronesRequest>): ThunkResult =>
  (dispatch) => {
    dispatch(showLoading(true));

    for (const URL of [VALHALLA_OSM_URL]) {
      axios
        .get<ValhallaIsochroneResponse>(URL + '/isochrone', {
          params: { json: JSON.stringify(valhallaRequest.json) },
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then(({ data }) => {
          data.features.forEach((feature) => {
            if (feature.properties) {
              feature.properties.area = calcArea(feature);
            }
          });
          dispatch(registerIsoResponse(URL!, data));
        })
        .catch((error: ValhallaRouteErrorResponse) => {
          dispatch(registerIsoResponse(URL!, []));
          dispatch(
            sendMessage({
              type: 'warning',
              icon: 'warning',
              description: `${serverMapping[URL!]}: ${error.response.data.error}`,
              title: `${error.response.data.status}`,
            })
          );
        })
        .finally(() => {
          setTimeout(() => {
            dispatch(showLoading(false));
          }, 500);
        });
    }
  };

export const clearIsos = (provider?: string) => ({
  type: CLEAR_ISOS,
  payload: provider,
});

export const registerIsoResponse = (
  provider: string,
  data: ValhallaIsochroneResponse | never[]
) => ({
  type: RECEIVE_ISOCHRONE_RESULTS,
  payload: {
    provider,
    data,
  },
});

export const updateTextInput = (obj: UpdateTextInputObject) => ({
  type: UPDATE_TEXTINPUT_ISO,
  payload: obj,
});

export const updateIsoSettings = (obj: UpdateIsoSettingsObject) => ({
  type: UPDATE_SETTINGS_ISO,
  payload: obj,
});

const placeholderAddress =
  (index: number, lng: number, lat: number): ThunkResult =>
  (dispatch) => {
    // placeholder until gecoder is complete
    // will add latLng to input field
    const addresses = [
      {
        selected: false,
        title: '',
        displaylnglat: [lng, lat],
        key: index,
        addressindex: index,
      },
    ];

    dispatch({
      type: RECEIVE_GEOCODE_RESULTS_ISO,
      payload: addresses,
    });
    dispatch({
      type: UPDATE_TEXTINPUT_ISO,
      payload: {
        userInput: [lng.toFixed(6), lat.toFixed(6)].join(', '),
        index: 0,
        addressindex: 0,
      },
    });
  };

export const fetchReverseGeocodeIso =
  (lng: number, lat: number): ThunkResult =>
  (dispatch) => {
    dispatch(placeholderAddress(0, lng, lat));

    dispatch({
      type: REQUEST_GEOCODE_RESULTS_ISO,
    });
    reverse_geocode(lng, lat)
      .then((response) => {
        dispatch(processGeocodeResponse(response.data, true, [lng, lat]));
      })
      .catch((error) => {
        console.log(error);
      });
    // .finally(() => {
    //   // always executed
    // })
  };

export const fetchGeocode =
  (userInput: string, lngLat?: [number, number]): ThunkResult =>
  (dispatch) => {
    dispatch({
      type: REQUEST_GEOCODE_RESULTS_ISO,
    });

    if (lngLat) {
      const addresses = [
        {
          title: lngLat.toString(),
          description: '',
          selected: false,
          addresslnglat: lngLat,
          sourcelnglat: lngLat,
          displaylnglat: lngLat,
          addressindex: 0,
        },
      ];

      dispatch({
        type: RECEIVE_GEOCODE_RESULTS_ISO,
        payload: addresses,
      });
    } else {
      forward_geocode(userInput)
        .then((response) => {
          dispatch(processGeocodeResponse(response.data));
        })
        .catch((error) => {
          console.log(error);
        });
    }
  };

const processGeocodeResponse =
  (
    data: NominatimResponse,
    reverse?: boolean,
    lngLat?: [number, number]
  ): ThunkResult =>
  (dispatch) => {
    const addresses = parseGeocodeResponse(data, lngLat!);
    // if no address can be found
    if (addresses.length === 0) {
      dispatch(
        sendMessage({
          type: 'warning',
          icon: 'warning',
          description: 'Sorry, no addresses can be found.',
          title: 'No addresses',
        })
      );
    }
    dispatch({
      type: RECEIVE_GEOCODE_RESULTS_ISO,
      payload: addresses,
    });

    if (reverse) {
      dispatch({
        type: UPDATE_TEXTINPUT_ISO,
        payload: {
          userInput: addresses[0]?.title || '',
          index: 0,
          addressindex: 0,
        },
      });
      dispatch(updatePermalink());
      dispatch(makeIsochronesRequest());
    }
  };

export const showProvider = (provider: string, show: boolean) => ({
  type: TOGGLE_PROVIDER_ISO,
  payload: {
    provider,
    show,
  },
});
