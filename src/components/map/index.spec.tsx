import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapComponent } from './index';

const mockToast = vi.hoisted(() => ({
  error: vi.fn(),
}));

const mockMapRef = {
  getCenter: vi.fn(() => ({ lng: 13.4, lat: 52.5 })),
  getZoom: vi.fn(() => 10),
  fitBounds: vi.fn(),
  getMap: vi.fn(() => ({
    getCanvas: vi.fn(() => ({ style: { cursor: '' } })),
  })),
};

vi.mock('react-map-gl/maplibre', () => ({
  Map: vi.fn(({ children, onClick, onContextMenu, ...props }) => (
    <div
      data-testid="map"
      data-longitude={props.longitude}
      data-latitude={props.latitude}
      data-zoom={props.zoom}
      onClick={() => {
        onClick?.({
          lngLat: { lng: 13.4, lat: 52.5 },
          point: { x: 100, y: 100 },
        });
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.({
          lngLat: { lng: 13.4, lat: 52.5 },
          point: { x: 100, y: 100 },
        });
      }}
    >
      {children}
    </div>
  )),
  Marker: vi.fn(({ children, longitude, latitude }) => (
    <div data-testid="marker" data-lng={longitude} data-lat={latitude}>
      {children}
    </div>
  )),
  Popup: vi.fn(({ children }) => <div data-testid="popup">{children}</div>),
  NavigationControl: vi.fn(() => (
    <div data-testid="navigation-control">Nav</div>
  )),
  GeolocateControl: vi.fn(({ onError }) => (
    <div data-testid="geolocate-control">
      <button
        data-testid="trigger-geolocate-error"
        onClick={() => onError?.({ PERMISSION_DENIED: false })}
      >
        Trigger Error
      </button>
      <button
        data-testid="trigger-geolocate-permission-denied"
        onClick={() => onError?.({ PERMISSION_DENIED: true })}
      >
        Trigger Permission Denied
      </button>
    </div>
  )),
  useMap: vi.fn(() => ({ current: mockMapRef })),
}));

vi.mock('@tanstack/react-router', () => ({
  useParams: vi.fn(() => ({ activeTab: 'directions' })),
  useSearch: vi.fn(() => ({ profile: 'bicycle', style: undefined })),
}));

vi.mock('@/stores/common-store', () => ({
  useCommonStore: vi.fn((selector) => {
    const state = {
      coordinates: [],
      directionsPanelOpen: true,
      settingsPanelOpen: false,
      updateSettings: vi.fn(),
    };
    return selector(state);
  }),
}));

vi.mock('@/stores/directions-store', () => ({
  useDirectionsStore: vi.fn((selector) => {
    const state = {
      waypoints: [],
      results: { data: null, show: {} },
      successful: false,
      updateInclineDecline: vi.fn(),
    };
    return selector(state);
  }),
}));

vi.mock('@/stores/isochrones-store', () => ({
  useIsochronesStore: vi.fn((selector) => {
    const state = {
      geocodeResults: [],
    };
    return selector(state);
  }),
}));

vi.mock('@/hooks/use-directions-queries', () => ({
  useDirectionsQuery: vi.fn(() => ({
    refetch: vi.fn(),
  })),
  useReverseGeocodeDirections: vi.fn(() => ({
    reverseGeocode: vi.fn().mockResolvedValue([]),
  })),
}));

vi.mock('@/hooks/use-isochrones-queries', () => ({
  useIsochronesQuery: vi.fn(() => ({
    refetch: vi.fn(),
  })),
  useReverseGeocodeIsochrones: vi.fn(() => ({
    reverseGeocode: vi.fn().mockResolvedValue([]),
  })),
}));

vi.mock('./map-style-control', () => ({
  MapStyleControl: vi.fn(() => (
    <div data-testid="map-style-control">Style Control</div>
  )),
}));

vi.mock('./draw-control', () => ({
  DrawControl: vi.fn(() => <div data-testid="draw-control">Draw Control</div>),
}));

vi.mock('./parts/route-lines', () => ({
  RouteLines: vi.fn(() => <div data-testid="route-lines">Route Lines</div>),
}));

vi.mock('./parts/highlight-segment', () => ({
  HighlightSegment: vi.fn(() => (
    <div data-testid="highlight-segment">Highlight</div>
  )),
}));

