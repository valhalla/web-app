import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TilesProperty } from './tiles-property';

describe('TilesProperty', () => {
  describe('OSM ID links', () => {
    it('should render osm_id as a link to OpenStreetMap', () => {
      render(<TilesProperty propertyKey="osm_id" value={730703719} />);

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
      render(<TilesProperty propertyKey="osm_way_id" value={123456789} />);

      const link = screen.getByRole('link', { name: /123456789/ });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute(
        'href',
        'https://www.openstreetmap.org/way/123456789'
      );
    });

    it('should handle string osm_id values', () => {
      render(<TilesProperty propertyKey="osm_id" value="999999" />);

      const link = screen.getByRole('link', { name: /999999/ });
      expect(link).toHaveAttribute(
        'href',
        'https://www.openstreetmap.org/way/999999'
      );
    });
  });

  describe('property name mappings', () => {
    it('should map road_class to human-readable name with badge', () => {
      const { rerender } = render(
        <TilesProperty propertyKey="road_class" value={0} />
      );
      expect(screen.getByText('Motorway')).toBeInTheDocument();
      expect(screen.getByText('(0)')).toBeInTheDocument();

      rerender(<TilesProperty propertyKey="road_class" value={2} />);
      expect(screen.getByText('Primary')).toBeInTheDocument();
      expect(screen.getByText('(2)')).toBeInTheDocument();
    });

    it('should map use to human-readable name with badge', () => {
      const { rerender } = render(
        <TilesProperty propertyKey="use" value={0} />
      );
      expect(screen.getByText('Road')).toBeInTheDocument();

      rerender(<TilesProperty propertyKey="use" value={10} />);
      expect(screen.getByText('Cycleway')).toBeInTheDocument();
    });

    it('should map hov_type to human-readable name', () => {
      render(<TilesProperty propertyKey="hov_type" value={1} />);
      expect(screen.getByText('HOV2')).toBeInTheDocument();
    });

    it('should map speed_type to human-readable name', () => {
      render(<TilesProperty propertyKey="speed_type" value={0} />);
      expect(screen.getByText('Tagged')).toBeInTheDocument();
    });

    it('should map surface to human-readable name', () => {
      render(<TilesProperty propertyKey="surface" value={0} />);
      expect(screen.getByText('Paved Smooth')).toBeInTheDocument();
    });

    it('should map cyclelane to human-readable name', () => {
      render(<TilesProperty propertyKey="cyclelane" value={2} />);
      expect(screen.getByText('Dedicated')).toBeInTheDocument();
    });

    it('should map sac_scale to human-readable name', () => {
      render(<TilesProperty propertyKey="sac_scale" value={3} />);
      expect(screen.getByText('Demanding Mountain Hiking')).toBeInTheDocument();
    });

    it('should map node_type to human-readable name', () => {
      render(<TilesProperty propertyKey="node_type" value={7} />);
      expect(screen.getByText('Motor Way Junction')).toBeInTheDocument();
    });

    it('should map intersection_type to human-readable name', () => {
      render(<TilesProperty propertyKey="intersection_type" value={1} />);
      expect(screen.getByText('Fork')).toBeInTheDocument();
    });

    it('should return Unknown for unmapped numeric values', () => {
      render(<TilesProperty propertyKey="road_class" value={99} />);
      expect(screen.getByText('Unknown')).toBeInTheDocument();
      expect(screen.getByText('(99)')).toBeInTheDocument();
    });
  });

  describe('access bitmask properties', () => {
    it('should decode access:fwd bitmask to badges', () => {
      // 1 (Auto) + 2 (Pedestrian) + 4 (Bicycle) = 7
      render(<TilesProperty propertyKey="access:fwd" value={7} />);
      expect(screen.getByText('Auto')).toBeInTheDocument();
      expect(screen.getByText('Pedestrian')).toBeInTheDocument();
      expect(screen.getByText('Bicycle')).toBeInTheDocument();
    });

    it('should decode access:bwd bitmask to badges', () => {
      // 8 (Truck) + 64 (Bus) = 72
      render(<TilesProperty propertyKey="access:bwd" value={72} />);
      expect(screen.getByText('Truck')).toBeInTheDocument();
      expect(screen.getByText('Bus')).toBeInTheDocument();
      expect(screen.queryByText('Auto')).not.toBeInTheDocument();
    });

    it('should show all access types for full bitmask', () => {
      // All flags: 1+2+4+8+16+32+64+128+256+512+1024 = 2047
      render(<TilesProperty propertyKey="access:fwd" value={2047} />);
      expect(screen.getByText('Auto')).toBeInTheDocument();
      expect(screen.getByText('Pedestrian')).toBeInTheDocument();
      expect(screen.getByText('Bicycle')).toBeInTheDocument();
      expect(screen.getByText('Truck')).toBeInTheDocument();
      expect(screen.getByText('Emergency')).toBeInTheDocument();
      expect(screen.getByText('Taxi')).toBeInTheDocument();
      expect(screen.getByText('Bus')).toBeInTheDocument();
      expect(screen.getByText('HOV')).toBeInTheDocument();
      expect(screen.getByText('Wheelchair')).toBeInTheDocument();
      expect(screen.getByText('Moped')).toBeInTheDocument();
      expect(screen.getByText('Motorcycle')).toBeInTheDocument();
    });

    it('should show None for zero bitmask', () => {
      render(<TilesProperty propertyKey="access:fwd" value={0} />);
      expect(screen.getByText('None')).toBeInTheDocument();
    });
  });

  describe('bike_network bitmask properties', () => {
    it('should decode bike_network bitmask to badges', () => {
      // 1 (National) + 4 (Local) = 5
      render(<TilesProperty propertyKey="bike_network" value={5} />);
      expect(screen.getByText('National')).toBeInTheDocument();
      expect(screen.getByText('Local')).toBeInTheDocument();
      expect(screen.queryByText('Regional')).not.toBeInTheDocument();
    });

    it('should show all bike network types for full bitmask', () => {
      // All flags: 1+2+4+8 = 15
      render(<TilesProperty propertyKey="bike_network" value={15} />);
      expect(screen.getByText('National')).toBeInTheDocument();
      expect(screen.getByText('Regional')).toBeInTheDocument();
      expect(screen.getByText('Local')).toBeInTheDocument();
      expect(screen.getByText('Mountain')).toBeInTheDocument();
    });

    it('should show None for zero bike_network', () => {
      render(<TilesProperty propertyKey="bike_network" value={0} />);
      expect(screen.getByText('None')).toBeInTheDocument();
    });
  });

  describe('boolean values', () => {
    it('should show Yes with check icon for true', () => {
      const { container } = render(
        <TilesProperty propertyKey="tunnel" value={true} />
      );
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(container.querySelector('.text-emerald-600')).toBeInTheDocument();
    });

    it('should show No with X icon for false', () => {
      const { container } = render(
        <TilesProperty propertyKey="tunnel" value={false} />
      );
      expect(screen.getByText('No')).toBeInTheDocument();
      expect(container.querySelector('.text-red-600')).toBeInTheDocument();
    });
  });

  describe('length values', () => {
    it('should show length with meters unit', () => {
      render(<TilesProperty propertyKey="length" value={76} />);
      expect(screen.getByText('76')).toBeInTheDocument();
      expect(screen.getByText('m')).toBeInTheDocument();
    });

    it('should handle decimal length values', () => {
      render(<TilesProperty propertyKey="length" value={1234.567} />);
      expect(screen.getByText('1234.567')).toBeInTheDocument();
    });
  });

  describe('speed values', () => {
    it('should show speed with km/h unit', () => {
      render(<TilesProperty propertyKey="speed" value={50} />);
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('km/h')).toBeInTheDocument();
    });

    it('should handle max_speed key', () => {
      render(<TilesProperty propertyKey="max_speed" value={120} />);
      expect(screen.getByText('120')).toBeInTheDocument();
    });
  });

  describe('live traffic breakpoints and congestion', () => {
    it('should show speed without km/h unit', () => {
      render(
        <TilesProperty
          propertyKey="live_traffic:forward:congestion0"
          value={50}
        />
      );
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.queryByText('km/h')).not.toBeInTheDocument();
    });
  });

  describe('slope values', () => {
    it('should show slope with degree unit', () => {
      render(<TilesProperty propertyKey="max_up_slope" value={5} />);
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('°')).toBeInTheDocument();
    });

    it('should handle max_down_slope key', () => {
      render(<TilesProperty propertyKey="max_down_slope" value={3} />);
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('object values', () => {
    it('should stringify object values in code block', () => {
      render(<TilesProperty propertyKey="metadata" value={{ key: 'value' }} />);
      expect(screen.getByText('{"key":"value"}')).toBeInTheDocument();
    });

    it('should stringify array values', () => {
      render(<TilesProperty propertyKey="tags" value={[1, 2, 3]} />);
      expect(screen.getByText('[1,2,3]')).toBeInTheDocument();
    });
  });

  describe('default string conversion', () => {
    it('should render numbers', () => {
      render(<TilesProperty propertyKey="tile_id" value={3196} />);
      expect(screen.getByText('3196')).toBeInTheDocument();
    });

    it('should pass through string values', () => {
      render(<TilesProperty propertyKey="name" value="Main Street" />);
      expect(screen.getByText('Main Street')).toBeInTheDocument();
    });
  });
});
