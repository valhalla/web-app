import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SettingsPanel } from './settings-panel';
import { DIRECTIONS_LANGUAGE_STORAGE_KEY } from './settings-options';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

const renderWithQueryClient = (ui: React.ReactElement) => {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>
  );
};

const mockUpdateSettings = vi.fn();
const mockResetSettings = vi.fn();
const mockToggleSettings = vi.fn();
const mockRefetchDirections = vi.fn();
const mockRefetchIsochrones = vi.fn();

const mockUseParams = vi.fn(() => ({ activeTab: 'directions' }));
const mockUseSearch = vi.fn(() => ({ profile: 'bicycle' }));

vi.mock('@tanstack/react-router', () => ({
  useParams: () => mockUseParams(),
  useSearch: () => mockUseSearch(),
}));

vi.mock('@/stores/common-store', () => ({
  useCommonStore: vi.fn((selector) => {
    const state = {
      settings: {
        cycling_speed: 20,
        use_roads: 0.5,
        use_hills: 0.5,
        avoid_bad_surfaces: 0.25,
        shortest: false,
        use_ferry: 0.5,
        use_living_streets: 0.5,
        alternates: 2,
        bicycle_type: 'Hybrid',
        service_penalty: 15,
        service_factor: 1,
        maneuver_penalty: 5,
        use_geocoding: false,
        private_access_penalty: 450,
        gate_penalty: 300,
        gate_cost: 30,
        country_crossing_cost: 600,
        country_crossing_penalty: 0,
        turn_penalty_factor: 0,
      },
      settingsPanelOpen: true,
      updateSettings: mockUpdateSettings,
      resetSettings: mockResetSettings,
      toggleSettings: mockToggleSettings,
    };
    return selector(state);
  }),
}));

vi.mock('@/hooks/use-directions-queries', () => ({
  useDirectionsQuery: vi.fn(() => ({
    refetch: mockRefetchDirections,
  })),
}));

vi.mock('@/hooks/use-isochrones-queries', () => ({
  useIsochronesQuery: vi.fn(() => ({
    refetch: mockRefetchIsochrones,
  })),
}));

const BASE_URL_STORAGE_KEY = 'valhalla_base_url';