vi.mock('./parts/isochrone-polygons', () => ({
  IsochronePolygons: vi.fn(() => (
    <div data-testid="isochrone-polygons">Isochrone</div>
  )),
}));

vi.mock('./parts/isochrone-locations', () => ({
  IsochroneLocations: vi.fn(() => (
    <div data-testid="isochrone-locations">Locations</div>
  )),
}));

vi.mock('./parts/heightgraph-hover-marker', () => ({
  HeightgraphHoverMarker: vi.fn(() => (
    <div data-testid="heightgraph-hover-marker">Hover Marker</div>
  )),
}));

vi.mock('./parts/brand-logos', () => ({
  BrandLogos: vi.fn(() => <div data-testid="brand-logos">Logos</div>),
}));

vi.mock('./parts/map-info-popup', () => ({
  MapInfoPopup: vi.fn(({ onClose }) => (
    <div data-testid="map-info-popup">
      <button onClick={onClose}>Close</button>
    </div>
  )),
}));

vi.mock('./parts/map-context-menu', () => ({
  MapContextMenu: vi.fn(({ onAddWaypoint }) => (
    <div data-testid="map-context-menu">
      <button onClick={() => onAddWaypoint(0)}>Add Waypoint</button>
    </div>
  )),
}));

vi.mock('./parts/route-hover-popup', () => ({
  RouteHoverPopup: vi.fn(() => (
    <div data-testid="route-hover-popup">Hover</div>
  )),
}));

vi.mock('./parts/marker-icon', () => ({
  MarkerIcon: vi.fn(({ color, number }) => (
    <div data-testid="marker-icon" data-color={color} data-number={number}>
      Marker
    </div>
  )),
}));

vi.mock('@/components/heightgraph', () => ({
  default: vi.fn(() => <div data-testid="heightgraph">HeightGraph</div>),
}));

vi.mock('./utils', () => ({
  getInitialMapStyle: vi.fn(() => 'shortbread'),
  getCustomStyle: vi.fn(() => null),
  getMapStyleUrl: vi.fn((style: string) => `https://example.com/${style}.json`),
  getInitialMapPosition: vi.fn(() => ({
    center: [13.4, 52.5],
    zoom: 10,
  })),
  LAST_CENTER_KEY: 'last_center',
}));

vi.mock('./constants', () => ({
  DEFAULT_MAP_STYLE_ID: 'shortbread',
  maxBounds: undefined,
}));

vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: { height: [100] } }),
  },
}));

vi.mock('@/utils/valhalla', () => ({
  VALHALLA_OSM_URL: 'https://valhalla.example.com',
  buildHeightRequest: vi.fn(() => ({})),
  buildLocateRequest: vi.fn(() => ({})),
}));

vi.mock('@/utils/heightgraph', () => ({
  buildHeightgraphData: vi.fn(() => []),
}));

vi.mock('sonner', () => ({
  toast: mockToast,
}));

