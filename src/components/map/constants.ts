import { VALHALLA_OSM_URL } from '@/utils/valhalla';

const centerCoords = process.env.REACT_APP_CENTER_COORDS!.split(',');

export const DEFAULT_CENTER: [number, number] = [
  parseFloat(centerCoords[1] || '13.393707'),
  parseFloat(centerCoords[0] || '52.51831'),
];

export const DEFAULT_ZOOM = 10;

export const maxBounds: [[number, number], [number, number]] | undefined =
  undefined;

export const routeObjects = {
  [VALHALLA_OSM_URL!]: {
    color: '#0066ff',
    alternativeColor: '#66a3ff',
    name: 'OSM',
  },
};
