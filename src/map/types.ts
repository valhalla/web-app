export type Coordinate = [number, number]; // [latitude, longitude]

export type RangeHeightPoint = [number, number]; // [distance, elevation]

export interface LastCenterStorageValue {
  center: [number, number];
  zoom_level: number;
}
