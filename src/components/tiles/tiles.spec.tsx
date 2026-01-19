import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TilesControl } from './tiles';

const createMockLayers = () => [
  { id: 'water-fill', type: 'fill', 'source-layer': 'water' },
  { id: 'water-outline', type: 'line', 'source-layer': 'water' },
  { id: 'road-primary', type: 'line', 'source-layer': 'roads' },
  { id: 'road-secondary', type: 'line', 'source-layer': 'roads' },
  { id: 'road-tertiary', type: 'line', 'source-layer': 'roads' },
  { id: 'building-fill', type: 'fill', 'source-layer': 'buildings' },
  { id: 'background', type: 'background' },
  { id: 'sky', type: 'sky' },
];

const createMockMap = (layers = createMockLayers()) => {
  const layerVisibility: Record<string, string> = {};
  const sources: Record<string, unknown> = {};
  const dynamicLayers: Record<string, unknown> = {};

  return {
    getStyle: vi.fn(() => ({ layers })),
    getLayoutProperty: vi.fn((layerId: string, property: string) => {
      if (property === 'visibility') {
        return layerVisibility[layerId] ?? 'visible';
      }
      return undefined;
    }),
    setLayoutProperty: vi.fn(
      (layerId: string, property: string, value: string) => {
        if (property === 'visibility') {
          layerVisibility[layerId] = value;
        }
      }
    ),
    on: vi.fn(),
    off: vi.fn(),
    getSource: vi.fn((id: string) => sources[id]),
    addSource: vi.fn((id: string, spec: unknown) => {
      sources[id] = spec;
    }),
    removeSource: vi.fn((id: string) => {
      delete sources[id];
    }),
    getLayer: vi.fn((id: string) => dynamicLayers[id]),
    addLayer: vi.fn((layer: { id: string }) => {
      dynamicLayers[layer.id] = layer;
    }),
    removeLayer: vi.fn((id: string) => {
      delete dynamicLayers[id];
    }),
  };
};

let mockMap = createMockMap();

vi.mock('react-map-gl/maplibre', () => ({
  useMap: vi.fn(() => ({
    mainMap: {
      getMap: () => mockMap,
    },
  })),
}));

vi.mock('@/stores/common-store', () => ({
  useCommonStore: vi.fn((selector) =>
    selector({
      mapReady: true,
    })
  ),
}));

