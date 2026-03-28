import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { RouteLines } from './route-lines';

const mockSource = vi.fn();
const mockLayer = vi.fn();

vi.mock('react-map-gl/maplibre', () => ({
  Source: (props: Record<string, unknown>) => {
    mockSource(props);
    return <div data-testid="source">{props.children as React.ReactNode}</div>;
  },
  Layer: (props: Record<string, unknown>) => {
    mockLayer(props);
    return <div data-testid="layer" />;
  },
}));

const mockUseDirectionsStore = vi.fn();
const mockUseTraceRouteStore = vi.fn();
const mockUseParams = vi.hoisted(() =>
  vi.fn(() => ({ activeTab: 'directions' }))
);

vi.mock('@tanstack/react-router', () => ({
  useParams: mockUseParams,
}));

vi.mock('@/stores/directions-store', () => ({
  useDirectionsStore: (selector: (state: unknown) => unknown) =>
    mockUseDirectionsStore(selector),
}));

vi.mock('@/stores/trace-route-store', () => ({
  useTraceRouteStore: (selector: (state: unknown) => unknown) =>
    mockUseTraceRouteStore(selector),
}));

interface MockRouteGeometry {
  decodedGeometry: number[][];
  trip: {
    summary: {
      length: number;
      time: number;
    };
  };
  alternates: MockRouteGeometry[];
}

interface MockRouteState {
  results: {
    data: MockRouteGeometry | null;
    show: Record<number, boolean>;
  };
  successful: boolean;
  activeRouteIndex: number;
}

const createMockState = (
  overrides: Partial<MockRouteState> = {}
): MockRouteState => ({
  results: {
    data: {
      decodedGeometry: [
        [50, 10],
        [51, 11],
      ],
      trip: { summary: { length: 100, time: 3600 } },
      alternates: [],
    },
    show: { [-1]: true },
  },
  successful: true,
  activeRouteIndex: -1,
  ...overrides,
});

const setupStores = ({
  activeTab = 'directions',
  directionState = createMockState(),
  traceState = createMockState(),
}: {
  activeTab?: string;
  directionState?: MockRouteState;
  traceState?: MockRouteState;
} = {}) => {
  mockUseParams.mockReturnValue({ activeTab });
  mockUseDirectionsStore.mockImplementation((selector) =>
    selector(directionState)
  );
  mockUseTraceRouteStore.mockImplementation((selector) => selector(traceState));
};

describe('RouteLines', () => {
  beforeEach(() => {
    mockSource.mockClear();
    mockLayer.mockClear();
    mockUseDirectionsStore.mockClear();
    mockUseTraceRouteStore.mockClear();
    mockUseParams.mockReturnValue({ activeTab: 'directions' });
  });

  it('should render nothing when results data is null', () => {
    setupStores({
      directionState: {
        results: { data: null, show: {} },
        successful: false,
        activeRouteIndex: -1,
      },
    });

    const { container } = render(<RouteLines />);

    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when not successful', () => {
    setupStores({ directionState: createMockState({ successful: false }) });

    const { container } = render(<RouteLines />);

    expect(container.firstChild).toBeNull();
  });

  it('should render Source when data is valid', () => {
    setupStores();

    render(<RouteLines />);

    expect(mockSource).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'routes', type: 'geojson' })
    );
  });

  it('should render two layers (outline and line)', () => {
    setupStores();

    render(<RouteLines />);

    expect(mockLayer).toHaveBeenCalledTimes(2);
  });

  it('should render outline layer with white color', () => {
    setupStores();

    render(<RouteLines />);

    expect(mockLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'routes-outline',
        type: 'line',
        paint: { 'line-color': '#FFF', 'line-width': 9, 'line-opacity': 1 },
      })
    );
  });

  it('should render line layer with dynamic color', () => {
    setupStores();

    render(<RouteLines />);

    expect(mockLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'routes-line',
        type: 'line',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 5,
          'line-opacity': ['case', ['==', ['get', 'routeIndex'], -1], 1, 0.5],
        },
      })
    );
  });

  it('should convert lat/lng to lng/lat format', () => {
    setupStores();

    render(<RouteLines />);

    const sourceCall = mockSource.mock.calls[0]?.[0];
    const coords = sourceCall?.data.features[0].geometry.coordinates;
    expect(coords[0]).toEqual([10, 50]);
    expect(coords[1]).toEqual([11, 51]);
  });

  it('should use trace-route results when active tab is trace-route', () => {
    setupStores({
      activeTab: 'trace-route',
      directionState: {
        results: { data: null, show: {} },
        successful: false,
        activeRouteIndex: -1,
      },
      traceState: createMockState({
        activeRouteIndex: 0,
        results: {
          data: {
            decodedGeometry: [
              [1, 2],
              [3, 4],
            ],
            trip: { summary: { length: 2, time: 60 } },
            alternates: [],
          },
          show: { 0: true },
        },
      }),
    });

    render(<RouteLines />);

    const sourceCall = mockSource.mock.calls[0]?.[0];
    const coords = sourceCall?.data.features[0].geometry.coordinates;
    expect(coords).toEqual([
      [2, 1],
      [4, 3],
    ]);
  });
});
