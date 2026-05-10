import {
  settingsInit,
  settingsInitTruckOverride,
} from '@/components/settings-panel/settings-options';
import type { PossibleSettings } from '@/components/types';
import type { Profile } from '@/stores/common-store';

// Keys too large to serialize in the URL
const EXCLUDED_KEYS = new Set<keyof PossibleSettings>(['exclude_polygons']);

function getDefaultSettings(profile: Profile): typeof settingsInit {
  return profile === 'truck' ? settingsInitTruckOverride : settingsInit;
}

// syncs only the non-default costing options to an object for use in the url
// returns undefined if all settings are at their defaults.
export function serializeCostingOptions(
  settings: PossibleSettings,
  profile: Profile
): Record<string, unknown> | undefined {
  const defaults = getDefaultSettings(profile) as PossibleSettings;
  const nonDefault: Record<string, unknown> = {};

  for (const key of Object.keys(settings) as (keyof PossibleSettings)[]) {
    if (EXCLUDED_KEYS.has(key)) continue;

    const value = settings[key];
    const defaultValue = defaults[key];

    if (JSON.stringify(value) !== JSON.stringify(defaultValue)) {
      nonDefault[key] = value;
    }
  }

  if (Object.keys(nonDefault).length === 0) return undefined;
  return nonDefault;
}

// if the costing param is not a plain object, return empty obj
export function deserializeCostingOptions(
  costing: Record<string, unknown> | undefined
): Partial<PossibleSettings> {
  if (!costing || typeof costing !== 'object' || Array.isArray(costing)) {
    return {};
  }
  return costing as Partial<PossibleSettings>;
}
