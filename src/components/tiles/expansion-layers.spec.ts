import { describe, it, expect } from 'vitest';
import type { LineLayerSpecification } from 'maplibre-gl';
import {
  EXPANSION_SOURCE_ID,
  EXPANSION_EDGES_LAYER_ID,
  EXPANSION_EDGES_LAYER,
  EXPANSION_LAYERS,
} from './expansion-layers';

describe('expansion-layers', () => {
  it('should export the expected source and layer ids', () => {
    expect(EXPANSION_SOURCE_ID).toBe('valhalla-expansion');
    expect(EXPANSION_EDGES_LAYER_ID).toBe('valhalla-expansion-edges');
  });

  it('should export the expansion layer collection', () => {
    expect(EXPANSION_LAYERS).toHaveLength(1);
    expect(EXPANSION_LAYERS[0]).toBe(EXPANSION_EDGES_LAYER);
  });

  it('should define an edge line layer with status-based styling', () => {
    const layer = EXPANSION_EDGES_LAYER as LineLayerSpecification;

    expect(layer.type).toBe('line');
    expect(layer.source).toBe(EXPANSION_SOURCE_ID);
    expect(layer['source-layer']).toBe('edges');
    expect(layer.paint).toMatchObject({
      'line-color': [
        'match',
        ['get', 'edge_status'],
        'reached',
        '#16a34a',
        'settled',
        '#f59e0b',
        'connected',
        '#2563eb',
        '#64748b',
      ],
      'line-opacity': 0.9,
    });
  });
});
