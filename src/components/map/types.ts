import type { MAP_STYLES } from './constants';

export interface LastCenterStorageValue {
  center: [number, number];
  zoom_level: number;
}

export type BuiltInMapStyleId = (typeof MAP_STYLES)[number]['id'];
export type MapStyleType = BuiltInMapStyleId | 'custom';
