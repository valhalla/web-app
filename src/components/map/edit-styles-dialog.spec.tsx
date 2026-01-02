import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type maplibregl from 'maplibre-gl';
import { EditStylesDialog } from './edit-styles-dialog';

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

const validStyle = {
  version: 8,
  name: 'Test Style',
  sources: {},
  layers: [],
} as maplibregl.StyleSpecification;

describe('EditStylesDialog', () => {
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
    render(<EditStylesDialog styleData={validStyle} />);

    expect(
      screen.getByRole('button', { name: 'Edit custom style' })
    ).toBeInTheDocument();
  });

  it('should open dialog and display JSON when trigger is clicked', async () => {
    const user = userEvent.setup();

    render(<EditStylesDialog styleData={validStyle} />);

    await user.click(screen.getByRole('button', { name: 'Edit custom style' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Use role heading to distinguish from the button
    expect(
      screen.getByRole('heading', { name: 'Edit custom style' })
    ).toBeInTheDocument();

    const textarea = screen.getByLabelText('Style JSON');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue(JSON.stringify(validStyle, null, 2));
  });

  it('should show error for invalid JSON syntax', async () => {
    const user = userEvent.setup();

    render(<EditStylesDialog styleData={validStyle} />);

    await user.click(screen.getByRole('button', { name: 'Edit custom style' }));

    const textarea = screen.getByLabelText('Style JSON');
    await user.clear(textarea);
    // Use paste to handle special characters like { }
    await user.paste('{ invalid-json: ');

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid JSON syntax')).toBeInTheDocument();
    });
  });

  it('should show error for invalid MapLibre style schema', async () => {
    const user = userEvent.setup();
    const invalidSchemaStyle = { foo: 'bar' }; // Missing version, sources, layers

    render(<EditStylesDialog styleData={validStyle} />);

    await user.click(screen.getByRole('button', { name: 'Edit custom style' }));

    const textarea = screen.getByLabelText('Style JSON');
    await user.clear(textarea);
    await user.paste(JSON.stringify(invalidSchemaStyle));

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(
        screen.getByText('Invalid MapLibre style.json format')
      ).toBeInTheDocument();
    });
  });

  it('should save valid style and update localStorage', async () => {
    const user = userEvent.setup();
    const onStyleSaved = vi.fn();
    const newStyle = { ...validStyle, name: 'Updated Style' };

    render(
      <EditStylesDialog styleData={validStyle} onStyleSaved={onStyleSaved} />
    );

    await user.click(screen.getByRole('button', { name: 'Edit custom style' }));

    const textarea = screen.getByLabelText('Style JSON');
    await user.clear(textarea);
    await user.paste(JSON.stringify(newStyle, null, 2));

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'customMapStyle',
        JSON.stringify(newStyle)
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'selectedMapStyle',
        'custom'
      );
    });

    expect(onStyleSaved).toHaveBeenCalledWith(newStyle);
  });

  it('should clear error when typing in textarea', async () => {
    const user = userEvent.setup();

    render(<EditStylesDialog styleData={validStyle} />);

    await user.click(screen.getByRole('button', { name: 'Edit custom style' }));

    const textarea = screen.getByLabelText('Style JSON');
    await user.clear(textarea);
    await user.paste('{ invalid');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(screen.getByText('Invalid JSON syntax')).toBeInTheDocument();

    // specific syntax causing issues with user-event, simple character type is enough to trigger onChange and clear error
    await user.type(textarea, 'a');

    await waitFor(() => {
      expect(screen.queryByText('Invalid JSON syntax')).not.toBeInTheDocument();
    });
  });

  it('should close dialog when Cancel is clicked', async () => {
    const user = userEvent.setup();

    render(<EditStylesDialog styleData={validStyle} />);

    await user.click(screen.getByRole('button', { name: 'Edit custom style' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
