import type { SourceSpecification } from 'maplibre-gl';
import { getBaseUrl, normalizeBaseUrl } from '@/utils/base-url';

export const VALHALLA_SOURCE_ID = 'valhalla-tiles';
export const VALHALLA_EDGES_LAYER_ID = 'valhalla-edges';
export const VALHALLA_SHORTCUTS_LAYER_ID = 'valhalla-shortcuts';
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

export async function getValhallaStyle() {
  const res = await fetch(
    'https://raw.githubusercontent.com/valhalla/valhalla/refs/heads/master/docs/docs/api/tile/default_style.json'
  );
  const style = await res.json();
  if (style.sources?.valhalla) {
    style.sources.valhalla.tiles = [getValhallaTileUrl()];
  }
  return style;
}
