import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapStyleControl } from './map-style-control';
import { MAP_STYLES, MAP_STYLE_STORAGE_KEY } from './constants';
import * as utils from './utils';

vi.mock('react-map-gl/maplibre', () => ({
  default: vi.fn(({ id }) => <div data-testid={`map-${id}`}>Mock Map</div>),
  useMap: vi.fn(() => ({
    current: {
      getCenter: () => ({ lng: 13.4, lat: 52.5 }),
      getZoom: () => 10,
    },
  })),
}));

vi.mock('./custom-control', async () => {
  const { forwardRef: fwdRef } = await import('react');
  return {
    CustomControl: vi.fn(({ children }: { children: React.ReactNode }) => (
      <div data-testid="custom-control">{children}</div>
    )),
    ControlButton: fwdRef<
      HTMLButtonElement,
      React.ComponentPropsWithoutRef<'button'> & {
        title: string;
        icon: React.ReactNode;
      }
    >(({ title, icon, ...props }, ref) => (
      <button ref={ref} aria-label={title} title={title} {...props}>
        {icon}
      </button>
    )),
  };
});

vi.mock('./custom-styles-dialog', () => ({
  CustomStylesDialog: vi.fn(({ onStyleLoaded }) => (
    <button
      data-testid="custom-styles-dialog"
      onClick={() =>
        onStyleLoaded?.({
          version: 8,
          name: 'Custom Style',
          sources: {},
          layers: [],
        })
      }
    >
      Load custom styles
    </button>
  )),
}));

vi.mock('./edit-styles-dialog', () => ({
  EditStylesDialog: vi.fn(({ styleData, onStyleSaved }) => (
    <button
      data-testid="edit-styles-dialog"
      onClick={() =>
        onStyleSaved?.({
          ...styleData,
          name: 'Edited Style',
        })
      }
    >
      Edit custom style
    </button>
  )),
}));

vi.mock('./utils', async (importOriginal) => {
  const original = await importOriginal<typeof utils>();
  return {
    ...original,
    getInitialMapStyle: vi.fn(() => 'shortbread'),
  };
});

