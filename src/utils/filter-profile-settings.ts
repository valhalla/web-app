import {
  profileSettings,
  generalSettings,
} from '../components/settings-panel/settings-options';
import type { Profile } from '@/stores/common-store';
import type { PossibleSettings } from '@/components/types';

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
      for (const item of profileSettings[profile].list) {
        if (setting === item.param) {
          filteredSettings.costing[setting] =
            settings[setting as keyof PossibleSettings];
        }
      }
    }
  }
  return filteredSettings;
};
