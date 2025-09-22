import {
  ADD_WAYPOINT,
  INSERT_WAYPOINT,
  SET_WAYPOINT,
  CLEAR_WAYPOINTS,
  EMPTY_WAYPOINT,
  UPDATE_TEXTINPUT,
  REQUEST_GEOCODE_RESULTS,
  RECEIVE_GEOCODE_RESULTS,
  RECEIVE_ROUTE_RESULTS,
  CLEAR_ROUTES,
  TOGGLE_PROVIDER_ISO,
  HIGHLIGHT_MNV,
  ZOOM_TO_MNV,
  UPDATE_INCLINE_DECLINE,
} from 'actions/types'

import { VALHALLA_OSM_URL } from '../utils/valhalla'

const initialState = {
  successful: false,
  highlightSegment: {
    startIndex: -1,
    endIndex: -1,
    // -1 is main route, other values are indices into the alternate array
    alternate: -1,
  },
  waypoints: [],
  zoomObj: {
    index: -1,
    timeNow: -1,
  },
  selectedAddresses: '',
  results: {
    [VALHALLA_OSM_URL]: {
      data: {},
      show: {
        '-1': true,
      },
    },
  },
}

export const directions = (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_INCLINE_DECLINE:
      return {
        ...state,
        inclineDeclineTotal: { ...action.payload },
      }

    case TOGGLE_PROVIDER_ISO:
      return {
        ...state,
        results: {
          ...state.results,
          [action.payload.provider]: {
            ...state.results[action.payload.provider],
            show: {
              ...state.results[action.payload.provider].show,
              [action.payload.idx]: action.payload.show,
            },
          },
        },
      }

    case CLEAR_ROUTES:
      return {
        ...state,
        successful: false,
        inclineDeclineTotal: undefined,
        results: {
          ...state.results,
          [action.payload]: {
            ...state.results[action.payload],
            data: {},
          },
        },
      }

    case RECEIVE_ROUTE_RESULTS: {
      const { alternates } = action.payload.data

      const show = {}
      if (alternates) {
        for (let i = 0; i < alternates.length; ++i) {
          show[i] = true
        }
      }
      return {
        ...state,
        inclineDeclineTotal: undefined,
        results: {
          ...state.results,
          [action.payload.provider]: {
            ...state.results[action.payload.provider],
            data: action.payload.data,
            show: {
              '-1': true,
              ...show,
            },
          },
        },
        successful: true,
      }
    }

    case RECEIVE_GEOCODE_RESULTS:
      return {
        ...state,
        waypoints: state.waypoints.map((waypoint, i) =>
          i === action.payload.index
            ? {
                ...waypoint,
                isFetching: false,
                geocodeResults: action.payload.addresses,
              }
            : waypoint
        ),
      }

    case REQUEST_GEOCODE_RESULTS:
      return {
        ...state,
        waypoints: state.waypoints.map((waypoint, i) =>
          i === action.payload.index
            ? { ...waypoint, isFetching: true }
            : waypoint
        ),
      }

    case UPDATE_TEXTINPUT:
      // Catch array of selectedAddress from all waypoints
      // eslint-disable-next-line no-case-declarations
      const selectedAddresses = []
      state.waypoints.forEach((waypoint) => {
        waypoint.geocodeResults.forEach((result, i) => {
          selectedAddresses.push(
            i === action.payload.addressindex ? waypoint : null
          )
        })
      })
      return {
        ...state,
        selectedAddresses: selectedAddresses,
        waypoints: state.waypoints.map((waypoint, i) =>
          i === action.payload.index
            ? {
                ...waypoint,
                userInput: action.payload.inputValue,
                geocodeResults: waypoint.geocodeResults.map((result, j) =>
                  j === action.payload.addressindex
                    ? { ...result, selected: true }
                    : { ...result, selected: false }
                ),
              }
            : waypoint
        ),
      }

    case CLEAR_WAYPOINTS: {
      return {
        ...state,
        waypoints:
          action.payload.index >= 0
            ? state.waypoints.filter((v, i) => i !== action.payload.index)
            : [],
      }
    }

    case EMPTY_WAYPOINT: {
      return {
        ...state,
        waypoints: state.waypoints.map((waypoint, i) =>
          i === action.payload.index
            ? {
                ...waypoint,
                userInput: '',
                geocodeResults: [],
              }
            : waypoint
        ),
      }
    }

    case SET_WAYPOINT: {
      return {
        ...state,
        waypoints: action.payload,
      }
    }

    case ADD_WAYPOINT: {
      return {
        ...state,
        waypoints: [...state.waypoints, action.payload],
      }
    }

    case INSERT_WAYPOINT: {
      const waypoints = state.waypoints
      waypoints.splice(waypoints.length - 1, 0, action.payload)

      return {
        ...state,
        waypoints: [...waypoints],
      }
    }

    case HIGHLIGHT_MNV: {
      return {
        ...state,
        highlightSegment: action.payload,
      }
    }

    case ZOOM_TO_MNV: {
      return {
        ...state,
        zoomObj: action.payload,
      }
    }

    default: {
      return state
    }
  }
}
