import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TilesInfoPopup } from './tiles-info-popup';
import type { MapGeoJSONFeature } from 'maplibre-gl';

const createMockFeature = (
  sourceLayer: string,
  properties: Record<string, unknown>
): MapGeoJSONFeature =>
  ({
    type: 'Feature',
    sourceLayer,
    properties,
    geometry: { type: 'Point', coordinates: [0, 0] },
    layer: { id: `valhalla-${sourceLayer}` },
  }) as unknown as MapGeoJSONFeature;

const defaultProps = {
  features: [
    createMockFeature('edges', {
      id: '12345',
      speed: 50,
      road_class: 'primary',
      surface: 'paved',
    }),
  ],
  onClose: vi.fn(),
};

describe('TilesInfoPopup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    expect(() => render(<TilesInfoPopup {...defaultProps} />)).not.toThrow();
  });

  it('should return null when features array is empty', () => {
    const { container } = render(
      <TilesInfoPopup features={[]} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<TilesInfoPopup {...defaultProps} onClose={onClose} />);

    const closeButton = screen.getByRole('button');
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should display "Edge" label for edge features', () => {
    render(<TilesInfoPopup {...defaultProps} />);

    expect(screen.getByText('Edge 1')).toBeInTheDocument();
  });

  it('should display "Node" label for node features', () => {
    const nodeFeature = createMockFeature('nodes', {
      node_id: '67890',
      traffic_signal: true,
    });

    render(<TilesInfoPopup features={[nodeFeature]} onClose={vi.fn()} />);

    expect(screen.getByText('Node 1')).toBeInTheDocument();
  });

  it('should display all properties of a feature', () => {
    render(<TilesInfoPopup {...defaultProps} />);

    expect(screen.getByText('id:')).toBeInTheDocument();
    expect(screen.getByText('12345')).toBeInTheDocument();
    expect(screen.getByText('speed:')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('road_class:')).toBeInTheDocument();
    expect(screen.getByText('primary')).toBeInTheDocument();
    expect(screen.getByText('surface:')).toBeInTheDocument();
    expect(screen.getByText('paved')).toBeInTheDocument();
  });

  it('should display multiple features', () => {
    const features = [
      createMockFeature('edges', { id: '111', speed: 30 }),
      createMockFeature('edges', { id: '222', speed: 60 }),
      createMockFeature('nodes', { node_id: '333', traffic_signal: false }),
    ];

    render(<TilesInfoPopup features={features} onClose={vi.fn()} />);

    expect(screen.getByText('Edge 1')).toBeInTheDocument();
    expect(screen.getByText('Edge 2')).toBeInTheDocument();
    expect(screen.getByText('Node 3')).toBeInTheDocument();
  });

  it('should display boolean values as strings', () => {
    const feature = createMockFeature('nodes', {
      traffic_signal: true,
      toll: false,
    });

    render(<TilesInfoPopup features={[feature]} onClose={vi.fn()} />);

    expect(screen.getByText('true')).toBeInTheDocument();
    expect(screen.getByText('false')).toBeInTheDocument();
  });

  it('should display object values as JSON strings', () => {
    const feature = createMockFeature('edges', {
      metadata: { key: 'value' },
    });

    render(<TilesInfoPopup features={[feature]} onClose={vi.fn()} />);

    expect(screen.getByText('{"key":"value"}')).toBeInTheDocument();
  });

  it('should display "No properties available" when feature has no properties', () => {
    const feature = createMockFeature('edges', {});

    render(<TilesInfoPopup features={[feature]} onClose={vi.fn()} />);

    expect(screen.getByText('No properties available')).toBeInTheDocument();
  });

  it('should handle null properties gracefully', () => {
    const feature = {
      type: 'Feature',
      sourceLayer: 'edges',
      properties: null,
      geometry: { type: 'Point', coordinates: [0, 0] },
      layer: { id: 'valhalla-edges' },
    } as unknown as MapGeoJSONFeature;

    render(<TilesInfoPopup features={[feature]} onClose={vi.fn()} />);

    expect(screen.getByText('No properties available')).toBeInTheDocument();
  });

  it('should display numeric values correctly', () => {
    const feature = createMockFeature('edges', {
      length: 1234.567,
      lanes: 2,
    });

    render(<TilesInfoPopup features={[feature]} onClose={vi.fn()} />);

    expect(screen.getByText('1234.567')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
