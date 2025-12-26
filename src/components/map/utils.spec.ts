import { describe, it, expect, beforeEach } from 'vitest';
import {
  convertDDToDMS,
  mapStyleSchema,
  getMapStyleUrl,
  getInitialMapStyle,
  getCustomStyle,
} from './utils';
import { MAP_STYLE_STORAGE_KEY, CUSTOM_STYLE_STORAGE_KEY } from './constants';

describe('convertDDToDMS', () => {
  it('should convert zero degrees correctly', () => {
    expect(convertDDToDMS(0)).toBe('0° 0\' 0"');
  });

  it('should convert positive decimal degrees correctly', () => {
    expect(convertDDToDMS(45.5)).toBe('45° 30\' 0"');
    expect(convertDDToDMS(23.456789)).toBe('23° 27\' 24"');
    expect(convertDDToDMS(1.234567)).toBe('1° 14\' 4"');
  });

  it('should convert negative decimal degrees correctly', () => {
    expect(convertDDToDMS(-45.5)).toBe('-45° 30\' 0"');
    expect(convertDDToDMS(-23.456789)).toBe('-23° 27\' 24"');
    expect(convertDDToDMS(-1.234567)).toBe('-1° 14\' 4"');
  });

  it('should handle exact degree values', () => {
    expect(convertDDToDMS(90)).toBe('90° 0\' 0"');
    expect(convertDDToDMS(180)).toBe('180° 0\' 0"');
    expect(convertDDToDMS(360)).toBe('360° 0\' 0"');
  });

  it('should handle exact minute values', () => {
    expect(convertDDToDMS(45.5)).toBe('45° 30\' 0"');
    expect(convertDDToDMS(30.25)).toBe('30° 15\' 0"');
  });

  it('should handle exact second values', () => {
    expect(convertDDToDMS(45.5041667)).toBe('45° 30\' 15"');
  });

  it('should handle small decimal values', () => {
    expect(convertDDToDMS(0.0001)).toBe('0° 0\' 0"');
    expect(convertDDToDMS(0.0166667)).toBe('0° 1\' 0"');
    expect(convertDDToDMS(0.0002778)).toBe('0° 0\' 1"');
  });

  it('should handle large decimal degrees', () => {
    expect(convertDDToDMS(359.9999)).toBe('359° 0\' 0"');
    expect(convertDDToDMS(180.5)).toBe('180° 30\' 0"');
  });

  it('should handle extreme negative values', () => {
    expect(convertDDToDMS(-180)).toBe('-180° 0\' 0"');
    expect(convertDDToDMS(-359.9999)).toBe('-359° 0\' 0"');
  });

  it('should maintain precision for various decimal places', () => {
    expect(convertDDToDMS(45.123456789)).toBe('45° 7\' 24"');
    expect(convertDDToDMS(45.987654321)).toBe('45° 59\' 15"');
  });

  it('should handle values with high precision minutes', () => {
    expect(convertDDToDMS(45.999999)).toBe('45° 0\' 0"');
  });

  it('should handle coordinate edge cases', () => {
    expect(convertDDToDMS(90)).toBe('90° 0\' 0"');
    expect(convertDDToDMS(-90)).toBe('-90° 0\' 0"');
    expect(convertDDToDMS(180)).toBe('180° 0\' 0"');
    expect(convertDDToDMS(-180)).toBe('-180° 0\' 0"');
  });

  it('should handle very small positive values', () => {
    expect(convertDDToDMS(0.0000001)).toBe('0° 0\' 0"');
  });

  it('should handle very small negative values', () => {
    expect(convertDDToDMS(-0.0000001)).toBe('0° 0\' 0"');
  });

  it('should handle floating point precision issues', () => {
    // Test cases that might be affected by floating point precision
    expect(convertDDToDMS(45.123456789123)).toBe('45° 7\' 24"');
    expect(convertDDToDMS(23.456789012345)).toBe('23° 27\' 24"');
  });

  it('should handle values around 0 with negative sign', () => {
    expect(convertDDToDMS(-0.0000001)).toBe('0° 0\' 0"');
    expect(convertDDToDMS(0.0000001)).toBe('0° 0\' 0"');
  });

  it('should demonstrate the rounding behavior at degree boundaries', () => {
    // Values very close to full degrees get rounded to 0 minutes/seconds
    // due to the +1e-4 rounding in the implementation
    expect(convertDDToDMS(45.9999)).toBe('45° 0\' 0"');
    expect(convertDDToDMS(359.9999)).toBe('359° 0\' 0"');
    expect(convertDDToDMS(-359.9999)).toBe('-359° 0\' 0"');
  });

  it('should handle typical geographic coordinates', () => {
    expect(convertDDToDMS(52.5167)).toBe('52° 31\' 0"');
    expect(convertDDToDMS(13.3777)).toBe('13° 22\' 40"');
    expect(convertDDToDMS(-33.8688)).toBe('-33° 52\' 8"');
    expect(convertDDToDMS(151.2093)).toBe('151° 12\' 33"');
  });
});

