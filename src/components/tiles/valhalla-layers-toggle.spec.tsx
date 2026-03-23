import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { LayerSpecification } from 'maplibre-gl';
import { ValhallaLayersToggle } from './valhalla-layers-toggle';
import { VALHALLA_SOURCE_ID, getValhallaStyle } from './valhalla-layers';

vi.mock('./valhalla-layers', () => ({
  VALHALLA_SOURCE_ID: 'valhalla-tiles',
  getValhallaStyle: vi.fn(),
}));

const createMockMap = () => {
  const sources: Record<string, unknown> = {};
  const layers: Record<string, unknown> = {};

  return {
    getSource: vi.fn((id: string) => sources[id]),
    addSource: vi.fn((id: string, spec: unknown) => {
      sources[id] = spec;
    }),
    getLayer: vi.fn((id: string) => layers[id]),
    addLayer: vi.fn((layer: { id: string }) => {
      layers[layer.id] = layer;
    }),
    setLayoutProperty: vi.fn(),
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

    vi.mocked(getValhallaStyle).mockResolvedValue({
      sources: {
        [VALHALLA_SOURCE_ID]: {
          type: 'vector',
          tiles: ['https://example.com/tile'],
        },
      },
      layers: [
        {
          id: 'edges',
          type: 'line',
          source: VALHALLA_SOURCE_ID,
        },
        {
          id: 'nodes',
          type: 'circle',
          source: VALHALLA_SOURCE_ID,
        },
      ],
    });
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
    it('should fetch valhalla style when toggled', async () => {
      const user = userEvent.setup();
      render(<ValhallaLayersToggle customLayers={noCustomLayers} />);

      await user.click(screen.getByRole('switch'));

      await waitFor(() => {
        expect(getValhallaStyle).toHaveBeenCalledTimes(1);
      });
    });

    it('should add source when toggled on', async () => {
      const user = userEvent.setup();
      render(<ValhallaLayersToggle customLayers={noCustomLayers} />);

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      await waitFor(() => {
        expect(mockMap.addSource).toHaveBeenCalledWith(
          VALHALLA_SOURCE_ID,
          expect.objectContaining({
            type: 'vector',
            tiles: expect.any(Array),
          })
        );
      });
    });

    it('should add all style layers when toggled on', async () => {
      const user = userEvent.setup();
      render(<ValhallaLayersToggle customLayers={noCustomLayers} />);

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      await waitFor(() => {
        expect(mockMap.addLayer).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'edges' })
        );
        expect(mockMap.addLayer).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'nodes' })
        );
      });
    });

    it('should not add source if already exists', async () => {
      const user = userEvent.setup();
      mockMap._sources[VALHALLA_SOURCE_ID] = { type: 'vector' };

      render(<ValhallaLayersToggle customLayers={noCustomLayers} />);

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      await waitFor(() => {
        expect(mockMap.addSource).not.toHaveBeenCalled();
      });
    });

    it('should not add layer if already exists', async () => {
      const user = userEvent.setup();
      mockMap._layers.edges = { id: 'edges' };

      render(<ValhallaLayersToggle customLayers={noCustomLayers} />);

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      await waitFor(() => {
        expect(mockMap.addLayer).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'nodes' })
        );
      });

      const addLayerIds = mockMap.addLayer.mock.calls.map(
        (call: [{ id: string }]) => call[0].id
      );
      expect(addLayerIds).not.toContain('edges');
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

      await waitFor(() => {
        expect(mockMap.addLayer).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'custom-valhalla-layer' })
        );
      });
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

      await waitFor(() => {
        expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
          'custom-hidden-layer',
          'visibility',
          'none'
        );
      });
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

    it('should set custom valhalla layer visibility to none when toggled off', async () => {
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
      await user.click(toggle);

      await waitFor(() => {
        expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
          'custom-valhalla-layer',
          'visibility',
          'none'
        );
      });
    });

    it('should toggle built-in valhalla style layer visibility', async () => {
      const user = userEvent.setup();
      mockMap._layers.edges = { id: 'edges' };
      mockMap._layers.shortcuts = { id: 'shortcuts' };
      mockMap._layers.nodes = { id: 'nodes' };

      render(<ValhallaLayersToggle customLayers={noCustomLayers} />);

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      await waitFor(() => {
        expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
          'edges',
          'visibility',
          'visible'
        );
        expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
          'shortcuts',
          'visibility',
          'visible'
        );
        expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
          'nodes',
          'visibility',
          'visible'
        );
      });

      await user.click(toggle);

      await waitFor(() => {
        expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
          'edges',
          'visibility',
          'none'
        );
        expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
          'shortcuts',
          'visibility',
          'none'
        );
        expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
          'nodes',
          'visibility',
          'none'
        );
      });
    });
  });
});
