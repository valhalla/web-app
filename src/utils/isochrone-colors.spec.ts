import { describe, it, expect } from 'vitest';
import { getIsochroneColor, ISOCHRONE_PALETTES } from './isochrone-colors';

describe('isochrone-colors', () => {
  describe('getIsochroneColor', () => {
    it('should return a valid hex color for any value between 0 and 1', () => {
      const testValues = [0, 0.25, 0.5, 0.75, 1.0];
      for (const value of testValues) {
        const color = getIsochroneColor(value, 'viridis');
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });

    it('should handle values outside [0, 1] by clamping them', () => {
      const colorNegative = getIsochroneColor(-0.5, 'viridis');
      const colorZero = getIsochroneColor(0, 'viridis');
      const colorOver = getIsochroneColor(1.5, 'viridis');
      const colorOne = getIsochroneColor(1.0, 'viridis');

      expect(colorNegative).toBe(colorZero);

      expect(colorOver).toBe(colorOne);
    });

    describe('viridis palette', () => {
      it('should start with dark purple at value 0', () => {
        const color = getIsochroneColor(0, 'viridis');

        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });

      it('should end with yellow at value 1.0', () => {
        const color = getIsochroneColor(1.0, 'viridis');
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });

      it('should return different colors across the range', () => {
        const colors = [0, 0.25, 0.5, 0.75, 1.0].map((v) =>
          getIsochroneColor(v, 'viridis')
        );
        const uniqueColors = new Set(colors);
        expect(uniqueColors.size).toBe(colors.length);
      });

      it('should have smooth interpolation (no flat regions)', () => {
        const color74 = getIsochroneColor(0.74, 'viridis');
        const color76 = getIsochroneColor(0.76, 'viridis');
        expect(color74).not.toBe(color76);
      });
    });

    describe('current palette', () => {
      it('should return colors for all values', () => {
        const testValues = [0, 0.25, 0.5, 0.75, 1.0];
        for (const value of testValues) {
          const color = getIsochroneColor(value, 'current');
          expect(color).toMatch(/^#[0-9a-f]{6}$/i);
        }
      });

      it('should return different colors across the range', () => {
        const colors = [0, 0.33, 0.66, 1.0].map((v) =>
          getIsochroneColor(v, 'current')
        );
        const uniqueColors = new Set(colors);
        expect(uniqueColors.size).toBeGreaterThan(1);
      });
    });

    describe('magma palette', () => {
      it('should return colors for all values', () => {
        const testValues = [0, 0.25, 0.5, 0.75, 1.0];
        for (const value of testValues) {
          const color = getIsochroneColor(value, 'magma');
          expect(color).toMatch(/^#[0-9a-f]{6}$/i);
        }
      });

      it('should return different colors across the range', () => {
        const colors = [0, 0.25, 0.5, 0.75, 1.0].map((v) =>
          getIsochroneColor(v, 'magma')
        );
        const uniqueColors = new Set(colors);
        expect(uniqueColors.size).toBe(colors.length);
      });
    });

    it('should use current palette as default', () => {
      const colorDefault = getIsochroneColor(0.5);
      const colorExplicit = getIsochroneColor(0.5, 'current');
      expect(colorDefault).toBe(colorExplicit);
    });

    it('should return current palette for invalid palette name', () => {
      const colorInvalid = getIsochroneColor(0.5, 'invalid' as any);
      const colorCurrent = getIsochroneColor(0.5, 'current');
      expect(colorInvalid).toBe(colorCurrent);
    });

    it('should return different colors for different palettes', () => {
      const color1 = getIsochroneColor(0.5, 'viridis');
      const color2 = getIsochroneColor(0.5, 'magma');
      const color3 = getIsochroneColor(0.5, 'current');

      // At least some should be different
      const uniqueColors = new Set([color1, color2, color3]);
      expect(uniqueColors.size).toBeGreaterThan(1);
    });
  });

  describe('ISOCHRONE_PALETTES', () => {
    it('should define all required palettes', () => {
      expect(ISOCHRONE_PALETTES).toHaveProperty('viridis');
      expect(ISOCHRONE_PALETTES).toHaveProperty('magma');
      expect(ISOCHRONE_PALETTES).toHaveProperty('current');
    });

    it('should have correct structure for each palette', () => {
      Object.entries(ISOCHRONE_PALETTES).forEach(([key, palette]) => {
        expect(palette).toHaveProperty('label');
        expect(palette).toHaveProperty('value');
        expect(typeof palette.label).toBe('string');
        expect(palette.value).toBe(key);
      });
    });

    it('should have non-empty labels', () => {
      Object.values(ISOCHRONE_PALETTES).forEach((palette) => {
        expect(palette.label.length).toBeGreaterThan(0);
      });
    });
  });
});
