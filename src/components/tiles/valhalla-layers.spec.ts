import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { VectorSourceSpecification } from 'maplibre-gl';
import {
  VALHALLA_SOURCE_ID,
  VALHALLA_EDGES_LAYER_ID,
  VALHALLA_SHORTCUTS_LAYER_ID,
  VALHALLA_NODES_LAYER_ID,
  VALHALLA_LAYER_IDS,
  VALHALLA_DEFAULT_STYLE_URL,
  getValhallaTileUrl,
  getValhallaSourceSpec,
  getValhallaLayers,
} from './valhalla-layers';

vi.mock('@/utils/base-url', () => ({
  getBaseUrl: vi.fn(() => 'https://valhalla.example.com'),
  normalizeBaseUrl: vi.fn((url: string) => url.replace(/\/$/, '')),
}));

describe('valhalla-layers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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

    it('should export app layer IDs in expected order', () => {
      expect(VALHALLA_LAYER_IDS).toEqual([
        VALHALLA_EDGES_LAYER_ID,
        VALHALLA_SHORTCUTS_LAYER_ID,
        VALHALLA_NODES_LAYER_ID,
      ]);
    });

    it('should export hosted default style url', () => {
      expect(VALHALLA_DEFAULT_STYLE_URL).toContain(
        'raw.githubusercontent.com/valhalla/valhalla/master/docs/docs/api/tile/default_style.json'
      );
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

  describe('getValhallaLayers', () => {
    const makeStyleResponse = () => ({
      layers: [
        {
          id: 'edges',
          type: 'line',
          source: 'valhalla',
          'source-layer': 'edges',
          paint: { 'line-color': '#ff0000' },
        },
        {
          id: 'shortcuts',
          type: 'line',
          source: 'valhalla',
          'source-layer': 'shortcuts',
          paint: { 'line-color': '#ff8800' },
        },
        {
          id: 'nodes',
          type: 'circle',
          source: 'valhalla',
          'source-layer': 'nodes',
          paint: { 'circle-color': '#0088ff' },
        },
        {
          id: 'background',
          type: 'background',
          paint: { 'background-color': '#fff' },
        },
      ],
    });

    it('should fetch hosted default style and map layer ids/source', async () => {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        json: async () => makeStyleResponse(),
      }));
      vi.stubGlobal('fetch', fetchMock);

      const layers = await getValhallaLayers();

      expect(fetchMock).toHaveBeenCalledWith(VALHALLA_DEFAULT_STYLE_URL);
      expect(layers).toHaveLength(3);
      expect(layers.map((l) => l.id)).toEqual([
        VALHALLA_EDGES_LAYER_ID,
        VALHALLA_SHORTCUTS_LAYER_ID,
        VALHALLA_NODES_LAYER_ID,
      ]);
      expect(
        layers.every((l) => 'source' in l && l.source === VALHALLA_SOURCE_ID)
      ).toBe(true);
    });

    it('should fetch on each call', async () => {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        json: async () => makeStyleResponse(),
      }));
      vi.stubGlobal('fetch', fetchMock);

      await getValhallaLayers();
      await getValhallaLayers();

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should throw when fetch fails', async () => {
      const fetchMock = vi.fn(async () => ({ ok: false, status: 500 }));
      vi.stubGlobal('fetch', fetchMock);

      await expect(getValhallaLayers()).rejects.toThrow(
        'Failed to fetch Valhalla default style: 500'
      );
    });
  });
});
