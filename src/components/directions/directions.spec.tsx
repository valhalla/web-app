import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DirectionsControl } from './directions';

const mockNavigate = vi.fn();
const mockRefetchDirections = vi.fn();
const mockReverseGeocode = vi.fn().mockResolvedValue([]);
const mockAddEmptyWaypointToEnd = vi.fn();
const mockClearWaypoints = vi.fn();
const mockClearRoutes = vi.fn();
const mockUpdateDateTime = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(() => mockNavigate),
}));

vi.mock('@/utils/parse-url-params', () => ({
  parseUrlParams: vi.fn(() => ({})),
}));

const mockWaypoints = [
  { id: '0', geocodeResults: [], userInput: '' },
  { id: '1', geocodeResults: [], userInput: '' },
];

const mockResults = {
  data: null as null | {
    trip: { summary: unknown; legs: unknown[] };
    alternates?: unknown[];
  },
  show: { '-1': true },
};

const mockDateTime = { type: 0, value: '2024-01-01T12:00' };

vi.mock('@/stores/directions-store', () => ({
  defaultWaypoints: [
    { id: '0', geocodeResults: [], userInput: '' },
    { id: '1', geocodeResults: [], userInput: '' },
  ],
  useDirectionsStore: vi.fn((selector) =>
    selector({
      waypoints: mockWaypoints,
      results: mockResults,
      addEmptyWaypointToEnd: mockAddEmptyWaypointToEnd,
      clearWaypoints: mockClearWaypoints,
      clearRoutes: mockClearRoutes,
    })
  ),
}));

vi.mock('@/stores/common-store', () => ({
  useCommonStore: vi.fn((selector) =>
    selector({
      updateDateTime: mockUpdateDateTime,
      dateTime: mockDateTime,
    })
  ),
}));

vi.mock('@/hooks/use-directions-queries', () => ({
  useDirectionsQuery: vi.fn(() => ({
    refetch: mockRefetchDirections,
  })),
  useReverseGeocodeDirections: vi.fn(() => ({
    reverseGeocode: mockReverseGeocode,
  })),
}));

