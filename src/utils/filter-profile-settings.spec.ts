import { describe, it, expect } from 'vitest';
import { settingsInit } from '@/components/settings-panel/settings-options';
import type { PossibleSettings } from '@/components/types';
import { filterProfileSettings } from './filter-profile-settings';

const defaultSettings: PossibleSettings = { ...settingsInit };

describe('filterProfileSettings', () => {
  it('does not send hierarchy limits by default', () => {
    const { costing } = filterProfileSettings('car', defaultSettings);

    expect(costing).not.toHaveProperty('hierarchy_limits');
  });

  it('sends both hierarchy levels when enabled', () => {
    const { costing } = filterProfileSettings('car', {
      ...defaultSettings,
      use_hierarchy_limits: true,
      hierarchy_limits_1_max_up_transitions: 200,
    });

    expect(costing.hierarchy_limits).toEqual({
      1: { max_up_transitions: 200, expand_within_distance: 20000 },
      2: { max_up_transitions: 100, expand_within_distance: 5000 },
    });
  });

  it('does not leak the flattened UI params into the costing options', () => {
    const { costing } = filterProfileSettings('car', {
      ...defaultSettings,
      use_hierarchy_limits: true,
    });

    expect(Object.keys(costing).join()).not.toMatch(
      /use_hierarchy_limits|hierarchy_limits_/
    );
  });
});
