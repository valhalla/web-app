import { describe, it, expect } from 'vitest';
import {
  getPaletteColor,
  DEFAULT_FILL,
  ISOCHRONE_PALETTES,
} from './isochrone-palettes';

const BINARY = ['#000000', '#ffffff'];

const VIRIDIS = ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'];

describe('getPaletteColor', () => {
  it('returns DEFAULT_FILL for an empty palette', () => {
    expect(getPaletteColor([], 0)).toBe(DEFAULT_FILL);
  });

  it('returns the only color when the palette has one entry', () => {
    expect(getPaletteColor(['#aabbcc'], 0.5)).toBe('#aabbcc');
  });

  it('maps t=1 (largest contour) to the palette end', () => {
    expect(getPaletteColor(VIRIDIS, 1)).toBe('#fde725');
    expect(getPaletteColor(BINARY, 1)).toBe('#ffffff');
  });

  it('maps t=0 to the palette start', () => {
    expect(getPaletteColor(VIRIDIS, 0)).toBe('#440154');
    expect(getPaletteColor(BINARY, 0)).toBe('#000000');
  });

  it('is stable: same t always produces the same color', () => {
    const t = 30 / 30;
    expect(getPaletteColor(VIRIDIS, t)).toBe('#fde725');

    const tMid = 10 / 30;
    expect(getPaletteColor(VIRIDIS, tMid)).toBe(getPaletteColor(VIRIDIS, tMid));
  });

  it('returns exact palette colors at t=0 and t=1', () => {
    expect(getPaletteColor(BINARY, 0)).toBe('#000000');
    expect(getPaletteColor(BINARY, 1)).toBe('#ffffff');
  });

  it('interpolates correctly at t=0.5 on a two-stop palette', () => {
    expect(getPaletteColor(BINARY, 0.5)).toBe('#808080');
  });

  it('largest contour is always palette end across different maxRange scenarios', () => {
    expect(getPaletteColor(VIRIDIS, 30 / 30)).toBe('#fde725');
    expect(getPaletteColor(VIRIDIS, 60 / 60)).toBe('#fde725');
  });
});

describe('ISOCHRONE_PALETTES', () => {
  it('includes colorblind-friendly palettes', () => {
    const ids = ISOCHRONE_PALETTES.map((p) => p.id);
    expect(ids).toContain('viridis');
    expect(ids).toContain('cividis');
  });

  it('labels colorblind-friendly palettes correctly', () => {
    const viridis = ISOCHRONE_PALETTES.find((p) => p.id === 'viridis');
    const cividis = ISOCHRONE_PALETTES.find((p) => p.id === 'cividis');
    expect(viridis?.label).toContain('colorblind-friendly');
    expect(cividis?.label).toContain('colorblind-friendly');
  });
});
