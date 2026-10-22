import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IsochronesControl } from './isochrones';

const mockResults = {
  data: null as null | {
    features: { properties: { contour: number; area: number } }[];
  },
  show: true,
};

vi.mock('@/stores/isochrones-store', () => {
  const useIsochronesStore = Object.assign(
    vi.fn((selector) =>
      selector({
        results: mockResults,
      })
    ),
    {
      getState: () => ({
        results: mockResults,
      }),
    }
  );
  return { useIsochronesStore };
});

vi.mock('./waypoints', () => ({
  Waypoints: () => <div data-testid="mock-waypoints">Waypoints</div>,
}));

vi.mock('@/components/settings-footer', () => ({
  SettingsFooter: () => (
    <div data-testid="mock-settings-footer">Settings Footer</div>
  ),
}));

vi.mock('./isochrone-card', () => ({
  IsochroneCard: ({
    data,
    showOnMap,
  }: {
    data: unknown;
    showOnMap: boolean;
  }) => (
    <div data-testid="mock-isochrone-card" data-show-on-map={showOnMap}>
      Isochrone Card: {JSON.stringify(data)}
    </div>
  ),
}));

vi.mock('@/components/quick-settings', () => ({
  QuickSettings: () => (
    <div data-testid="mock-quick-settings">Quick Settings</div>
  ),
}));

describe('IsochronesControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.data = null;
  });

  it('should render without crashing', () => {
    expect(() => render(<IsochronesControl />)).not.toThrow();
  });

  it('should render Waypoints component', () => {
    render(<IsochronesControl />);
    expect(screen.getByTestId('mock-waypoints')).toBeInTheDocument();
  });

  it('should render SettingsFooter component', () => {
    render(<IsochronesControl />);
    expect(screen.getByTestId('mock-settings-footer')).toBeInTheDocument();
  });

  it('should not render IsochroneCard when no results', () => {
    render(<IsochronesControl />);
    expect(screen.queryByTestId('mock-isochrone-card')).not.toBeInTheDocument();
    expect(screen.queryByText('Isochrones')).not.toBeInTheDocument();
  });

  it('should render IsochroneCard when results exist', () => {
    mockResults.data = {
      features: [{ properties: { contour: 10, area: 5.5 } }],
    };

    render(<IsochronesControl />);

    expect(screen.getByText('Isochrones')).toBeInTheDocument();
    expect(screen.getByTestId('mock-isochrone-card')).toBeInTheDocument();
  });

  it('should pass correct props to IsochroneCard', () => {
    mockResults.data = {
      features: [{ properties: { contour: 15, area: 8.2 } }],
    };
    mockResults.show = false;

    render(<IsochronesControl />);

    const card = screen.getByTestId('mock-isochrone-card');
    expect(card).toHaveAttribute('data-show-on-map', 'false');
  });

  it('should render QuickSettings component', () => {
    render(<IsochronesControl />);
    expect(screen.getByTestId('mock-quick-settings')).toBeInTheDocument();
  });
});
