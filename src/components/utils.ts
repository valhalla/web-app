import type { Profile } from '@/stores/common-store';

export const VALID_PROFILES: readonly Profile[] = [
  'auto',
  'bicycle',
  'pedestrian',
  'car',
  'truck',
  'bus',
  'motor_scooter',
  'motorcycle',
] as const;

export const isValidProfile = (profile: string): profile is Profile => {
  return VALID_PROFILES.includes(profile as Profile);
};

export const parseWaypoints = (wpsParam: string): number[][] => {
  const coordinates = wpsParam.split(',').map(Number);
  const waypoints: number[][] = [];

  for (let i = 0; i < coordinates.length - 1; i += 2) {
    const lng = coordinates[i]!;
    const lat = coordinates[i + 1]!;
    waypoints.push([lat, lng]);
  }

  return waypoints;
};
