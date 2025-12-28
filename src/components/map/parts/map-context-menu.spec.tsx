import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapContextMenu } from './map-context-menu';

const mockAddWaypointAtIndex = vi.fn();
const mockUseDirectionsStore = vi.fn();

vi.mock('@/stores/directions-store', () => ({
  useDirectionsStore: (selector: (state: unknown) => unknown) =>
    mockUseDirectionsStore(selector),
}));

const defaultProps = {
  activeTab: 'directions',
  onAddWaypoint: vi.fn(),
  onAddIsoWaypoint: vi.fn(),
  popupLocation: { lng: 10.5, lat: 50.5 },
};

describe('MapContextMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDirectionsStore.mockImplementation((selector) => {
      const state = {
        waypoints: [{}, {}, {}],
        addWaypointAtIndex: mockAddWaypointAtIndex,
      };
      return selector(state);
    });
  });

  describe('directions tab', () => {
    it('should render without crashing', () => {
      expect(() => render(<MapContextMenu {...defaultProps} />)).not.toThrow();
    });

    it('should render "Directions from here" button', () => {
      render(<MapContextMenu {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: 'Directions from here' })
      ).toBeInTheDocument();
    });

    it('should render "Add as via point" button', () => {
      render(<MapContextMenu {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: 'Add as via point' })
      ).toBeInTheDocument();
    });

    it('should render "Directions to here" button', () => {
      render(<MapContextMenu {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: 'Directions to here' })
      ).toBeInTheDocument();
    });

    it('should call onAddWaypoint(0) when "Directions from here" is clicked', async () => {
      const user = userEvent.setup();
      const onAddWaypoint = vi.fn();

      render(
        <MapContextMenu {...defaultProps} onAddWaypoint={onAddWaypoint} />
      );

      await user.click(
        screen.getByRole('button', { name: 'Directions from here' })
      );

      expect(onAddWaypoint).toHaveBeenCalledWith(0);
    });

    it('should call onAddWaypoint with last index when "Directions to here" is clicked', async () => {
      const user = userEvent.setup();
      const onAddWaypoint = vi.fn();

      render(
        <MapContextMenu {...defaultProps} onAddWaypoint={onAddWaypoint} />
      );

      await user.click(
        screen.getByRole('button', { name: 'Directions to here' })
      );

      expect(onAddWaypoint).toHaveBeenCalledWith(2);
    });

    it('should add waypoint and call onAddWaypoint when "Add as via point" is clicked', async () => {
      const user = userEvent.setup();
      const onAddWaypoint = vi.fn();
      const popupLocation = { lng: 10.5, lat: 50.5 };

      render(
        <MapContextMenu
          {...defaultProps}
          onAddWaypoint={onAddWaypoint}
          popupLocation={popupLocation}
        />
      );

      await user.click(
        screen.getByRole('button', { name: 'Add as via point' })
      );

      expect(mockAddWaypointAtIndex).toHaveBeenCalledWith({
        index: 2,
        placeholder: popupLocation,
      });
      expect(onAddWaypoint).toHaveBeenCalledWith(2);
    });
  });

  describe('isochrones tab', () => {
    it('should render "Set center here" button', () => {
      render(<MapContextMenu {...defaultProps} activeTab="isochrones" />);

      expect(
        screen.getByRole('button', { name: 'Set center here' })
      ).toBeInTheDocument();
    });

    it('should not render directions buttons', () => {
      render(<MapContextMenu {...defaultProps} activeTab="isochrones" />);

      expect(
        screen.queryByRole('button', { name: 'Directions from here' })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Add as via point' })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Directions to here' })
      ).not.toBeInTheDocument();
    });

    it('should call onAddIsoWaypoint when "Set center here" is clicked', async () => {
      const user = userEvent.setup();
      const onAddIsoWaypoint = vi.fn();

      render(
        <MapContextMenu
          {...defaultProps}
          activeTab="isochrones"
          onAddIsoWaypoint={onAddIsoWaypoint}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Set center here' }));

      expect(onAddIsoWaypoint).toHaveBeenCalled();
    });
  });
});
