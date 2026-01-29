import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  LineLayerSpecification,
  CircleLayerSpecification,
  VectorSourceSpecification,
} from 'maplibre-gl';
import {
  VALHALLA_SOURCE_ID,
  VALHALLA_EDGES_LAYER_ID,
  VALHALLA_NODES_LAYER_ID,
  VALHALLA_EDGES_LAYER,
  VALHALLA_NODES_LAYER,
  VALHALLA_LAYERS,
  getValhallaTileUrl,
  getValhallaSourceSpec,
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
      expect(VALHALLA_NODES_LAYER_ID).toBe('valhalla-nodes');
    });

    it('should export VALHALLA_LAYERS array with both layers', () => {
      expect(VALHALLA_LAYERS).toHaveLength(2);
      expect(VALHALLA_LAYERS).toContain(VALHALLA_EDGES_LAYER);
      expect(VALHALLA_LAYERS).toContain(VALHALLA_NODES_LAYER);
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

    it('should have correct zoom range', () => {
      expect(edgesLayer.minzoom).toBe(7);
      expect(edgesLayer.maxzoom).toBe(22);
    });

    it('should have visible layout', () => {
      expect(edgesLayer.layout).toEqual({ visibility: 'visible' });
    });

    it('should have paint properties', () => {
      expect(edgesLayer.paint).toBeDefined();
      expect(edgesLayer.paint).toHaveProperty('line-color');
      expect(edgesLayer.paint).toHaveProperty('line-width');
      expect(edgesLayer.paint).toHaveProperty('line-opacity');
    });
  });

  describe('VALHALLA_NODES_LAYER', () => {
    const nodesLayer = VALHALLA_NODES_LAYER as CircleLayerSpecification;

    it('should have correct id', () => {
      expect(nodesLayer.id).toBe(VALHALLA_NODES_LAYER_ID);
    });

    it('should be a circle type layer', () => {
      expect(nodesLayer.type).toBe('circle');
    });

    it('should reference correct source', () => {
      expect(nodesLayer.source).toBe(VALHALLA_SOURCE_ID);
    });

    it('should have nodes source-layer', () => {
      expect(nodesLayer['source-layer']).toBe('nodes');
    });

    it('should have correct zoom range', () => {
      expect(nodesLayer.minzoom).toBe(16);
      expect(nodesLayer.maxzoom).toBe(22);
    });

    it('should have paint properties', () => {
      expect(nodesLayer.paint).toBeDefined();
      expect(nodesLayer.paint).toHaveProperty('circle-radius');
      expect(nodesLayer.paint).toHaveProperty('circle-color');
      expect(nodesLayer.paint).toHaveProperty('circle-stroke-color');
      expect(nodesLayer.paint).toHaveProperty('circle-stroke-width');
      expect(nodesLayer.paint).toHaveProperty('circle-opacity');
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
