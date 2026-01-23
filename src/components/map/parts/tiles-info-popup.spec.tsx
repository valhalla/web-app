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

    expect(screen.getByText('Edge')).toBeInTheDocument();
  });

  it('should display "Node" label for node features', () => {
    const nodeFeature = createMockFeature('nodes', {
      node_id: '67890',
      traffic_signal: true,
    });

    render(<TilesInfoPopup features={[nodeFeature]} onClose={vi.fn()} />);

    expect(screen.getByText('Node')).toBeInTheDocument();
  });

  it('should display all properties of a feature', () => {
    render(<TilesInfoPopup {...defaultProps} />);

    expect(screen.getByText('id')).toBeInTheDocument();
    expect(screen.getByText('12345')).toBeInTheDocument();
    expect(screen.getByText('speed')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('road_class')).toBeInTheDocument();
    expect(screen.getByText('primary')).toBeInTheDocument();
    expect(screen.getByText('surface')).toBeInTheDocument();
    expect(screen.getByText('paved')).toBeInTheDocument();
  });

  it('should display multiple features with numbered labels', () => {
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

  it('should display boolean values with indicators', () => {
    const feature = createMockFeature('nodes', {
      traffic_signal: true,
      toll: false,
    });

    render(<TilesInfoPopup features={[feature]} onClose={vi.fn()} />);

    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
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
    expect(screen.getByText('m')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should map road_class numeric values to names', () => {
    const feature = createMockFeature('edges', {
      road_class: 2,
    });

    render(<TilesInfoPopup features={[feature]} onClose={vi.fn()} />);

    expect(screen.getByText('Primary')).toBeInTheDocument();
    expect(screen.getByText('(2)')).toBeInTheDocument();
  });

  it('should map use numeric values to names', () => {
    const feature = createMockFeature('edges', {
      use: 10,
    });

    render(<TilesInfoPopup features={[feature]} onClose={vi.fn()} />);

    expect(screen.getByText('Cycleway')).toBeInTheDocument();
    expect(screen.getByText('(10)')).toBeInTheDocument();
  });

  it('should display Unknown for unmapped numeric values', () => {
    const feature = createMockFeature('edges', {
      road_class: 99,
    });

    render(<TilesInfoPopup features={[feature]} onClose={vi.fn()} />);

    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.getByText('(99)')).toBeInTheDocument();
  });

  it('should display slope values with degree symbol', () => {
    const feature = createMockFeature('edges', {
      max_up_slope: 5,
      max_down_slope: 3,
    });

    render(<TilesInfoPopup features={[feature]} onClose={vi.fn()} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getAllByText('°').length).toBe(2);
  });

  it('should display access properties with indicators', () => {
    const feature = createMockFeature('edges', {
      'access:car': true,
      'access:bicycle': false,
    });

    const { container } = render(
      <TilesInfoPopup features={[feature]} onClose={vi.fn()} />
    );

    expect(container.querySelector('.text-emerald-600')).toBeInTheDocument();
    expect(container.querySelector('.text-red-600')).toBeInTheDocument();
  });

  it('should map surface numeric values to names', () => {
    const feature = createMockFeature('edges', {
      surface: 0,
    });

    render(<TilesInfoPopup features={[feature]} onClose={vi.fn()} />);

    expect(screen.getByText('Paved Smooth')).toBeInTheDocument();
    expect(screen.getByText('(0)')).toBeInTheDocument();
  });

  it('should map cyclelane numeric values to names', () => {
    const feature = createMockFeature('edges', {
      cyclelane: 2,
    });

    render(<TilesInfoPopup features={[feature]} onClose={vi.fn()} />);

    expect(screen.getByText('Dedicated')).toBeInTheDocument();
    expect(screen.getByText('(2)')).toBeInTheDocument();
  });

  it('should map sac_scale numeric values to names', () => {
    const feature = createMockFeature('edges', {
      sac_scale: 3,
    });

    render(<TilesInfoPopup features={[feature]} onClose={vi.fn()} />);

    expect(screen.getByText('Demanding Mountain Hiking')).toBeInTheDocument();
    expect(screen.getByText('(3)')).toBeInTheDocument();
  });

  it('should map node_type numeric values to names', () => {
    const feature = createMockFeature('nodes', {
      node_type: 7,
    });

    render(<TilesInfoPopup features={[feature]} onClose={vi.fn()} />);

    expect(screen.getByText('Motor Way Junction')).toBeInTheDocument();
    expect(screen.getByText('(7)')).toBeInTheDocument();
  });

  it('should map intersection_type numeric values to names', () => {
    const feature = createMockFeature('nodes', {
      intersection_type: 1,
    });

    render(<TilesInfoPopup features={[feature]} onClose={vi.fn()} />);

    expect(screen.getByText('Fork')).toBeInTheDocument();
    expect(screen.getByText('(1)')).toBeInTheDocument();
  });

  it('should render osm_id as a link to OpenStreetMap', () => {
    const feature = createMockFeature('edges', {
      osm_id: 730703719,
    });

    render(<TilesInfoPopup features={[feature]} onClose={vi.fn()} />);

    const link = screen.getByRole('link', { name: /730703719/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      'href',
      'https://www.openstreetmap.org/way/730703719'
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should render osm_way_id as a link to OpenStreetMap', () => {
    const feature = createMockFeature('edges', {
      osm_way_id: 123456789,
    });

    render(<TilesInfoPopup features={[feature]} onClose={vi.fn()} />);

    const link = screen.getByRole('link', { name: /123456789/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      'href',
      'https://www.openstreetmap.org/way/123456789'
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should render properties in a table', () => {
    const { container } = render(<TilesInfoPopup {...defaultProps} />);

    expect(container.querySelector('table')).toBeInTheDocument();
    expect(container.querySelectorAll('tr').length).toBeGreaterThan(0);
  });
});
