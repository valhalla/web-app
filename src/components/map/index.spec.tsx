import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapComponent } from './index';

const mockToast = vi.hoisted(() => ({
  error: vi.fn(),
}));

const mockQueryRenderedFeatures = vi.hoisted(() =>
  vi.fn(() => [] as unknown[])
);
const mockGetLayer = vi.hoisted(() => vi.fn((): unknown => true));
const mockMapRef = vi.hoisted(() => ({
  getCenter: vi.fn(() => ({ lng: 13.4, lat: 52.5 })),
  getZoom: vi.fn(() => 10),
  fitBounds: vi.fn(),
  getMap: vi.fn(() => ({
    getCanvas: vi.fn(() => ({ style: { cursor: '' } })),
    queryRenderedFeatures: mockQueryRenderedFeatures,
    getLayer: mockGetLayer,
  })),
}));

vi.mock('react-map-gl/maplibre', async () => {
  const React = await import('react');
  return {
    // eslint-disable-next-line react/display-name
    Map: React.forwardRef(
      (
        {
          children,
          onClick,
          onDblClick,
          onContextMenu,
          onTouchStart,
          ...props
        }: {
          children?: React.ReactNode;
          onClick?: (e: unknown) => void;
          onDblClick?: (e: unknown) => void;
          onContextMenu?: (e: unknown) => void;
          onTouchStart?: (e: unknown) => void;
          longitude?: number;
          latitude?: number;
          zoom?: number;
        },
        ref: React.Ref<typeof mockMapRef>
      ) => {
        // Set up the ref to return our mock map
        React.useImperativeHandle(ref, () => mockMapRef);

        return (
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
            onDoubleClick={() => {
              onDblClick?.({
                lngLat: { lng: 13.4, lat: 52.5 },
                point: { x: 100, y: 100 },
              });
            }}
            onContextMenu={(e: React.MouseEvent) => {
              e.preventDefault();
              onContextMenu?.({
                lngLat: { lng: 13.4, lat: 52.5 },
                point: { x: 100, y: 100 },
              });
            }}
            onTouchStart={(e: React.TouchEvent) => {
              onTouchStart?.({
                lngLat: { lng: 13.4, lat: 52.5 },
                point: { x: 100, y: 100 },
                originalEvent: e,
              });
            }}
          >
            {children}
          </div>
        );
      }
    ),
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
  };
});

const mockUseParams = vi.hoisted(() =>
  vi.fn(() => ({ activeTab: 'directions' }))
);

