import type { LayerSpecification, SourceSpecification } from 'maplibre-gl';
import { getBaseUrl, normalizeBaseUrl } from '@/utils/base-url';

export const VALHALLA_SOURCE_ID = 'valhalla-tiles';
export const VALHALLA_EDGES_LAYER_ID = 'valhalla-edges';
export const VALHALLA_NODES_LAYER_ID = 'valhalla-nodes';

// Pre-encoded JSON: {"tile":{"z":{z},"x":{x},"y":{y}}}
// Placeholders {z}, {x}, {y} remain unencoded for MapLibre to replace
const TILE_JSON_ENCODED =
  '%7B%22verbose%22%3A%20true%2C%20%22tile%22%3A%7B%22z%22%3A{z}%2C%22x%22%3A{x}%2C%22y%22%3A{y}%7D%7D';

export function getValhallaTileUrl(): string {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  return `${baseUrl}/tile?json=${TILE_JSON_ENCODED}`;
}

export function getValhallaSourceSpec(): SourceSpecification {
  return {
    type: 'vector',
    tiles: [getValhallaTileUrl()],
    minzoom: 7,
    maxzoom: 14,
    scheme: 'xyz',
  };
}

export const VALHALLA_EDGES_LAYER: LayerSpecification = {
  id: VALHALLA_EDGES_LAYER_ID,
  type: 'line',
  source: VALHALLA_SOURCE_ID,
  'source-layer': 'edges',
  minzoom: 7,
  maxzoom: 22,
  filter: ['all'],
  layout: { visibility: 'visible' },
  paint: {
    'line-color': [
      'match',
      ['get', 'tile_level'],
      0,
      '#ff0000',
      1,
      '#ff8800',
      2,
      '#ffdd00',
      '#ff00ff',
    ],
    'line-width': [
      'interpolate',
      ['exponential', 1.5],
      ['zoom'],
      12,
      ['match', ['get', 'tile_level'], 0, 3, 1, 2, 2, 1, 2],
      14,
      ['match', ['get', 'tile_level'], 0, 4, 1, 3, 2, 2, 3],
      16,
      ['match', ['get', 'tile_level'], 0, 6, 1, 4, 2, 3, 4],
      18,
      ['match', ['get', 'tile_level'], 0, 8, 1, 6, 2, 4, 6],
      20,
      ['match', ['get', 'tile_level'], 0, 10, 1, 8, 2, 6, 8],
      22,
      ['match', ['get', 'tile_level'], 0, 12, 1, 10, 2, 8, 10],
    ],
    'line-opacity': 0.8,
  },
};

export const VALHALLA_NODES_LAYER: LayerSpecification = {
  id: VALHALLA_NODES_LAYER_ID,
  type: 'circle',
  source: VALHALLA_SOURCE_ID,
  'source-layer': 'nodes',
  minzoom: 16,
  maxzoom: 22,
  paint: {
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 16, 2, 18, 4, 20, 6],
    'circle-color': ['case', ['get', 'traffic_signal'], '#ff0000', '#0088ff'],
    'circle-stroke-color': '#ffffff',
    'circle-stroke-width': 1,
    'circle-opacity': 0.8,
  },
};

export const VALHALLA_LAYERS: LayerSpecification[] = [
  VALHALLA_EDGES_LAYER,
  VALHALLA_NODES_LAYER,
];
