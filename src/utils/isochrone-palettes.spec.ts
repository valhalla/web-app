import { describe, it, expect } from 'vitest';
import { getPaletteColor, DEFAULT_FILL } from './isochrone-palettes';

// black → white
const BINARY = ['#000000', '#ffffff'];

// 5-stop viridis palette
const VIRIDIS = ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'];

describe('getPaletteColor', () => {
  it('returns DEFAULT_FILL for an empty palette', () => {
    expect(getPaletteColor([], 0)).toBe(DEFAULT_FILL);
  });

  it('returns the only color when the palette has one entry', () => {
    expect(getPaletteColor(['#aabbcc'], 0.5)).toBe('#aabbcc');
  });

  // t=1 is the largest contour, should map to the last color
  it('maps t=1 (largest contour) to the palette end', () => {
    expect(getPaletteColor(VIRIDIS, 1)).toBe('#fde725');
    expect(getPaletteColor(BINARY, 1)).toBe('#ffffff');
  });

  // t=0 is the smallest contour, should map to the first color
  it('maps t=0 to the palette start', () => {
    expect(getPaletteColor(VIRIDIS, 0)).toBe('#440154');
    expect(getPaletteColor(BINARY, 0)).toBe('#000000');
  });

  // same t should always give the same color, regardless of how many contours exist
  it('is stable: same t always produces the same color', () => {
    const t = 30 / 30; // contour=30, maxRange=30 → always 1
    expect(getPaletteColor(VIRIDIS, t)).toBe('#fde725');

    const tMid = 10 / 30; // contour=10, maxRange=30 → always 0.333…
    expect(getPaletteColor(VIRIDIS, tMid)).toBe(getPaletteColor(VIRIDIS, tMid));
  });

  // no floating-point drift at the edges
  it('returns exact palette colors at t=0 and t=1', () => {
    expect(getPaletteColor(BINARY, 0)).toBe('#000000');
    expect(getPaletteColor(BINARY, 1)).toBe('#ffffff');
  });

  // midpoint of black and white is #808080
  it('interpolates correctly at t=0.5 on a two-stop palette', () => {
    expect(getPaletteColor(BINARY, 0.5)).toBe('#808080');
  });

  // the largest contour should always land on the palette end, no matter the maxRange
  it('largest contour is always palette end across different maxRange scenarios', () => {
    expect(getPaletteColor(VIRIDIS, 30 / 30)).toBe('#fde725');
    expect(getPaletteColor(VIRIDIS, 60 / 60)).toBe('#fde725');
  });
});
