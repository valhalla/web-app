const centerCoords = import.meta.env.VITE_CENTER_COORDS?.split(',') || [];

export const DEFAULT_CENTER: [number, number] = [
  parseFloat(centerCoords[1] || '13.393707'),
  parseFloat(centerCoords[0] || '52.51831'),
];

export const DEFAULT_ZOOM = 10;

export const maxBounds: [[number, number], [number, number]] | undefined =
  undefined;

export const routeObjects = {
  color: '#0066ff',
  alternativeColor: '#66a3ff',
};

export const MAP_STYLE_STORAGE_KEY = 'selectedMapStyle';
export const CUSTOM_STYLE_STORAGE_KEY = 'customMapStyle';

const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const MAP_STYLES = [
  {
    id: 'shortbread',
    label: 'Shortbread',
    style: assetPath('styles/versatiles-colorful.json'),
  },
  { id: 'carto', label: 'Carto', style: assetPath('styles/carto.json') },
  {
    id: 'alidade-smooth',
    label: 'Alidade Smooth',
    style: 'https://tiles.stadiamaps.com/styles/alidade_smooth.json',
  },
] as const;

export const DEFAULT_MAP_STYLE = MAP_STYLES[0].style;
export const DEFAULT_MAP_STYLE_ID = MAP_STYLES[0].id;
export const MAP_STYLE_IDS = MAP_STYLES.map((s) => s.id);
export const CLICK_DELAY_MS = 200;
export const DOUBLE_TAP_THRESHOLD_MS = 300;
