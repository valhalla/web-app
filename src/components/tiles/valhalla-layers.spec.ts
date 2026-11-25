import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { VectorSourceSpecification } from 'maplibre-gl';
import {
  VALHALLA_SOURCE_ID,
  VALHALLA_EDGES_LAYER_ID,
  VALHALLA_SHORTCUTS_LAYER_ID,
  VALHALLA_NODES_LAYER_ID,
  VALHALLA_LAYER_IDS,
  VALHALLA_DEFAULT_STYLE_URL,
  VALHALLA_ACCESS_RESTRICTIONS_PERMANENT_LAYER_ID,
  VALHALLA_ACCESS_RESTRICTIONS_TIMED_LAYER_ID,
  VALHALLA_EDGES_LAYER,
  VALHALLA_SHORTCUTS_LAYER,
  VALHALLA_NODES_LAYER,
  VALHALLA_ACCESS_RESTRICTIONS_PERMANENT_LAYER,
  VALHALLA_ACCESS_RESTRICTIONS_TIMED_LAYER,
  VALHALLA_LAYERS,
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
      expect(VALHALLA_ACCESS_RESTRICTIONS_PERMANENT_LAYER_ID).toBe(
        'valhalla-access-restrictions-permanent'
      );
      expect(VALHALLA_ACCESS_RESTRICTIONS_TIMED_LAYER_ID).toBe(
        'valhalla-access-restrictions-timed'
      );
    });

    it('should export app layer IDs in expected order', () => {
      expect(VALHALLA_LAYER_IDS).toEqual([
        VALHALLA_EDGES_LAYER_ID,
        VALHALLA_SHORTCUTS_LAYER_ID,
        VALHALLA_NODES_LAYER_ID,
      ]);
    it('should export VALHALLA_LAYERS array with all layers', () => {
      expect(VALHALLA_LAYERS).toHaveLength(5);
      expect(VALHALLA_LAYERS).toContain(VALHALLA_EDGES_LAYER);
      expect(VALHALLA_LAYERS).toContain(VALHALLA_SHORTCUTS_LAYER);
      expect(VALHALLA_LAYERS).toContain(VALHALLA_NODES_LAYER);
      expect(VALHALLA_LAYERS).toContain(
        VALHALLA_ACCESS_RESTRICTIONS_PERMANENT_LAYER
      );
      expect(VALHALLA_LAYERS).toContain(
        VALHALLA_ACCESS_RESTRICTIONS_TIMED_LAYER
      );
    });
  });

  describe('VALHALLA_EDGES_LAYER', () => {
    const edgesLayer = VALHALLA_EDGES_LAYER as LineLayerSpecification;

    it('should have correct id', () => {
      expect(edgesLayer.id).toBe(VALHALLA_EDGES_LAYER_ID);
    });

    it('should be a line type layer', () => {
      expect(edgesLayer.type).toBe('line');
    });

    it('should reference correct source', () => {
      expect(edgesLayer.source).toBe(VALHALLA_SOURCE_ID);
    });

    it('should have edges source-layer', () => {
      expect(edgesLayer['source-layer']).toBe('edges');
    });

    it('should export hosted default style url', () => {
      expect(VALHALLA_DEFAULT_STYLE_URL).toContain(
        'raw.githubusercontent.com/valhalla/valhalla/master/docs/docs/api/tile/default_style.json'
      );
    });
  });

  describe('VALHALLA_ACCESS_RESTRICTIONS_PERMANENT_LAYER', () => {
    const layer =
      VALHALLA_ACCESS_RESTRICTIONS_PERMANENT_LAYER as LineLayerSpecification;

    it('should have correct id', () => {
      expect(layer.id).toBe(VALHALLA_ACCESS_RESTRICTIONS_PERMANENT_LAYER_ID);
    });

    it('should be a line type layer', () => {
      expect(layer.type).toBe('line');
    });

    it('should reference correct source', () => {
      expect(layer.source).toBe(VALHALLA_SOURCE_ID);
    });

    it('should have access_restrictions source-layer', () => {
      expect(layer['source-layer']).toBe('access_restrictions');
    });

    it('should filter out timed restrictions', () => {
      expect(layer.filter).toEqual([
        '!',
        ['in', ['get', 'type'], ['literal', [6, 7]]],
      ]);
    });

    it('should have paint properties', () => {
      expect(layer.paint).toHaveProperty('line-color');
      expect(layer.paint).toHaveProperty('line-width');
      expect(layer.paint).toHaveProperty('line-opacity');
    });
  });

  describe('VALHALLA_ACCESS_RESTRICTIONS_TIMED_LAYER', () => {
    const layer =
      VALHALLA_ACCESS_RESTRICTIONS_TIMED_LAYER as LineLayerSpecification;

    it('should have correct id', () => {
      expect(layer.id).toBe(VALHALLA_ACCESS_RESTRICTIONS_TIMED_LAYER_ID);
    });

    it('should be a line type layer', () => {
      expect(layer.type).toBe('line');
    });

    it('should reference correct source', () => {
      expect(layer.source).toBe(VALHALLA_SOURCE_ID);
    });

    it('should have access_restrictions source-layer', () => {
      expect(layer['source-layer']).toBe('access_restrictions');
    });

    it('should filter to timed restrictions only', () => {
      expect(layer.filter).toEqual([
        'in',
        ['get', 'type'],
        ['literal', [6, 7]],
      ]);
    });

    it('should have a dash array for visual distinction', () => {
      expect(layer.paint).toHaveProperty('line-dasharray');
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
