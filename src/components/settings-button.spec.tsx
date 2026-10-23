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

  it('should render an "Advanced settings" labeled button', () => {
    render(<SettingsButton />);
    const button = screen.getByTestId('show-hide-settings-btn');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent(/Advanced settings/i);
  });

  it('should call toggleSettings when clicked', async () => {
    const user = userEvent.setup();
    render(<SettingsButton />);

    await user.click(screen.getByTestId('show-hide-settings-btn'));

    expect(mockToggleSettings).toHaveBeenCalledTimes(1);
  });
});
