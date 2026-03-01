export type PaletteId = 'default' | 'viridis' | 'plasma' | 'blues';

//Fallback fill color when the Valhalla API provides no color for a feature.
export const DEFAULT_FILL = '#6200ea';

//Default opacity for isochrone fill polygons.
export const DEFAULT_OPACITY = 0.4;

export interface IsochronePalette {
  id: PaletteId;
  label: string;
  //Ordered from smallest to largest contour. null = use API-provided colors.
  colors: string[] | null;
}

export const ISOCHRONE_PALETTES: IsochronePalette[] = [
  {
    id: 'default',
    label: 'Default',
    colors: null,
  },
  {
    id: 'viridis',
    label: 'Viridis (colorblind-friendly)',
    colors: ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'],
  },
  {
    id: 'plasma',
    label: 'Plasma',
    colors: ['#0d0887', '#7e03a8', '#cc4778', '#f89540', '#f0f921'],
  },
  {
    id: 'blues',
    label: 'Blues',
    colors: ['#084594', '#2171b5', '#4292c6', '#9ecae1', '#deebf7'],
  },
];

// Type guard - returns true if value is a valid PaletteId.
export function isPaletteId(value: string): value is PaletteId {
  return ISOCHRONE_PALETTES.some((p) => p.id === value);
}

function interpolateHex(c1: string, c2: string, t: number): string {
  const r1 = parseInt(c1.slice(1, 3), 16);
  const g1 = parseInt(c1.slice(3, 5), 16);
  const b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16);
  const g2 = parseInt(c2.slice(3, 5), 16);
  const b2 = parseInt(c2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Interpolates a color from a palette for a given index out of total.

export function getPaletteColor(
  colors: string[],
  index: number,
  total: number
): string {
  if (colors.length === 0) return DEFAULT_FILL;
  if (total <= 1 || colors.length === 1) {
    return colors[Math.floor(colors.length / 2)] ?? colors[0]!;
  }
  const t = index / (total - 1);
  const rawIdx = t * (colors.length - 1);
  const lower = Math.floor(rawIdx);
  const upper = Math.min(lower + 1, colors.length - 1);
  if (lower === upper) return colors[lower]!;
  return interpolateHex(colors[lower]!, colors[upper]!, rawIdx - lower);
}
