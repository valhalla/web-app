import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VectorSourceSpecification } from 'maplibre-gl';
import {
  VALHALLA_SOURCE_ID,
  VALHALLA_EDGES_LAYER_ID,
  VALHALLA_SHORTCUTS_LAYER_ID,
  VALHALLA_NODES_LAYER_ID,
  getValhallaTileUrl,
  getValhallaSourceSpec,
  getValhallaStyle,
} from './valhalla-layers';

vi.mock('@/utils/base-url', () => ({
  getBaseUrl: vi.fn(() => 'https://valhalla.example.com'),
  normalizeBaseUrl: vi.fn((url: string) => url.replace(/\/$/, '')),
}));

describe('valhalla-layers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constants', () => {
    it('should export correct source ID', () => {
      expect(VALHALLA_SOURCE_ID).toBe('valhalla-tiles');
    });

    it('should export correct layer IDs', () => {
      expect(VALHALLA_EDGES_LAYER_ID).toBe('valhalla-edges');
      expect(VALHALLA_SHORTCUTS_LAYER_ID).toBe('valhalla-shortcuts');
      expect(VALHALLA_NODES_LAYER_ID).toBe('valhalla-nodes');
    });
  });

  describe('getValhallaStyle', () => {
    it('should fetch valhalla default style and update valhalla source tiles', async () => {
      const mockStyle = {
        version: 8,
        sources: {
          valhalla: {
            type: 'vector',
            tiles: ['https://old.example.com/{z}/{x}/{y}.pbf'],
          },
        },
        layers: [],
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockStyle),
      }) as unknown as typeof fetch;

      const style = await getValhallaStyle();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://raw.githubusercontent.com/valhalla/valhalla/refs/heads/master/docs/docs/api/tile/default_style.json'
      );
      expect(style.sources.valhalla.tiles).toEqual([getValhallaTileUrl()]);
    });

    it('should keep style unchanged when valhalla source is not present', async () => {
      const mockStyle = {
        version: 8,
        sources: {
          streets: {
            type: 'vector',
            tiles: ['https://example.com/{z}/{x}/{y}.pbf'],
          },
        },
        layers: [],
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockStyle),
      }) as unknown as typeof fetch;

      const style = await getValhallaStyle();

      expect(style).toEqual(mockStyle);
      expect(style.sources).not.toHaveProperty('valhalla');
    });
  });

  describe('getValhallaTileUrl', () => {
    it('should return correctly formatted tile URL', () => {
      const url = getValhallaTileUrl();

      expect(url).toContain('https://valhalla.example.com/tile?json=');
    });

    it('should include encoded JSON with xyz placeholders', () => {
      const url = getValhallaTileUrl();

      expect(url).toContain('{z}');
      expect(url).toContain('{x}');
      expect(url).toContain('{y}');
    });

    it('should have properly encoded JSON structure', () => {
      const url = getValhallaTileUrl();
      const expectedEncoded =
        '%7B%22verbose%22%3A%20true%2C%20%22tile%22%3A%7B%22z%22%3A{z}%2C%22x%22%3A{x}%2C%22y%22%3A{y}%7D%7D';

      expect(url).toContain(expectedEncoded);
    });
  });

  describe('getValhallaSourceSpec', () => {
    it('should return vector source type', () => {
      const spec = getValhallaSourceSpec() as VectorSourceSpecification;

      expect(spec.type).toBe('vector');
    });

    it('should include tile URL', () => {
      const spec = getValhallaSourceSpec() as VectorSourceSpecification;

      expect(spec.tiles).toHaveLength(1);
      expect(spec.tiles![0]).toContain('https://valhalla.example.com/tile');
    });

    it('should have correct zoom range', () => {
      const spec = getValhallaSourceSpec() as VectorSourceSpecification;

      expect(spec.minzoom).toBe(7);
      expect(spec.maxzoom).toBe(14);
    });

    it('should use xyz scheme', () => {
      const spec = getValhallaSourceSpec() as VectorSourceSpecification;

      expect(spec.scheme).toBe('xyz');
    });
  });
});
