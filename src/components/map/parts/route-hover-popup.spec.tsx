import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouteHoverPopup } from './route-hover-popup';
import type { Summary } from '@/components/types';

vi.mock('react-map-gl/maplibre', () => ({
  Popup: ({
    children,
    longitude,
    latitude,
  }: {
    children: React.ReactNode;
    longitude: number;
    latitude: number;
  }) => (
    <div
      data-testid="popup"
      data-longitude={longitude}
      data-latitude={latitude}
    >
      {children}
    </div>
  ),
}));

const createSummary = (overrides: Partial<Summary> = {}): Summary => ({
  has_time_restrictions: false,
  has_toll: false,
  has_highway: false,
  has_ferry: false,
  min_lat: 50,
  min_lon: 10,
  max_lat: 51,
  max_lon: 11,
  time: 3600,
  length: 25.5,
  cost: 100,
  ...overrides,
});

const defaultProps = {
  lng: 10.5,
  lat: 50.5,
  summary: createSummary(),
};

describe('RouteHoverPopup', () => {
  it('should render without crashing', () => {
    expect(() => render(<RouteHoverPopup {...defaultProps} />)).not.toThrow();
  });

  it('should render Popup at correct coordinates', () => {
    render(<RouteHoverPopup {...defaultProps} />);

    const popup = screen.getByTestId('popup');
    expect(popup).toHaveAttribute('data-longitude', '10.5');
    expect(popup).toHaveAttribute('data-latitude', '50.5');
  });

  it('should display "Route Summary" title', () => {
    render(<RouteHoverPopup {...defaultProps} />);

    expect(screen.getByText('Route Summary')).toBeInTheDocument();
  });

  it('should display distance in km with 1 decimal for short routes', () => {
    render(
      <RouteHoverPopup
        {...defaultProps}
        summary={createSummary({ length: 25.5 })}
      />
    );

    expect(screen.getByText('25.5 km')).toBeInTheDocument();
  });

  it('should display distance in km with 0 decimals for long routes', () => {
    render(
      <RouteHoverPopup
        {...defaultProps}
        summary={createSummary({ length: 1500.7 })}
      />
    );

    expect(screen.getByText('1501 km')).toBeInTheDocument();
  });

  it('should display formatted duration', () => {
    render(
      <RouteHoverPopup
        {...defaultProps}
        summary={createSummary({ time: 3660 })}
      />
    );

    expect(screen.getByText('1h 1m')).toBeInTheDocument();
  });

  it('should display duration in minutes for short trips', () => {
    render(
      <RouteHoverPopup
        {...defaultProps}
        summary={createSummary({ time: 900 })}
      />
    );

    expect(screen.getByText('15m')).toBeInTheDocument();
  });
});