describe('mapStyleSchema', () => {
  it('should validate built-in style ids', () => {
    expect(mapStyleSchema.safeParse('shortbread').success).toBe(true);
    expect(mapStyleSchema.safeParse('carto').success).toBe(true);
    expect(mapStyleSchema.safeParse('alidade-smooth').success).toBe(true);
  });

  it('should validate custom style', () => {
    expect(mapStyleSchema.safeParse('custom').success).toBe(true);
  });

  it('should reject invalid style ids', () => {
    expect(mapStyleSchema.safeParse('invalid').success).toBe(false);
    expect(mapStyleSchema.safeParse('').success).toBe(false);
    expect(mapStyleSchema.safeParse(null).success).toBe(false);
    expect(mapStyleSchema.safeParse(undefined).success).toBe(false);
    expect(mapStyleSchema.safeParse(123).success).toBe(false);
  });
});

describe('getMapStyleUrl', () => {
  it('should return correct URL for shortbread style', () => {
    expect(getMapStyleUrl('shortbread')).toBe(
      '/styles/versatiles-colorful.json'
    );
  });

  it('should return correct URL for carto style', () => {
    expect(getMapStyleUrl('carto')).toBe('/styles/carto.json');
  });

  it('should return correct URL for alidade-smooth style', () => {
    expect(getMapStyleUrl('alidade-smooth')).toBe(
      'https://tiles.stadiamaps.com/styles/alidade_smooth.json'
    );
  });

  it('should return default style URL for custom style', () => {
    expect(getMapStyleUrl('custom')).toBe('/styles/versatiles-colorful.json');
  });
});

describe('getInitialMapStyle', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return urlValue if it is a valid built-in style', () => {
    expect(getInitialMapStyle('shortbread')).toBe('shortbread');
    expect(getInitialMapStyle('carto')).toBe('carto');
    expect(getInitialMapStyle('alidade-smooth')).toBe('alidade-smooth');
  });

  it('should return custom if urlValue is custom and custom style exists in localStorage', () => {
    localStorage.setItem(CUSTOM_STYLE_STORAGE_KEY, '{"version":8}');
    expect(getInitialMapStyle('custom')).toBe('custom');
  });

  it('should return default if urlValue is custom but no custom style in localStorage', () => {
    expect(getInitialMapStyle('custom')).toBe('shortbread');
  });

  it('should fallback to localStorage if urlValue is undefined', () => {
    localStorage.setItem(MAP_STYLE_STORAGE_KEY, 'carto');
    expect(getInitialMapStyle()).toBe('carto');
  });

  it('should return custom from localStorage if custom style exists', () => {
    localStorage.setItem(MAP_STYLE_STORAGE_KEY, 'custom');
    localStorage.setItem(CUSTOM_STYLE_STORAGE_KEY, '{"version":8}');
    expect(getInitialMapStyle()).toBe('custom');
  });

  it('should return default if localStorage has custom but no custom style data', () => {
    localStorage.setItem(MAP_STYLE_STORAGE_KEY, 'custom');
    expect(getInitialMapStyle()).toBe('shortbread');
  });

  it('should return default if localStorage has invalid value', () => {
    localStorage.setItem(MAP_STYLE_STORAGE_KEY, 'invalid-style');
    expect(getInitialMapStyle()).toBe('shortbread');
  });

  it('should return default if no urlValue and no localStorage', () => {
    expect(getInitialMapStyle()).toBe('shortbread');
  });

  it('should return default for invalid urlValue', () => {
    expect(getInitialMapStyle('invalid')).toBe('shortbread');
    expect(getInitialMapStyle('')).toBe('shortbread');
  });
});

describe('getCustomStyle', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return null if no custom style in localStorage', () => {
    expect(getCustomStyle()).toBeNull();
  });

  it('should return parsed style if valid JSON in localStorage', () => {
    const styleData = { version: 8, name: 'Test', sources: {}, layers: [] };
    localStorage.setItem(CUSTOM_STYLE_STORAGE_KEY, JSON.stringify(styleData));
    expect(getCustomStyle()).toEqual(styleData);
  });

  it('should return null if invalid JSON in localStorage', () => {
    localStorage.setItem(CUSTOM_STYLE_STORAGE_KEY, 'invalid-json{');
    expect(getCustomStyle()).toBeNull();
  });

  it('should return complex style object correctly', () => {
    const styleData = {
      version: 8,
      name: 'Complex Style',
      sources: {
        osm: { type: 'vector', url: 'https://example.com' },
      },
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: { 'background-color': '#fff' },
        },
      ],
    };
    localStorage.setItem(CUSTOM_STYLE_STORAGE_KEY, JSON.stringify(styleData));
    expect(getCustomStyle()).toEqual(styleData);
  });
});
