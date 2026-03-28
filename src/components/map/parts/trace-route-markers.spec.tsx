import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TraceRouteMarkers } from './trace-route-markers';

const mockUseParams = vi.hoisted(() =>
  vi.fn(() => ({ activeTab: 'trace-route' }))
);
const mockUseTraceRouteStore = vi.fn();
const mockMarker = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useParams: mockUseParams,
}));

vi.mock('react-map-gl/maplibre', () => ({
  Marker: (props: Record<string, unknown>) => {
    mockMarker(props);
    return <div data-testid="marker">{props.children as React.ReactNode}</div>;
  },
}));

vi.mock('@/stores/trace-route-store', () => ({
  useTraceRouteStore: (selector: (state: unknown) => unknown) =>
    mockUseTraceRouteStore(selector),
}));

const setupStore = ({
  successful = true,
  locations = [] as unknown[],
} = {}) => {
  mockUseTraceRouteStore.mockImplementation((selector) =>
    selector({
      successful,
      results: {
        data: {
          trip: {
            locations,
          },
        },
      },
    })
  );
};

describe('TraceRouteMarkers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ activeTab: 'trace-route' });
  });

  it('should render nothing outside trace-route tab', () => {
    mockUseParams.mockReturnValue({ activeTab: 'directions' });
    setupStore({
      successful: true,
      locations: [
        { lat: 52.5, lon: 13.4 },
        { lat: 52.6, lon: 13.5 },
      ],
    });

    const { container } = render(<TraceRouteMarkers />);
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when trace route is not successful', () => {
    setupStore({
      successful: false,
      locations: [
        { lat: 52.5, lon: 13.4 },
        { lat: 52.6, lon: 13.5 },
      ],
    });

    const { container } = render(<TraceRouteMarkers />);
    expect(container.firstChild).toBeNull();
  });

  it('should render start and end markers when successful data exists', () => {
    setupStore({
      successful: true,
      locations: [
        { lat: 52.5, lon: 13.4 },
        { lat: 52.6, lon: 13.5 },
      ],
    });

    render(<TraceRouteMarkers />);

    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(mockMarker).toHaveBeenCalledTimes(2);
    expect(mockMarker).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ longitude: 13.4, latitude: 52.5 })
    );
    expect(mockMarker).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ longitude: 13.5, latitude: 52.6 })
    );
  });
});
