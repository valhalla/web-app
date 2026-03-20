import type { LayerSpecification, SourceSpecification } from 'maplibre-gl';
import { getBaseUrl, normalizeBaseUrl } from '@/utils/base-url';

export const VALHALLA_SOURCE_ID = 'valhalla-tiles';
export const VALHALLA_EDGES_LAYER_ID = 'valhalla-edges';
export const VALHALLA_SHORTCUTS_LAYER_ID = 'valhalla-shortcuts';
export const VALHALLA_NODES_LAYER_ID = 'valhalla-nodes';
export const VALHALLA_DEFAULT_STYLE_URL =
  import.meta.env.VITE_VALHALLA_DEFAULT_STYLE_URL ||
  'https://raw.githubusercontent.com/valhalla/valhalla/master/docs/docs/api/tile/default_style.json';
export const VALHALLA_LAYER_IDS = [
  VALHALLA_EDGES_LAYER_ID,
  VALHALLA_SHORTCUTS_LAYER_ID,
  VALHALLA_NODES_LAYER_ID,
] as const;

const VALHALLA_SOURCE_LAYER_TO_MAP_LAYER_ID: Record<string, string> = {
  edges: VALHALLA_EDGES_LAYER_ID,
  shortcuts: VALHALLA_SHORTCUTS_LAYER_ID,
  nodes: VALHALLA_NODES_LAYER_ID,
};

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

function isTargetValhallaLayer(
  layer: LayerSpecification
): layer is LayerSpecification & { 'source-layer': string } {
  if (!('source-layer' in layer)) {
    return false;
  }

  const sourceLayer = layer['source-layer'];
  return (
    typeof sourceLayer === 'string' &&
    sourceLayer in VALHALLA_SOURCE_LAYER_TO_MAP_LAYER_ID
  );
}

function toAppLayer(
  layer: LayerSpecification & { 'source-layer': string }
): LayerSpecification {
  const sourceLayer = layer['source-layer'];
  return {
    ...layer,
    id: VALHALLA_SOURCE_LAYER_TO_MAP_LAYER_ID[sourceLayer] || layer.id,
    source: VALHALLA_SOURCE_ID,
  } as LayerSpecification;
}

export async function getValhallaLayers(): Promise<LayerSpecification[]> {
  const response = await fetch(VALHALLA_DEFAULT_STYLE_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch Valhalla default style: ${response.status}`
    );
  }

  const style = (await response.json()) as {
    layers?: LayerSpecification[];
  };

  if (!Array.isArray(style.layers)) {
    throw new Error('Invalid Valhalla default style: missing layers array');
  }

  return style.layers.filter(isTargetValhallaLayer).map(toAppLayer);
}
