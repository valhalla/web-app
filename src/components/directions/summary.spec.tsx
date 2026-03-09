import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Summary } from './summary';
import type { Summary as SummaryType } from '@/components/types';
import { useDirectionsStore } from '@/stores/directions-store';

const mockToggleShowOnMap = vi.fn();
const mockFitBounds = vi.fn();

const mockResults = {
  show: { '-1': true, '0': true, '1': false } as Record<string, boolean>,
};

vi.mock('@/stores/directions-store', () => ({
  useDirectionsStore: vi.fn((selector) =>
    selector({
      results: mockResults,
      inclineDeclineTotal: null,
      toggleShowOnMap: mockToggleShowOnMap,
      successful: true,
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

vi.mock('@/stores/common-store', () => ({
  useCommonStore: {
    getState: vi.fn(() => ({
      directionsPanelOpen: true,
      settingsPanelOpen: false,
    })),
  },
}));

const mockRouteCoordinates: number[][] = [
  [48.0, 10.0],
  [52.5, 13.4],
];

const createMockSummary = (
  overrides: Partial<SummaryType> = {}
): SummaryType => ({
  has_time_restrictions: false,
  has_toll: false,
  has_highway: false,
  has_ferry: false,
  min_lat: 48.0,
  min_lon: 10.0,
  max_lat: 52.5,
  max_lon: 13.4,
  time: 3600,
  length: 150.5,
  cost: 100,
  ...overrides,
});

describe('Summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.show = { '-1': true, '0': true, '1': false };

    vi.mocked(useDirectionsStore).mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (selector: any) =>
        selector({
          results: mockResults,
          inclineDeclineTotal: null,
          toggleShowOnMap: mockToggleShowOnMap,
          successful: true,
        })
    );

    Object.defineProperty(window, 'screen', {
      writable: true,
      value: { width: 1024 },
    });
  });

  it('should render without crashing', () => {
    const summary = createMockSummary();
    expect(() =>
      render(
        <Summary
          summary={summary}
          title="Main Route"
          index={-1}
          routeCoordinates={mockRouteCoordinates}
        />
      )
    ).not.toThrow();
  });

  it('should display route title', () => {
    const summary = createMockSummary();
    render(
      <Summary
        summary={summary}
        title="Main Route"
        index={-1}
        routeCoordinates={mockRouteCoordinates}
      />
    );

    expect(screen.getByText('Main Route')).toBeInTheDocument();
  });

  it('should display alternate route title', () => {
    const summary = createMockSummary();
    render(
      <Summary
        summary={summary}
        title="Alternate Route #1"
        index={0}
        routeCoordinates={mockRouteCoordinates}
      />
    );

    expect(screen.getByText('Alternate Route #1')).toBeInTheDocument();
  });

  it('should display "No route found" when summary is null', () => {
    render(
      <Summary
        summary={null as unknown as SummaryType}
        title="Route"
        index={-1}
        routeCoordinates={mockRouteCoordinates}
      />
    );

    expect(screen.getByText('No route found')).toBeInTheDocument();
  });

  it('should display route length in km', () => {
    const summary = createMockSummary({ length: 150.5 });
    render(
      <Summary
        summary={summary}
        title="Route"
        index={-1}
        routeCoordinates={mockRouteCoordinates}
      />
    );

    expect(screen.getByText('150.5 km')).toBeInTheDocument();
    expect(screen.getByText('Route length')).toBeInTheDocument();
  });

  it('should round length for values over 1000 km', () => {
    const summary = createMockSummary({ length: 1234.567 });
    render(
      <Summary
        summary={summary}
        title="Route"
        index={-1}
        routeCoordinates={mockRouteCoordinates}
      />
    );

    expect(screen.getByText('1235 km')).toBeInTheDocument();
  });

  it('should display route duration', () => {
    const summary = createMockSummary({ time: 3600 });
    render(
      <Summary
        summary={summary}
        title="Route"
        index={-1}
        routeCoordinates={mockRouteCoordinates}
      />
    );

    expect(screen.getByText('Route duration')).toBeInTheDocument();
  });

  it('should render show on map switch', () => {
    const summary = createMockSummary();
    render(
      <Summary
        summary={summary}
        title="Route"
        index={-1}
        routeCoordinates={mockRouteCoordinates}
      />
    );

    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('should have switch checked when show is true', () => {
    const summary = createMockSummary();
    render(
      <Summary
        summary={summary}
        title="Route"
        index={-1}
        routeCoordinates={mockRouteCoordinates}
      />
    );

    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('should have switch unchecked when show is false', () => {
    mockResults.show = { '-1': false };
    const summary = createMockSummary();
    render(
      <Summary
        summary={summary}
        title="Route"
        index={-1}
        routeCoordinates={mockRouteCoordinates}
      />
    );

    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('should call toggleShowOnMap when switch is toggled', async () => {
    const user = userEvent.setup();
    const summary = createMockSummary();
    render(
      <Summary
        summary={summary}
        title="Route"
        index={-1}
        routeCoordinates={mockRouteCoordinates}
      />
    );

    await user.click(screen.getByRole('switch'));

    expect(mockToggleShowOnMap).toHaveBeenCalledWith({ show: false, idx: -1 });
  });

  it('should call toggleShowOnMap with correct index for alternate', async () => {
    const user = userEvent.setup();
    const summary = createMockSummary();
    render(
      <Summary
        summary={summary}
        title="Alternate"
        index={0}
        routeCoordinates={mockRouteCoordinates}
      />
    );

    await user.click(screen.getByRole('switch'));

    expect(mockToggleShowOnMap).toHaveBeenCalledWith({ show: false, idx: 0 });
  });

  it('should display highway attribute when has_highway is true', () => {
    const summary = createMockSummary({ has_highway: true });
    render(
      <Summary
        summary={summary}
        title="Route"
        index={-1}
        routeCoordinates={mockRouteCoordinates}
      />
    );

    expect(screen.getByText('Route includes highway')).toBeInTheDocument();
  });

  it('should display ferry attribute when has_ferry is true', () => {
    const summary = createMockSummary({ has_ferry: true });
    render(
      <Summary
        summary={summary}
        title="Route"
        index={-1}
        routeCoordinates={mockRouteCoordinates}
      />
    );

    expect(screen.getByText('Route includes ferry')).toBeInTheDocument();
  });

  it('should display toll attribute when has_toll is true', () => {
    const summary = createMockSummary({ has_toll: true });
    render(
      <Summary
        summary={summary}
        title="Route"
        index={-1}
        routeCoordinates={mockRouteCoordinates}
      />
    );

    expect(screen.getByText('Route includes toll')).toBeInTheDocument();
  });

  it('should not display attributes when all are false', () => {
    const summary = createMockSummary({
      has_highway: false,
      has_ferry: false,
      has_toll: false,
    });
    render(
      <Summary
        summary={summary}
        title="Route"
        index={-1}
        routeCoordinates={mockRouteCoordinates}
      />
    );

    expect(
      screen.queryByText('Route includes highway')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Route includes ferry')).not.toBeInTheDocument();
    expect(screen.queryByText('Route includes toll')).not.toBeInTheDocument();
  });

  it('should render recenter button when successful is true', () => {
    const summary = createMockSummary();
    render(
      <Summary
        summary={summary}
        title="Route"
        index={-1}
        routeCoordinates={mockRouteCoordinates}
      />
    );

    expect(
      screen.getByRole('button', { name: /recenter route/i })
    ).toBeInTheDocument();
  });

  it('should not render recenter button when successful is false', async () => {
    vi.mocked(useDirectionsStore).mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (selector: any) =>
        selector({
          results: mockResults,
          inclineDeclineTotal: null,
          toggleShowOnMap: mockToggleShowOnMap,
          successful: false,
        })
    );

    const summary = createMockSummary();
    render(
      <Summary
        summary={summary}
        title="Route"
        index={-1}
        routeCoordinates={mockRouteCoordinates}
      />
    );

    expect(
      screen.queryByRole('button', { name: /recenter route/i })
    ).not.toBeInTheDocument();
  });

  it('should call fitBounds with correct bounds and padding when recenter is clicked', async () => {
    const user = userEvent.setup();
    const summary = createMockSummary();
    render(
      <Summary
        summary={summary}
        title="Route"
        index={-1}
        routeCoordinates={mockRouteCoordinates}
      />
    );

    await user.click(screen.getByRole('button', { name: /recenter route/i }));

    expect(mockFitBounds).toHaveBeenCalledWith(
      [
        [10.0, 48.0],
        [13.4, 52.5],
      ],
      expect.objectContaining({
        padding: expect.objectContaining({
          left: 420,
          right: 50,
          top: 50,
          bottom: 50,
        }),
        maxZoom: 18,
      })
    );
  });

  it('should not render recenter button after route is cleared', async () => {
    const { rerender } = render(
      <Summary
        summary={createMockSummary()}
        title="Route"
        index={-1}
        routeCoordinates={mockRouteCoordinates}
      />
    );

    expect(
      screen.getByRole('button', { name: /recenter route/i })
    ).toBeInTheDocument();

    vi.mocked(useDirectionsStore).mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (selector: any) =>
        selector({
          results: mockResults,
          inclineDeclineTotal: null,
          toggleShowOnMap: mockToggleShowOnMap,
          successful: false,
        })
    );

    rerender(
      <Summary
        summary={createMockSummary()}
        title="Route"
        index={-1}
        routeCoordinates={mockRouteCoordinates}
      />
    );

    expect(
      screen.queryByRole('button', { name: /recenter route/i })
    ).not.toBeInTheDocument();
  });
});

describe('Summary with incline/decline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display incline and decline when available', async () => {
    vi.mocked(useDirectionsStore).mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (selector: any) =>
        selector({
          results: { ...mockResults, data: null },
          inclineDeclineTotal: { inclineTotal: 500, declineTotal: 450 },
          toggleShowOnMap: mockToggleShowOnMap,
          successful: true,
        })
    );

    const summary = createMockSummary();
    render(
      <Summary
        summary={summary}
        title="Route"
        index={-1}
        routeCoordinates={mockRouteCoordinates}
      />
    );

    expect(screen.getByText('Total Incline')).toBeInTheDocument();
    expect(screen.getByText('500 m')).toBeInTheDocument();
    expect(screen.getByText('Total Decline')).toBeInTheDocument();
    expect(screen.getByText('450 m')).toBeInTheDocument();
  });
});
