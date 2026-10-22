import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMap } from 'react-map-gl/maplibre';
import { useIsochronesPermalink } from './use-isochrones-permalink';

const mockNavigate = vi.fn();
const mockRefetchIsochrones = vi.fn();
const mockReverseGeocode = vi.fn().mockResolvedValue([]);
const mockFlyTo = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(() => mockNavigate),
}));

vi.mock('react-map-gl/maplibre', () => ({
  useMap: vi.fn(() => ({
    mainMap: {
      flyTo: mockFlyTo,
    },
  })),
}));

vi.mock('@/utils/parse-url-params', () => ({
  parseUrlParams: vi.fn(() => ({})),
}));

const mockGeocodeResults: {
  selected: boolean;
  sourcelnglat: [number, number];
}[] = [];

vi.mock('@/stores/isochrones-store', () => {
  const useIsochronesStore = Object.assign(
    vi.fn((selector) => selector({ geocodeResults: mockGeocodeResults })),
    { getState: () => ({ geocodeResults: mockGeocodeResults }) }
  );
  return { useIsochronesStore };
});

vi.mock('@/hooks/use-isochrones-queries', () => ({
  useIsochronesQuery: vi.fn(() => ({
    refetch: mockRefetchIsochrones,
  })),
  useReverseGeocodeIsochrones: vi.fn(() => ({
    reverseGeocode: mockReverseGeocode,
  })),
}));

const mockUrlParams = async (params: Record<string, string>) => {
  const parseUrlParams = await import('@/utils/parse-url-params');
  vi.mocked(parseUrlParams.parseUrlParams).mockReturnValue(params);
};

const lastSearchFn = () =>
  (
    mockNavigate.mock.calls.at(-1)?.[0] as {
      search: (prev: Record<string, unknown>) => Record<string, unknown>;
    }
  ).search;

describe('useIsochronesPermalink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGeocodeResults.length = 0;
  });

  it('should process URL params with valid coordinates', async () => {
    await mockUrlParams({ wps: '13.4,52.5' });

    renderHook(() => useIsochronesPermalink(true));

    expect(mockReverseGeocode).toHaveBeenCalledWith(13.4, 52.5);
    expect(mockFlyTo).toHaveBeenCalledWith({
      center: [13.4, 52.5],
      zoom: 12,
    });
  });

  it('should skip invalid coordinates from URL', async () => {
    await mockUrlParams({ wps: '999,999' });

    renderHook(() => useIsochronesPermalink(true));

    expect(mockReverseGeocode).not.toHaveBeenCalled();
  });

  it('should process URL params with valid coordinates where lng > 90 (Singapore)', async () => {
    await mockUrlParams({ wps: '103.66492937866911,1.4827280571964963' });

    renderHook(() => useIsochronesPermalink(true));

    expect(mockReverseGeocode).toHaveBeenCalledWith(
      103.66492937866911,
      1.4827280571964963
    );
    expect(mockFlyTo).toHaveBeenCalledWith({
      center: [103.66492937866911, 1.4827280571964963],
      zoom: 12,
    });
  });

  it('should do nothing while disabled', async () => {
    await mockUrlParams({ wps: '13.4,52.5' });

    renderHook(() => useIsochronesPermalink(false));

    expect(mockReverseGeocode).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should not touch the URL before the map is ready', async () => {
    await mockUrlParams({ wps: '13.4,52.5' });
    vi.mocked(useMap).mockReturnValueOnce({} as ReturnType<typeof useMap>);

    const { rerender } = renderHook(() => useIsochronesPermalink(true));

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockReverseGeocode).not.toHaveBeenCalled();

    rerender();

    expect(mockReverseGeocode).toHaveBeenCalledWith(13.4, 52.5);
  });

  it('should call navigate with wps parameter when center exists', () => {
    mockGeocodeResults.push({ selected: true, sourcelnglat: [13.4, 52.5] });

    renderHook(() => useIsochronesPermalink(true));

    expect(mockNavigate).toHaveBeenCalledWith({
      search: expect.any(Function),
      replace: true,
    });
    expect(lastSearchFn()({}).wps).toBe('13.4,52.5');
  });

  it('should call navigate with undefined wps when no center', () => {
    renderHook(() => useIsochronesPermalink(true));

    expect(lastSearchFn()({ wps: 'old-value' }).wps).toBeUndefined();
  });
});
