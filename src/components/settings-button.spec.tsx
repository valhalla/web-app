import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsButton } from './settings-button';

const mockToggleSettings = vi.fn();

vi.mock('@/stores/common-store', () => ({
  useCommonStore: vi.fn((selector) =>
    selector({
      toggleSettings: mockToggleSettings,
    })
  ),
}));

describe('SettingsButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    expect(() => render(<SettingsButton />)).not.toThrow();
  });

  it('should render a button with settings icon', () => {
    render(<SettingsButton />);
    expect(screen.getByTestId('show-hide-settings-btn')).toBeInTheDocument();
  });

  it('should call toggleSettings when clicked', async () => {
    const user = userEvent.setup();
    render(<SettingsButton />);

    await user.click(screen.getByTestId('show-hide-settings-btn'));

    expect(mockToggleSettings).toHaveBeenCalledTimes(1);
  });

  it('should have tooltip with Show/Hide Settings text', async () => {
    const user = userEvent.setup();
    render(<SettingsButton />);

    await user.hover(screen.getByTestId('show-hide-settings-btn'));

    expect(
      await screen.findByRole('tooltip', { name: 'Show/Hide Settings' })
    ).toBeInTheDocument();
  });
});
