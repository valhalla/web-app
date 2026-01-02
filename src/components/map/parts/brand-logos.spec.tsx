import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrandLogos } from './brand-logos';

describe('BrandLogos', () => {
  it('should render without crashing', () => {
    expect(() => render(<BrandLogos />)).not.toThrow();
  });

  it('should render FOSSGIS link with correct href', () => {
    render(<BrandLogos />);
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute(
      'href',
      'https://fossgis.de/news/2021-11-12_funding_valhalla/'
    );
  });

  it('should render Valhalla link with correct href', () => {
    render(<BrandLogos />);
    const links = screen.getAllByRole('link');
    const valhallaLink = links[1];
    expect(valhallaLink).toHaveAttribute(
      'href',
      'https://github.com/valhalla/valhalla'
    );
  });

  it('should open links in new tab', () => {
    render(<BrandLogos />);
    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer');
    });
  });

  it('should render FOSSGIS logo element', () => {
    const { container } = render(<BrandLogos />);
    const fossgisLogo = container.querySelector('.fossgis-logo');
    expect(fossgisLogo).toBeInTheDocument();
  });

  it('should render Valhalla logo element', () => {
    const { container } = render(<BrandLogos />);
    const valhallaLogo = container.querySelector('.valhalla-logo');
    expect(valhallaLogo).toBeInTheDocument();
  });
});
