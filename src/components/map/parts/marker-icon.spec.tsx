import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkerIcon } from './marker-icon';

describe('MarkerIcon', () => {
  it('should render without crashing', () => {
    expect(() => render(<MarkerIcon />)).not.toThrow();
  });

  it('should render svg marker', () => {
    const { container } = render(<MarkerIcon />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should have correct svg dimensions', () => {
    const { container } = render(<MarkerIcon />);

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '35');
    expect(svg).toHaveAttribute('height', '45');
  });

  it('should render aria-label with number', () => {
    render(<MarkerIcon number="1" />);

    expect(screen.getByLabelText('Map marker 1')).toBeInTheDocument();
  });

  it('should display number when provided', () => {
    render(<MarkerIcon number="5" />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should not display number when not provided', () => {
    const { container } = render(<MarkerIcon />);

    const numberDiv = container.querySelector('.absolute');
    expect(numberDiv).not.toBeInTheDocument();
  });

  describe('color variants', () => {
    it('should apply green color class by default', () => {
      const { container } = render(<MarkerIcon />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('[&_path]:fill-[#28a745]');
    });

    it('should apply green color class when color is green', () => {
      const { container } = render(<MarkerIcon color="green" />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('[&_path]:fill-[#28a745]');
    });

    it('should apply purple color class when color is purple', () => {
      const { container } = render(<MarkerIcon color="purple" />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('[&_path]:fill-[#6f42c1]');
    });

    it('should apply blue color class when color is blue', () => {
      const { container } = render(<MarkerIcon color="blue" />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('[&_path]:fill-[#007bff]');
    });
  });

  it('should apply custom className', () => {
    const { container } = render(<MarkerIcon className="custom-class" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('should have base classes for sizing', () => {
    const { container } = render(<MarkerIcon />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('w-[35px]');
    expect(wrapper).toHaveClass('h-[45px]');
  });

  it('should have cursor-pointer class', () => {
    const { container } = render(<MarkerIcon />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('cursor-pointer');
  });
});
