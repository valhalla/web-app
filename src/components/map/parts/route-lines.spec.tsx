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

vi.mock('@/stores/directions-store', () => ({
  useDirectionsStore: (selector: (state: unknown) => unknown) =>
    mockUseDirectionsStore(selector),
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
  ...overrides,
});

describe('RouteLines', () => {
  beforeEach(() => {
    mockSource.mockClear();
    mockLayer.mockClear();
    mockUseDirectionsStore.mockClear();
  });

  it('should render nothing when results data is null', () => {
    mockUseDirectionsStore.mockImplementation((selector) => {
      const state = { results: { data: null, show: {} }, successful: false };
      return selector(state);
    });

    const { container } = render(<RouteLines />);

    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when not successful', () => {
    mockUseDirectionsStore.mockImplementation((selector) => {
      const state = createMockState({ successful: false });
      return selector(state);
    });

    const { container } = render(<RouteLines />);

    expect(container.firstChild).toBeNull();
  });

  it('should render Source when data is valid', () => {
    mockUseDirectionsStore.mockImplementation((selector) => {
      const state = createMockState();
      return selector(state);
    });

    render(<RouteLines />);

    expect(mockSource).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'routes', type: 'geojson' })
    );
  });

  it('should render two layers (outline and line)', () => {
    mockUseDirectionsStore.mockImplementation((selector) => {
      const state = createMockState();
      return selector(state);
    });

    render(<RouteLines />);

    expect(mockLayer).toHaveBeenCalledTimes(2);
  });

  it('should render outline layer with white color', () => {
    mockUseDirectionsStore.mockImplementation((selector) => {
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
    mockUseDirectionsStore.mockImplementation((selector) => {
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
          'line-opacity': 1,
        },
      })
    );
  });

  it('should convert lat/lng to lng/lat format', () => {
    mockUseDirectionsStore.mockImplementation((selector) => {
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
