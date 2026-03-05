interface RGBColor {
  r: number;
  g: number;
  b: number;
}

function getViridisColor(value: number): string {
  const v = Math.max(0, Math.min(1, value));

 //5 key stops
  const colors: [number, string][] = [
    [0.0, '#440154'], // dark purple
    [0.25, '#31688e'], // blue
    [0.5, '#35b779'], // green
    [0.75, '#90d743'], // yellow-green
    [1.0, '#fde724'], // yellow
  ];

  
  let lower: [number, string] = colors[0]!;
  let upper: [number, string] = colors[colors.length - 1]!;

  for (let i = 0; i < colors.length - 1; i++) {
    const current = colors[i];
    const next = colors[i + 1];
    if (current && next && v >= current[0] && v <= next[0]) {
      lower = current;
      upper = next;
      break;
    }
  }

  const range = upper[0] - lower[0];
  const t = range === 0 ? 0 : (v - lower[0]) / range;

  const color1 = hexToRgb(lower[1]);
  const color2 = hexToRgb(upper[1]);

  const r = Math.round(color1.r + (color2.r - color1.r) * t);
  const g = Math.round(color1.g + (color2.g - color1.g) * t);
  const b = Math.round(color1.b + (color2.b - color1.b) * t);

  return rgbToHex(r, g, b);
}

function getCurrentColor(value: number): string {
  const v = Math.max(0, Math.min(1, value));


  const colors: [number, string][] = [
    [0.0, '#00ff00'], // green
    [0.33, '#ffff00'], // yellow
    [0.66, '#ff8800'], // orange
    [1.0, '#ff0000'], // red
  ];

  let lower: [number, string] = colors[0]!;
  let upper: [number, string] = colors[colors.length - 1]!;

  for (let i = 0; i < colors.length - 1; i++) {
    const current = colors[i];
    const next = colors[i + 1];
    if (current && next && v >= current[0] && v <= next[0]) {
      lower = current;
      upper = next;
      break;
    }
  }

  const range = upper[0] - lower[0];
  const t = range === 0 ? 0 : (v - lower[0]) / range;

  const color1 = hexToRgb(lower[1]);
  const color2 = hexToRgb(upper[1]);

  const r = Math.round(color1.r + (color2.r - color1.r) * t);
  const g = Math.round(color1.g + (color2.g - color1.g) * t);
  const b = Math.round(color1.b + (color2.b - color1.b) * t);

  return rgbToHex(r, g, b);
}


function getMagmaColor(value: number): string {
  const v = Math.max(0, Math.min(1, value));

  const colors: [number, string][] = [
    [0.0, '#fcfdbf'], // light yellow
    [0.25, '#fc8961'], // orange
    [0.5, '#b73779'], // magenta/pink
    [0.75, '#51127c'], // purple
    [1.0, '#000004'], // almost black
  ];

  let lower: [number, string] = colors[0]!;
  let upper: [number, string] = colors[colors.length - 1]!;

  for (let i = 0; i < colors.length - 1; i++) {
    const current = colors[i];
    const next = colors[i + 1];
    if (current && next && v >= current[0] && v <= next[0]) {
      lower = current;
      upper = next;
      break;
    }
  }

  const range = upper[0] - lower[0];
  const t = range === 0 ? 0 : (v - lower[0]) / range;

  const color1 = hexToRgb(lower[1]);
  const color2 = hexToRgb(upper[1]);

  const r = Math.round(color1.r + (color2.r - color1.r) * t);
  const g = Math.round(color1.g + (color2.g - color1.g) * t);
  const b = Math.round(color1.b + (color2.b - color1.b) * t);

  return rgbToHex(r, g, b);
}

/**
 * Get color for a value (0-1) based on selected palette
 * @param value - Number between 0 and 1 (0 = closest/easiest, 1 = farthest/hardest)
 * @param palette - Selected color palette
 * @returns Hex color string
 */
export function getIsochroneColor(
  value: number,
  palette: IsochronePalette = 'current'
): string {
  switch (palette) {
    case 'viridis':
      return getViridisColor(value);
    case 'current':
      return getCurrentColor(value);
        case 'magma':
          return getMagmaColor(value);
    default:
      return getCurrentColor(value);
  }
}

function hexToRgb(hex: string): RGBColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return {
    r: parseInt(result?.[1] || '0', 16),
    g: parseInt(result?.[2] || '0', 16),
    b: parseInt(result?.[3] || '0', 16),
  };
}


function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

export const ISOCHRONE_PALETTES = {
     current: {
    label: 'Default',
    value: 'current' as const,
  },
    magma: {
      label: 'Magma (colorblind-friendly)',
      value: 'magma' as const,
    },
  viridis: {
    label: 'Viridis (colorblind-friendly)',
    value: 'viridis' as const,
  },
  
} as const;

export type IsochronePalette = keyof typeof ISOCHRONE_PALETTES;
