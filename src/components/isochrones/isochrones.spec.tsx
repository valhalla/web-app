import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IsochronesControl } from './isochrones';

const mockNavigate = vi.fn();
const mockRefetchIsochrones = vi.fn();
const mockReverseGeocode = vi.fn().mockResolvedValue([]);
const mockFlyTo = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(() => mockNavigate),
}));

vi.mock('react-map-gl/maplibre', () => ({
  useMap: vi.fn(() => ({
    mainMap: {
      flyTo: mockFlyTo,
    },
  })),
}));

vi.mock('@/utils/parse-url-params', () => ({
  parseUrlParams: vi.fn(() => ({})),
}));

const mockResults = {
  data: null as null | {
    features: { properties: { contour: number; area: number } }[];
  },
  show: true,
};

const mockGeocodeResults: {
  selected: boolean;
  sourcelnglat: [number, number];
}[] = [];

vi.mock('@/stores/isochrones-store', () => ({
  useIsochronesStore: vi.fn((selector) =>
    selector({
      results: mockResults,
      geocodeResults: mockGeocodeResults,
    })
  ),
}));

vi.mock('@/hooks/use-isochrones-queries', () => ({
  useIsochronesQuery: vi.fn(() => ({
    refetch: mockRefetchIsochrones,
  })),
  useReverseGeocodeIsochrones: vi.fn(() => ({
    reverseGeocode: mockReverseGeocode,
  })),
}));

vi.mock('./waypoints', () => ({
  Waypoints: () => <div data-testid="mock-waypoints">Waypoints</div>,
}));

vi.mock('@/components/settings-footer', () => ({
  SettingsFooter: () => (
    <div data-testid="mock-settings-footer">Settings Footer</div>
  ),
}));

vi.mock('./isochrone-card', () => ({
  IsochroneCard: ({
    data,
    showOnMap,
  }: {
    data: unknown;
    showOnMap: boolean;
  }) => (
    <div data-testid="mock-isochrone-card" data-show-on-map={showOnMap}>
      Isochrone Card: {JSON.stringify(data)}
    </div>
  ),
}));

describe('IsochronesControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.data = null;
    mockGeocodeResults.length = 0;
  });

  it('should render without crashing', () => {
    expect(() => render(<IsochronesControl />)).not.toThrow();
  });

  it('should render Waypoints component', () => {
    render(<IsochronesControl />);
    expect(screen.getByTestId('mock-waypoints')).toBeInTheDocument();
  });

  it('should render SettingsFooter component', () => {
    render(<IsochronesControl />);
    expect(screen.getByTestId('mock-settings-footer')).toBeInTheDocument();
  });

  it('should not render IsochroneCard when no results', () => {
    render(<IsochronesControl />);
    expect(screen.queryByTestId('mock-isochrone-card')).not.toBeInTheDocument();
    expect(screen.queryByText('Isochrones')).not.toBeInTheDocument();
  });

  it('should render IsochroneCard when results exist', () => {
    mockResults.data = {
      features: [{ properties: { contour: 10, area: 5.5 } }],
    };

    render(<IsochronesControl />);

    expect(screen.getByText('Isochrones')).toBeInTheDocument();
    expect(screen.getByTestId('mock-isochrone-card')).toBeInTheDocument();
  });

  it('should pass correct props to IsochroneCard', () => {
    mockResults.data = {
      features: [{ properties: { contour: 15, area: 8.2 } }],
    };
    mockResults.show = false;

    render(<IsochronesControl />);

    const card = screen.getByTestId('mock-isochrone-card');
    expect(card).toHaveAttribute('data-show-on-map', 'false');
  });

  it('should sync geocode results to URL', () => {
    mockGeocodeResults.push({
      selected: true,
      sourcelnglat: [13.4, 52.5],
    });

    render(<IsochronesControl />);

    expect(mockNavigate).toHaveBeenCalledWith({
      search: expect.any(Function),
      replace: true,
    });
  });

  it('should call navigate with wps parameter when center exists', () => {
    mockGeocodeResults.push({
      selected: true,
      sourcelnglat: [13.4, 52.5],
    });

    render(<IsochronesControl />);

    expect(mockNavigate.mock.calls.length).toBeGreaterThan(0);
    const navigateCall = mockNavigate.mock.calls[0]?.[0] as {
      search: (prev: Record<string, unknown>) => Record<string, unknown>;
    };
    const searchFn = navigateCall.search;
    const result = searchFn({});

    expect(result.wps).toBe('13.4,52.5');
  });

  it('should call navigate with undefined wps when no center', () => {
    render(<IsochronesControl />);

    expect(mockNavigate.mock.calls.length).toBeGreaterThan(0);
    const navigateCall = mockNavigate.mock.calls[0]?.[0] as {
      search: (prev: Record<string, unknown>) => Record<string, unknown>;
    };
    const searchFn = navigateCall.search;
    const result = searchFn({ wps: 'old-value' });

    expect(result.wps).toBeUndefined();
  });

  it('should render container with proper structure', () => {
    render(<IsochronesControl />);

    const container = screen.getByTestId('mock-waypoints').parentElement;
    expect(container).toHaveClass(
      'flex',
      'flex-col',
      'gap-3',
      'border',
      'rounded-md',
      'p-2'
    );
  });
});

describe('IsochronesControl URL parsing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.data = null;
    mockGeocodeResults.length = 0;
  });

  it('should process URL params with valid coordinates', async () => {
    const parseUrlParams = await import('@/utils/parse-url-params');
    vi.mocked(parseUrlParams.parseUrlParams).mockReturnValue({
      wps: '13.4,52.5',
    });

    render(<IsochronesControl />);

    expect(mockReverseGeocode).toHaveBeenCalledWith(13.4, 52.5);
    expect(mockFlyTo).toHaveBeenCalledWith({
      center: [13.4, 52.5],
      zoom: 12,
    });
  });

  it('should skip invalid coordinates from URL', async () => {
    const parseUrlParams = await import('@/utils/parse-url-params');
    vi.mocked(parseUrlParams.parseUrlParams).mockReturnValue({
      wps: '999,999',
    });

    render(<IsochronesControl />);

    expect(mockReverseGeocode).not.toHaveBeenCalled();
  });

  it('should process URL params with valid coordinates where lng > 90 (Singapore)', async () => {
    const parseUrlParams = await import('@/utils/parse-url-params');
    vi.mocked(parseUrlParams.parseUrlParams).mockReturnValue({
      wps: '103.66492937866911,1.4827280571964963',
    });

    render(<IsochronesControl />);

    expect(mockReverseGeocode).toHaveBeenCalledWith(
      103.66492937866911,
      1.4827280571964963
    );
    expect(mockFlyTo).toHaveBeenCalledWith({
      center: [103.66492937866911, 1.4827280571964963],
      zoom: 12,
    });
  });
});
