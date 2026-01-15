import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoutePlanner } from './route-planner';

const mockToggleDirections = vi.fn();
const mockRefetchDirections = vi.fn();
const mockRefetchIsochrones = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useParams: vi.fn(() => ({ activeTab: 'directions' })),
  useNavigate: vi.fn(() => mockNavigate),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: new Date('2024-01-15T10:30:00'),
    isLoading: false,
    isError: false,
  })),
}));

vi.mock('@/stores/common-store', () => ({
  useCommonStore: vi.fn((selector) =>
    selector({
      directionsPanelOpen: true,
      loading: false,
      toggleDirections: mockToggleDirections,
    })
  ),
}));

vi.mock('@/hooks/use-directions-queries', () => ({
  useDirectionsQuery: vi.fn(() => ({
    refetch: mockRefetchDirections,
  })),
}));

vi.mock('@/hooks/use-isochrones-queries', () => ({
  useIsochronesQuery: vi.fn(() => ({
    refetch: mockRefetchIsochrones,
  })),
}));

vi.mock('./directions/directions', () => ({
  DirectionsControl: vi.fn(() => (
    <div data-testid="mock-directions-control">Directions Control</div>
  )),
}));

vi.mock('./isochrones/isochrones', () => ({
  IsochronesControl: vi.fn(() => (
    <div data-testid="mock-isochrones-control">Isochrones Control</div>
  )),
}));

vi.mock('./tiles/tiles', () => ({
  TilesControl: vi.fn(() => (
    <div data-testid="mock-tiles-control">Tiles Control</div>
  )),
}));

vi.mock('./profile-picker', () => ({
  ProfilePicker: vi.fn(({ onProfileChange }) => (
    <div data-testid="mock-profile-picker">
      <button onClick={() => onProfileChange('car')}>Change to Car</button>
    </div>
  )),
}));

vi.mock('./settings-button', () => ({
  SettingsButton: vi.fn(() => (
    <button data-testid="mock-settings-button">Settings</button>
  )),
}));

describe('RoutePlanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render without crashing', () => {
    expect(() => render(<RoutePlanner />)).not.toThrow();
  });

  it('should render open directions button', () => {
    render(<RoutePlanner />);
    expect(screen.getByTestId('open-directions-button')).toBeInTheDocument();
  });

  it('should display Directions text on trigger when on directions tab', () => {
    render(<RoutePlanner />);
    expect(screen.getByTestId('open-directions-button')).toHaveTextContent(
      'Directions'
    );
  });

  it('should render tab buttons', () => {
    render(<RoutePlanner />);
    expect(screen.getByTestId('directions-tab-button')).toBeInTheDocument();
    expect(screen.getByTestId('isochrones-tab-button')).toBeInTheDocument();
    expect(screen.getByTestId('tiles-tab-button')).toBeInTheDocument();
  });

  it('should render close button', () => {
    render(<RoutePlanner />);
    expect(screen.getByTestId('close-directions-button')).toBeInTheDocument();
  });

  it('should call toggleDirections when close button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<RoutePlanner />);

    await user.click(screen.getByTestId('close-directions-button'));

    expect(mockToggleDirections).toHaveBeenCalled();
  });

  it('should call toggleDirections when open button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<RoutePlanner />);

    await user.click(screen.getByTestId('open-directions-button'));

    expect(mockToggleDirections).toHaveBeenCalled();
  });

  it('should render ProfilePicker', () => {
    render(<RoutePlanner />);
    expect(screen.getByTestId('mock-profile-picker')).toBeInTheDocument();
  });

  it('should render SettingsButton', () => {
    render(<RoutePlanner />);
    expect(screen.getByTestId('mock-settings-button')).toBeInTheDocument();
  });

  it('should render DirectionsControl when on directions tab', () => {
    render(<RoutePlanner />);
    expect(screen.getByTestId('mock-directions-control')).toBeInTheDocument();
  });

  it('should navigate when tab is changed', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<RoutePlanner />);

    await user.click(screen.getByTestId('isochrones-tab-button'));

    expect(mockNavigate).toHaveBeenCalledWith({
      params: { activeTab: 'isochrones' },
    });
  });

  it('should navigate and refetch when profile changes', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<RoutePlanner />);

    await user.click(screen.getByText('Change to Car'));

    expect(mockNavigate).toHaveBeenCalledWith({
      search: expect.any(Function),
      replace: true,
    });
    expect(mockRefetchDirections).toHaveBeenCalled();
  });

  it('should refetch isochrones after delay when profile changes on directions tab', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<RoutePlanner />);

    await user.click(screen.getByText('Change to Car'));

    expect(mockRefetchIsochrones).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(mockRefetchIsochrones).toHaveBeenCalled();
    });
  });

  it('should display last update date when loaded', () => {
    render(<RoutePlanner />);
    expect(screen.getByText(/Last Data Update:/)).toBeInTheDocument();
    expect(screen.getByText(/2024-01-15/)).toBeInTheDocument();
  });

  it('should navigate to tiles tab when tiles tab button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<RoutePlanner />);

    await user.click(screen.getByTestId('tiles-tab-button'));

    expect(mockNavigate).toHaveBeenCalledWith({
      params: { activeTab: 'tiles' },
    });
  });

  describe('when on tiles tab', () => {
    beforeEach(async () => {
      const router = await import('@tanstack/react-router');
      vi.mocked(router.useParams).mockReturnValue({ activeTab: 'tiles' });
    });

    it('should display Tiles text on trigger button', () => {
      render(<RoutePlanner />);
      expect(screen.getByTestId('open-directions-button')).toHaveTextContent(
        'Tiles'
      );
    });

    it('should not render ProfilePicker on tiles tab', () => {
      render(<RoutePlanner />);
      expect(
        screen.queryByTestId('mock-profile-picker')
      ).not.toBeInTheDocument();
    });

    it('should not render SettingsButton on tiles tab', () => {
      render(<RoutePlanner />);
      expect(
        screen.queryByTestId('mock-settings-button')
      ).not.toBeInTheDocument();
    });

    it('should not display last update date on tiles tab', () => {
      render(<RoutePlanner />);
      expect(screen.queryByText(/Last Data Update:/)).not.toBeInTheDocument();
    });
  });
});
