import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomStylesDialog } from './custom-styles-dialog';

const mockLocalStorage: Record<string, string> = {};

vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => mockLocalStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockLocalStorage).forEach(
      (key) => delete mockLocalStorage[key]
    );
  }),
});

describe('CustomStylesDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockLocalStorage).forEach(
      (key) => delete mockLocalStorage[key]
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render trigger button', () => {
    render(<CustomStylesDialog />);

    expect(
      screen.getByRole('button', { name: 'Load custom styles' })
    ).toBeInTheDocument();
  });

  it('should open dialog when trigger is clicked', async () => {
    const user = userEvent.setup();

    render(<CustomStylesDialog />);

    await user.click(
      screen.getByRole('button', { name: 'Load custom styles' })
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Custom styles')).toBeInTheDocument();
  });

  it('should display dialog description', async () => {
    const user = userEvent.setup();

    render(<CustomStylesDialog />);

    await user.click(
      screen.getByRole('button', { name: 'Load custom styles' })
    );

    expect(
      screen.getByText(/load custom styles from a URL or a local file/i)
    ).toBeInTheDocument();
  });

  it('should have URL input field', async () => {
    const user = userEvent.setup();

    render(<CustomStylesDialog />);

    await user.click(
      screen.getByRole('button', { name: 'Load custom styles' })
    );

    expect(screen.getByLabelText('Load from URL')).toBeInTheDocument();
  });

  it('should have Load button', async () => {
    const user = userEvent.setup();

    render(<CustomStylesDialog />);

    await user.click(
      screen.getByRole('button', { name: 'Load custom styles' })
    );

    expect(screen.getByRole('button', { name: 'Load' })).toBeInTheDocument();
  });

  it('should have Choose file button', async () => {
    const user = userEvent.setup();

    render(<CustomStylesDialog />);

    await user.click(
      screen.getByRole('button', { name: 'Load custom styles' })
    );

    expect(
      screen.getByRole('button', { name: 'Choose file' })
    ).toBeInTheDocument();
  });

  it('should show error for invalid URL', async () => {
    const user = userEvent.setup();

    render(<CustomStylesDialog />);

    await user.click(
      screen.getByRole('button', { name: 'Load custom styles' })
    );
    await user.type(screen.getByLabelText('Load from URL'), 'not-a-url');
    await user.click(screen.getByRole('button', { name: 'Load' }));

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument();
    });
  });

  it('should clear error when typing in URL input', async () => {
    const user = userEvent.setup();

    render(<CustomStylesDialog />);

    await user.click(
      screen.getByRole('button', { name: 'Load custom styles' })
    );
    await user.type(screen.getByLabelText('Load from URL'), 'not-a-url');
    await user.click(screen.getByRole('button', { name: 'Load' }));

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Load from URL'), 'https://');

    await waitFor(() => {
      expect(
        screen.queryByText('Please enter a valid URL')
      ).not.toBeInTheDocument();
    });
  });

  it('should handle successful URL fetch', async () => {
    const user = userEvent.setup();
    const onStyleLoaded = vi.fn();
    const mockStyle = {
      version: 8,
      name: 'Test Style',
      sources: {},
      layers: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockStyle),
    });

    render(<CustomStylesDialog onStyleLoaded={onStyleLoaded} />);

    await user.click(
      screen.getByRole('button', { name: 'Load custom styles' })
    );
    await user.type(
      screen.getByLabelText('Load from URL'),
      'https://example.com/style.json'
    );
    await user.click(screen.getByRole('button', { name: 'Load' }));

    await waitFor(() => {
      expect(onStyleLoaded).toHaveBeenCalledWith(mockStyle);
    });
  });

  it('should save style to localStorage on successful load', async () => {
    const user = userEvent.setup();
    const mockStyle = {
      version: 8,
      name: 'Test Style',
      sources: {},
      layers: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockStyle),
    });

    render(<CustomStylesDialog />);

    await user.click(
      screen.getByRole('button', { name: 'Load custom styles' })
    );
    await user.type(
      screen.getByLabelText('Load from URL'),
      'https://example.com/style.json'
    );
    await user.click(screen.getByRole('button', { name: 'Load' }));

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'selectedMapStyle',
        'custom'
      );
    });
  });

  it('should show error for invalid style format', async () => {
    const user = userEvent.setup();
    const invalidStyle = { invalid: 'format' };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(invalidStyle),
    });

    render(<CustomStylesDialog />);

    await user.click(
      screen.getByRole('button', { name: 'Load custom styles' })
    );
    await user.type(
      screen.getByLabelText('Load from URL'),
      'https://example.com/style.json'
    );
    await user.click(screen.getByRole('button', { name: 'Load' }));

    await waitFor(() => {
      expect(
        screen.getByText('Invalid MapLibre style.json format')
      ).toBeInTheDocument();
    });
  });

  it('should show error on fetch failure', async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    render(<CustomStylesDialog />);

    await user.click(
      screen.getByRole('button', { name: 'Load custom styles' })
    );
    await user.type(
      screen.getByLabelText('Load from URL'),
      'https://example.com/style.json'
    );
    await user.click(screen.getByRole('button', { name: 'Load' }));

    await waitFor(() => {
      expect(screen.getByText('HTTP 404: Not Found')).toBeInTheDocument();
    });
  });
});
