import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Waypoint } from './waypoint-item';

const mockReceiveGeocodeResults = vi.fn();
const mockUpdateTextInput = vi.fn();
const mockDoRemoveWaypoint = vi.fn();
const mockRefetchDirections = vi.fn();

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: vi.fn(() => ({
    attributes: { role: 'button' },
    listeners: { onKeyDown: vi.fn() },
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: vi.fn(() => null),
    },
  },
}));

vi.mock('@/stores/directions-store', () => ({
  useDirectionsStore: vi.fn((selector) =>
    selector({
      waypoints: [
        {
          id: 'wp-1',
          userInput: 'Berlin',
          geocodeResults: [
            { title: 'Berlin, Germany', addressindex: 0, lngLat: [13.4, 52.5] },
          ],
        },
        {
          id: 'wp-2',
          userInput: 'Munich',
          geocodeResults: [],
        },
      ],
      receiveGeocodeResults: mockReceiveGeocodeResults,
      updateTextInput: mockUpdateTextInput,
      doRemoveWaypoint: mockDoRemoveWaypoint,
    })
  ),
  defaultWaypoints: [
    { id: 'default-1', userInput: '', geocodeResults: [] },
    { id: 'default-2', userInput: '', geocodeResults: [] },
  ],
}));

vi.mock('@/hooks/use-directions-queries', () => ({
  useDirectionsQuery: vi.fn(() => ({
    refetch: mockRefetchDirections,
  })),
}));

vi.mock('@/components/ui/waypoint-search', () => ({
  WaypointSearch: vi.fn(
    ({
      userInput,
      onGeocodeResults,
      onResultSelect,
      leftContent,
      rightContent,
      testId,
    }) => (
      <div data-testid={testId}>
        <span data-testid="waypoint-user-input">{userInput}</span>
        <button
          data-testid="trigger-geocode"
          onClick={() =>
            onGeocodeResults([
              { title: 'Test Result', addressindex: 0, lngLat: [0, 0] },
            ])
          }
        >
          Trigger Geocode
        </button>
        <button
          data-testid="select-result"
          onClick={() =>
            onResultSelect({
              title: 'Selected',
              addressindex: 0,
              lngLat: [0, 0],
            })
          }
        >
          Select Result
        </button>
        {leftContent}
        {rightContent}
      </div>
    )
  ),
}));

describe('Waypoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    expect(() => render(<Waypoint id="wp-1" index={0} />)).not.toThrow();
  });

  it('should render waypoint with correct index number', () => {
    render(<Waypoint id="wp-1" index={0} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should render waypoint input with testId', () => {
    render(<Waypoint id="wp-1" index={0} />);
    expect(screen.getByTestId('waypoint-input-0')).toBeInTheDocument();
  });

  it('should display user input value', () => {
    render(<Waypoint id="wp-1" index={0} />);
    expect(screen.getByTestId('waypoint-user-input')).toHaveTextContent(
      'Berlin'
    );
  });

  it('should render drag handle button', () => {
    render(<Waypoint id="wp-1" index={0} />);
    expect(
      screen.getByRole('button', { name: /Drag handle for waypoint 1/i })
    ).toBeInTheDocument();
  });

  it('should render remove waypoint button', () => {
    render(<Waypoint id="wp-1" index={0} />);
    expect(screen.getByTestId('remove-waypoint-button')).toBeInTheDocument();
  });

  it('should call receiveGeocodeResults when geocode results are received', async () => {
    const user = userEvent.setup();
    render(<Waypoint id="wp-1" index={0} />);

    await user.click(screen.getByTestId('trigger-geocode'));

    expect(mockReceiveGeocodeResults).toHaveBeenCalledWith({
      addresses: [{ title: 'Test Result', addressindex: 0, lngLat: [0, 0] }],
      index: 0,
    });
  });

  it('should call updateTextInput and refetchDirections when result is selected', async () => {
    const user = userEvent.setup();
    render(<Waypoint id="wp-1" index={0} />);

    await user.click(screen.getByTestId('select-result'));

    expect(mockUpdateTextInput).toHaveBeenCalledWith({
      inputValue: 'Selected',
      index: 0,
      addressindex: 0,
    });
    expect(mockRefetchDirections).toHaveBeenCalled();
  });

  it('should call doRemoveWaypoint and refetchDirections when remove button is clicked', async () => {
    const user = userEvent.setup();
    render(<Waypoint id="wp-1" index={0} />);

    await user.click(screen.getByTestId('remove-waypoint-button'));

    expect(mockDoRemoveWaypoint).toHaveBeenCalledWith({ index: 0 });
    expect(mockRefetchDirections).toHaveBeenCalled();
  });

  it('should have correct aria-label for waypoint', () => {
    render(<Waypoint id="wp-1" index={0} />);
    expect(screen.getByRole('listitem')).toHaveAttribute(
      'aria-label',
      'Waypoint 1'
    );
  });

  it('should render second waypoint with correct index', () => {
    render(<Waypoint id="wp-2" index={1} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveAttribute(
      'aria-label',
      'Waypoint 2'
    );
  });
});
