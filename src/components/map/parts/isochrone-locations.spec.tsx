import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { IsochroneLocations } from './isochrone-locations';

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
          geometry: { type: 'Point', coordinates: [10, 50] },
          properties: { type: 'snapped' },
        },
      ],
    },
    show: true,
  },
  successful: true,
  ...overrides,
});

describe('IsochroneLocations', () => {
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

    const { container } = render(<IsochroneLocations />);

    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when not successful', () => {
    mockUseIsochronesStore.mockImplementation((selector) => {
      const state = createMockState({ successful: false });
      return selector(state);
    });

    const { container } = render(<IsochroneLocations />);

    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when show is false', () => {
    mockUseIsochronesStore.mockImplementation((selector) => {
      const state = createMockState({
        results: { ...createMockState().results, show: false },
      });
      return selector(state);
    });

    const { container } = render(<IsochroneLocations />);

    expect(container.firstChild).toBeNull();
  });

  it('should render Source when data is valid', () => {
    mockUseIsochronesStore.mockImplementation((selector) => {
      const state = createMockState();
      return selector(state);
    });

    render(<IsochroneLocations />);

    expect(mockSource).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'iso-locations', type: 'geojson' })
    );
  });

  it('should render Layer with circle type', () => {
    mockUseIsochronesStore.mockImplementation((selector) => {
      const state = createMockState();
      return selector(state);
    });

    render(<IsochroneLocations />);

    expect(mockLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'iso-locations-circle',
        type: 'circle',
      })
    );
  });

  it('should render Layer with correct paint properties', () => {
    mockUseIsochronesStore.mockImplementation((selector) => {
      const state = createMockState();
      return selector(state);
    });

    render(<IsochroneLocations />);

    expect(mockLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        paint: {
          'circle-radius': 6,
          'circle-color': '#fff',
          'circle-stroke-color': '#000',
          'circle-stroke-width': 2,
        },
      })
    );
  });

  it('should filter out Polygon features', () => {
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

    render(<IsochroneLocations />);

    const sourceCall = mockSource.mock.calls[0]?.[0];
    expect(sourceCall?.data.features).toHaveLength(1);
    expect(sourceCall?.data.features[0].geometry.type).toBe('Point');
  });

  it('should filter out input type features', () => {
    mockUseIsochronesStore.mockImplementation((selector) => {
      const state = {
        results: {
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [0, 0] },
                properties: { type: 'input' },
              },
              {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [1, 1] },
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

    render(<IsochroneLocations />);

    const sourceCall = mockSource.mock.calls[0]?.[0];
    expect(sourceCall?.data.features).toHaveLength(1);
    expect(sourceCall?.data.features[0].properties.type).toBe('snapped');
  });
});
