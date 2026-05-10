import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './app';

type MockSearch = {
  wps?: string;
};

type MockWaypoint = {
  id: string;
  geocodeResults: Array<{
    selected?: boolean;
    sourcelnglat?: [number, number];
  }>;
  userInput: string;
};

const mockUseParams = vi.fn(() => ({ activeTab: 'directions' }));
const mockUseSearch = vi.fn<() => MockSearch>(() => ({ wps: undefined }));
const mockRefetchDirections = vi.fn().mockResolvedValue(undefined);
const mockReverseGeocode = vi.fn().mockResolvedValue([]);
let mockMapReady = true;
let mockWaypoints: MockWaypoint[] = [
  { id: '0', geocodeResults: [], userInput: '' },
  { id: '1', geocodeResults: [], userInput: '' },
];

vi.mock('@tanstack/react-router', () => ({
  useParams: () => mockUseParams(),
  useSearch: () => mockUseSearch(),
}));

vi.mock('react-map-gl/maplibre', () => ({
  MapProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-provider">{children}</div>
  ),
}));

vi.mock('./components/map', () => ({
  MapComponent: () => <div data-testid="map-component">MapComponent</div>,
}));

vi.mock('./components/route-planner', () => ({
  RoutePlanner: () => <div data-testid="route-planner">RoutePlanner</div>,
}));

vi.mock('./components/settings-panel/settings-panel', () => ({
  SettingsPanel: () => <div data-testid="settings-panel">SettingsPanel</div>,
}));

vi.mock('@/components/ui/sonner', () => ({
  Toaster: ({ position, duration }: { position: string; duration: number }) => (
    <div
      data-testid="toaster"
      data-position={position}
      data-duration={duration}
    >
      Toaster
    </div>
  ),
}));

vi.mock('@/hooks/use-directions-queries', () => ({
  useDirectionsQuery: () => ({
    refetch: mockRefetchDirections,
  }),
  useReverseGeocodeDirections: () => ({
    reverseGeocode: mockReverseGeocode,
  }),
}));

vi.mock('@/stores/common-store', () => ({
  useCommonStore: (selector: (state: { mapReady: boolean }) => unknown) =>
    selector({ mapReady: mockMapReady }),
}));

vi.mock('@/stores/directions-store', () => ({
  useDirectionsStore: (
    selector: (state: { waypoints: typeof mockWaypoints }) => unknown
  ) => selector({ waypoints: mockWaypoints }),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ activeTab: 'directions' });
    mockUseSearch.mockReturnValue({ wps: undefined });
    mockMapReady = true;
    mockWaypoints = [
      { id: '0', geocodeResults: [], userInput: '' },
      { id: '1', geocodeResults: [], userInput: '' },
    ];
  });

  it('should render without crashing', () => {
    expect(() => render(<App />)).not.toThrow();
  });

  it('should render MapProvider as wrapper', () => {
    render(<App />);
    expect(screen.getByTestId('map-provider')).toBeInTheDocument();
  });

  it('should render MapComponent', () => {
    render(<App />);
    expect(screen.getByTestId('map-component')).toBeInTheDocument();
  });

  it('should render RoutePlanner', () => {
    render(<App />);
    expect(screen.getByTestId('route-planner')).toBeInTheDocument();
  });

  it('should render SettingsPanel', () => {
    render(<App />);
    expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
  });

  it('should render Toaster with correct props', () => {
    render(<App />);
    const toaster = screen.getByTestId('toaster');
    expect(toaster).toBeInTheDocument();
    expect(toaster).toHaveAttribute('data-position', 'bottom-center');
    expect(toaster).toHaveAttribute('data-duration', '5000');
  });

  it('should render all components inside MapProvider', () => {
    render(<App />);
    const mapProvider = screen.getByTestId('map-provider');
    expect(mapProvider).toContainElement(screen.getByTestId('map-component'));
    expect(mapProvider).toContainElement(screen.getByTestId('route-planner'));
    expect(mapProvider).toContainElement(screen.getByTestId('settings-panel'));
    expect(mapProvider).toContainElement(screen.getByTestId('toaster'));
  });

  it('should hydrate waypoints from URL search params on initial load', () => {
    mockUseSearch.mockReturnValue({
      wps: '13.343067169189455,52.5296422146409,13.33414077758789,52.50901237642168',
    });

    render(<App />);

    expect(mockReverseGeocode).toHaveBeenCalledTimes(2);
    expect(mockReverseGeocode).toHaveBeenNthCalledWith(
      1,
      13.343067169189455,
      52.5296422146409,
      0,
      { isPermalink: true }
    );
    expect(mockReverseGeocode).toHaveBeenNthCalledWith(
      2,
      13.33414077758789,
      52.50901237642168,
      1,
      { isPermalink: true }
    );
  });

  it('should auto-render directions when URL waypoints already exist in state', () => {
    mockUseSearch.mockReturnValue({
      wps: '13.343067169189455,52.5296422146409,13.33414077758789,52.50901237642168',
    });
    mockWaypoints = [
      {
        id: '0',
        geocodeResults: [
          {
            selected: true,
            sourcelnglat: [13.343067169189455, 52.5296422146409],
          },
        ],
        userInput: 'Waypoint 1',
      },
      {
        id: '1',
        geocodeResults: [
          {
            selected: true,
            sourcelnglat: [13.33414077758789, 52.50901237642168],
          },
        ],
        userInput: 'Waypoint 2',
      },
    ];

    render(<App />);

    expect(mockRefetchDirections).toHaveBeenCalledTimes(1);
  });
});
