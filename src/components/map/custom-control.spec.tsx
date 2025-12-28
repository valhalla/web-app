import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomControl, ControlButton } from './custom-control';

describe('ControlButton', () => {
  it('should render without crashing', () => {
    expect(() =>
      render(<ControlButton title="Test" icon={<span>Icon</span>} />)
    ).not.toThrow();
  });

  it('should render with title attribute', () => {
    render(<ControlButton title="Test Button" icon={<span>Icon</span>} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Test Button');
  });

  it('should render with aria-label attribute', () => {
    render(<ControlButton title="Test Button" icon={<span>Icon</span>} />);

    const button = screen.getByRole('button', { name: 'Test Button' });
    expect(button).toBeInTheDocument();
  });

  it('should render icon inside button', () => {
    render(
      <ControlButton title="Test" icon={<span data-testid="icon">Icon</span>} />
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('should have type="button" by default', () => {
    render(<ControlButton title="Test" icon={<span>Icon</span>} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('should allow custom type', () => {
    render(
      <ControlButton title="Test" icon={<span>Icon</span>} type="submit" />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('should handle click events', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <ControlButton title="Test" icon={<span>Icon</span>} onClick={onClick} />
    );

    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalled();
  });

  it('should forward ref to button element', () => {
    const ref = vi.fn();

    render(<ControlButton ref={ref} title="Test" icon={<span>Icon</span>} />);

    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0]?.[0]).toBeInstanceOf(HTMLButtonElement);
  });

  it('should pass additional props to button', () => {
    render(
      <ControlButton
        title="Test"
        icon={<span>Icon</span>}
        disabled
        data-testid="custom-button"
      />
    );

    const button = screen.getByTestId('custom-button');
    expect(button).toBeDisabled();
  });
});

describe('CustomControl', () => {
  beforeEach(() => {
    const topLeft = document.createElement('div');
    topLeft.className = 'maplibregl-ctrl-top-left';
    document.body.appendChild(topLeft);

    const topRight = document.createElement('div');
    topRight.className = 'maplibregl-ctrl-top-right';
    document.body.appendChild(topRight);

    const bottomLeft = document.createElement('div');
    bottomLeft.className = 'maplibregl-ctrl-bottom-left';
    document.body.appendChild(bottomLeft);

    const bottomRight = document.createElement('div');
    bottomRight.className = 'maplibregl-ctrl-bottom-right';
    document.body.appendChild(bottomRight);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should render without crashing', () => {
    expect(() =>
      render(
        <CustomControl position="topLeft">
          <div>Test</div>
        </CustomControl>
      )
    ).not.toThrow();
  });

  it('should render children into control container', async () => {
    render(
      <CustomControl position="topLeft">
        <div data-testid="child">Test Content</div>
      </CustomControl>
    );

    await waitFor(() => {
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  it('should add control classes to container', async () => {
    render(
      <CustomControl position="topRight">
        <div>Test</div>
      </CustomControl>
    );

    await waitFor(() => {
      const controlGroup = document.querySelector('.maplibregl-ctrl-group');
      expect(controlGroup).toBeInTheDocument();
      expect(controlGroup).toHaveClass('maplibregl-ctrl');
    });
  });

  it('should append to topLeft position', async () => {
    render(
      <CustomControl position="topLeft">
        <div data-testid="child">Test</div>
      </CustomControl>
    );

    await waitFor(() => {
      const topLeft = document.querySelector('.maplibregl-ctrl-top-left');
      expect(
        topLeft?.querySelector('[data-testid="child"]')
      ).toBeInTheDocument();
    });
  });

  it('should append to bottomRight position', async () => {
    render(
      <CustomControl position="bottomRight">
        <div data-testid="child">Test</div>
      </CustomControl>
    );

    await waitFor(() => {
      const bottomRight = document.querySelector(
        '.maplibregl-ctrl-bottom-right'
      );
      expect(
        bottomRight?.querySelector('[data-testid="child"]')
      ).toBeInTheDocument();
    });
  });

  it('should clean up on unmount', async () => {
    const { unmount } = render(
      <CustomControl position="topLeft">
        <div>Test</div>
      </CustomControl>
    );

    await waitFor(() => {
      expect(
        document.querySelector('.maplibregl-ctrl-group')
      ).toBeInTheDocument();
    });

    unmount();

    expect(
      document.querySelector('.maplibregl-ctrl-group')
    ).not.toBeInTheDocument();
  });
});
