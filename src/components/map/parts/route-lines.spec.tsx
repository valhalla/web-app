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

const mockUseActiveRouteStore = vi.fn();

vi.mock('@/hooks/use-active-route-store', () => ({
  useActiveRouteStore: (selector: (state: unknown) => unknown) =>
    mockUseActiveRouteStore(selector),
}));

const createMockState = (overrides = {}) => ({
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

describe('RouteLines', () => {
  beforeEach(() => {
    mockSource.mockClear();
    mockLayer.mockClear();
    mockUseActiveRouteStore.mockClear();
  });

  it('should render nothing when results data is null', () => {
    mockUseActiveRouteStore.mockImplementation((selector) => {
      const state = { results: { data: null, show: {} }, successful: false };
      return selector(state);
    });

    const { container } = render(<RouteLines />);

    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when not successful', () => {
    mockUseActiveRouteStore.mockImplementation((selector) => {
      const state = createMockState({ successful: false });
      return selector(state);
    });

    const { container } = render(<RouteLines />);

    expect(container.firstChild).toBeNull();
  });

  it('should render Source when data is valid', () => {
    mockUseActiveRouteStore.mockImplementation((selector) => {
      const state = createMockState();
      return selector(state);
    });

    render(<RouteLines />);

    expect(mockSource).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'routes', type: 'geojson' })
    );
  });

  it('should render three layers (outline, line, hit-target)', () => {
    mockUseActiveRouteStore.mockImplementation((selector) => {
      const state = createMockState();
      return selector(state);
    });

    render(<RouteLines />);

    expect(mockLayer).toHaveBeenCalledTimes(3);
    expect(mockLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'routes-hit-target' })
    );
  });

  it('should render outline layer with white color', () => {
    mockUseActiveRouteStore.mockImplementation((selector) => {
      const state = createMockState();
      return selector(state);
    });

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
    mockUseActiveRouteStore.mockImplementation((selector) => {
      const state = createMockState();
      return selector(state);
    });

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
    mockUseActiveRouteStore.mockImplementation((selector) => {
      const state = createMockState();
      return selector(state);
    });

    render(<RouteLines />);

    const sourceCall = mockSource.mock.calls[0]?.[0];
    const coords = sourceCall?.data.features[0].geometry.coordinates;
    expect(coords[0]).toEqual([10, 50]);
    expect(coords[1]).toEqual([11, 51]);
  });
});
