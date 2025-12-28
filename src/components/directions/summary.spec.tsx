import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Summary } from './summary';
import type { Summary as SummaryType } from '@/components/types';

const mockToggleShowOnMap = vi.fn();

const mockResults = {
  show: { '-1': true, '0': true, '1': false } as Record<string, boolean>,
};

vi.mock('@/stores/directions-store', () => ({
  useDirectionsStore: vi.fn((selector) =>
    selector({
      results: mockResults,
      inclineDeclineTotal: null,
      toggleShowOnMap: mockToggleShowOnMap,
    })
  ),
}));

const createMockSummary = (
  overrides: Partial<SummaryType> = {}
): SummaryType => ({
  has_time_restrictions: false,
  has_toll: false,
  has_highway: false,
  has_ferry: false,
  min_lat: 48.0,
  min_lon: 10.0,
  max_lat: 52.5,
  max_lon: 13.4,
  time: 3600,
  length: 150.5,
  cost: 100,
  ...overrides,
});

describe('Summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.show = { '-1': true, '0': true, '1': false };
  });

  it('should render without crashing', () => {
    const summary = createMockSummary();
    expect(() =>
      render(<Summary summary={summary} title="Main Route" index={-1} />)
    ).not.toThrow();
  });

  it('should display route title', () => {
    const summary = createMockSummary();
    render(<Summary summary={summary} title="Main Route" index={-1} />);

    expect(screen.getByText('Main Route')).toBeInTheDocument();
  });

  it('should display alternate route title', () => {
    const summary = createMockSummary();
    render(<Summary summary={summary} title="Alternate Route #1" index={0} />);

    expect(screen.getByText('Alternate Route #1')).toBeInTheDocument();
  });

  it('should display "No route found" when summary is null', () => {
    render(
      <Summary
        summary={null as unknown as SummaryType}
        title="Route"
        index={-1}
      />
    );

    expect(screen.getByText('No route found')).toBeInTheDocument();
  });

  it('should display route length in km', () => {
    const summary = createMockSummary({ length: 150.5 });
    render(<Summary summary={summary} title="Route" index={-1} />);

    expect(screen.getByText('150.5 km')).toBeInTheDocument();
    expect(screen.getByText('Route length')).toBeInTheDocument();
  });

  it('should round length for values over 1000 km', () => {
    const summary = createMockSummary({ length: 1234.567 });
    render(<Summary summary={summary} title="Route" index={-1} />);

    expect(screen.getByText('1235 km')).toBeInTheDocument();
  });

  it('should display route duration', () => {
    const summary = createMockSummary({ time: 3600 });
    render(<Summary summary={summary} title="Route" index={-1} />);

    expect(screen.getByText('Route duration')).toBeInTheDocument();
  });

  it('should render show on map switch', () => {
    const summary = createMockSummary();
    render(<Summary summary={summary} title="Route" index={-1} />);

    expect(screen.getByRole('switch')).toBeInTheDocument();
    expect(screen.getByLabelText('Show on map')).toBeInTheDocument();
  });

  it('should have switch checked when show is true', () => {
    const summary = createMockSummary();
    render(<Summary summary={summary} title="Route" index={-1} />);

    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('should have switch unchecked when show is false', () => {
    mockResults.show = { '-1': false };
    const summary = createMockSummary();
    render(<Summary summary={summary} title="Route" index={-1} />);

    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('should call toggleShowOnMap when switch is toggled', async () => {
    const user = userEvent.setup();
    const summary = createMockSummary();
    render(<Summary summary={summary} title="Route" index={-1} />);

    await user.click(screen.getByRole('switch'));

    expect(mockToggleShowOnMap).toHaveBeenCalledWith({ show: false, idx: -1 });
  });

  it('should call toggleShowOnMap with correct index for alternate', async () => {
    const user = userEvent.setup();
    const summary = createMockSummary();
    render(<Summary summary={summary} title="Alternate" index={0} />);

    await user.click(screen.getByRole('switch'));

    expect(mockToggleShowOnMap).toHaveBeenCalledWith({ show: false, idx: 0 });
  });

  it('should display highway attribute when has_highway is true', () => {
    const summary = createMockSummary({ has_highway: true });
    render(<Summary summary={summary} title="Route" index={-1} />);

    expect(screen.getByText('Route includes highway')).toBeInTheDocument();
  });

  it('should display ferry attribute when has_ferry is true', () => {
    const summary = createMockSummary({ has_ferry: true });
    render(<Summary summary={summary} title="Route" index={-1} />);

    expect(screen.getByText('Route includes ferry')).toBeInTheDocument();
  });

  it('should display toll attribute when has_toll is true', () => {
    const summary = createMockSummary({ has_toll: true });
    render(<Summary summary={summary} title="Route" index={-1} />);

    expect(screen.getByText('Route includes toll')).toBeInTheDocument();
  });

  it('should not display attributes when all are false', () => {
    const summary = createMockSummary({
      has_highway: false,
      has_ferry: false,
      has_toll: false,
    });
    render(<Summary summary={summary} title="Route" index={-1} />);

    expect(
      screen.queryByText('Route includes highway')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Route includes ferry')).not.toBeInTheDocument();
    expect(screen.queryByText('Route includes toll')).not.toBeInTheDocument();
  });
});

describe('Summary with incline/decline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display incline and decline when available', async () => {
    const directionsStore = await import('@/stores/directions-store');
    vi.mocked(directionsStore.useDirectionsStore).mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (selector: any) =>
        selector({
          results: { ...mockResults, data: null },
          inclineDeclineTotal: { inclineTotal: 500, declineTotal: 450 },
          toggleShowOnMap: mockToggleShowOnMap,
        })
    );

    const summary = createMockSummary();
    render(<Summary summary={summary} title="Route" index={-1} />);

    expect(screen.getByText('Total Incline')).toBeInTheDocument();
    expect(screen.getByText('500 m')).toBeInTheDocument();
    expect(screen.getByText('Total Decline')).toBeInTheDocument();
    expect(screen.getByText('450 m')).toBeInTheDocument();
  });
});
