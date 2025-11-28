import {
  UPDATE_PROFILE,
  UPDATE_SETTINGS,
  UPDATE_TAB,
  LOADING,
  SHOW_SETTINGS,
  ZOOM_TO,
  RESET_SETTINGS,
  TOGGLE_DIRECTIONS,
  UPDATE_DATETIME,
} from './types';

import { profileSettings, generalSettings } from '../components/settings-panel/settings-options';
import type { Profile } from '@/reducers/common';
import type {
  PossibleSettings,
  PossibleTabValues,
  ThunkResult,
} from '@/components/types';

export const showLoading = (loading: boolean) => ({
  type: LOADING,
  payload: loading,
});

interface SettingsObject {
  name: string;
  value: string | number | boolean | string[];
}

export const updateSettings = (object: SettingsObject) => ({
  type: UPDATE_SETTINGS,
  payload: object,
});

export const updateProfile = (object: { profile: Profile }) => ({
  type: UPDATE_PROFILE,
  payload: object,
});

export const updateTab = (object: { activeTab: PossibleTabValues }) => ({
  type: UPDATE_TAB,
  payload: object,
});

export const doShowSettings = () => ({
  type: SHOW_SETTINGS,
});

export const toggleDirections = () => ({
  type: TOGGLE_DIRECTIONS,
});

export const resetSettings = () => ({
  type: RESET_SETTINGS,
});

export const zoomTo = (coords: number[][]) => ({
  type: ZOOM_TO,
  payload: coords,
});

export const doUpdateDateTime = (key: string, value: string) => ({
  type: UPDATE_DATETIME,
  payload: { key, value },
});

export const updatePermalink = (): ThunkResult => (_, getState) => {
  const { waypoints } = getState().directions;
  const { geocodeResults, maxRange, interval, generalize, denoise } =
    getState().isochrones;
  const { profile, activeTab } = getState().common;
  const queryParams = new URLSearchParams();
  queryParams.set('profile', profile);

  let path = '/directions?';
  if (activeTab === 'directions') {
    const wps = [];
    for (const wp of waypoints) {
      for (const result of wp.geocodeResults) {
        if (result.selected) {
          wps.push(result.sourcelnglat);
        }
      }
    }
    if (wps.length > 0) {
      queryParams.set('wps', wps.toString());
    }
  } else {
    path = '/isochrones?';

    let center;
    for (const result of geocodeResults) {
      if (result.selected && result.sourcelnglat) {
        center = result.sourcelnglat.toString();
      }
    }
    if (center) {
      queryParams.set('wps', center.toString());
    }
    queryParams.set('range', maxRange.toString());
    queryParams.set('interval', interval.toString());
    queryParams.set('generalize', generalize.toString());
    queryParams.set('denoise', denoise.toString());
  }
  window.history.replaceState(null, '', path + queryParams.toString());
};

export const downloadFile = ({
  data,
  fileName,
  fileType,
}: {
  data: string | ArrayBuffer;
  fileName: string;
  fileType: string;
}) => {
  // Create a blob with the data we want to download as a file
  const blob = new Blob([data], { type: fileType });
  // Create an anchor element and dispatch a click event on it
  // to trigger a download
  const aElem = document.createElement('a');
  aElem.download = fileName;
  aElem.href = window.URL.createObjectURL(blob);
  const clickEvt = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true,
  });
  aElem.dispatchEvent(clickEvt);
  aElem.remove();
};

// Type guard to check if profile exists in settings objects
type SettingsProfile = Exclude<Profile, 'auto'>;

function isValidSettingsProfile(profile: Profile): profile is SettingsProfile {
  return profile !== 'auto';
}

export const filterProfileSettings = (
  profile: Profile,
  settings: PossibleSettings
) => {
  const filteredSettings: {
    costing: Record<
      string,
      string | number | boolean | string[] | GeoJSON.GeoJSON[] | undefined
    >;
    directions: {
      alternates: PossibleSettings['alternates'];
      exclude_polygons: PossibleSettings['exclude_polygons'];
    };
  } = {
    costing: {},
    directions: {
      alternates: settings.alternates,
      exclude_polygons: settings.exclude_polygons,
    },
  };

  // Skip filtering if profile is 'auto' since it doesn't exist in settings
  if (!isValidSettingsProfile(profile)) {
    return filteredSettings;
  }

  for (const setting in settings) {
    // Check if the profile exists in settings_general
    if (profile in generalSettings) {
      for (const item of generalSettings[profile].numeric) {
        if (setting === item.param) {
          filteredSettings.costing[setting] =
            settings[setting as keyof PossibleSettings];
        }
      }
      for (const item of generalSettings[profile].boolean) {
        if (setting === item.param) {
          filteredSettings.costing[setting] =
            settings[setting as keyof PossibleSettings];
        }
      }
      for (const item of generalSettings[profile].enum) {
        if (setting === (item as { param: string }).param) {
          filteredSettings.costing[setting] =
            settings[setting as keyof PossibleSettings];
        }
      }
    }

    // Check if the profile exists in profile_settings
    if (profile in profileSettings) {
      for (const item of profileSettings[profile].numeric) {
        if (setting === item.param) {
          filteredSettings.costing[setting] =
            settings[setting as keyof PossibleSettings];
        }
      }

      for (const item of profileSettings[profile].boolean) {
        if (setting === item.param) {
          filteredSettings.costing[setting] =
            settings[setting as keyof PossibleSettings];
        }
      }
      for (const item of profileSettings[profile].enum) {
        if (setting === item.param) {
          filteredSettings.costing[setting] =
            settings[setting as keyof PossibleSettings];
        }
      }
    }
  }
  return filteredSettings;
};
