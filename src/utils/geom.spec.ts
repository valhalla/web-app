import { describe, it, expect } from 'vitest';
import { calcArea, isValidCoordinates } from './geom';

describe('calcArea', () => {
  it('should calculate area for a valid square polygon', () => {
    const feature = {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
            [0, 0],
          ],
        ],
      },
      properties: {},
    };

    const result = calcArea(feature);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeCloseTo(12363.7, 0);
  });

  it('should calculate area for a triangle polygon', () => {
    const feature = {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [0.5, 1],
            [0, 0],
          ],
        ],
      },
      properties: {},
    };

    const result = calcArea(feature);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeCloseTo(6181.9, 0);
  });

  it('should calculate area for a complex polygon', () => {
    const feature = {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [-74.0059, 40.7128], // New York
            [-74.0059, 40.7628],
            [-73.9559, 40.7628],
            [-73.9559, 40.7128],
            [-74.0059, 40.7128],
          ],
        ],
      },
      properties: {},
    };

    const result = calcArea(feature);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1000);
  });

  it('should handle polygon with holes (multipolygon)', () => {
    const feature = {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [0, 0],
            [0, 2],
            [2, 2],
            [2, 0],
            [0, 0],
          ],
          [
            [0.5, 0.5],
            [0.5, 1.5],
            [1.5, 1.5],
            [1.5, 0.5],
            [0.5, 0.5],
          ],
        ],
      },
      properties: {},
    };

    const result = calcArea(feature);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(49565.6);
  });

  it('should return 0 for invalid geometry with empty coordinates', () => {
    const invalidFeature = {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [],
      },
      properties: {},
    };

    const result = calcArea(invalidFeature);
    expect(result).toBe(0);
  });

  it('should return -1 for malformed coordinates', () => {
    const invalidFeature = {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [NaN, NaN],
            [0, 1],
            [1, 1],
          ],
        ],
      },
      properties: {},
    };

    const result = calcArea(invalidFeature);
    expect(result).toBe(-1);
  });

  it('should return -1 for insufficient coordinates', () => {
    const invalidFeature = {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [0, 0],
            [0, 1],
          ],
        ],
      },
      properties: {},
    };

    const result = calcArea(invalidFeature);
    expect(result).toBe(-1);
  });

  it('should handle very small polygons', () => {
    const feature = {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [0, 0],
            [0, 0.001],
            [0.001, 0.001],
            [0.001, 0],
            [0, 0],
          ],
        ],
      },
      properties: {},
    };

    const result = calcArea(feature);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1);
  });
});

