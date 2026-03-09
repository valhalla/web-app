import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { LayerSpecification } from 'maplibre-gl';
import { CustomLayerEditor } from './custom-layer-editor';

const createMockMap = () => {
  const layers: Record<string, unknown> = {};
  return {
    getLayer: vi.fn((id: string) => layers[id]),
    addLayer: vi.fn((layer: { id: string }) => {
      layers[layer.id] = layer;
    }),
    on: vi.fn((event: string, handler: () => void) => {
      if (event === 'styledata') handler();
    }),
    off: vi.fn(),
    getSource: vi.fn(() => ({ type: 'vector' })),
    _layers: layers,
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

const VALID_LAYER_JSON = JSON.stringify({
  id: 'custom-dead-ends',
  type: 'line',
  source: 'valhalla-tiles',
  'source-layer': 'edges',
  paint: { 'line-color': '#ff0000' },
});

const noCustomLayers: { layer: LayerSpecification; visible: boolean }[] = [];
const mockOnLayerAdded = vi.fn();

const openDialog = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /add custom layer/i }));
  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
};

describe('CustomLayerEditor', () => {
  beforeEach(() => {
    mockMap = createMockMap();
    mockOnLayerAdded.mockClear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('trigger button', () => {
    it('should render the Add Custom Layer button', () => {
      render(
        <CustomLayerEditor
          customLayers={noCustomLayers}
          onLayerAdded={mockOnLayerAdded}
        />
      );
      expect(
        screen.getByRole('button', { name: /add custom layer/i })
      ).toBeInTheDocument();
    });

    it('should open the dialog when the button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <CustomLayerEditor
          customLayers={noCustomLayers}
          onLayerAdded={mockOnLayerAdded}
        />
      );

      await openDialog(user);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should show the dialog title', async () => {
      const user = userEvent.setup();
      render(
        <CustomLayerEditor
          customLayers={noCustomLayers}
          onLayerAdded={mockOnLayerAdded}
        />
      );

      await openDialog(user);

      expect(
        within(screen.getByRole('dialog')).getByText('Add Custom Layer')
      ).toBeInTheDocument();
    });

    it('should show the textarea for JSON input', async () => {
      const user = userEvent.setup();
      render(
        <CustomLayerEditor
          customLayers={noCustomLayers}
          onLayerAdded={mockOnLayerAdded}
        />
      );

      await openDialog(user);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('should show error for invalid JSON', async () => {
      const user = userEvent.setup();
      render(
        <CustomLayerEditor
          customLayers={noCustomLayers}
          onLayerAdded={mockOnLayerAdded}
        />
      );

      await openDialog(user);
      // userEvent.type interprets {} as keyboard shortcuts; fireEvent bypasses that.
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'not valid json' },
      });
      await user.click(screen.getByRole('button', { name: /^add layer$/i }));

      await waitFor(() => {
        expect(
          screen.getByText('Invalid JSON. Please check your input.')
        ).toBeInTheDocument();
      });
    });

    it('should show error when layer is missing an id field', async () => {
      const user = userEvent.setup();
      render(
        <CustomLayerEditor
          customLayers={noCustomLayers}
          onLayerAdded={mockOnLayerAdded}
        />
      );

      await openDialog(user);
      fireEvent.change(screen.getByRole('textbox'), {
        target: {
          value: JSON.stringify({ type: 'line', source: 'valhalla-tiles' }),
        },
      });
      await user.click(screen.getByRole('button', { name: /^add layer$/i }));

      await waitFor(() => {
        expect(
          screen.getByText('Layer must have a string "id" field.')
        ).toBeInTheDocument();
      });
    });

    it('should show error when layer id already exists on the map', async () => {
      const user = userEvent.setup();
      mockMap._layers['custom-dead-ends'] = { id: 'custom-dead-ends' };

      render(
        <CustomLayerEditor
          customLayers={noCustomLayers}
          onLayerAdded={mockOnLayerAdded}
        />
      );

      await openDialog(user);
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: VALID_LAYER_JSON },
      });
      await user.click(screen.getByRole('button', { name: /^add layer$/i }));

      await waitFor(() => {
        expect(
          screen.getByText(
            'Layer with id "custom-dead-ends" already exists on the map.'
          )
        ).toBeInTheDocument();
      });
    });

    it('should show error when layer id is already tracked', async () => {
      const user = userEvent.setup();
      const existingLayers = [
        {
          layer: {
            id: 'custom-dead-ends',
            type: 'line',
            source: 'valhalla-tiles',
            'source-layer': 'edges',
          } as LayerSpecification,
          visible: true,
        },
      ];

      render(
        <CustomLayerEditor
          customLayers={existingLayers}
          onLayerAdded={mockOnLayerAdded}
        />
      );

      await openDialog(user);
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: VALID_LAYER_JSON },
      });
      await user.click(screen.getByRole('button', { name: /^add layer$/i }));

      await waitFor(() => {
        expect(
          screen.getByText(
            'A custom layer with id "custom-dead-ends" is already tracked.'
          )
        ).toBeInTheDocument();
      });
    });

    it('should show MapLibre error when map.addLayer throws', async () => {
      const user = userEvent.setup();
      mockMap.addLayer.mockImplementationOnce(() => {
        throw new Error('Source "valhalla-tiles" does not exist.');
      });

      render(
        <CustomLayerEditor
          customLayers={noCustomLayers}
          onLayerAdded={mockOnLayerAdded}
        />
      );

      await openDialog(user);
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: VALID_LAYER_JSON },
      });
      await user.click(screen.getByRole('button', { name: /^add layer$/i }));

      await waitFor(() => {
        expect(
          screen.getByText('Source "valhalla-tiles" does not exist.')
        ).toBeInTheDocument();
      });
    });

    it('should clear error when user edits the textarea', async () => {
      const user = userEvent.setup();
      render(
        <CustomLayerEditor
          customLayers={noCustomLayers}
          onLayerAdded={mockOnLayerAdded}
        />
      );

      await openDialog(user);
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'bad json' },
      });
      await user.click(screen.getByRole('button', { name: /^add layer$/i }));

      await waitFor(() => {
        expect(
          screen.getByText('Invalid JSON. Please check your input.')
        ).toBeInTheDocument();
      });

      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'bad json ' },
      });

      await waitFor(() => {
        expect(
          screen.queryByText('Invalid JSON. Please check your input.')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('successful layer addition', () => {
    it('should call map.addLayer with parsed layer on valid input', async () => {
      const user = userEvent.setup();
      render(
        <CustomLayerEditor
          customLayers={noCustomLayers}
          onLayerAdded={mockOnLayerAdded}
        />
      );

      await openDialog(user);
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: VALID_LAYER_JSON },
      });
      await user.click(screen.getByRole('button', { name: /^add layer$/i }));

      await waitFor(() => {
        expect(mockMap.addLayer).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'custom-dead-ends', type: 'line' })
        );
      });
    });

    it('should call onLayerAdded with the parsed layer on success', async () => {
      const user = userEvent.setup();
      render(
        <CustomLayerEditor
          customLayers={noCustomLayers}
          onLayerAdded={mockOnLayerAdded}
        />
      );

      await openDialog(user);
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: VALID_LAYER_JSON },
      });
      await user.click(screen.getByRole('button', { name: /^add layer$/i }));

      await waitFor(() => {
        expect(mockOnLayerAdded).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'custom-dead-ends' })
        );
      });
    });

    it('should close the dialog on successful submission', async () => {
      const user = userEvent.setup();
      render(
        <CustomLayerEditor
          customLayers={noCustomLayers}
          onLayerAdded={mockOnLayerAdded}
        />
      );

      await openDialog(user);
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: VALID_LAYER_JSON },
      });
      await user.click(screen.getByRole('button', { name: /^add layer$/i }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('cancel behaviour', () => {
    it('should close the dialog when Cancel is clicked', async () => {
      const user = userEvent.setup();
      render(
        <CustomLayerEditor
          customLayers={noCustomLayers}
          onLayerAdded={mockOnLayerAdded}
        />
      );

      await openDialog(user);
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should clear the error when the dialog is closed and reopened', async () => {
      const user = userEvent.setup();
      render(
        <CustomLayerEditor
          customLayers={noCustomLayers}
          onLayerAdded={mockOnLayerAdded}
        />
      );

      await openDialog(user);
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'bad json' },
      });
      await user.click(screen.getByRole('button', { name: /^add layer$/i }));

      await waitFor(() => {
        expect(
          screen.getByText('Invalid JSON. Please check your input.')
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /cancel/i }));
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      await openDialog(user);

      expect(
        screen.queryByText('Invalid JSON. Please check your input.')
      ).not.toBeInTheDocument();
    });

    it('should disable the Add Layer button when textarea is empty', async () => {
      const user = userEvent.setup();
      render(
        <CustomLayerEditor
          customLayers={noCustomLayers}
          onLayerAdded={mockOnLayerAdded}
        />
      );

      await openDialog(user);

      expect(
        screen.getByRole('button', { name: /^add layer$/i })
      ).toBeDisabled();
    });
  });
});
