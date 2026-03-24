import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { LayerSpecification } from 'maplibre-gl';
import { ValhallaLayersToggle } from './valhalla-layers-toggle';
import {
  VALHALLA_SOURCE_ID,
  VALHALLA_LAYERS,
  VALHALLA_EDGES_LAYER_ID,
  VALHALLA_NODES_LAYER_ID,
  VALHALLA_SHORTCUTS_LAYER_ID,
  VALHALLA_ACCESS_RESTRICTIONS_PERMANENT_LAYER_ID,
  VALHALLA_ACCESS_RESTRICTIONS_TIMED_LAYER_ID,
} from './valhalla-layers';

const createMockMap = () => {
  const sources: Record<string, unknown> = {};
  const layers: Record<string, unknown> = {};

  return {
    getSource: vi.fn((id: string) => sources[id]),
    addSource: vi.fn((id: string, spec: unknown) => {
      sources[id] = spec;
    }),
    removeSource: vi.fn((id: string) => {
      delete sources[id];
    }),
    getLayer: vi.fn((id: string) => layers[id]),
    addLayer: vi.fn((layer: { id: string }) => {
      layers[layer.id] = layer;
    }),
    removeLayer: vi.fn((id: string) => {
      delete layers[id];
    }),
    setLayoutProperty: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    _sources: sources,
    _layers: layers,
  };
};

let mockMap = createMockMap();
let mockMapReady = true;

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
      mapReady: mockMapReady,
    })
  ),
}));

const noCustomLayers: { layer: LayerSpecification; visible: boolean }[] = [];

