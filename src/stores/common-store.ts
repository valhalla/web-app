import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { PossibleSettings } from '@/components/types';
import {
  settingsInit,
  settingsInitTruckOverride,
} from '@/components/settings-panel/settings-options';
import { z } from 'zod';

export const profileEnum = z.enum([
  'auto',
  'bicycle',
  'pedestrian',
  'car',
  'truck',
  'bus',
  'motor_scooter',
  'motorcycle',
]);

export type Profile = z.infer<typeof profileEnum>;

interface CommonState {
  settingsPanelOpen: boolean;
  directionsPanelOpen: boolean;
  coordinates: number[][];
  loading: boolean;
  settings: PossibleSettings;
  dateTime: { type: number; value: string };
  mapReady: boolean;
}

interface CommonActions {
  showLoading: (loading: boolean) => void;
  zoomTo: (coordinates: number[][]) => void;
  toggleSettings: () => void;
  toggleDirections: () => void;
  updateSettings: (
    name: keyof PossibleSettings,
    value: PossibleSettings[keyof PossibleSettings]
  ) => void;
  resetSettings: (profile: Profile) => void;
  updateDateTime: (key: 'type' | 'value', value: string | number) => void;
  setMapReady: (ready: boolean) => void;
}

type CommonStore = CommonState & CommonActions;

export const useCommonStore = create<CommonStore>()(
  devtools(
    immer((set) => ({
      settingsPanelOpen: false,
      directionsPanelOpen: true,
      coordinates: [],
      loading: false,
      settings: { ...settingsInit },
      dateTime: {
        type: -1,
        value: new Date().toISOString().slice(0, 16),
      },
      mapReady: false,

      showLoading: (loading) => set({ loading }),
      zoomTo: (coordinates) => set({ coordinates }),
      setMapReady: (ready) => set({ mapReady: ready }),
      toggleSettings: () =>
        set(
          (state) => {
            state.settingsPanelOpen = !state.settingsPanelOpen;
          },
          undefined,
          'toggleSettings'
        ),
      toggleDirections: () =>
        set(
          (state) => {
            state.directionsPanelOpen = !state.directionsPanelOpen;
          },
          undefined,
          'toggleDirections'
        ),
      updateSettings: (name, value) =>
        set(
          (state) => {
            state.settings[name] = value;
          },
          undefined,
          'updateSettings'
        ),
      resetSettings: (profile) =>
        set(
          (state) => {
            state.settings =
              profile === 'truck' ? settingsInitTruckOverride : settingsInit;
          },
          undefined,
          'resetSettings'
        ),
      updateDateTime: (key, value) =>
        set(
          (state) => {
            if (key === 'type') state.dateTime.type = value as number;
            else state.dateTime.value = value as string;
          },
          undefined,
          'updateDateTime'
        ),
    })),
    { name: 'common' }
  )
);