describe('MapStyleControl', () => {
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
      (key: string, value: string) => {
        localStorageMock[key] = value;
      }
    );
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
      (key: string) => localStorageMock[key] ?? null
    );

    vi.clearAllMocks();
    (utils.getInitialMapStyle as Mock).mockReturnValue('shortbread');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render without crashing', () => {
    expect(() =>
      render(
        <MapStyleControl
          customStyleData={null}
          onStyleChange={vi.fn()}
          onCustomStyleLoaded={vi.fn()}
        />
      )
    ).not.toThrow();
  });

  it('should render the map styles button', () => {
    render(
      <MapStyleControl
        customStyleData={null}
        onStyleChange={vi.fn()}
        onCustomStyleLoaded={vi.fn()}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Map Styles' })
    ).toBeInTheDocument();
  });

  it('should open popover when button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <MapStyleControl
        customStyleData={null}
        onStyleChange={vi.fn()}
        onCustomStyleLoaded={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Map Styles' }));

    await waitFor(() => {
      MAP_STYLES.forEach((mapStyle) => {
        expect(screen.getByText(mapStyle.label)).toBeInTheDocument();
      });
    });
  });

  it('should render all built-in map style options', async () => {
    const user = userEvent.setup();

    render(
      <MapStyleControl
        customStyleData={null}
        onStyleChange={vi.fn()}
        onCustomStyleLoaded={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Map Styles' }));

    await waitFor(() => {
      expect(screen.getByText('Shortbread')).toBeInTheDocument();
      expect(screen.getByText('Carto')).toBeInTheDocument();
      expect(screen.getByText('Alidade Smooth')).toBeInTheDocument();
    });
  });

  it('should render the Load custom styles button', async () => {
    const user = userEvent.setup();

    render(
      <MapStyleControl
        customStyleData={null}
        onStyleChange={vi.fn()}
        onCustomStyleLoaded={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Map Styles' }));

    await waitFor(() => {
      expect(screen.getByTestId('custom-styles-dialog')).toBeInTheDocument();
    });
  });

  it('should call onStyleChange when style is selected', async () => {
    const user = userEvent.setup();
    const onStyleChange = vi.fn();

    render(
      <MapStyleControl
        customStyleData={null}
        onStyleChange={onStyleChange}
        onCustomStyleLoaded={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Map Styles' }));

    await waitFor(() => {
      expect(screen.getByText('Carto')).toBeInTheDocument();
    });

    const cartoMap = screen.getByTestId('map-carto-map');
    const cartoOption = cartoMap.closest('.cursor-pointer');
    await user.click(cartoOption!);

    await waitFor(() => {
      expect(onStyleChange).toHaveBeenCalledWith('carto');
    });
  });

  it('should save selected style to localStorage', async () => {
    const user = userEvent.setup();

    render(
      <MapStyleControl
        customStyleData={null}
        onStyleChange={vi.fn()}
        onCustomStyleLoaded={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Map Styles' }));

    await waitFor(() => {
      expect(screen.getByText('Alidade Smooth')).toBeInTheDocument();
    });

    const alidadeMap = screen.getByTestId('map-alidade-smooth-map');
    const alidadeOption = alidadeMap.closest('.cursor-pointer');
    await user.click(alidadeOption!);

    await waitFor(() => {
      expect(localStorageMock[MAP_STYLE_STORAGE_KEY]).toBe('alidade-smooth');
    });
  });

  it('should display custom style option when customStyleData is provided', async () => {
    const user = userEvent.setup();
    const customStyleData = {
      version: 8 as const,
      name: 'My Custom Style',
      sources: {},
      layers: [],
    };

    render(
      <MapStyleControl
        customStyleData={customStyleData}
        onStyleChange={vi.fn()}
        onCustomStyleLoaded={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Map Styles' }));

    await waitFor(() => {
      expect(screen.getByText('My Custom Style')).toBeInTheDocument();
    });
  });

  it('should show "Custom" as label when customStyleData has no name', async () => {
    const user = userEvent.setup();
    const customStyleData = {
      version: 8 as const,
      sources: {},
      layers: [],
    };

    render(
      <MapStyleControl
        customStyleData={customStyleData}
        onStyleChange={vi.fn()}
        onCustomStyleLoaded={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Map Styles' }));

    await waitFor(() => {
      expect(screen.getByText('Custom')).toBeInTheDocument();
    });
  });

  it('should show EditStylesDialog when custom style is selected', async () => {
    const user = userEvent.setup();
    (utils.getInitialMapStyle as Mock).mockReturnValue('custom');

    const customStyleData = {
      version: 8 as const,
      name: 'My Custom Style',
      sources: {},
      layers: [],
    };

    render(
      <MapStyleControl
        customStyleData={customStyleData}
        onStyleChange={vi.fn()}
        onCustomStyleLoaded={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Map Styles' }));

    await waitFor(() => {
      expect(screen.getByTestId('edit-styles-dialog')).toBeInTheDocument();
    });
  });

  it('should not show EditStylesDialog when custom style is not selected', async () => {
    const user = userEvent.setup();
    const customStyleData = {
      version: 8 as const,
      name: 'My Custom Style',
      sources: {},
      layers: [],
    };

    render(
      <MapStyleControl
        customStyleData={customStyleData}
        onStyleChange={vi.fn()}
        onCustomStyleLoaded={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Map Styles' }));

    await waitFor(() => {
      expect(
        screen.queryByTestId('edit-styles-dialog')
      ).not.toBeInTheDocument();
    });
  });

  it('should call onCustomStyleLoaded when custom style is loaded', async () => {
    const user = userEvent.setup();
    const onCustomStyleLoaded = vi.fn();

    render(
      <MapStyleControl
        customStyleData={null}
        onStyleChange={vi.fn()}
        onCustomStyleLoaded={onCustomStyleLoaded}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Map Styles' }));

    await waitFor(() => {
      expect(screen.getByTestId('custom-styles-dialog')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('custom-styles-dialog'));

    await waitFor(() => {
      expect(onCustomStyleLoaded).toHaveBeenCalledWith(
        expect.objectContaining({
          version: 8,
          name: 'Custom Style',
        })
      );
    });
  });

  it('should set selectedStyle to custom when custom style is loaded', async () => {
    const user = userEvent.setup();
    const onStyleChange = vi.fn();

    render(
      <MapStyleControl
        customStyleData={null}
        onStyleChange={onStyleChange}
        onCustomStyleLoaded={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Map Styles' }));

    await waitFor(() => {
      expect(screen.getByTestId('custom-styles-dialog')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('custom-styles-dialog'));

    await waitFor(() => {
      expect(onStyleChange).toHaveBeenCalledWith('custom');
    });
  });

  it('should highlight the selected style option', async () => {
    const user = userEvent.setup();
    (utils.getInitialMapStyle as Mock).mockReturnValue('carto');

    render(
      <MapStyleControl
        customStyleData={null}
        onStyleChange={vi.fn()}
        onCustomStyleLoaded={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Map Styles' }));

    await waitFor(() => {
      const cartoLabel = screen.getByText('Carto');
      expect(cartoLabel).toHaveClass('font-bold');
      expect(cartoLabel).toHaveClass('text-primary');

      const shortbreadLabel = screen.getByText('Shortbread');
      expect(shortbreadLabel).toHaveClass('font-normal');
      expect(shortbreadLabel).toHaveClass('text-muted-foreground');
    });
  });

  it('should use getInitialMapStyle for initial selected style', async () => {
    const user = userEvent.setup();
    (utils.getInitialMapStyle as Mock).mockReturnValue('alidade-smooth');

    render(
      <MapStyleControl
        customStyleData={null}
        onStyleChange={vi.fn()}
        onCustomStyleLoaded={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Map Styles' }));

    await waitFor(() => {
      const alidadeLabel = screen.getByText('Alidade Smooth');
      expect(alidadeLabel).toHaveClass('font-bold');
    });
  });

  it('should call onStyleChange on initial render with initial style', async () => {
    const onStyleChange = vi.fn();

    render(
      <MapStyleControl
        customStyleData={null}
        onStyleChange={onStyleChange}
        onCustomStyleLoaded={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(onStyleChange).toHaveBeenCalledWith('shortbread');
    });
  });

  it('should save initial style to localStorage on mount', async () => {
    render(
      <MapStyleControl
        customStyleData={null}
        onStyleChange={vi.fn()}
        onCustomStyleLoaded={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(localStorageMock[MAP_STYLE_STORAGE_KEY]).toBe('shortbread');
    });
  });

  it('should call onCustomStyleLoaded when edit styles dialog saves', async () => {
    const user = userEvent.setup();
    (utils.getInitialMapStyle as Mock).mockReturnValue('custom');
    const onCustomStyleLoaded = vi.fn();
    const customStyleData = {
      version: 8 as const,
      name: 'My Custom Style',
      sources: {},
      layers: [],
    };

    render(
      <MapStyleControl
        customStyleData={customStyleData}
        onStyleChange={vi.fn()}
        onCustomStyleLoaded={onCustomStyleLoaded}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Map Styles' }));

    await waitFor(() => {
      expect(screen.getByTestId('edit-styles-dialog')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('edit-styles-dialog'));

    await waitFor(() => {
      expect(onCustomStyleLoaded).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Edited Style',
        })
      );
    });
  });

  it('should render mini maps for each style option', async () => {
    const user = userEvent.setup();

    render(
      <MapStyleControl
        customStyleData={null}
        onStyleChange={vi.fn()}
        onCustomStyleLoaded={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Map Styles' }));

    await waitFor(() => {
      expect(screen.getByTestId('map-shortbread-map')).toBeInTheDocument();
      expect(screen.getByTestId('map-carto-map')).toBeInTheDocument();
      expect(screen.getByTestId('map-alidade-smooth-map')).toBeInTheDocument();
    });
  });

  it('should render custom style mini map when customStyleData is provided', async () => {
    const user = userEvent.setup();
    const customStyleData = {
      version: 8 as const,
      name: 'My Custom Style',
      sources: {},
      layers: [],
    };

    render(
      <MapStyleControl
        customStyleData={customStyleData}
        onStyleChange={vi.fn()}
        onCustomStyleLoaded={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Map Styles' }));

    await waitFor(() => {
      expect(screen.getByTestId('map-custom-map')).toBeInTheDocument();
    });
  });

  it('should handle switching between built-in and custom styles', async () => {
    const user = userEvent.setup();
    const onStyleChange = vi.fn();
    const customStyleData = {
      version: 8 as const,
      name: 'My Custom Style',
      sources: {},
      layers: [],
    };

    render(
      <MapStyleControl
        customStyleData={customStyleData}
        onStyleChange={onStyleChange}
        onCustomStyleLoaded={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Map Styles' }));

    await waitFor(() => {
      expect(screen.getByText('My Custom Style')).toBeInTheDocument();
    });

    const customMap = screen.getByTestId('map-custom-map');
    const customOption = customMap.closest('.cursor-pointer');
    await user.click(customOption!);

    await waitFor(() => {
      expect(onStyleChange).toHaveBeenCalledWith('custom');
      expect(localStorageMock[MAP_STYLE_STORAGE_KEY]).toBe('custom');
    });

    const shortbreadMap = screen.getByTestId('map-shortbread-map');
    const shortbreadOption = shortbreadMap.closest('.cursor-pointer');
    await user.click(shortbreadOption!);

    await waitFor(() => {
      expect(onStyleChange).toHaveBeenCalledWith('shortbread');
      expect(localStorageMock[MAP_STYLE_STORAGE_KEY]).toBe('shortbread');
    });
  });

  it('should apply selected border class to selected style', async () => {
    const user = userEvent.setup();

    render(
      <MapStyleControl
        customStyleData={null}
        onStyleChange={vi.fn()}
        onCustomStyleLoaded={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Map Styles' }));

    await waitFor(() => {
      const shortbreadMap = screen.getByTestId('map-shortbread-map');
      const shortbreadOption = shortbreadMap.closest('.cursor-pointer');
      expect(shortbreadOption).toHaveClass('border-primary');

      const cartoMap = screen.getByTestId('map-carto-map');
      const cartoOption = cartoMap.closest('.cursor-pointer');
      expect(cartoOption).toHaveClass('border-transparent');
    });
  });

  it('should update border class when selection changes', async () => {
    const user = userEvent.setup();

    render(
      <MapStyleControl
        customStyleData={null}
        onStyleChange={vi.fn()}
        onCustomStyleLoaded={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Map Styles' }));

    await waitFor(() => {
      const shortbreadMap = screen.getByTestId('map-shortbread-map');
      const shortbreadOption = shortbreadMap.closest('.cursor-pointer');
      expect(shortbreadOption).toHaveClass('border-primary');
    });

    const cartoMap = screen.getByTestId('map-carto-map');
    const cartoOption = cartoMap.closest('.cursor-pointer');
    await user.click(cartoOption!);

    await waitFor(() => {
      expect(cartoOption).toHaveClass('border-primary');

      const shortbreadMap = screen.getByTestId('map-shortbread-map');
      const shortbreadOption = shortbreadMap.closest('.cursor-pointer');
      expect(shortbreadOption).toHaveClass('border-transparent');
    });
  });
});