vi.mock('@/hooks/use-optimized-route-query', () => ({
  useOptimizedRouteQuery: vi.fn(() => ({
    optimizeRoute: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('./waypoints/waypoint-list', () => ({
  Waypoints: () => <div data-testid="mock-waypoints">Waypoints</div>,
}));

vi.mock('@/components/settings-footer', () => ({
  SettingsFooter: () => (
    <div data-testid="mock-settings-footer">Settings Footer</div>
  ),
}));

vi.mock('@/components/date-time-picker', () => ({
  DateTimePicker: ({
    onChange,
  }: {
    type: number;
    value: string;
    onChange: (field: string, value: string) => void;
  }) => (
    <div data-testid="mock-date-time-picker">
      <button
        data-testid="change-date-type"
        onClick={() => onChange('type', '1')}
      >
        Change Type
      </button>
      <button
        data-testid="change-date-value"
        onClick={() => onChange('value', '2024-01-02T10:00')}
      >
        Change Value
      </button>
    </div>
  ),
}));

vi.mock('./route-card', () => ({
  RouteCard: ({ data, index }: { data: unknown; index: number }) => (
    <div data-testid={`mock-route-card-${index}`}>
      Route Card {index}: {JSON.stringify(data)}
    </div>
  ),
}));

describe('DirectionsControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.data = null;
    mockWaypoints.length = 0;
    mockWaypoints.push(
      { id: '0', geocodeResults: [], userInput: '' },
      { id: '1', geocodeResults: [], userInput: '' }
    );
  });

  it('should render without crashing', () => {
    expect(() => render(<DirectionsControl />)).not.toThrow();
  });

  it('should render Waypoints component', () => {
    render(<DirectionsControl />);
    expect(screen.getByTestId('mock-waypoints')).toBeInTheDocument();
  });

  it('should render SettingsFooter component', () => {
    render(<DirectionsControl />);
    expect(screen.getByTestId('mock-settings-footer')).toBeInTheDocument();
  });

  it('should render DateTimePicker component', () => {
    render(<DirectionsControl />);
    expect(screen.getByTestId('mock-date-time-picker')).toBeInTheDocument();
  });

  it('should render Add Waypoint button', () => {
    render(<DirectionsControl />);
    expect(
      screen.getByRole('button', { name: /add waypoint/i })
    ).toBeInTheDocument();
  });

  it('should render Reset Waypoints button', () => {
    render(<DirectionsControl />);
    expect(
      screen.getByRole('button', { name: /reset waypoints/i })
    ).toBeInTheDocument();
  });

  it('should call addEmptyWaypointToEnd when Add Waypoint is clicked', async () => {
    const user = userEvent.setup();
    render(<DirectionsControl />);

    await user.click(screen.getByRole('button', { name: /add waypoint/i }));

    expect(mockAddEmptyWaypointToEnd).toHaveBeenCalled();
  });

  it('should call clearWaypoints and clearRoutes when Reset Waypoints is clicked', async () => {
    const user = userEvent.setup();
    mockWaypoints.length = 0;
    mockWaypoints.push(
      {
        id: '0',
        geocodeResults: [
          { selected: true, sourcelnglat: [13.4, 52.5] },
        ] as never[],
        userInput: 'Berlin',
      },
      { id: '1', geocodeResults: [], userInput: '' }
    );

    render(<DirectionsControl />);

    await user.click(screen.getByRole('button', { name: /reset waypoints/i }));

    expect(mockClearWaypoints).toHaveBeenCalled();
    expect(mockClearRoutes).toHaveBeenCalled();
  });

  it('should disable Reset Waypoints button when waypoints are default', () => {
    render(<DirectionsControl />);

    expect(
      screen.getByRole('button', { name: /reset waypoints/i })
    ).toBeDisabled();
  });

  it('should not render RouteCard when no results', () => {
    render(<DirectionsControl />);
    expect(screen.queryByTestId('mock-route-card--1')).not.toBeInTheDocument();
    expect(screen.queryByText('Directions')).not.toBeInTheDocument();
  });

  it('should render RouteCard when results exist', () => {
    mockResults.data = {
      trip: { summary: {}, legs: [] },
    };

    render(<DirectionsControl />);

    expect(screen.getByText('Directions')).toBeInTheDocument();
    expect(screen.getByTestId('mock-route-card--1')).toBeInTheDocument();
  });

  it('should render alternate routes when available', () => {
    mockResults.data = {
      trip: { summary: {}, legs: [] },
      alternates: [
        { id: 'alt-1', trip: { summary: {}, legs: [] } },
        { id: 'alt-2', trip: { summary: {}, legs: [] } },
      ],
    };

    render(<DirectionsControl />);

    expect(screen.getByTestId('mock-route-card--1')).toBeInTheDocument();
    expect(screen.getByTestId('mock-route-card-0')).toBeInTheDocument();
    expect(screen.getByTestId('mock-route-card-1')).toBeInTheDocument();
  });

  it('should call updateDateTime and refetchDirections when date type changes', async () => {
    const user = userEvent.setup();
    render(<DirectionsControl />);

    await user.click(screen.getByTestId('change-date-type'));

    expect(mockUpdateDateTime).toHaveBeenCalledWith('type', '1');
    expect(mockRefetchDirections).toHaveBeenCalled();
  });

  it('should call updateDateTime and refetchDirections when date value changes', async () => {
    const user = userEvent.setup();
    render(<DirectionsControl />);

    await user.click(screen.getByTestId('change-date-value'));

    expect(mockUpdateDateTime).toHaveBeenCalledWith(
      'value',
      '2024-01-02T10:00'
    );
    expect(mockRefetchDirections).toHaveBeenCalled();
  });

  it('should sync waypoints to URL', () => {
    mockWaypoints.length = 0;
    mockWaypoints.push(
      {
        id: '0',
        geocodeResults: [
          { selected: true, sourcelnglat: [13.4, 52.5] },
        ] as never[],
        userInput: 'Berlin',
      },
      {
        id: '1',
        geocodeResults: [
          { selected: true, sourcelnglat: [10.0, 48.0] },
        ] as never[],
        userInput: 'Munich',
      }
    );

    render(<DirectionsControl />);

    expect(mockNavigate).toHaveBeenCalledWith({
      search: expect.any(Function),
      replace: true,
    });

    const navigateCall = mockNavigate.mock.calls[0]?.[0] as {
      search: (prev: Record<string, unknown>) => Record<string, unknown>;
    };
    const searchFn = navigateCall.search;
    const result = searchFn({});

    expect(result.wps).toBe('13.4,52.5,10,48');
  });
});

describe('DirectionsControl URL parsing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.data = null;
    mockWaypoints.length = 0;
    mockWaypoints.push(
      { id: '0', geocodeResults: [], userInput: '' },
      { id: '1', geocodeResults: [], userInput: '' }
    );
  });

  it('should process URL params with valid coordinates (Berlin)', async () => {
    const parseUrlParams = await import('@/utils/parse-url-params');
    vi.mocked(parseUrlParams.parseUrlParams).mockReturnValue({
      wps: '13.365016850476763,52.483706198952575,13.422421655040836,52.49336042169804',
    });

    render(<DirectionsControl />);

    expect(mockReverseGeocode).toHaveBeenCalledTimes(2);
    expect(mockReverseGeocode).toHaveBeenCalledWith(
      13.365016850476763,
      52.483706198952575,
      0,
      { isPermalink: true }
    );
    expect(mockReverseGeocode).toHaveBeenCalledWith(
      13.422421655040836,
      52.49336042169804,
      1,
      { isPermalink: true }
    );
  });

  it('should process URL params with valid coordinates where lng > 90 (Singapore)', async () => {
    const parseUrlParams = await import('@/utils/parse-url-params');
    vi.mocked(parseUrlParams.parseUrlParams).mockReturnValue({
      wps: '103.66492937866911,1.4827280571964963,103.66421854954496,1.4840285187178779',
    });

    render(<DirectionsControl />);

    expect(mockReverseGeocode).toHaveBeenCalledTimes(2);
    expect(mockReverseGeocode).toHaveBeenCalledWith(
      103.66492937866911,
      1.4827280571964963,
      0,
      { isPermalink: true }
    );
    expect(mockReverseGeocode).toHaveBeenCalledWith(
      103.66421854954496,
      1.4840285187178779,
      1,
      { isPermalink: true }
    );
  });

  it('should skip truly invalid coordinates from URL', async () => {
    const parseUrlParams = await import('@/utils/parse-url-params');
    vi.mocked(parseUrlParams.parseUrlParams).mockReturnValue({
      wps: '999,999',
    });

    render(<DirectionsControl />);

    expect(mockReverseGeocode).not.toHaveBeenCalled();
  });

  it('should handle coordinates near edge of valid range', async () => {
    const parseUrlParams = await import('@/utils/parse-url-params');
    vi.mocked(parseUrlParams.parseUrlParams).mockReturnValue({
      wps: '179.9,89,-179.9,-89',
    });

    render(<DirectionsControl />);

    expect(mockReverseGeocode).toHaveBeenCalledTimes(2);
    expect(mockReverseGeocode).toHaveBeenCalledWith(179.9, 89, 0, {
      isPermalink: true,
    });
    expect(mockReverseGeocode).toHaveBeenCalledWith(-179.9, -89, 1, {
      isPermalink: true,
    });
  });
});
