import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './app';

vi.mock('react-map-gl/maplibre', () => ({
  MapProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-provider">{children}</div>
  ),
}));

vi.mock('./components/map', () => ({
  MapComponent: () => <div data-testid="map-component">MapComponent</div>,
}));

vi.mock('./components/route-planner', () => ({
  RoutePlanner: () => <div data-testid="route-planner">RoutePlanner</div>,
}));

vi.mock('./components/settings-panel/settings-panel', () => ({
  SettingsPanel: () => <div data-testid="settings-panel">SettingsPanel</div>,
}));

vi.mock('@/components/ui/sonner', () => ({
  Toaster: ({ position, duration }: { position: string; duration: number }) => (
    <div
      data-testid="toaster"
      data-position={position}
      data-duration={duration}
    >
      Toaster
    </div>
  ),
}));

describe('App', () => {
  it('should render without crashing', () => {
    expect(() => render(<App />)).not.toThrow();
  });

  it('should render MapProvider as wrapper', () => {
    render(<App />);
    expect(screen.getByTestId('map-provider')).toBeInTheDocument();
  });

  it('should render MapComponent', () => {
    render(<App />);
    expect(screen.getByTestId('map-component')).toBeInTheDocument();
  });

  it('should render RoutePlanner', () => {
    render(<App />);
    expect(screen.getByTestId('route-planner')).toBeInTheDocument();
  });

  it('should render SettingsPanel', () => {
    render(<App />);
    expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
  });

  it('should render Toaster with correct props', () => {
    render(<App />);
    const toaster = screen.getByTestId('toaster');
    expect(toaster).toBeInTheDocument();
    expect(toaster).toHaveAttribute('data-position', 'bottom-center');
    expect(toaster).toHaveAttribute('data-duration', '5000');
  });

  it('should render all components inside MapProvider', () => {
    render(<App />);
    const mapProvider = screen.getByTestId('map-provider');
    expect(mapProvider).toContainElement(screen.getByTestId('map-component'));
    expect(mapProvider).toContainElement(screen.getByTestId('route-planner'));
    expect(mapProvider).toContainElement(screen.getByTestId('settings-panel'));
    expect(mapProvider).toContainElement(screen.getByTestId('toaster'));
  });
});
