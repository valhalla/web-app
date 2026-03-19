import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToolButton } from './tool-button';

describe('ToolButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    expect(() =>
      render(
        <ToolButton
          title="Test Button"
          icon={<span>icon</span>}
          onClick={vi.fn()}
        />
      )
    ).not.toThrow();
  });

  it('should render with the correct aria-label', () => {
    render(
      <ToolButton
        title="Directions"
        icon={<span>icon</span>}
        onClick={vi.fn()}
      />
    );
    expect(
      screen.getByRole('button', { name: 'Directions' })
    ).toBeInTheDocument();
  });

  it('should render with the correct title attribute for tooltip', () => {
    render(
      <ToolButton
        title="Isochrones"
        icon={<span>icon</span>}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'Isochrones' })).toHaveAttribute(
      'title',
      'Isochrones'
    );
  });

  it('should render the provided icon', () => {
    render(
      <ToolButton
        title="Tiles"
        icon={<span data-testid="test-icon">icon</span>}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <ToolButton title="Test" icon={<span>icon</span>} onClick={onClick} />
    );

    await user.click(screen.getByRole('button', { name: 'Test' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should render with the provided data-testid', () => {
    render(
      <ToolButton
        title="Test"
        icon={<span>icon</span>}
        onClick={vi.fn()}
        data-testid="my-tool-button"
      />
    );
    expect(screen.getByTestId('my-tool-button')).toBeInTheDocument();
  });

  it('should be a button element', () => {
    render(
      <ToolButton title="Test" icon={<span>icon</span>} onClick={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: 'Test' })).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <ToolButton
        title="Test"
        icon={<span>icon</span>}
        onClick={vi.fn()}
        disabled={true}
      />
    );
    expect(screen.getByRole('button', { name: 'Test' })).toBeDisabled();
  });

  it('should not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <ToolButton
        title="Test"
        icon={<span>icon</span>}
        onClick={onClick}
        disabled={true}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Test' }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