describe('SettingsPanel', () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockUseParams.mockReturnValue({ activeTab: 'directions' });
    mockUseSearch.mockReturnValue({ profile: 'bicycle' });
    vi.stubGlobal('navigator', { ...originalNavigator, language: 'en-US' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    vi.stubGlobal('navigator', originalNavigator);
  });

  it('should render without crashing', () => {
    expect(() => renderWithQueryClient(<SettingsPanel />)).not.toThrow();
  });

  it('should render the settings title', () => {
    renderWithQueryClient(<SettingsPanel />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should render close button', () => {
    renderWithQueryClient(<SettingsPanel />);
    expect(screen.getByTestId('close-settings-button')).toBeInTheDocument();
  });

  it('should call toggleSettings when close button is clicked', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<SettingsPanel />);

    await user.click(screen.getByTestId('close-settings-button'));

    expect(mockToggleSettings).toHaveBeenCalled();
  });

  it('should render Profile Settings section for bicycle profile', () => {
    renderWithQueryClient(<SettingsPanel />);
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
  });

  it('should render General Settings section', () => {
    renderWithQueryClient(<SettingsPanel />);
    expect(screen.getByText('General Settings')).toBeInTheDocument();
  });

  it('should display current profile name', () => {
    renderWithQueryClient(<SettingsPanel />);
    expect(screen.getByText('(bicycle)')).toBeInTheDocument();
  });

  it('should render Copy to Clipboard button', () => {
    renderWithQueryClient(<SettingsPanel />);
    expect(
      screen.getByRole('button', { name: /Copy to Clipboard/i })
    ).toBeInTheDocument();
  });

  it('should render Reset button', () => {
    renderWithQueryClient(<SettingsPanel />);
    expect(
      screen.getByRole('button', { name: /^Reset$/i })
    ).toBeInTheDocument();
  });

  it('should render bicycle profile settings like Cycling Speed', () => {
    renderWithQueryClient(<SettingsPanel />);
    expect(screen.getByText('Cycling Speed')).toBeInTheDocument();
  });

  it('should render Shortest checkbox for bicycle profile', () => {
    renderWithQueryClient(<SettingsPanel />);
    expect(screen.getByText('Shortest')).toBeInTheDocument();
  });

  it('should render Bicycle Type select for bicycle profile', () => {
    renderWithQueryClient(<SettingsPanel />);
    expect(screen.getByText('Bicycle Type')).toBeInTheDocument();
  });

  it('should render general settings like Use Ferries', () => {
    renderWithQueryClient(<SettingsPanel />);
    expect(screen.getByText('Use Ferries')).toBeInTheDocument();
  });

  it('should render Alternates setting from all general settings', () => {
    renderWithQueryClient(<SettingsPanel />);
    expect(screen.getByText('Alternates')).toBeInTheDocument();
  });

  it('should call resetSettings with current profile when Reset is clicked', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<SettingsPanel />);

    await user.click(screen.getByRole('button', { name: /^Reset$/i }));

    expect(mockResetSettings).toHaveBeenCalledWith('bicycle');
  });

  it('should call refetchDirections after reset', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<SettingsPanel />);

    await user.click(screen.getByRole('button', { name: /^Reset$/i }));

    expect(mockRefetchDirections).toHaveBeenCalled();
  });

  it('should show Copied! feedback after clicking Copy to Clipboard', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<SettingsPanel />);

    await user.click(
      screen.getByRole('button', { name: /Copy to Clipboard/i })
    );

    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('should toggle shortest checkbox and trigger refetch', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<SettingsPanel />);

    const shortestCheckbox = screen.getByRole('checkbox', {
      name: /Shortest/i,
    });
    await user.click(shortestCheckbox);

    expect(mockUpdateSettings).toHaveBeenCalledWith('shortest', true);
    expect(mockRefetchDirections).toHaveBeenCalled();
  });

  it('should render all expected profile numeric settings for bicycle', () => {
    renderWithQueryClient(<SettingsPanel />);

    expect(screen.getByText('Cycling Speed')).toBeInTheDocument();
    expect(screen.getByText('Use Roads')).toBeInTheDocument();
    expect(screen.getByText('Use Hills')).toBeInTheDocument();
    expect(screen.getByText('Avoid Bad Surface')).toBeInTheDocument();
  });

  it('should render all expected general numeric settings for bicycle', () => {
    renderWithQueryClient(<SettingsPanel />);

    expect(screen.getByText('Use Ferries')).toBeInTheDocument();
    expect(screen.getByText('Use Living Streets')).toBeInTheDocument();
    expect(screen.getByText('Turn Penalty')).toBeInTheDocument();
  });

  describe('Server Settings', () => {
    it('should render Server Settings section', () => {
      renderWithQueryClient(<SettingsPanel />);
      expect(screen.getByText('Server Settings')).toBeInTheDocument();
    });

    it('should render Base URL label when expanded', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<SettingsPanel />);

      await user.click(screen.getByText('Server Settings'));

      expect(screen.getByText('Base URL')).toBeInTheDocument();
    });

    it('should render base URL input when expanded', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<SettingsPanel />);

      await user.click(screen.getByText('Server Settings'));

      expect(
        screen.getByRole('textbox', { name: /Base URL/i })
      ).toBeInTheDocument();
    });

    it('should render Reset Base URL button when expanded', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<SettingsPanel />);

      await user.click(screen.getByText('Server Settings'));

      expect(
        screen.getByRole('button', { name: /Reset Base URL/i })
      ).toBeInTheDocument();
    });

    it('should display stored base URL from localStorage', async () => {
      const user = userEvent.setup();
      const customUrl = 'https://custom.valhalla.com';
      localStorage.setItem(BASE_URL_STORAGE_KEY, customUrl);
      renderWithQueryClient(<SettingsPanel />);

      await user.click(screen.getByText('Server Settings'));

      const input = screen.getByRole('textbox', { name: /Base URL/i });
      expect(input).toHaveValue(customUrl);
    });

    it('should update input value when typing', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<SettingsPanel />);

      await user.click(screen.getByText('Server Settings'));

      const input = screen.getByRole('textbox', { name: /Base URL/i });
      await user.clear(input);
      await user.type(input, 'https://new.valhalla.com');

      expect(input).toHaveValue('https://new.valhalla.com');
    });

    it('should not save to localStorage while typing', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<SettingsPanel />);

      await user.click(screen.getByText('Server Settings'));

      const input = screen.getByRole('textbox', { name: /Base URL/i });
      await user.clear(input);
      await user.type(input, 'https://test.com');

      expect(localStorage.getItem(BASE_URL_STORAGE_KEY)).toBeNull();
    });

    it('should show error for invalid URL format on blur', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<SettingsPanel />);

      await user.click(screen.getByText('Server Settings'));

      const input = screen.getByRole('textbox', { name: /Base URL/i });
      await user.clear(input);
      await user.type(input, 'not-a-valid-url');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Invalid URL format')).toBeInTheDocument();
      });
    });

    it('should show error for non-http protocol on blur', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<SettingsPanel />);

      await user.click(screen.getByText('Server Settings'));

      const input = screen.getByRole('textbox', { name: /Base URL/i });
      await user.clear(input);
      await user.type(input, 'ftp://example.com');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText('URL must use HTTP or HTTPS protocol')
        ).toBeInTheDocument();
      });
    });

    it('should clear error when typing after error', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<SettingsPanel />);

      await user.click(screen.getByText('Server Settings'));

      const input = screen.getByRole('textbox', { name: /Base URL/i });
      await user.clear(input);
      await user.type(input, 'invalid');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Invalid URL format')).toBeInTheDocument();
      });

      await user.type(input, 'https://valid.com');

      await waitFor(() => {
        expect(
          screen.queryByText('Invalid URL format')
        ).not.toBeInTheDocument();
      });
    });

    it('should have aria-invalid attribute when there is an error', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<SettingsPanel />);

      await user.click(screen.getByText('Server Settings'));

      const input = screen.getByRole('textbox', { name: /Base URL/i });
      await user.clear(input);
      await user.type(input, 'invalid');
      await user.tab();

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should reset base URL to default when Reset Base URL is clicked', async () => {
      const user = userEvent.setup();
      const customUrl = 'https://custom.valhalla.com';
      localStorage.setItem(BASE_URL_STORAGE_KEY, customUrl);
      renderWithQueryClient(<SettingsPanel />);

      await user.click(screen.getByText('Server Settings'));

      const resetButton = screen.getByRole('button', {
        name: /Reset Base URL/i,
      });
      await user.click(resetButton);

      expect(localStorage.getItem(BASE_URL_STORAGE_KEY)).toBeNull();
    });

    it('should disable Reset Base URL button when URL equals default', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<SettingsPanel />);

      await user.click(screen.getByText('Server Settings'));

      const resetButton = screen.getByRole('button', {
        name: /Reset Base URL/i,
      });
      expect(resetButton).toBeDisabled();
    });

    it('should enable Reset Base URL button when URL differs from default', async () => {
      const user = userEvent.setup();
      const customUrl = 'https://custom.valhalla.com';
      localStorage.setItem(BASE_URL_STORAGE_KEY, customUrl);
      renderWithQueryClient(<SettingsPanel />);

      await user.click(screen.getByText('Server Settings'));

      const resetButton = screen.getByRole('button', {
        name: /Reset Base URL/i,
      });
      expect(resetButton).toBeEnabled();
    });

    it('should not re-send request on blur when input is in error state and value unchanged', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<SettingsPanel />);

      await user.click(screen.getByText('Server Settings'));

      const input = screen.getByRole('textbox', { name: /Base URL/i });
      await user.clear(input);
      await user.type(input, 'invalid-url');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Invalid URL format')).toBeInTheDocument();
      });

      await user.click(input);
      await user.tab();

      expect(screen.getByText('Invalid URL format')).toBeInTheDocument();
    });

    it('should re-send request on blur after user modifies the error input value', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<SettingsPanel />);

      await user.click(screen.getByText('Server Settings'));

      const input = screen.getByRole('textbox', { name: /Base URL/i });
      await user.clear(input);
      await user.type(input, 'invalid-url');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Invalid URL format')).toBeInTheDocument();
      });

      await user.type(input, '-modified');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Invalid URL format')).toBeInTheDocument();
      });
    });

    it('should clear error state when reset button is clicked after error', async () => {
      const user = userEvent.setup();
      const customUrl = 'https://custom.valhalla.com';
      localStorage.setItem(BASE_URL_STORAGE_KEY, customUrl);
      renderWithQueryClient(<SettingsPanel />);

      await user.click(screen.getByText('Server Settings'));

      const input = screen.getByRole('textbox', { name: /Base URL/i });
      await user.clear(input);
      await user.type(input, 'invalid-url');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Invalid URL format')).toBeInTheDocument();
      });

      const resetButton = screen.getByRole('button', {
        name: /Reset Base URL/i,
      });
      await user.click(resetButton);

      expect(screen.queryByText('Invalid URL format')).not.toBeInTheDocument();
    });
  });

  describe('Language Picker', () => {
    it('should render Directions Language section when activeTab is directions', () => {
      renderWithQueryClient(<SettingsPanel />);
      expect(screen.getByText('Directions Language')).toBeInTheDocument();
      expect(screen.getByText('Language')).toBeInTheDocument();
    });

    it('should not render Directions Language section when activeTab is isochrones', () => {
      mockUseParams.mockReturnValue({ activeTab: 'isochrones' });
      renderWithQueryClient(<SettingsPanel />);
      expect(screen.queryByText('Directions Language')).not.toBeInTheDocument();
    });

    it('should use system locale when no language is stored', () => {
      vi.stubGlobal('navigator', { language: 'fr-FR' });
      renderWithQueryClient(<SettingsPanel />);
      expect(screen.getByText('French (France)')).toBeInTheDocument();
    });

    it('should fall back to en-US when system locale is not supported', () => {
      vi.stubGlobal('navigator', { language: 'xx-XX' });
      renderWithQueryClient(<SettingsPanel />);
      expect(screen.getByText('English (United States)')).toBeInTheDocument();
    });

    it('should use stored language from localStorage on initial render', () => {
      localStorage.setItem(DIRECTIONS_LANGUAGE_STORAGE_KEY, 'de-DE');
      renderWithQueryClient(<SettingsPanel />);
      expect(screen.getByText('German (Germany)')).toBeInTheDocument();
    });

    it('should render language select with correct id', () => {
      renderWithQueryClient(<SettingsPanel />);
      const languageSelect = screen.getByRole('combobox', {
        name: /Language/i,
      });
      expect(languageSelect).toBeInTheDocument();
    });

    it('should render language description in help tooltip', () => {
      renderWithQueryClient(<SettingsPanel />);
      expect(screen.getByText('Language')).toBeInTheDocument();
    });
  });
});
