import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { TraceRouteInputLine } from './trace-input-line';

const mockSource = vi.fn();
const mockLayer = vi.fn();
const mockUseParams = vi.hoisted(() =>
  vi.fn(() => ({ activeTab: 'trace-route' }))
);
const mockUseTraceRouteStore = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useParams: mockUseParams,
}));

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

vi.mock('@/stores/trace-route-store', () => ({
  useTraceRouteStore: (selector: (state: unknown) => unknown) =>
    mockUseTraceRouteStore(selector),
}));

const setupStore = (inputGeometry: number[][] | null) => {
  mockUseTraceRouteStore.mockImplementation((selector) =>
    selector({ inputGeometry })
  );
};

describe('TraceRouteInputLine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ activeTab: 'trace-route' });
  });

  it('should render nothing when not on trace-route tab', () => {
    mockUseParams.mockReturnValue({ activeTab: 'directions' });
    setupStore([
      [10, 20],
      [11, 21],
    ]);

    const { container } = render(<TraceRouteInputLine />);

    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when input geometry has less than 2 points', () => {
    setupStore([[10, 20]]);

    const { container } = render(<TraceRouteInputLine />);

    expect(container.firstChild).toBeNull();
  });

  it('should render source and layer for valid trace input geometry', () => {
    setupStore([
      [10, 20],
      [11, 21],
    ]);

    render(<TraceRouteInputLine />);

    expect(mockSource).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'trace-input', type: 'geojson' })
    );
    expect(mockLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'trace-input-line', type: 'line' })
    );

    const sourceCall = mockSource.mock.calls[0]?.[0];
    expect(sourceCall?.data.features[0].geometry.coordinates).toEqual([
      [20, 10],
      [21, 11],
    ]);
  });

  it('should filter invalid points and return null if fewer than 2 valid remain', () => {
    setupStore([
      [10, 20],
      [Number.NaN, 21],
    ]);

    const { container } = render(<TraceRouteInputLine />);

    expect(container.firstChild).toBeNull();
  });
});
