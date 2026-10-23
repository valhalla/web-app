import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataInfoTable } from './data-info-table';

const mockUseQuery = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => mockUseQuery(),
}));

vi.mock('@/utils/valhalla', () => ({
  getValhallaUrl: () => 'https://valhalla.example',
  VALHALLA_CLIENT_HEADERS: {},
}));

describe('DataInfoTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a relative build time and links the commit SHA to its GitHub commit', () => {
    mockUseQuery.mockReturnValue({
      data: {
        version: '3.8.3-1a53e4e',
        // 07:17:16 UTC — deterministic regardless of the runner's timezone.
        buildFinished: new Date(Date.UTC(2026, 7, 18, 7, 17, 16)),
      },
      isLoading: false,
      isError: false,
    });

    render(<DataInfoTable />);

    expect(screen.getByText(/ago/)).toBeInTheDocument();
    const commitLink = screen.getByRole('link', { name: '3.8.3-1a53e4e' });
    expect(commitLink).toHaveAttribute(
      'href',
      'https://github.com/valhalla/valhalla/commit/1a53e4e'
    );
  });

  it('renders the version as plain text when no commit SHA is present', () => {
    mockUseQuery.mockReturnValue({
      data: { version: '3.8.3', buildFinished: null },
      isLoading: false,
      isError: false,
    });

    render(<DataInfoTable />);

    expect(screen.getByText('3.8.3')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows the exact UTC time in a tooltip on hover', async () => {
    mockUseQuery.mockReturnValue({
      data: {
        version: '3.8.3-1a53e4e',
        buildFinished: new Date(Date.UTC(2026, 7, 18, 7, 17, 16)),
      },
      isLoading: false,
      isError: false,
    });

    const user = userEvent.setup();
    render(<DataInfoTable />);
    await user.hover(screen.getByText(/ago/));

    // Radix renders the tooltip content into a portal; the exact instant shows.
    const utc = await screen.findAllByText('2026-08-18 07:17:16 UTC');
    expect(utc.length).toBeGreaterThan(0);
  });

  it('shows an error state when the status request fails', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<DataInfoTable />);

    expect(screen.getByText(/Failed to load status/)).toBeInTheDocument();
  });
});