describe('MapComponent', () => {
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
      (key: string, value: string) => {
        localStorageMock[key] = value;
      }
    );
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
      (key: string) => localStorageMock[key] ?? null
    );

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render without crashing', () => {
    expect(() => render(<MapComponent />)).not.toThrow();
  });

  it('should render the map container', () => {
    render(<MapComponent />);
    expect(screen.getByTestId('map')).toBeInTheDocument();
  });

  it('should render navigation control', () => {
    render(<MapComponent />);
    expect(screen.getByTestId('navigation-control')).toBeInTheDocument();
  });

  it('should render geolocate control', () => {
    render(<MapComponent />);
    expect(screen.getByTestId('geolocate-control')).toBeInTheDocument();
  });

  it('should render draw control', () => {
    render(<MapComponent />);
    expect(screen.getByTestId('draw-control')).toBeInTheDocument();
  });

  it('should render map style control', () => {
    render(<MapComponent />);
    expect(screen.getByTestId('map-style-control')).toBeInTheDocument();
  });

  it('should render route lines component', () => {
    render(<MapComponent />);
    expect(screen.getByTestId('route-lines')).toBeInTheDocument();
  });

  it('should render highlight segment component', () => {
    render(<MapComponent />);
    expect(screen.getByTestId('highlight-segment')).toBeInTheDocument();
  });

  it('should render isochrone polygons component', () => {
    render(<MapComponent />);
    expect(screen.getByTestId('isochrone-polygons')).toBeInTheDocument();
  });

  it('should render isochrone locations component', () => {
    render(<MapComponent />);
    expect(screen.getByTestId('isochrone-locations')).toBeInTheDocument();
  });

  it('should render brand logos', () => {
    render(<MapComponent />);
    expect(screen.getByTestId('brand-logos')).toBeInTheDocument();
  });

  it('should render heightgraph hover marker', () => {
    render(<MapComponent />);
    expect(screen.getByTestId('heightgraph-hover-marker')).toBeInTheDocument();
  });

  it('should render Open OSM button', () => {
    render(<MapComponent />);
    expect(
      screen.getByRole('button', { name: 'Open OSM' })
    ).toBeInTheDocument();
  });

  it('should have Open OSM button that can be clicked', async () => {
    const user = userEvent.setup();
    render(<MapComponent />);

    const osmButton = screen.getByRole('button', { name: 'Open OSM' });
    expect(osmButton).toBeInTheDocument();

    await user.click(osmButton);
  });

  it('should show info popup on map click', async () => {
    render(<MapComponent />);

    fireEvent.click(screen.getByTestId('map'));

    await waitFor(() => {
      expect(screen.getByTestId('popup')).toBeInTheDocument();
      expect(screen.getByTestId('map-info-popup')).toBeInTheDocument();
    });
  });

  it('should show context menu on right click', async () => {
    render(<MapComponent />);

    fireEvent.contextMenu(screen.getByTestId('map'));

    await waitFor(() => {
      expect(screen.getByTestId('popup')).toBeInTheDocument();
      expect(screen.getByTestId('map-context-menu')).toBeInTheDocument();
    });
  });

  it('should close info popup when close is triggered', async () => {
    const user = userEvent.setup();
    render(<MapComponent />);

    fireEvent.click(screen.getByTestId('map'));

    await waitFor(() => {
      expect(screen.getByTestId('map-info-popup')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => {
      expect(screen.queryByTestId('map-info-popup')).not.toBeInTheDocument();
    });
  });

  it('should not show heightgraph when directions are not successful', () => {
    render(<MapComponent />);
    expect(screen.queryByTestId('heightgraph')).not.toBeInTheDocument();
  });

  it('should set initial view state from getInitialMapPosition', () => {
    render(<MapComponent />);
    const map = screen.getByTestId('map');

    expect(map).toHaveAttribute('data-longitude', '13.4');
    expect(map).toHaveAttribute('data-latitude', '52.5');
    expect(map).toHaveAttribute('data-zoom', '10');
  });

  it('should close context popup when clicking on map again', async () => {
    render(<MapComponent />);

    fireEvent.contextMenu(screen.getByTestId('map'));

    await waitFor(() => {
      expect(screen.getByTestId('map-context-menu')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('map'));

    await waitFor(() => {
      expect(screen.queryByTestId('map-context-menu')).not.toBeInTheDocument();
    });
  });

  it('should close info popup when clicking on map again', async () => {
    render(<MapComponent />);

    fireEvent.click(screen.getByTestId('map'));

    await waitFor(() => {
      expect(screen.getByTestId('map-info-popup')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('map'));

    await waitFor(() => {
      expect(screen.queryByTestId('map-info-popup')).not.toBeInTheDocument();
    });
  });

  describe('GeolocateControl error handling', () => {
    it('should show default error toast when geolocate fails', async () => {
      const user = userEvent.setup();
      render(<MapComponent />);

      await user.click(screen.getByTestId('trigger-geolocate-error'));

      expect(mockToast.error).toHaveBeenCalledWith(
        "We couldn't get your location. Please try again."
      );
    });

    it('should show permission denied error toast when location permission is denied', async () => {
      const user = userEvent.setup();
      render(<MapComponent />);

      await user.click(
        screen.getByTestId('trigger-geolocate-permission-denied')
      );

      expect(mockToast.error).toHaveBeenCalledWith(
        "We couldn't get your location. Please check your browser settings and allow location access."
      );
    });
  });
});
