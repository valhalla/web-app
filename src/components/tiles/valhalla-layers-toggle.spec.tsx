import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValhallaLayersToggle } from './valhalla-layers-toggle';
import {
  VALHALLA_SOURCE_ID,
  VALHALLA_LAYERS,
  VALHALLA_EDGES_LAYER_ID,
  VALHALLA_NODES_LAYER_ID,
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
      expect(() => render(<ValhallaLayersToggle />)).not.toThrow();
    });

    it('should render toggle label', () => {
      render(<ValhallaLayersToggle />);

      expect(screen.getByText('Append Valhalla layers')).toBeInTheDocument();
    });

    it('should render description text', () => {
      render(<ValhallaLayersToggle />);

      expect(
        screen.getByText(/Overlay Valhalla routing graph tiles/)
      ).toBeInTheDocument();
    });

    it('should render Tile API link', () => {
      render(<ValhallaLayersToggle />);

      const link = screen.getByRole('link', { name: 'Tile API' });
      expect(link).toHaveAttribute(
        'href',
        'https://valhalla.github.io/valhalla/api/tile/api-reference/'
      );
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should render switch in unchecked state by default', () => {
      render(<ValhallaLayersToggle />);

      const toggle = screen.getByRole('switch');
      expect(toggle).not.toBeChecked();
    });

    it('should not render when map is not ready', () => {
      mockMapReady = false;

      const { container } = render(<ValhallaLayersToggle />);

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('toggle functionality', () => {
    it('should add source when toggled on', async () => {
      const user = userEvent.setup();
      render(<ValhallaLayersToggle />);

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
      render(<ValhallaLayersToggle />);

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      expect(mockMap.addLayer).toHaveBeenCalledTimes(VALHALLA_LAYERS.length);
      for (const layer of VALHALLA_LAYERS) {
        expect(mockMap.addLayer).toHaveBeenCalledWith(layer);
      }
    });

    it('should remove all layers when toggled off', async () => {
      const user = userEvent.setup();
      render(<ValhallaLayersToggle />);

      const toggle = screen.getByRole('switch');
      await user.click(toggle);
      await user.click(toggle);

      expect(mockMap.removeLayer).toHaveBeenCalledWith(VALHALLA_EDGES_LAYER_ID);
      expect(mockMap.removeLayer).toHaveBeenCalledWith(VALHALLA_NODES_LAYER_ID);
    });

    it('should remove source when toggled off', async () => {
      const user = userEvent.setup();
      render(<ValhallaLayersToggle />);

      const toggle = screen.getByRole('switch');
      await user.click(toggle);
      await user.click(toggle);

      expect(mockMap.removeSource).toHaveBeenCalledWith(VALHALLA_SOURCE_ID);
    });

    it('should not add source if already exists', async () => {
      const user = userEvent.setup();
      mockMap._sources[VALHALLA_SOURCE_ID] = { type: 'vector' };

      render(<ValhallaLayersToggle />);

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      expect(mockMap.addSource).not.toHaveBeenCalled();
    });

    it('should not add layer if already exists', async () => {
      const user = userEvent.setup();
      mockMap._layers[VALHALLA_EDGES_LAYER_ID] = {
        id: VALHALLA_EDGES_LAYER_ID,
      };

      render(<ValhallaLayersToggle />);

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      expect(mockMap.addLayer).toHaveBeenCalledTimes(1);
    });

    it('should update checked state when toggled', async () => {
      const user = userEvent.setup();
      render(<ValhallaLayersToggle />);

      const toggle = screen.getByRole('switch');
      expect(toggle).not.toBeChecked();

      await user.click(toggle);

      expect(toggle).toBeChecked();
    });
  });

  describe('style change handling', () => {
    it('should register styledata event listener', () => {
      render(<ValhallaLayersToggle />);

      expect(mockMap.on).toHaveBeenCalledWith(
        'styledata',
        expect.any(Function)
      );
    });

    it('should unregister styledata event listener on unmount', () => {
      const { unmount } = render(<ValhallaLayersToggle />);

      unmount();

      expect(mockMap.off).toHaveBeenCalledWith(
        'styledata',
        expect.any(Function)
      );
    });

    it('should sync enabled state with source existence on style change', async () => {
      render(<ValhallaLayersToggle />);

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
      render(<ValhallaLayersToggle />);

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
});
