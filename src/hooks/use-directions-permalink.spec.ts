import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDirectionsPermalink } from './use-directions-permalink';

const mockNavigate = vi.fn();
const mockRefetchDirections = vi.fn();
const mockSetWaypointFromCoords = vi.fn().mockResolvedValue([]);

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(() => mockNavigate),
}));

vi.mock('@/utils/parse-url-params', () => ({
  parseUrlParams: vi.fn(() => ({})),
}));

const mockWaypoints: {
  id: string;
  geocodeResults: { selected: boolean; sourcelnglat: [number, number] }[];
  userInput: string;
}[] = [];

vi.mock('@/stores/directions-store', () => {
  const useDirectionsStore = Object.assign(
    vi.fn((selector) => selector({ waypoints: mockWaypoints })),
    { getState: () => ({ waypoints: mockWaypoints }) }
  );
  return { useDirectionsStore };
});

vi.mock('@/hooks/use-directions-queries', () => ({
  useDirectionsQuery: vi.fn(() => ({
    refetch: mockRefetchDirections,
  })),
  useSetWaypointFromCoords: vi.fn(() => ({
    setWaypointFromCoords: mockSetWaypointFromCoords,
  })),
}));

const mockUrlParams = async (params: Record<string, string>) => {
  const parseUrlParams = await import('@/utils/parse-url-params');
  vi.mocked(parseUrlParams.parseUrlParams).mockReturnValue(params);
};

describe('useDirectionsPermalink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWaypoints.length = 0;
  });

  it('should process URL params with valid coordinates (Berlin)', async () => {
    await mockUrlParams({
      wps: '13.365016850476763,52.483706198952575,13.422421655040836,52.49336042169804',
    });

    renderHook(() => useDirectionsPermalink(true));

    expect(mockSetWaypointFromCoords).toHaveBeenCalledTimes(2);
    expect(mockSetWaypointFromCoords).toHaveBeenCalledWith(
      13.365016850476763,
      52.483706198952575,
      0,
      { isPermalink: true }
    );
    expect(mockSetWaypointFromCoords).toHaveBeenCalledWith(
      13.422421655040836,
      52.49336042169804,
      1,
      { isPermalink: true }
    );
    expect(mockRefetchDirections).toHaveBeenCalledTimes(1);
  });

  it('should process URL params with valid coordinates where lng > 90 (Singapore)', async () => {
    await mockUrlParams({
      wps: '103.66492937866911,1.4827280571964963,103.66421854954496,1.4840285187178779',
    });

    renderHook(() => useDirectionsPermalink(true));

    expect(mockSetWaypointFromCoords).toHaveBeenCalledTimes(2);
    expect(mockSetWaypointFromCoords).toHaveBeenCalledWith(
      103.66492937866911,
      1.4827280571964963,
      0,
      { isPermalink: true }
    );
    expect(mockSetWaypointFromCoords).toHaveBeenCalledWith(
      103.66421854954496,
      1.4840285187178779,
      1,
      { isPermalink: true }
    );
  });

  it('should skip truly invalid coordinates from URL', async () => {
    await mockUrlParams({ wps: '999,999' });

    renderHook(() => useDirectionsPermalink(true));

    expect(mockSetWaypointFromCoords).not.toHaveBeenCalled();
  });

  it('should handle coordinates near edge of valid range', async () => {
    await mockUrlParams({ wps: '179.9,89,-179.9,-89' });

    renderHook(() => useDirectionsPermalink(true));

    expect(mockSetWaypointFromCoords).toHaveBeenCalledTimes(2);
    expect(mockSetWaypointFromCoords).toHaveBeenCalledWith(179.9, 89, 0, {
      isPermalink: true,
    });
    expect(mockSetWaypointFromCoords).toHaveBeenCalledWith(-179.9, -89, 1, {
      isPermalink: true,
    });
  });

  it('should hydrate only once across re-renders', async () => {
    await mockUrlParams({ wps: '13.4,52.5,10,48' });

    const { rerender } = renderHook(() => useDirectionsPermalink(true));
    rerender();

    expect(mockSetWaypointFromCoords).toHaveBeenCalledTimes(2);
    expect(mockRefetchDirections).toHaveBeenCalledTimes(1);
  });

  it('should do nothing while disabled and hydrate once enabled', async () => {
    await mockUrlParams({ wps: '13.4,52.5,10,48' });

    const { rerender } = renderHook(
      ({ enabled }) => useDirectionsPermalink(enabled),
      { initialProps: { enabled: false } }
    );

    expect(mockSetWaypointFromCoords).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();

    rerender({ enabled: true });

    expect(mockSetWaypointFromCoords).toHaveBeenCalledTimes(2);
  });

  it('should sync waypoints to URL', () => {
    mockWaypoints.push(
      {
        id: '0',
        geocodeResults: [{ selected: true, sourcelnglat: [13.4, 52.5] }],
        userInput: 'Berlin',
      },
      {
        id: '1',
        geocodeResults: [{ selected: true, sourcelnglat: [10.0, 48.0] }],
        userInput: 'Munich',
      }
    );

    renderHook(() => useDirectionsPermalink(true));

    expect(mockNavigate).toHaveBeenCalledWith({
      search: expect.any(Function),
      replace: true,
    });

    const navigateCall = mockNavigate.mock.calls[0]?.[0] as {
      search: (prev: Record<string, unknown>) => Record<string, unknown>;
    };
    expect(navigateCall.search({}).wps).toBe('13.4,52.5,10,48');
  });
});
