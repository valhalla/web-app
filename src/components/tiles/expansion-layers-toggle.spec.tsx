import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { LayerSpecification } from 'maplibre-gl';
import { ExpansionLayersToggle } from './expansion-layers-toggle';
import {
  EXPANSION_SOURCE_ID,
  EXPANSION_LAYERS,
  EXPANSION_EDGES_LAYER_ID,
} from './expansion-layers';

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

describe('ExpansionLayersToggle', () => {
  beforeEach(() => {
    mockMap = createMockMap();
    mockMapReady = true;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the expansion toggle label', () => {
    render(<ExpansionLayersToggle customLayers={noCustomLayers} />);

    expect(screen.getByText('Append Expansion layers')).toBeInTheDocument();
  });

  it('should add the expansion source and layer when toggled on', async () => {
    const user = userEvent.setup();
    render(<ExpansionLayersToggle customLayers={noCustomLayers} />);

    await user.click(screen.getByRole('switch'));

    expect(mockMap.addSource).toHaveBeenCalledWith(
      EXPANSION_SOURCE_ID,
      expect.objectContaining({
        type: 'vector',
        tiles: [expect.stringContaining('/expansion?json=')],
      })
    );
    expect(mockMap.addLayer).toHaveBeenCalledWith(EXPANSION_LAYERS[0]);
  });

  it('should remove the expansion layer and source when toggled off', async () => {
    const user = userEvent.setup();
    render(<ExpansionLayersToggle customLayers={noCustomLayers} />);

    const toggle = screen.getByRole('switch');
    await user.click(toggle);
    await user.click(toggle);

    expect(mockMap.removeLayer).toHaveBeenCalledWith(EXPANSION_EDGES_LAYER_ID);
    expect(mockMap.removeSource).toHaveBeenCalledWith(EXPANSION_SOURCE_ID);
  });

  it('should sync enabled state with source existence on style change', async () => {
    render(<ExpansionLayersToggle customLayers={noCustomLayers} />);

    const styleDataHandler = mockMap.on.mock.calls.find(
      (call) => call[0] === 'styledata'
    )?.[1];

    mockMap._sources[EXPANSION_SOURCE_ID] = { type: 'vector' };

    await act(async () => {
      styleDataHandler?.();
    });

    await waitFor(() => {
      expect(screen.getByRole('switch')).toBeChecked();
    });
  });
});
