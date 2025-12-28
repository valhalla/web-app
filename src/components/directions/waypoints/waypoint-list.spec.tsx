import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Waypoints } from './waypoint-list';

const mockSetWaypoint = vi.fn();
const mockRefetchDirections = vi.fn();

vi.mock('@/stores/directions-store', () => ({
  useDirectionsStore: vi.fn((selector) =>
    selector({
      waypoints: [
        { id: 'wp-1', userInput: 'Berlin', geocodeResults: [] },
        { id: 'wp-2', userInput: 'Munich', geocodeResults: [] },
        { id: 'wp-3', userInput: 'Hamburg', geocodeResults: [] },
      ],
      setWaypoint: mockSetWaypoint,
    })
  ),
}));

vi.mock('@/hooks/use-directions-queries', () => ({
  useDirectionsQuery: vi.fn(() => ({
    refetch: mockRefetchDirections,
  })),
}));

vi.mock('./waypoint-item', () => ({
  Waypoint: vi.fn(({ id, index }) => (
    <div data-testid={`mock-waypoint-${index}`} data-id={id}>
      Waypoint {index + 1}
    </div>
  )),
}));

describe('Waypoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    expect(() => render(<Waypoints />)).not.toThrow();
  });

  it('should render all waypoints', () => {
    render(<Waypoints />);

    expect(screen.getByTestId('mock-waypoint-0')).toBeInTheDocument();
    expect(screen.getByTestId('mock-waypoint-1')).toBeInTheDocument();
    expect(screen.getByTestId('mock-waypoint-2')).toBeInTheDocument();
  });

  it('should render waypoints in correct order', () => {
    render(<Waypoints />);

    const waypoints = screen.getAllByTestId(/mock-waypoint-/);
    expect(waypoints).toHaveLength(3);
    expect(waypoints[0]).toHaveAttribute('data-id', 'wp-1');
    expect(waypoints[1]).toHaveAttribute('data-id', 'wp-2');
    expect(waypoints[2]).toHaveAttribute('data-id', 'wp-3');
  });

  it('should render list container with correct role', () => {
    render(<Waypoints />);
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('should have correct aria-label on list', () => {
    render(<Waypoints />);
    expect(screen.getByRole('list')).toHaveAttribute(
      'aria-label',
      'Waypoints list'
    );
  });

  it('should render correct number of waypoint components', () => {
    render(<Waypoints />);
    expect(screen.getAllByText(/Waypoint \d+/)).toHaveLength(3);
  });
});