describe('ValhallaLayersToggle', () => {
  beforeEach(() => {
    mockMap = createMockMap();
    mockMapReady = true;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render without crashing', () => {
      expect(() =>
        render(<ValhallaLayersToggle customLayers={noCustomLayers} />)
      ).not.toThrow();
    });

    it('should render toggle label', () => {
      render(<ValhallaLayersToggle customLayers={noCustomLayers} />);

      expect(screen.getByText('Append Valhalla layers')).toBeInTheDocument();
    });

    it('should render switch in unchecked state by default', () => {
      render(<ValhallaLayersToggle customLayers={noCustomLayers} />);

      const toggle = screen.getByRole('switch');
      expect(toggle).not.toBeChecked();
    });

    it('should not render when map is not ready', () => {
      mockMapReady = false;

      const { container } = render(
        <ValhallaLayersToggle customLayers={noCustomLayers} />
      );

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('toggle functionality', () => {
    it('should add source when toggled on', async () => {
      const user = userEvent.setup();
      render(<ValhallaLayersToggle customLayers={noCustomLayers} />);

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      expect(mockMap.addSource).toHaveBeenCalledWith(
        VALHALLA_SOURCE_ID,
        expect.objectContaining({
          type: 'vector',
          tiles: expect.any(Array),
        })
      );
    });

    it('should add all layers when toggled on', async () => {
      const user = userEvent.setup();
      render(<ValhallaLayersToggle customLayers={noCustomLayers} />);

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      expect(mockMap.addLayer).toHaveBeenCalledTimes(VALHALLA_LAYERS.length);
      for (const layer of VALHALLA_LAYERS) {
        expect(mockMap.addLayer).toHaveBeenCalledWith(layer);
      }
    });

    it('should remove all layers when toggled off', async () => {
      const user = userEvent.setup();
      render(<ValhallaLayersToggle customLayers={noCustomLayers} />);

      const toggle = screen.getByRole('switch');
      await user.click(toggle);
      await user.click(toggle);

      expect(mockMap.removeLayer).toHaveBeenCalledWith(VALHALLA_EDGES_LAYER_ID);
      expect(mockMap.removeLayer).toHaveBeenCalledWith(
        VALHALLA_SHORTCUTS_LAYER_ID
      );
      expect(mockMap.removeLayer).toHaveBeenCalledWith(VALHALLA_NODES_LAYER_ID);
      expect(mockMap.removeLayer).toHaveBeenCalledWith(
        VALHALLA_ACCESS_RESTRICTIONS_PERMANENT_LAYER_ID
      );
      expect(mockMap.removeLayer).toHaveBeenCalledWith(
        VALHALLA_ACCESS_RESTRICTIONS_TIMED_LAYER_ID
      );
    });

    it('should remove source when toggled off', async () => {
      const user = userEvent.setup();
      render(<ValhallaLayersToggle customLayers={noCustomLayers} />);

      const toggle = screen.getByRole('switch');
      await user.click(toggle);
      await user.click(toggle);

      expect(mockMap.removeSource).toHaveBeenCalledWith(VALHALLA_SOURCE_ID);
    });

    it('should not add source if already exists', async () => {
      const user = userEvent.setup();
      mockMap._sources[VALHALLA_SOURCE_ID] = { type: 'vector' };

      render(<ValhallaLayersToggle customLayers={noCustomLayers} />);

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      expect(mockMap.addSource).not.toHaveBeenCalled();
    });

    it('should not add layer if already exists', async () => {
      const user = userEvent.setup();
      mockMap._layers[VALHALLA_EDGES_LAYER_ID] = {
        id: VALHALLA_EDGES_LAYER_ID,
      };

      render(<ValhallaLayersToggle customLayers={noCustomLayers} />);

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      expect(mockMap.addLayer).toHaveBeenCalledTimes(
        VALHALLA_LAYERS.length - 1
      );
    });

    it('should update checked state when toggled', async () => {
      const user = userEvent.setup();
      render(<ValhallaLayersToggle customLayers={noCustomLayers} />);

      const toggle = screen.getByRole('switch');
      expect(toggle).not.toBeChecked();

      await user.click(toggle);

      expect(toggle).toBeChecked();
    });
  });

  describe('style change handling', () => {
    it('should register styledata event listener', () => {
      render(<ValhallaLayersToggle customLayers={noCustomLayers} />);

      expect(mockMap.on).toHaveBeenCalledWith(
        'styledata',
        expect.any(Function)
      );
    });

    it('should unregister styledata event listener on unmount', () => {
      const { unmount } = render(
        <ValhallaLayersToggle customLayers={noCustomLayers} />
      );

      unmount();

      expect(mockMap.off).toHaveBeenCalledWith(
        'styledata',
        expect.any(Function)
      );
    });

    it('should sync enabled state with source existence on style change', async () => {
      render(<ValhallaLayersToggle customLayers={noCustomLayers} />);

      const styleDataHandler = mockMap.on.mock.calls.find(
        (call) => call[0] === 'styledata'
      )?.[1];

      mockMap._sources[VALHALLA_SOURCE_ID] = { type: 'vector' };

      await act(async () => {
        styleDataHandler?.();
      });

      await waitFor(() => {
        expect(screen.getByRole('switch')).toBeChecked();
      });
    });

    it('should set enabled to false when source is removed on style change', async () => {
      const user = userEvent.setup();
      render(<ValhallaLayersToggle customLayers={noCustomLayers} />);

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      expect(toggle).toBeChecked();

      const styleDataHandler = mockMap.on.mock.calls.find(
        (call) => call[0] === 'styledata'
      )?.[1];

      delete mockMap._sources[VALHALLA_SOURCE_ID];

      await act(async () => {
        styleDataHandler?.();
      });

      await waitFor(() => {
        expect(screen.getByRole('switch')).not.toBeChecked();
      });
    });
  });

  describe('custom layer re-application on enable', () => {
    it('should re-add a custom layer referencing valhalla-tiles when toggled on', async () => {
      const user = userEvent.setup();
      const customLayers = [
        {
          layer: {
            id: 'custom-valhalla-layer',
            type: 'line',
            source: VALHALLA_SOURCE_ID,
          } as LayerSpecification,
          visible: true,
        },
      ];

      render(<ValhallaLayersToggle customLayers={customLayers} />);

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      expect(mockMap.addLayer).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'custom-valhalla-layer' })
      );
    });

    it('should set visibility none for an invisible custom valhalla layer when re-added', async () => {
      const user = userEvent.setup();
      const customLayers = [
        {
          layer: {
            id: 'custom-hidden-layer',
            type: 'line',
            source: VALHALLA_SOURCE_ID,
          } as LayerSpecification,
          visible: false,
        },
      ];

      render(<ValhallaLayersToggle customLayers={customLayers} />);

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
        'custom-hidden-layer',
        'visibility',
        'none'
      );
    });

    it('should not re-add a custom layer that uses a different source', async () => {
      const user = userEvent.setup();
      const customLayers = [
        {
          layer: {
            id: 'custom-other-source',
            type: 'line',
            source: 'some-other-source',
          } as LayerSpecification,
          visible: true,
        },
      ];

      render(<ValhallaLayersToggle customLayers={customLayers} />);

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      const addLayerIds = mockMap.addLayer.mock.calls.map(
        (call: [{ id: string }]) => call[0].id
      );
      expect(addLayerIds).not.toContain('custom-other-source');
    });

    it('should not re-add a custom valhalla layer that is already on the map', async () => {
      const user = userEvent.setup();
      const customLayers = [
        {
          layer: {
            id: 'already-present-custom',
            type: 'line',
            source: VALHALLA_SOURCE_ID,
          } as LayerSpecification,
          visible: true,
        },
      ];
      mockMap._layers['already-present-custom'] = {
        id: 'already-present-custom',
      };

      render(<ValhallaLayersToggle customLayers={customLayers} />);

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      const addLayerIds = mockMap.addLayer.mock.calls.map(
        (call: [{ id: string }]) => call[0].id
      );
      expect(addLayerIds).not.toContain('already-present-custom');
    });

    it('should call map.removeLayer for custom valhalla layers when Valhalla is toggled off', async () => {
      const user = userEvent.setup();
      const customLayers = [
        {
          layer: {
            id: 'custom-valhalla-layer',
            type: 'line',
            source: VALHALLA_SOURCE_ID,
          } as LayerSpecification,
          visible: true,
        },
      ];

      render(<ValhallaLayersToggle customLayers={customLayers} />);

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      mockMap.removeLayer.mockClear();

      await user.click(toggle);

      const removeLayerIds = mockMap.removeLayer.mock.calls.map(
        (call: [string]) => call[0]
      );
      expect(removeLayerIds).toContain('custom-valhalla-layer');
    });
  });
});
