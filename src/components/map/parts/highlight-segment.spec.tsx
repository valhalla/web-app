import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { HighlightSegment } from './highlight-segment';

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
        [52, 12],
        [53, 13],
      ],
      alternates: [],
    },
  },
  highlightSegment: {
    startIndex: 1,
    endIndex: 2,
    alternate: -1,
  },
  ...overrides,
});

describe('HighlightSegment', () => {
  beforeEach(() => {
    mockSource.mockClear();
    mockLayer.mockClear();
    mockUseDirectionsStore.mockClear();
  });

  it('should render nothing when highlightSegment is null', () => {
    mockUseDirectionsStore.mockImplementation((selector) => {
      const state = { results: { data: null }, highlightSegment: null };
      return selector(state);
    });

    const { container } = render(<HighlightSegment />);

    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when results data is null', () => {
    mockUseDirectionsStore.mockImplementation((selector) => {
      const state = {
        results: { data: null },
        highlightSegment: { startIndex: 0, endIndex: 1, alternate: -1 },
      };
      return selector(state);
    });

    const { container } = render(<HighlightSegment />);

    expect(container.firstChild).toBeNull();
  });

  it('should render Source when data is valid', () => {
    mockUseDirectionsStore.mockImplementation((selector) => {
      const state = createMockState();
      return selector(state);
    });

    render(<HighlightSegment />);

    expect(mockSource).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'highlight-segment', type: 'geojson' })
    );
  });

  it('should render Layer with yellow color', () => {
    mockUseDirectionsStore.mockImplementation((selector) => {
      const state = createMockState();
      return selector(state);
    });

    render(<HighlightSegment />);

    expect(mockLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'highlight-segment-line',
        type: 'line',
        paint: { 'line-color': 'yellow', 'line-width': 4, 'line-opacity': 1 },
      })
    );
  });

  it('should slice coordinates based on startIndex and endIndex', () => {
    mockUseDirectionsStore.mockImplementation((selector) => {
      const state = createMockState();
      return selector(state);
    });

    render(<HighlightSegment />);

    const sourceCall = mockSource.mock.calls[0]?.[0];
    const coords = sourceCall?.data.geometry.coordinates;
    expect(coords).toHaveLength(2);
    expect(coords[0]).toEqual([11, 51]);
    expect(coords[1]).toEqual([12, 52]);
  });

  it('should render nothing when startIndex is -1', () => {
    mockUseDirectionsStore.mockImplementation((selector) => {
      const state = createMockState({
        highlightSegment: { startIndex: -1, endIndex: 2, alternate: -1 },
      });
      return selector(state);
    });

    const { container } = render(<HighlightSegment />);

    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when endIndex is -1', () => {
    mockUseDirectionsStore.mockImplementation((selector) => {
      const state = createMockState({
        highlightSegment: { startIndex: 0, endIndex: -1, alternate: -1 },
      });
      return selector(state);
    });

    const { container } = render(<HighlightSegment />);

    expect(container.firstChild).toBeNull();
  });
});