describe('TilesControl', () => {
  beforeEach(() => {
    mockMap = createMockMap();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render without crashing', () => {
      expect(() => render(<TilesControl />)).not.toThrow();
    });

    it('should render search input', () => {
      render(<TilesControl />);
      expect(
        screen.getByPlaceholderText('Search layers...')
      ).toBeInTheDocument();
    });

    it('should display grouped layers by source layer', () => {
      render(<TilesControl />);

      expect(screen.getByText('water')).toBeInTheDocument();
      expect(screen.getByText('roads')).toBeInTheDocument();
      expect(screen.getByText('buildings')).toBeInTheDocument();
    });

    it('should display layer count for each group', () => {
      render(<TilesControl />);

      expect(screen.getByText('(2)')).toBeInTheDocument();
      expect(screen.getByText('(3)')).toBeInTheDocument();
      expect(screen.getByText('(1)')).toBeInTheDocument();
    });

    it('should display ungrouped layers without source-layer', () => {
      render(<TilesControl />);

      expect(screen.getByText('background')).toBeInTheDocument();
      expect(screen.getByText('sky')).toBeInTheDocument();
    });

    it('should display layer type for ungrouped layers', () => {
      render(<TilesControl />);

      expect(screen.getByText('(background)')).toBeInTheDocument();
      expect(screen.getByText('(sky)')).toBeInTheDocument();
    });

    it('should filter out maplibregl-inspect layers', () => {
      const layersWithInspect = [
        ...createMockLayers(),
        { id: 'maplibregl-inspect-layer', type: 'line' },
      ];
      mockMap = createMockMap(layersWithInspect);

      render(<TilesControl />);

      expect(
        screen.queryByText('maplibregl-inspect-layer')
      ).not.toBeInTheDocument();
    });

    it('should filter out td- prefixed layers', () => {
      const layersWithTd = [
        ...createMockLayers(),
        { id: 'td-custom-layer', type: 'line' },
      ];
      mockMap = createMockMap(layersWithTd);

      render(<TilesControl />);

      expect(screen.queryByText('td-custom-layer')).not.toBeInTheDocument();
    });

    it('should show "No layers found" when no layers match', async () => {
      mockMap = createMockMap([]);

      render(<TilesControl />);

      expect(screen.getByText('No layers found')).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('should filter layers by layer id', async () => {
      const user = userEvent.setup();
      render(<TilesControl />);

      await user.type(screen.getByPlaceholderText('Search layers...'), 'water');

      await waitFor(() => {
        expect(screen.getByText('water')).toBeInTheDocument();
        expect(screen.queryByText('roads')).not.toBeInTheDocument();
        expect(screen.queryByText('buildings')).not.toBeInTheDocument();
      });
    });

    it('should filter layers by source layer name', async () => {
      const user = userEvent.setup();
      render(<TilesControl />);

      await user.type(screen.getByPlaceholderText('Search layers...'), 'road');

      await waitFor(() => {
        expect(screen.getByText('roads')).toBeInTheDocument();
        expect(screen.queryByText('water')).not.toBeInTheDocument();
      });
    });

    it('should be case insensitive', async () => {
      const user = userEvent.setup();
      render(<TilesControl />);

      await user.type(screen.getByPlaceholderText('Search layers...'), 'WATER');

      await waitFor(() => {
        expect(screen.getByText('water')).toBeInTheDocument();
      });
    });

    it('should show "No layers found" when search has no results', async () => {
      const user = userEvent.setup();
      render(<TilesControl />);

      await user.type(
        screen.getByPlaceholderText('Search layers...'),
        'nonexistent'
      );

      await waitFor(() => {
        expect(screen.getByText('No layers found')).toBeInTheDocument();
      });
    });

    it('should filter ungrouped layers too', async () => {
      const user = userEvent.setup();
      render(<TilesControl />);

      await user.type(
        screen.getByPlaceholderText('Search layers...'),
        'background'
      );

      await waitFor(() => {
        expect(screen.getByText('background')).toBeInTheDocument();
        expect(screen.queryByText('water')).not.toBeInTheDocument();
        expect(screen.queryByText('sky')).not.toBeInTheDocument();
      });
    });

    it('should clear filter and show all layers when search is cleared', async () => {
      const user = userEvent.setup();
      render(<TilesControl />);

      const searchInput = screen.getByPlaceholderText('Search layers...');
      await user.type(searchInput, 'water');

      await waitFor(() => {
        expect(screen.queryByText('roads')).not.toBeInTheDocument();
      });

      await user.clear(searchInput);

      await waitFor(() => {
        expect(screen.getByText('water')).toBeInTheDocument();
        expect(screen.getByText('roads')).toBeInTheDocument();
        expect(screen.getByText('buildings')).toBeInTheDocument();
      });
    });
  });

  describe('group expansion', () => {
    it('should expand group when clicked', async () => {
      const user = userEvent.setup();
      render(<TilesControl />);

      expect(screen.queryByText('water-fill')).not.toBeInTheDocument();

      await user.click(screen.getByText('water'));

      await waitFor(() => {
        expect(screen.getByText('water-fill')).toBeInTheDocument();
        expect(screen.getByText('water-outline')).toBeInTheDocument();
      });
    });

    it('should collapse group when clicked again', async () => {
      const user = userEvent.setup();
      render(<TilesControl />);

      await user.click(screen.getByText('water'));

      await waitFor(() => {
        expect(screen.getByText('water-fill')).toBeInTheDocument();
      });

      await user.click(screen.getByText('water'));

      await waitFor(() => {
        expect(screen.queryByText('water-fill')).not.toBeInTheDocument();
      });
    });

    it('should show layer type when group is expanded', async () => {
      const user = userEvent.setup();
      render(<TilesControl />);

      await user.click(screen.getByText('water'));

      await waitFor(() => {
        expect(screen.getByText('(fill)')).toBeInTheDocument();
        expect(screen.getByText('(line)')).toBeInTheDocument();
      });
    });

    it('should allow multiple groups to be expanded', async () => {
      const user = userEvent.setup();
      render(<TilesControl />);

      await user.click(screen.getByText('water'));
      await user.click(screen.getByText('roads'));

      await waitFor(() => {
        expect(screen.getByText('water-fill')).toBeInTheDocument();
        expect(screen.getByText('road-primary')).toBeInTheDocument();
      });
    });
  });

  describe('layer visibility toggle', () => {
    it('should toggle individual layer visibility', async () => {
      const user = userEvent.setup();
      render(<TilesControl />);

      await user.click(screen.getByText('water'));

      await waitFor(() => {
        expect(screen.getByText('water-fill')).toBeInTheDocument();
      });

      const waterFillSwitch = screen.getByRole('switch', {
        name: /water-fill/,
      });
      expect(waterFillSwitch).toBeChecked();

      await user.click(waterFillSwitch);

      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
        'water-fill',
        'visibility',
        'none'
      );
    });

    it('should toggle layer visibility back on', async () => {
      const user = userEvent.setup();
      render(<TilesControl />);

      await user.click(screen.getByText('water'));

      await waitFor(() => {
        expect(screen.getByText('water-fill')).toBeInTheDocument();
      });

      const waterFillSwitch = screen.getByRole('switch', {
        name: /water-fill/,
      });

      await user.click(waterFillSwitch);
      await user.click(waterFillSwitch);

      expect(mockMap.setLayoutProperty).toHaveBeenLastCalledWith(
        'water-fill',
        'visibility',
        'visible'
      );
    });

    it('should toggle ungrouped layer visibility', async () => {
      const user = userEvent.setup();
      render(<TilesControl />);

      const backgroundSwitch = screen.getByRole('switch', {
        name: /^background/,
      });
      await user.click(backgroundSwitch);

      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
        'background',
        'visibility',
        'none'
      );
    });
  });

  describe('group visibility toggle', () => {
    it('should toggle all layers in a group off', async () => {
      const user = userEvent.setup();
      render(<TilesControl />);

      const groupSwitches = screen.getAllByRole('switch');
      const roadsGroupSwitch = groupSwitches[2]!;

      await user.click(roadsGroupSwitch);

      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
        'road-primary',
        'visibility',
        'none'
      );
      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
        'road-secondary',
        'visibility',
        'none'
      );
      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
        'road-tertiary',
        'visibility',
        'none'
      );
    });

    it('should toggle all layers in a group on', async () => {
      const user = userEvent.setup();
      render(<TilesControl />);

      const groupSwitches = screen.getAllByRole('switch');
      const waterGroupSwitch = groupSwitches[1]!;

      await user.click(waterGroupSwitch);
      await user.click(waterGroupSwitch);

      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
        'water-fill',
        'visibility',
        'visible'
      );
      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
        'water-outline',
        'visibility',
        'visible'
      );
    });
  });

  describe('map style changes', () => {
    it('should register styledata event listener', () => {
      render(<TilesControl />);

      expect(mockMap.on).toHaveBeenCalledWith(
        'styledata',
        expect.any(Function)
      );
    });

    it('should unregister styledata event listener on unmount', () => {
      const { unmount } = render(<TilesControl />);

      unmount();

      expect(mockMap.off).toHaveBeenCalledWith(
        'styledata',
        expect.any(Function)
      );
    });

    it('should trigger re-render when style changes', async () => {
      render(<TilesControl />);

      expect(mockMap.getStyle).toHaveBeenCalled();
      const initialCallCount = mockMap.getStyle.mock.calls.length;

      const styleDataHandlers = mockMap.on.mock.calls
        .filter((call) => call[0] === 'styledata')
        .map((call) => call[1]);

      await act(async () => {
        for (const handler of styleDataHandlers) {
          handler?.();
        }
      });

      await waitFor(() => {
        expect(mockMap.getStyle.mock.calls.length).toBeGreaterThan(
          initialCallCount
        );
      });
    });

    it('should collapse all groups when style changes', async () => {
      const user = userEvent.setup();
      render(<TilesControl />);

      await user.click(screen.getByText('water'));

      await waitFor(() => {
        expect(screen.getByText('water-fill')).toBeInTheDocument();
      });

      const styleDataHandlers = mockMap.on.mock.calls
        .filter((call) => call[0] === 'styledata')
        .map((call) => call[1]);

      await act(async () => {
        for (const handler of styleDataHandlers) {
          handler?.();
        }
      });

      await waitFor(() => {
        expect(screen.queryByText('water-fill')).not.toBeInTheDocument();
      });
    });
  });

  describe('when map is not ready', () => {
    it('should show empty state when mapReady is false', async () => {
      const { useCommonStore } = await import('@/stores/common-store');
      vi.mocked(useCommonStore).mockImplementation((selector) =>
        selector({ mapReady: false } as Parameters<typeof selector>[0])
      );

      render(<TilesControl />);

      expect(screen.getByText('No layers found')).toBeInTheDocument();
    });
  });

  describe('when map has no layers', () => {
    it('should handle undefined style gracefully', () => {
      mockMap.getStyle.mockReturnValue(
        undefined as unknown as ReturnType<typeof mockMap.getStyle>
      );

      render(<TilesControl />);

      expect(screen.getByText('No layers found')).toBeInTheDocument();
    });

    it('should handle style with no layers array', () => {
      mockMap.getStyle.mockReturnValue(
        {} as unknown as ReturnType<typeof mockMap.getStyle>
      );

      render(<TilesControl />);

      expect(screen.getByText('No layers found')).toBeInTheDocument();
    });
  });
});
