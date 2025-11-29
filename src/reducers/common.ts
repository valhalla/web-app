// todo: we should get ride of @typescript-eslint/no-unsafe-assignment when we updating redux to redux-toolkit

import {
  UPDATE_SETTINGS,
  LOADING,
  SHOW_SETTINGS,
  ZOOM_TO,
  RESET_SETTINGS,
  TOGGLE_DIRECTIONS,
  UPDATE_DATETIME,
} from '@/actions/types';
import type { PossibleSettings } from '@/components/types';
import {
  settingsInit,
  settingsInitTruckOverride,
} from '@/components/settings-panel/settings-options';
import type { AnyAction } from 'redux';
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

export interface Message {
  receivedAt: number;
  type: 'info' | 'warning' | 'error' | 'success' | null;
  icon: string | null;
  topic: string | null;
  description: string | null;
}

const initialState = {
  showSettings: false,
  showDirectionsPanel: true,
  coordinates: [] as number[][],
  loading: false,
  settings: { ...settingsInit } as PossibleSettings,
  dateTime: {
    type: -1,
    value: new Date(Date.now()).toISOString().slice(0, 16),
  },
};

export const common = (
  state: typeof initialState = initialState,
  action: AnyAction
): typeof initialState => {
  switch (action.type) {
    case LOADING: {
      return {
        ...state,
        loading: action.payload,
      };
    }

    case ZOOM_TO: {
      return {
        ...state,
        coordinates: action.payload,
      };
    }

    case SHOW_SETTINGS: {
      return {
        ...state,
        showSettings: !state.showSettings,
      };
    }

    case TOGGLE_DIRECTIONS: {
      return {
        ...state,
        showDirectionsPanel: !state.showDirectionsPanel,
      };
    }

    case UPDATE_SETTINGS: {
      const { name, value } = action.payload;
      return {
        ...state,
        settings: {
          ...state.settings,
          [name]: value,
        },
      };
    }

    case RESET_SETTINGS: {
      const { profile } = action.payload;
      return {
        ...state,
        settings: {
          ...(profile === 'truck' ? settingsInitTruckOverride : settingsInit),
        },
      };
    }

    case UPDATE_DATETIME: {
      const { key, value } = action.payload;
      return {
        ...state,
        dateTime: {
          ...state.dateTime,
          [key]: value,
        },
      };
    }

    default: {
      return state;
    }
  }
};
