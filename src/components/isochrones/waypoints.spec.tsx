import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Waypoints } from './waypoints';

const mockUpdateSettings = vi.fn();
const mockClearIsos = vi.fn();
const mockUpdateTextInput = vi.fn();
const mockReceiveGeocodeResults = vi.fn();
const mockRefetchIsochrones = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(() => mockNavigate),
}));

vi.mock('@/utils/parse-url-params', () => ({
  parseUrlParams: vi.fn(() => ({})),
}));

vi.mock('@/stores/isochrones-store', () => ({
  useIsochronesStore: vi.fn((selector) =>
    selector({
      updateSettings: mockUpdateSettings,
      clearIsos: mockClearIsos,
      updateTextInput: mockUpdateTextInput,
      maxRange: 30,
      interval: 10,
      denoise: 1,
      generalize: 200,
      userInput: 'Berlin',
      geocodeResults: [],
      receiveGeocodeResults: mockReceiveGeocodeResults,
    })
  ),
}));

vi.mock('@/hooks/use-isochrones-queries', () => ({
  useIsochronesQuery: vi.fn(() => ({
    refetch: mockRefetchIsochrones,
  })),
}));

vi.mock('@/components/ui/waypoint-search', () => ({
  WaypointSearch: vi.fn(
    ({ userInput, onGeocodeResults, onResultSelect, rightContent }) => (
      <div data-testid="mock-waypoint-search">
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
              title: 'Selected Location',
              addressindex: 0,
              lngLat: [13.4, 52.5],
            })
          }
        >
          Select Result
        </button>
        {rightContent}
      </div>
    )
  ),
}));

vi.mock('@/components/ui/slider-setting', () => ({
  SliderSetting: vi.fn(
    ({ id, label, value, onValueChange, onValueCommit, onInputChange }) => (
      <div data-testid={`slider-${id}`}>
        <label htmlFor={id}>{label}</label>
        <input
          id={id}
          type="range"
          value={value}
          onChange={(e) => onValueChange([Number(e.target.value)])}
          onMouseUp={() => onValueCommit?.()}
          data-testid={`slider-input-${id}`}
        />
        <button
          data-testid={`slider-commit-${id}`}
          onClick={() => onInputChange?.([value + 5])}
        >
          Change {label}
        </button>
      </div>
    )
  ),
}));

describe('Waypoints (Isochrones)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    expect(() => render(<Waypoints />)).not.toThrow();
  });

  it('should render waypoint search component', () => {
    render(<Waypoints />);
    expect(screen.getByTestId('mock-waypoint-search')).toBeInTheDocument();
  });

  it('should display user input value', () => {
    render(<Waypoints />);
    expect(screen.getByTestId('waypoint-user-input')).toHaveTextContent(
      'Berlin'
    );
  });

  it('should render remove waypoint button', () => {
    render(<Waypoints />);
    expect(screen.getByTestId('remove-waypoint-button')).toBeInTheDocument();
  });

  it('should call clearIsos when remove button is clicked', async () => {
    const user = userEvent.setup();
    render(<Waypoints />);

    await user.click(screen.getByTestId('remove-waypoint-button'));

    expect(mockClearIsos).toHaveBeenCalled();
  });

  it('should render Isochrones Settings button', () => {
    render(<Waypoints />);
    expect(
      screen.getByRole('button', { name: /Isochrones Settings/i })
    ).toBeInTheDocument();
  });

  it('should expand settings when Isochrones Settings is clicked', async () => {
    const user = userEvent.setup();
    render(<Waypoints />);

    await user.click(
      screen.getByRole('button', { name: /Isochrones Settings/i })
    );

    expect(screen.getByTestId('slider-maxRange')).toBeInTheDocument();
    expect(screen.getByTestId('slider-interval')).toBeInTheDocument();
    expect(screen.getByTestId('slider-denoise')).toBeInTheDocument();
    expect(screen.getByTestId('slider-generalize')).toBeInTheDocument();
  });

  it('should render Maximum Range slider with correct label', async () => {
    const user = userEvent.setup();
    render(<Waypoints />);

    await user.click(
      screen.getByRole('button', { name: /Isochrones Settings/i })
    );

    expect(screen.getByText('Maximum Range')).toBeInTheDocument();
  });

  it('should render Interval Step slider', async () => {
    const user = userEvent.setup();
    render(<Waypoints />);

    await user.click(
      screen.getByRole('button', { name: /Isochrones Settings/i })
    );

    expect(screen.getByText('Interval Step')).toBeInTheDocument();
  });

  it('should render Denoise slider', async () => {
    const user = userEvent.setup();
    render(<Waypoints />);

    await user.click(
      screen.getByRole('button', { name: /Isochrones Settings/i })
    );

    expect(screen.getByText('Denoise')).toBeInTheDocument();
  });

  it('should render Generalize slider', async () => {
    const user = userEvent.setup();
    render(<Waypoints />);

    await user.click(
      screen.getByRole('button', { name: /Isochrones Settings/i })
    );

    expect(screen.getByText('Generalize')).toBeInTheDocument();
  });

  it('should call receiveGeocodeResults when geocode results are received', async () => {
    const user = userEvent.setup();
    render(<Waypoints />);

    await user.click(screen.getByTestId('trigger-geocode'));

    expect(mockReceiveGeocodeResults).toHaveBeenCalledWith([
      { title: 'Test Result', addressindex: 0, lngLat: [0, 0] },
    ]);
  });

  it('should call updateTextInput when result is selected', async () => {
    const user = userEvent.setup();
    render(<Waypoints />);

    await user.click(screen.getByTestId('select-result'));

    expect(mockUpdateTextInput).toHaveBeenCalledWith({
      userInput: 'Selected Location',
      addressIndex: 0,
    });
  });

  it('should call updateSettings when slider value changes', async () => {
    const user = userEvent.setup();
    render(<Waypoints />);

    await user.click(
      screen.getByRole('button', { name: /Isochrones Settings/i })
    );

    await user.click(screen.getByTestId('slider-commit-maxRange'));

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      name: 'maxRange',
      value: 35,
    });
  });

  it('should sync settings to URL on mount', () => {
    render(<Waypoints />);

    expect(mockNavigate).toHaveBeenCalledWith({
      search: expect.any(Function),
      replace: true,
    });
  });
});
