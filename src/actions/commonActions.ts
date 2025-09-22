import {
  MESSAGE_HANDLER,
  UPDATE_PROFILE,
  UPDATE_SETTINGS,
  UPDATE_TAB,
  LOADING,
  SHOW_SETTINGS,
  ZOOM_TO,
  RESET_SETTINGS,
  TOGGLE_DIRECTIONS,
  UPDATE_DATETIME,
} from './types'

import {
  profile_settings,
  settings_general,
} from '../Controls/settings-options'

export const showLoading = (loading) => ({
  type: LOADING,
  payload: loading,
})

export const sendMessage = (message_object) => ({
  type: MESSAGE_HANDLER,
  payload: {
    receivedAt: Date.now(),
    ...message_object,
  },
})

export const updateSettings = (object) => ({
  type: UPDATE_SETTINGS,
  payload: object,
})

export const updateProfile = (profile) => ({
  type: UPDATE_PROFILE,
  payload: profile,
})

export const updateTab = (activeTab) => ({
  type: UPDATE_TAB,
  payload: activeTab,
})

export const doShowSettings = () => ({
  type: SHOW_SETTINGS,
})

export const toggleDirections = () => ({
  type: TOGGLE_DIRECTIONS,
})

export const resetSettings = () => ({
  type: RESET_SETTINGS,
})

export const zoomTo = (coords) => ({
  type: ZOOM_TO,
  payload: coords,
})

export const doUpdateDateTime = (key, value) => ({
  type: UPDATE_DATETIME,
  payload: { key, value },
})

export const updatePermalink = () => (dispatch, getState) => {
  const { waypoints } = getState().directions
  const { geocodeResults, maxRange, interval, generalize, denoise } =
    getState().isochrones
  const { profile, /*settings,*/ activeTab } = getState().common
  const queryParams = new URLSearchParams()
  queryParams.set('profile', profile)

  let path = '/directions?'
  if (activeTab === 0) {
    const wps = []
    for (const wp of waypoints) {
      for (const result of wp.geocodeResults) {
        if (result.selected) {
          wps.push(result.sourcelnglat)
        }
      }
    }
    if (wps.length > 0) {
      queryParams.set('wps', wps.toString())
    }
  } else {
    path = '/isochrones?'

    let center
    for (const result of geocodeResults) {
      if (result.selected) {
        center = result.sourcelnglat.toString()
      }
    }
    if (center) {
      queryParams.set('wps', center.toString())
    }
    queryParams.set('range', maxRange)
    queryParams.set('interval', interval)
    queryParams.set('generalize', generalize)
    queryParams.set('denoise', denoise)
  }
  window.history.replaceState(null, null, path + queryParams.toString())
}

export const downloadFile = ({ data, fileName, fileType }) => {
  // Create a blob with the data we want to download as a file
  const blob = new Blob([data], { type: fileType })
  // Create an anchor element and dispatch a click event on it
  // to trigger a download
  const aElem = document.createElement('a')
  aElem.download = fileName
  aElem.href = window.URL.createObjectURL(blob)
  const clickEvt = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true,
  })
  aElem.dispatchEvent(clickEvt)
  aElem.remove()
}

export const filterProfileSettings = (profile, settings) => {
  const filteredSettings = {
    costing: {},
    directions: {
      alternates: settings.alternates,
      exclude_polygons: settings.exclude_polygons,
    },
  }
  for (const setting in settings) {
    for (const item of settings_general[profile].numeric) {
      if (setting === item.param) {
        filteredSettings.costing[setting] = settings[setting]
      }
    }
    for (const item of settings_general[profile].boolean) {
      if (setting === item.param) {
        filteredSettings.costing[setting] = settings[setting]
      }
    }
    for (const item of settings_general[profile].enum) {
      if (setting === item.param) {
        filteredSettings.costing[setting] = settings[setting]
      }
    }

    for (const item of profile_settings[profile].numeric) {
      if (setting === item.param) {
        filteredSettings.costing[setting] = settings[setting]
      }
    }

    for (const item of profile_settings[profile].boolean) {
      if (setting === item.param) {
        filteredSettings.costing[setting] = settings[setting]
      }
    }
    for (const item of profile_settings[profile].enum) {
      if (setting === item.param) {
        filteredSettings.costing[setting] = settings[setting]
      }
    }
  }
  return filteredSettings
}