vi.mock('@tanstack/react-router', () => ({
  useParams: mockUseParams,
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

vi.mock('./parts/tiles-info-popup', () => ({
  TilesInfoPopup: vi.fn(({ onClose }) => (
    <div data-testid="tiles-info-popup">
      <button onClick={onClose}>Close Tiles Popup</button>
    </div>
  )),
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

  it('should show info popup on map click after delay', async () => {
    vi.useFakeTimers();
    render(<MapComponent />);

    fireEvent.click(screen.getByTestId('map'));

    // popup should not appear immediately
    expect(screen.queryByTestId('map-info-popup')).not.toBeInTheDocument();

    // advance timers past the click delay (200ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(screen.getByTestId('popup')).toBeInTheDocument();
    expect(screen.getByTestId('map-info-popup')).toBeInTheDocument();

    vi.useRealTimers();
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
    vi.useFakeTimers();
    render(<MapComponent />);

    fireEvent.click(screen.getByTestId('map'));

    // advance timers to show popup
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(screen.getByTestId('map-info-popup')).toBeInTheDocument();

    // use real timers for user interaction
    vi.useRealTimers();
    const user = userEvent.setup();
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
    vi.useFakeTimers();
    render(<MapComponent />);

    fireEvent.click(screen.getByTestId('map'));

    // advance timers to show popup
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(screen.getByTestId('map-info-popup')).toBeInTheDocument();

    // click again to close
    fireEvent.click(screen.getByTestId('map'));

    // popup should close immediately (no delay for closing)
    expect(screen.queryByTestId('map-info-popup')).not.toBeInTheDocument();

    vi.useRealTimers();
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

  describe('double-click and double-tap behavior', () => {
    it('should not show popup on double-click (zoom only)', async () => {
      vi.useFakeTimers();
      render(<MapComponent />);

      const map = screen.getByTestId('map');

      // simulate double-click: click followed quickly by dblclick
      fireEvent.click(map);
      fireEvent.doubleClick(map);

      // advance timers past the click delay
      await act(async () => {
        await vi.advanceTimersByTimeAsync(250);
      });

      // popup should not appear because double-click cancelled it
      expect(screen.queryByTestId('map-info-popup')).not.toBeInTheDocument();

      vi.useRealTimers();
    });

    it('should cancel pending popup when double-click occurs before delay expires', async () => {
      vi.useFakeTimers();
      render(<MapComponent />);

      const map = screen.getByTestId('map');

      // first click starts the timer
      fireEvent.click(map);

      // popup should not be visible yet
      expect(screen.queryByTestId('map-info-popup')).not.toBeInTheDocument();

      // advance only 100ms (less than 200ms delay)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      // double-click cancels the pending popup
      fireEvent.doubleClick(map);

      // advance past the original delay
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });

      // popup should still not appear
      expect(screen.queryByTestId('map-info-popup')).not.toBeInTheDocument();

      vi.useRealTimers();
    });

    it('should cancel pending popup on double-tap (mobile)', async () => {
      vi.useFakeTimers();
      render(<MapComponent />);

      const map = screen.getByTestId('map');

      // create a mock touch event with single finger
      const createTouchEvent = () => ({
        touches: [{ identifier: 0, target: map }],
      });

      // first tap
      fireEvent.touchStart(map, createTouchEvent());
      fireEvent.click(map);

      // popup should not be visible yet
      expect(screen.queryByTestId('map-info-popup')).not.toBeInTheDocument();

      // second tap within 300ms threshold (simulating double-tap)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      fireEvent.touchStart(map, createTouchEvent());

      // advance past the click delay
      await act(async () => {
        await vi.advanceTimersByTimeAsync(250);
      });

      // popup should not appear because double-tap cancelled it
      expect(screen.queryByTestId('map-info-popup')).not.toBeInTheDocument();

      vi.useRealTimers();
    });

    it('should cancel pending popup on multi-finger touch (pinch-to-zoom)', async () => {
      vi.useFakeTimers();
      render(<MapComponent />);

      const map = screen.getByTestId('map');

      // first single-finger tap starts click timer
      fireEvent.touchStart(map, {
        touches: [{ identifier: 0, target: map }],
      });
      fireEvent.click(map);

      // popup should not be visible yet
      expect(screen.queryByTestId('map-info-popup')).not.toBeInTheDocument();

      // multi-finger touch (pinch gesture) should cancel pending popup
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });
      fireEvent.touchStart(map, {
        touches: [
          { identifier: 0, target: map },
          { identifier: 1, target: map },
        ],
      });

      // advance past the click delay
      await act(async () => {
        await vi.advanceTimersByTimeAsync(250);
      });

      // popup should not appear because multi-touch cancelled it
      expect(screen.queryByTestId('map-info-popup')).not.toBeInTheDocument();

      vi.useRealTimers();
    });

    it('should show popup on single tap after double-tap threshold passes', async () => {
      vi.useFakeTimers();
      render(<MapComponent />);

      const map = screen.getByTestId('map');

      // first tap
      fireEvent.touchStart(map, {
        touches: [{ identifier: 0, target: map }],
      });
      fireEvent.click(map);

      // wait longer than double-tap threshold (300ms) + click delay (200ms)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(250);
      });

      // popup should appear since no second tap occurred
      expect(screen.getByTestId('map-info-popup')).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('tiles tab behavior', () => {
    beforeEach(() => {
      mockUseParams.mockReturnValue({ activeTab: 'tiles' });
      mockQueryRenderedFeatures.mockClear();
      mockGetLayer.mockClear();
    });

    afterEach(() => {
      mockUseParams.mockReturnValue({ activeTab: 'directions' });
    });

    it('should show tiles info popup when clicking on tiles with features', async () => {
      vi.useFakeTimers();
      mockGetLayer.mockReturnValue(true);
      mockQueryRenderedFeatures.mockReturnValue([
        {
          type: 'Feature',
          sourceLayer: 'edges',
          properties: { id: '123', speed: 50 },
          geometry: {
            type: 'LineString',
            coordinates: [
              [0, 0],
              [1, 1],
            ],
          },
          layer: { id: 'valhalla-edges' },
        },
      ]);

      render(<MapComponent />);

      fireEvent.click(screen.getByTestId('map'));

      // advance timers past the click delay
      await act(async () => {
        await vi.advanceTimersByTimeAsync(250);
      });

      expect(screen.getByTestId('tiles-info-popup')).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('should not show tiles info popup when no features are found', async () => {
      vi.useFakeTimers();
      mockGetLayer.mockReturnValue(true);
      mockQueryRenderedFeatures.mockReturnValue([]);

      render(<MapComponent />);

      fireEvent.click(screen.getByTestId('map'));

      // advance timers past the click delay
      await act(async () => {
        await vi.advanceTimersByTimeAsync(250);
      });

      expect(screen.queryByTestId('tiles-info-popup')).not.toBeInTheDocument();

      vi.useRealTimers();
    });

    it('should not query features when valhalla layers do not exist', async () => {
      vi.useFakeTimers();
      mockGetLayer.mockReturnValue(undefined);

      render(<MapComponent />);

      fireEvent.click(screen.getByTestId('map'));

      // advance timers past the click delay
      await act(async () => {
        await vi.advanceTimersByTimeAsync(250);
      });

      expect(mockQueryRenderedFeatures).not.toHaveBeenCalled();
      expect(screen.queryByTestId('tiles-info-popup')).not.toBeInTheDocument();

      vi.useRealTimers();
    });

    it('should only query available layers when some layers exist', async () => {
      vi.useFakeTimers();
      // Only edges layer exists, nodes layer does not
      mockGetLayer.mockImplementation((layerId?: string) =>
        layerId === 'valhalla-edges' ? { id: 'valhalla-edges' } : undefined
      );
      mockQueryRenderedFeatures.mockReturnValue([
        {
          type: 'Feature',
          sourceLayer: 'edges',
          properties: { id: '123' },
          geometry: {
            type: 'LineString',
            coordinates: [
              [0, 0],
              [1, 1],
            ],
          },
          layer: { id: 'valhalla-edges' },
        },
      ]);

      render(<MapComponent />);

      fireEvent.click(screen.getByTestId('map'));

      // advance timers past the click delay
      await act(async () => {
        await vi.advanceTimersByTimeAsync(250);
      });

      expect(mockQueryRenderedFeatures).toHaveBeenCalledWith(
        { x: 100, y: 100 },
        { layers: ['valhalla-edges'] }
      );

      vi.useRealTimers();
    });

    it('should close tiles info popup when close button is clicked', async () => {
      vi.useFakeTimers();
      mockGetLayer.mockReturnValue(true);
      mockQueryRenderedFeatures.mockReturnValue([
        {
          type: 'Feature',
          sourceLayer: 'edges',
          properties: { id: '123' },
          geometry: {
            type: 'LineString',
            coordinates: [
              [0, 0],
              [1, 1],
            ],
          },
          layer: { id: 'valhalla-edges' },
        },
      ]);

      render(<MapComponent />);

      fireEvent.click(screen.getByTestId('map'));

      // advance timers past the click delay
      await act(async () => {
        await vi.advanceTimersByTimeAsync(250);
      });

      expect(screen.getByTestId('tiles-info-popup')).toBeInTheDocument();

      vi.useRealTimers();

      const user = userEvent.setup();
      await user.click(
        screen.getByRole('button', { name: 'Close Tiles Popup' })
      );

      await waitFor(() => {
        expect(
          screen.queryByTestId('tiles-info-popup')
        ).not.toBeInTheDocument();
      });
    });

    it('should not show context menu on right click in tiles tab', () => {
      render(<MapComponent />);

      fireEvent.contextMenu(screen.getByTestId('map'));

      // Context menu should not appear in tiles tab
      expect(screen.queryByTestId('map-context-menu')).not.toBeInTheDocument();
    });

    it('should not show info popup on click in tiles tab', async () => {
      vi.useFakeTimers();
      mockGetLayer.mockReturnValue(undefined);
      mockQueryRenderedFeatures.mockReturnValue([]);

      render(<MapComponent />);

      fireEvent.click(screen.getByTestId('map'));

      // advance timers past the click delay
      await act(async () => {
        await vi.advanceTimersByTimeAsync(250);
      });

      // should not show info popup (only tiles popup behavior)
      expect(screen.queryByTestId('map-info-popup')).not.toBeInTheDocument();

      vi.useRealTimers();
    });
  });
});
