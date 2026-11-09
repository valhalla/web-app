import {
  profileSettings,
  generalSettings,
} from '../components/settings-panel/settings-options';
import type { Profile } from '@/stores/common-store';
import type { HierarchyLimits, PossibleSettings } from '@/components/types';

// Type guard to check if profile exists in settings objects
type SettingsProfile = Exclude<Profile, 'auto'>;

function isValidSettingsProfile(profile: Profile): profile is SettingsProfile {
  return profile !== 'auto';
}

// Valhalla requires both levels, each with both values. A level with a missing
// value is treated as exceeding the server maximums.
const buildHierarchyLimits = (
  settings: PossibleSettings
): Record<1 | 2, HierarchyLimits> => ({
  1: {
    max_up_transitions: settings.hierarchy_limits_1_max_up_transitions,
    expand_within_distance: settings.hierarchy_limits_1_expand_within_distance,
  },
  2: {
    max_up_transitions: settings.hierarchy_limits_2_max_up_transitions,
    expand_within_distance: settings.hierarchy_limits_2_expand_within_distance,
  },
});

export const filterProfileSettings = (
  profile: Profile,
  settings: PossibleSettings
) => {
  const filteredSettings: {
    costing: Record<
      string,
      | string
      | number
      | boolean
      | string[]
      | GeoJSON.GeoJSON[]
      | Record<1 | 2, HierarchyLimits>
      | undefined
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

  // Omitted by default: any hierarchy_limits in a request triggers a warning on
  // servers that don't allow modifying them.
  if (settings.use_hierarchy_limits) {
    filteredSettings.costing.hierarchy_limits = buildHierarchyLimits(settings);
  }

  return filteredSettings;
};
