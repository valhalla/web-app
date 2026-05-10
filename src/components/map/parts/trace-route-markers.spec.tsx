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
  inputShape = [] as Array<{ lat: number; lon: number; type?: string }>,
} = {}) => {
  mockUseTraceRouteStore.mockImplementation((selector) =>
    selector({
      inputShape,
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
      inputShape: [
        { lat: 52.5, lon: 13.4, type: 'break' },
        { lat: 52.6, lon: 13.5, type: 'break' },
      ],
    });

    const { container } = render(<TraceRouteMarkers />);
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when there are no break points', () => {
    setupStore({
      inputShape: [
        { lat: 52.5, lon: 13.4, type: 'via' },
        { lat: 52.6, lon: 13.5, type: 'through' },
      ],
    });

    const { container } = render(<TraceRouteMarkers />);
    expect(container.firstChild).toBeNull();
  });

  it('should render numbered markers for break points', () => {
    setupStore({
      inputShape: [
        { lat: 52.5, lon: 13.4, type: 'break' },
        { lat: 52.55, lon: 13.45, type: 'via' },
        { lat: 52.6, lon: 13.5, type: 'break' },
      ],
    });

    render(<TraceRouteMarkers />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
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
