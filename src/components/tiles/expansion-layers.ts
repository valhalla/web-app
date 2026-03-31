import type { LayerSpecification } from 'maplibre-gl';
import { getExpansionSourceSpec } from './valhalla-layers';

export const EXPANSION_SOURCE_ID = 'valhalla-expansion';
export const EXPANSION_EDGES_LAYER_ID = 'valhalla-expansion-edges';

export const EXPANSION_EDGES_LAYER: LayerSpecification = {
  id: EXPANSION_EDGES_LAYER_ID,
  type: 'line',
  source: EXPANSION_SOURCE_ID,
  'source-layer': 'edges',
  minzoom: 7,
  maxzoom: 22,
  filter: ['all'],
  layout: { visibility: 'visible' },
  paint: {
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
    'line-width': [
      'interpolate',
      ['linear'],
      ['zoom'],
      10,
      1.5,
      14,
      2.5,
      18,
      4,
      22,
      5.5,
    ],
    'line-opacity': 0.9,
  },
};

export const EXPANSION_LAYERS: LayerSpecification[] = [EXPANSION_EDGES_LAYER];

export { getExpansionSourceSpec };
