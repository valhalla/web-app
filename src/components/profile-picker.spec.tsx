import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfilePicker } from './profile-picker';
import { useSearch } from '@tanstack/react-router';

const mockResetSettings = vi.fn();
const mockOnProfileChange = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useSearch: vi.fn(() => ({ profile: 'bicycle' })),
}));

vi.mock('@/stores/common-store', () => ({
  useCommonStore: vi.fn((selector) =>
    selector({
      resetSettings: mockResetSettings,
    })
  ),
}));

describe('ProfilePicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSearch as Mock).mockReturnValue({ profile: 'bicycle' });
  });

  it('should render without crashing', () => {
    expect(() =>
      render(
        <ProfilePicker loading={false} onProfileChange={mockOnProfileChange} />
      )
    ).not.toThrow();
  });

  it('should render all profile buttons', () => {
    render(
      <ProfilePicker loading={false} onProfileChange={mockOnProfileChange} />
    );

    expect(screen.getByTestId('profile-button-bicycle')).toBeInTheDocument();
    expect(screen.getByTestId('profile-button-pedestrian')).toBeInTheDocument();
    expect(screen.getByTestId('profile-button-car')).toBeInTheDocument();
    expect(screen.getByTestId('profile-button-truck')).toBeInTheDocument();
    expect(screen.getByTestId('profile-button-bus')).toBeInTheDocument();
    expect(
      screen.getByTestId('profile-button-motor_scooter')
    ).toBeInTheDocument();
    expect(screen.getByTestId('profile-button-motorcycle')).toBeInTheDocument();
  });

  it('should highlight the active profile', () => {
    render(
      <ProfilePicker loading={false} onProfileChange={mockOnProfileChange} />
    );

    const bicycleButton = screen.getByTestId('profile-button-bicycle');
    expect(bicycleButton).toHaveAttribute('data-state', 'on');

    const carButton = screen.getByTestId('profile-button-car');
    expect(carButton).toHaveAttribute('data-state', 'off');
  });

  it('should call onProfileChange and resetSettings when a different profile is selected', async () => {
    const user = userEvent.setup();
    render(
      <ProfilePicker loading={false} onProfileChange={mockOnProfileChange} />
    );

    await user.click(screen.getByTestId('profile-button-car'));

    expect(mockResetSettings).toHaveBeenCalledWith('car');
    expect(mockOnProfileChange).toHaveBeenCalledWith('car');
  });

  it('should not call handlers when clicking the already active profile', async () => {
    const user = userEvent.setup();
    render(
      <ProfilePicker loading={false} onProfileChange={mockOnProfileChange} />
    );

    await user.click(screen.getByTestId('profile-button-bicycle'));

    expect(mockResetSettings).not.toHaveBeenCalled();
    expect(mockOnProfileChange).not.toHaveBeenCalled();
  });

  it('should show loading spinner on active profile when loading is true', () => {
    render(
      <ProfilePicker loading={true} onProfileChange={mockOnProfileChange} />
    );

    const bicycleButton = screen.getByTestId('profile-button-bicycle');
    expect(bicycleButton.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should not show loading spinner on inactive profiles when loading is true', () => {
    render(
      <ProfilePicker loading={true} onProfileChange={mockOnProfileChange} />
    );

    const carButton = screen.getByTestId('profile-button-car');
    expect(carButton.querySelector('.animate-spin')).not.toBeInTheDocument();
  });

  it('should have accessible labels for each profile button', () => {
    render(
      <ProfilePicker loading={false} onProfileChange={mockOnProfileChange} />
    );

    expect(
      screen.getByRole('radio', { name: 'Select Bicycle profile' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: 'Select Pedestrian profile' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: 'Select Car profile' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: 'Select Truck profile' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: 'Select Bus profile' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: 'Select Motor Scooter profile' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: 'Select Motorcycle profile' })
    ).toBeInTheDocument();
  });

  it('should show tooltip on hover', async () => {
    const user = userEvent.setup();
    render(
      <ProfilePicker loading={false} onProfileChange={mockOnProfileChange} />
    );

    await user.hover(screen.getByTestId('profile-button-truck'));

    expect(
      await screen.findByRole('tooltip', { name: 'Truck' })
    ).toBeInTheDocument();
  });
});
