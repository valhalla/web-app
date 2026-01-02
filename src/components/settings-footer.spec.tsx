import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsFooter } from './settings-footer';

describe('SettingsFooter', () => {
  it('should render without crashing', () => {
    expect(() => render(<SettingsFooter />)).not.toThrow();
  });

  it('should render Calculations by text', () => {
    render(<SettingsFooter />);
    expect(screen.getByText(/Calculations by/)).toBeInTheDocument();
  });

  it('should render Valhalla link', () => {
    render(<SettingsFooter />);
    const valhallaLink = screen.getByRole('link', { name: 'Valhalla' });
    expect(valhallaLink).toBeInTheDocument();
    expect(valhallaLink).toHaveAttribute(
      'href',
      'https://github.com/valhalla/valhalla'
    );
    expect(valhallaLink).toHaveAttribute('target', '_blank');
    expect(valhallaLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should render Valhalla App link', () => {
    render(<SettingsFooter />);
    const appLink = screen.getByRole('link', { name: 'Valhalla App' });
    expect(appLink).toBeInTheDocument();
    expect(appLink).toHaveAttribute(
      'href',
      'https://github.com/gis-ops/valhalla-app/'
    );
    expect(appLink).toHaveAttribute('target', '_blank');
    expect(appLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should render Visualized with text', () => {
    render(<SettingsFooter />);
    expect(screen.getByText(/Visualized with/)).toBeInTheDocument();
  });
});
