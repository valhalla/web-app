import { useEffect, useRef } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCommonStore, type Profile } from '@/stores/common-store';
import type { PossibleSettings } from '@/components/types';
import {
  serializeCostingOptions,
  deserializeCostingOptions,
} from '@/utils/costing-url';

// flow-
// on mount-use the existing params and apply to settings
// on change in setting we keep the url in sync
export function useSettingsUrlSync() {
  const settings = useCommonStore((state) => state.settings);
  const updateSettings = useCommonStore((state) => state.updateSettings);
  const { profile, costing: urlCosting } = useSearch({ from: '/$activeTab' });
  const navigate = useNavigate({ from: '/$activeTab' });

  // for the initial costing value from the URL before any effects run
  const initialCostingRef = useRef(urlCosting);
  const initializedRef = useRef(false);

  useEffect(() => {
    const costingOptions = deserializeCostingOptions(initialCostingRef.current);
    for (const [key, value] of Object.entries(costingOptions)) {
      updateSettings(
        key as keyof PossibleSettings,
        value as PossibleSettings[keyof PossibleSettings]
      );
    }
    initializedRef.current = true;
  }, []);

  useEffect(() => {
    if (!initializedRef.current) return;

    const costing = serializeCostingOptions(
      settings,
      (profile || 'bicycle') as Profile
    );
    navigate({
      search: (prev) => ({ ...prev, costing }),
      replace: true,
    });
  }, [settings, profile, navigate]);
}
