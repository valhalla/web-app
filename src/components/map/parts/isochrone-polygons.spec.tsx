import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { IsochronePolygons } from './isochrone-polygons';

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

const mockUseIsochronesStore = vi.fn();

vi.mock('@/stores/isochrones-store', () => ({
  useIsochronesStore: (selector: (state: unknown) => unknown) =>
    mockUseIsochronesStore(selector),
}));

const createMockState = (overrides = {}) => ({
  results: {
    data: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [1, 0],
                [1, 1],
                [0, 1],
                [0, 0],
              ],
            ],
          },
          properties: { fill: '#ff0000' },
        },
      ],
    },
    show: true,
  },
  successful: true,
  ...overrides,
});

describe('IsochronePolygons', () => {
  beforeEach(() => {
    mockSource.mockClear();
    mockLayer.mockClear();
    mockUseIsochronesStore.mockClear();
  });

  it('should render nothing when results is null', () => {
    mockUseIsochronesStore.mockImplementation((selector) => {
      const state = { results: null, successful: false };
      return selector(state);
    });

    const { container } = render(<IsochronePolygons />);

    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when not successful', () => {
    mockUseIsochronesStore.mockImplementation((selector) => {
      const state = createMockState({ successful: false });
      return selector(state);
    });

    const { container } = render(<IsochronePolygons />);

    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when show is false', () => {
    mockUseIsochronesStore.mockImplementation((selector) => {
      const state = createMockState({
        results: { ...createMockState().results, show: false },
      });
      return selector(state);
    });

    const { container } = render(<IsochronePolygons />);

    expect(container.firstChild).toBeNull();
  });

  it('should render Source when data is valid', () => {
    mockUseIsochronesStore.mockImplementation((selector) => {
      const state = createMockState();
      return selector(state);
    });

    render(<IsochronePolygons />);

    expect(mockSource).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'isochrones', type: 'geojson' })
    );
  });

  it('should render two layers (fill and outline)', () => {
    mockUseIsochronesStore.mockImplementation((selector) => {
      const state = createMockState();
      return selector(state);
    });

    render(<IsochronePolygons />);

    expect(mockLayer).toHaveBeenCalledTimes(2);
  });

  it('should render fill layer with correct paint', () => {
    mockUseIsochronesStore.mockImplementation((selector) => {
      const state = createMockState();
      return selector(state);
    });

    render(<IsochronePolygons />);

    expect(mockLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'isochrones-fill',
        type: 'fill',
        paint: { 'fill-color': ['get', 'fill'], 'fill-opacity': 0.4 },
      })
    );
  });

  it('should render outline layer with correct paint', () => {
    mockUseIsochronesStore.mockImplementation((selector) => {
      const state = createMockState();
      return selector(state);
    });

    render(<IsochronePolygons />);

    expect(mockLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'isochrones-outline',
        type: 'line',
        paint: { 'line-color': '#fff', 'line-width': 1, 'line-opacity': 1 },
      })
    );
  });

  it('should filter only Polygon and MultiPolygon features', () => {
    mockUseIsochronesStore.mockImplementation((selector) => {
      const state = {
        results: {
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: { type: 'Polygon', coordinates: [] },
                properties: { fill: '#ff0000' },
              },
              {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [0, 0] },
                properties: { type: 'snapped' },
              },
            ],
          },
          show: true,
        },
        successful: true,
      };
      return selector(state);
    });

    render(<IsochronePolygons />);

    const sourceCall = mockSource.mock.calls[0]?.[0];
    expect(sourceCall?.data.features).toHaveLength(1);
    expect(sourceCall?.data.features[0].geometry.type).toBe('Polygon');
  });
});
