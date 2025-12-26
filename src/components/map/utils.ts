import { z } from 'zod';
import type maplibregl from 'maplibre-gl';
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAP_STYLES,
  MAP_STYLE_IDS,
  DEFAULT_MAP_STYLE,
  DEFAULT_MAP_STYLE_ID,
  MAP_STYLE_STORAGE_KEY,
  CUSTOM_STYLE_STORAGE_KEY,
} from './constants';
import type { MapStyleType } from './types';

export const LAST_CENTER_KEY = 'last_center';

export const mapStyleSchema = z.enum([
  ...MAP_STYLE_IDS,
  'custom',
] as unknown as [string, ...string[]]);

export const getMapStyleUrl = (styleId: MapStyleType): string => {
  const found = MAP_STYLES.find((s) => s.id === styleId);
  return found?.style ?? DEFAULT_MAP_STYLE;
};

const isBuiltInStyle = (value: unknown): value is MapStyleType =>
  typeof value === 'string' &&
  (MAP_STYLE_IDS.includes(value as (typeof MAP_STYLE_IDS)[number]) ||
    value === 'custom');

export const getInitialMapStyle = (urlValue?: string): MapStyleType => {
  if (isBuiltInStyle(urlValue)) {
    if (urlValue === 'custom') {
      const customStyle = localStorage.getItem(CUSTOM_STYLE_STORAGE_KEY);
      if (customStyle) return 'custom';
      return DEFAULT_MAP_STYLE_ID;
    }
    return urlValue;
  }

  const savedStyle = localStorage.getItem(MAP_STYLE_STORAGE_KEY);
  const parsed = mapStyleSchema.safeParse(savedStyle);

  if (parsed.data === 'custom') {
    const customStyle = localStorage.getItem(CUSTOM_STYLE_STORAGE_KEY);
    if (!customStyle) return DEFAULT_MAP_STYLE_ID;
  }

  return parsed.success ? (parsed.data as MapStyleType) : DEFAULT_MAP_STYLE_ID;
};

export const getCustomStyle = (): maplibregl.StyleSpecification | null => {
  const customStyleJson = localStorage.getItem(CUSTOM_STYLE_STORAGE_KEY);
  if (!customStyleJson) return null;
  try {
    return JSON.parse(customStyleJson) as maplibregl.StyleSpecification;
  } catch {
    return null;
  }
};

export const convertDDToDMS = (decimalDegrees: number): string => {
  const absDegrees =
    (decimalDegrees < 0 ? -decimalDegrees : decimalDegrees) + 1e-4;

  const minutes = Math.floor((absDegrees % 1) * 60);
  const seconds = Math.floor(((absDegrees * 60) % 1) * 60);

  return `${0 | decimalDegrees}° ${minutes}' ${seconds}"`;
};

const isValidCoordinates = (lng: unknown, lat: unknown): boolean =>
  typeof lng === 'number' &&
  typeof lat === 'number' &&
  lng >= -180 &&
  lng <= 180 &&
  lat >= -90 &&
  lat <= 90;

const parseLastCenter = (
  data: unknown
): { center: [number, number]; zoom: number } | null => {
  if (!data || typeof data !== 'object') return null;

  const obj = data as Record<string, unknown>;
  const { center, zoom_level } = obj;

  if (!Array.isArray(center) || center.length !== 2) return null;
  if (typeof zoom_level !== 'number') return null;
  if (!isValidCoordinates(center[1], center[0])) return null;

  return {
    center: [center[1] as number, center[0] as number],
    zoom: zoom_level,
  };
};

export const getInitialMapPosition = (): {
  center: [number, number];
  zoom: number;
} => {
  const defaults = { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM };

  try {
    const stored = localStorage.getItem(LAST_CENTER_KEY);
    if (!stored) return defaults;

    const parsed = parseLastCenter(JSON.parse(stored));
    if (parsed) return parsed;

    console.warn('Invalid coordinates in localStorage, using defaults');
    localStorage.removeItem(LAST_CENTER_KEY);
  } catch {
    console.warn('Invalid localStorage data, using defaults');
    localStorage.removeItem(LAST_CENTER_KEY);
  }

  return defaults;
};
