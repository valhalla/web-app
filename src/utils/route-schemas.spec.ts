import { describe, it, expect } from 'vitest';
import { searchParamsSchema, isValidTab } from './route-schemas';

describe('route-schemas', () => {
  describe('searchParamsSchema', () => {
    describe('profile field', () => {
      it('should accept valid profile values', () => {
        const validProfiles = [
          'auto',
          'bicycle',
          'pedestrian',
          'truck',
          'motor_scooter',
        ];

        for (const profile of validProfiles) {
          const result = searchParamsSchema.parse({ profile });
          expect(result.profile).toBe(profile);
        }
      });

      it('should allow undefined profile (fallback applied by router)', () => {
        const result = searchParamsSchema.parse({});
        expect(result.profile).toBeUndefined();
      });

      it('should fallback to bicycle for invalid profile values', () => {
        const result = searchParamsSchema.parse({ profile: 'invalid' });
        expect(result.profile).toBe('bicycle');
      });
    });

    describe('wps field', () => {
      it('should accept valid wps string', () => {
        const result = searchParamsSchema.parse({
          wps: '12.34,56.78;90.12,34.56',
        });
        expect(result.wps).toBe('12.34,56.78;90.12,34.56');
      });

      it('should allow undefined wps', () => {
        const result = searchParamsSchema.parse({});
        expect(result.wps).toBeUndefined();
      });
    });

    describe('numeric fields', () => {
      it('should accept valid range value', () => {
        const result = searchParamsSchema.parse({ range: 30 });
        expect(result.range).toBe(30);
      });

      it('should accept valid interval value', () => {
        const result = searchParamsSchema.parse({ interval: 15 });
        expect(result.interval).toBe(15);
      });

      it('should accept valid generalize value', () => {
        const result = searchParamsSchema.parse({ generalize: 200 });
        expect(result.generalize).toBe(200);
      });

      it('should accept valid denoise value', () => {
        const result = searchParamsSchema.parse({ denoise: 0.5 });
        expect(result.denoise).toBe(0.5);
      });

      it('should allow undefined numeric fields', () => {
        const result = searchParamsSchema.parse({});
        expect(result.range).toBeUndefined();
        expect(result.interval).toBeUndefined();
        expect(result.generalize).toBeUndefined();
        expect(result.denoise).toBeUndefined();
      });

      it('should reject non-numeric values for range', () => {
        expect(() => searchParamsSchema.parse({ range: 'invalid' })).toThrow();
      });

      it('should reject non-numeric values for interval', () => {
        expect(() =>
          searchParamsSchema.parse({ interval: 'invalid' })
        ).toThrow();
      });
    });

    describe('combined params', () => {
      it('should parse complete valid search params', () => {
        const params = {
          profile: 'auto',
          wps: '12.34,56.78',
          range: 30,
          interval: 15,
          generalize: 200,
          denoise: 0.5,
          style: 'carto',
        };

        const result = searchParamsSchema.parse(params);

        expect(result).toEqual(params);
      });
    });
  });

  describe('isValidTab', () => {
    it('should return true for directions', () => {
      expect(isValidTab('directions')).toBe(true);
    });

    it('should return true for isochrones', () => {
      expect(isValidTab('isochrones')).toBe(true);
    });

    it('should return true for tiles', () => {
      expect(isValidTab('tiles')).toBe(true);
    });

    it('should return false for invalid tab names', () => {
      expect(isValidTab('invalid')).toBe(false);
      expect(isValidTab('settings')).toBe(false);
      expect(isValidTab('map')).toBe(false);
      expect(isValidTab('')).toBe(false);
    });

    it('should return false for similar but incorrect tab names', () => {
      expect(isValidTab('direction')).toBe(false);
      expect(isValidTab('isochrone')).toBe(false);
      expect(isValidTab('tile')).toBe(false);
      expect(isValidTab('Directions')).toBe(false);
      expect(isValidTab('ISOCHRONES')).toBe(false);
      expect(isValidTab('TILES')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isValidTab(' directions')).toBe(false);
      expect(isValidTab('directions ')).toBe(false);
      expect(isValidTab('directions\n')).toBe(false);
    });
  });
});