describe('isValidCoordinates', () => {
  describe('valid coordinates', () => {
    it('should accept valid latitude and longitude as numbers', () => {
      expect(isValidCoordinates(0, 0)).toBe(true);
      expect(isValidCoordinates(45.5, -122.5)).toBe(true);
      expect(isValidCoordinates(-89.9999, 179.9999)).toBe(true);
      expect(isValidCoordinates(90, 180)).toBe(true);
      expect(isValidCoordinates(-89, -179)).toBe(true);
    });

    it('should accept valid latitude and longitude as strings', () => {
      expect(isValidCoordinates('0', '0')).toBe(true);
      expect(isValidCoordinates('45.5', '-122.5')).toBe(true);
      expect(isValidCoordinates('-89.9999', '179.9999')).toBe(true);
      expect(isValidCoordinates('90', '180')).toBe(true);
      expect(isValidCoordinates('-89', '-179')).toBe(true);
    });

    it('should accept coordinates with high precision', () => {
      expect(
        isValidCoordinates('45.123456789012345678', '-122.987654321098765432')
      ).toBe(true);
      expect(
        isValidCoordinates(45.123456789012345678, -122.987654321098765432)
      ).toBe(true);
    });

    it('should accept edge case latitudes', () => {
      expect(isValidCoordinates(90, 0)).toBe(true);
      expect(isValidCoordinates(-89, 0)).toBe(true);
      expect(isValidCoordinates('90.0', '0')).toBe(true);
      expect(isValidCoordinates('-89.000000000000000000', '0')).toBe(true);
    });

    it('should accept edge case longitudes', () => {
      expect(isValidCoordinates(0, 180)).toBe(true);
      expect(isValidCoordinates(0, -179)).toBe(true);
      expect(isValidCoordinates('0', '180.0')).toBe(true);
      expect(isValidCoordinates('0', '-179.000000000000000000')).toBe(true);
    });

    it('should accept single digit coordinates', () => {
      expect(isValidCoordinates(5, 7)).toBe(true);
      expect(isValidCoordinates('1', '2')).toBe(true);
      expect(isValidCoordinates(0.5, 0.7)).toBe(true);
    });
  });

  describe('invalid coordinates', () => {
    it('should reject invalid latitude values', () => {
      expect(isValidCoordinates(91, 0)).toBe(false);
      expect(isValidCoordinates(-91, 0)).toBe(false);
      expect(isValidCoordinates(90.1, 0)).toBe(false);
      expect(isValidCoordinates(-90.1, 0)).toBe(false);
      expect(isValidCoordinates('91', '0')).toBe(false);
      expect(isValidCoordinates('-91', '0')).toBe(false);
    });

    it('should reject invalid longitude values', () => {
      expect(isValidCoordinates(0, 181)).toBe(false);
      expect(isValidCoordinates(0, -181)).toBe(false);
      expect(isValidCoordinates(0, 180.1)).toBe(false);
      expect(isValidCoordinates(0, -180.1)).toBe(false);
      expect(isValidCoordinates('0', '181')).toBe(false);
      expect(isValidCoordinates('0', '-181')).toBe(false);
    });

    it('should reject non-numeric strings', () => {
      expect(isValidCoordinates('abc', '0')).toBe(false);
      expect(isValidCoordinates('0', 'xyz')).toBe(false);
      expect(isValidCoordinates('', '')).toBe(false);
      expect(isValidCoordinates('null', 'undefined')).toBe(false);
    });

    it('should reject special numeric values', () => {
      expect(isValidCoordinates(NaN, 0)).toBe(false);
      expect(isValidCoordinates(0, NaN)).toBe(false);
      expect(isValidCoordinates(Infinity, 0)).toBe(false);
      expect(isValidCoordinates(0, -Infinity)).toBe(false);
    });

    it('should reject coordinates with too many decimal places (more than 18)', () => {
      expect(isValidCoordinates('45.1234567890123456789', '0')).toBe(false);
      expect(isValidCoordinates('0', '-122.1234567890123456789')).toBe(false);
    });

    it('should reject invalid formats', () => {
      expect(isValidCoordinates('45.', '0')).toBe(false);
      expect(isValidCoordinates('0', '122.')).toBe(false);
      expect(isValidCoordinates('.45', '0')).toBe(false);
      expect(isValidCoordinates('0', '.122')).toBe(false);
      expect(isValidCoordinates('45..5', '0')).toBe(false);
      expect(isValidCoordinates('0', '122..5')).toBe(false);
    });

    it('should reject coordinates with leading/trailing spaces', () => {
      expect(isValidCoordinates(' 45', '0')).toBe(false);
      expect(isValidCoordinates('45 ', '0')).toBe(false);
      expect(isValidCoordinates('0', ' 122')).toBe(false);
      expect(isValidCoordinates('0', '122 ')).toBe(false);
    });

    it('should reject coordinates with signs in wrong places', () => {
      expect(isValidCoordinates('4-5', '0')).toBe(false);
      expect(isValidCoordinates('45-', '0')).toBe(false);
      expect(isValidCoordinates('0', '12-2')).toBe(false);
      expect(isValidCoordinates('0', '122-')).toBe(false);
    });

    it('should reject extreme negative values due to regex limitations', () => {
      expect(isValidCoordinates(-90, 0)).toBe(false);
      expect(isValidCoordinates(0, -180)).toBe(false);
      expect(isValidCoordinates('-90', '0')).toBe(false);
      expect(isValidCoordinates('0', '-180')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle mixed string and number inputs', () => {
      expect(isValidCoordinates(45.5, '-122.5')).toBe(true);
      expect(isValidCoordinates('45.5', -122.5)).toBe(true);
    });

    it('should handle zero values correctly', () => {
      expect(isValidCoordinates(0, 0)).toBe(true);
      expect(isValidCoordinates('0', '0')).toBe(true);
      expect(isValidCoordinates('0.0', '0.0')).toBe(true);
      expect(
        isValidCoordinates('0.000000000000000000', '0.000000000000000000')
      ).toBe(true);
    });

    it('should handle negative zero', () => {
      expect(isValidCoordinates(-0, -0)).toBe(true);
      expect(isValidCoordinates('-0', '-0')).toBe(true);
      expect(isValidCoordinates('-0.0', '-0.0')).toBe(true);
    });
  });
});
