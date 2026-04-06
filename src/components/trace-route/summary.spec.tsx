import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Summary } from './summary';
import type { Summary as SummaryType } from '@/components/types';

const mockFitBounds = vi.fn();
const mockToggleShowOnMap = vi.fn();

const mockTraceRouteStore = {
  results: { show: { 0: true } },
  toggleShowOnMap: mockToggleShowOnMap,
  successful: true,
};

vi.mock('@/stores/trace-route-store', () => ({
  useTraceRouteStore: vi.fn(
    (selector: (state: typeof mockTraceRouteStore) => unknown) =>
      selector(mockTraceRouteStore)
  ),
}));

vi.mock('@/stores/common-store', () => ({
  useCommonStore: vi.fn((selector) =>
    selector({
      settingsPanelOpen: false,
    })
  ),
}));

vi.mock('react-map-gl/maplibre', () => ({
  useMap: vi.fn(() => ({
    mainMap: {
      fitBounds: mockFitBounds,
    },
  })),
}));

const createMockSummary = (
  overrides: Partial<SummaryType> = {}
): SummaryType => ({
  has_time_restrictions: false,
  has_toll: false,
  has_highway: false,
  has_ferry: false,
  min_lat: 0,
  min_lon: 0,
  max_lat: 1,
  max_lon: 2,
  time: 120,
  length: 1.2,
  cost: 1,
  ...overrides,
});

describe('TraceRoute Summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should recenter correctly when coordinates include zero values', async () => {
    const user = userEvent.setup();

    render(
      <Summary
        summary={createMockSummary()}
        title="Main Route"
        index={0}
        routeCoordinates={[
          [0, 0],
          [1, 2],
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: /zoom to route/i }));

    expect(mockFitBounds).toHaveBeenCalledWith(
      [
        [0, 0],
        [2, 1],
      ],
      expect.objectContaining({
        padding: expect.objectContaining({
          left: 420,
          right: 50,
          top: 50,
          bottom: 50,
        }),
      })
    );
  });

  it('should ignore invalid coordinates and still fit to valid route points', async () => {
    const user = userEvent.setup();

    render(
      <Summary
        summary={createMockSummary()}
        title="Main Route"
        index={0}
        routeCoordinates={[
          [Number.NaN, 4],
          [5, 6],
          [0, 3],
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: /zoom to route/i }));

    expect(mockFitBounds).toHaveBeenCalledWith(
      [
        [3, 0],
        [6, 5],
      ],
      expect.any(Object)
    );
  });
});
