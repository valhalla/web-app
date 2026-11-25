import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouteCard } from './route-card';
import type { ParsedDirectionsGeometry } from '@/components/types';

const mockExportDataAsJson = vi.fn();
const mockDownloadFile = vi.fn();
const mockFetchHeight = vi.fn();
const mockToastError = vi.fn();

vi.mock('@/utils/export', () => ({
  exportDataAsJson: (...args: unknown[]) => mockExportDataAsJson(...args),
}));

vi.mock('@/utils/download-file', () => ({
  downloadFile: (...args: unknown[]) => mockDownloadFile(...args),
}));

vi.mock('@/utils/height', () => ({
  fetchHeight: (...args: unknown[]) => mockFetchHeight(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

vi.mock('@/utils/date-time', () => ({
  getDateTimeString: () => '2024-01-01_12-00-00',
  formatDuration: (seconds: number) => `${Math.floor(seconds / 60)} min`,
}));

vi.mock('./summary', () => ({
  Summary: ({
    title,
    index,
  }: {
    summary: unknown;
    title: string;
    index: number;
    routeCoordinates: number[][];
  }) => <div data-testid={`mock-summary-${index}`}>Summary: {title}</div>,
}));

vi.mock('./maneuvers', () => ({
  Maneuvers: ({ index }: { legs: unknown[]; index: number }) => (
    <div data-testid={`mock-maneuvers-${index}`}>Maneuvers</div>
  ),
}));

const createMockData = (
  overrides: Partial<ParsedDirectionsGeometry> = {}
): ParsedDirectionsGeometry => ({
  id: 'test-route',
  trip: {
    locations: [],
    legs: [
      {
        maneuvers: [],
        summary: {
          has_time_restrictions: false,
          has_toll: false,
          has_highway: false,
          has_ferry: false,
          min_lat: 48.0,
          min_lon: 10.0,
          max_lat: 52.5,
          max_lon: 13.4,
          time: 3600,
          length: 150.5,
          cost: 100,
        },
        shape: 'encoded',
      },
    ],
    summary: {
      has_time_restrictions: false,
      has_toll: false,
      has_highway: false,
      has_ferry: false,
      min_lat: 48.0,
      min_lon: 10.0,
      max_lat: 52.5,
      max_lon: 13.4,
      time: 3600,
      length: 150.5,
      cost: 100,
    },
    status_message: 'OK',
    status: 0,
    units: 'kilometers',
    language: 'en',
  },
  decodedGeometry: [
    [52.5, 13.4],
    [52.4, 13.3],
    [52.3, 13.2],
  ],
  ...overrides,
});

describe('RouteCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchHeight.mockResolvedValue({ height: [100, 101, 102] });
  });

  it('should render without crashing', () => {
    const data = createMockData();
    expect(() =>
      render(
        <RouteCard data={data} index={0} isActive={true} onSelect={vi.fn()} />
      )
    ).not.toThrow();
  });

  it('should return null when trip is missing', () => {
    const data = {
      ...createMockData(),
      trip: undefined,
    } as unknown as ParsedDirectionsGeometry;
    const { container } = render(
      <RouteCard data={data} index={0} isActive={false} onSelect={vi.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render Summary component with Main Route title', () => {
    const data = createMockData();
    render(
      <RouteCard data={data} index={0} isActive={true} onSelect={vi.fn()} />
    );

    expect(screen.getByTestId('mock-summary-0')).toBeInTheDocument();
    expect(screen.getByText('Summary: Main Route')).toBeInTheDocument();
  });

  it('should render Summary component with Alternate Route title', () => {
    const data = createMockData();
    render(
      <RouteCard data={data} index={1} isActive={false} onSelect={vi.fn()} />
    );

    expect(screen.getByText('Summary: Alternate Route #1')).toBeInTheDocument();
  });

  it('should render Show Maneuvers button', () => {
    const data = createMockData();
    render(
      <RouteCard data={data} index={0} isActive={true} onSelect={vi.fn()} />
    );

    expect(
      screen.getByRole('button', { name: /show maneuvers/i })
    ).toBeInTheDocument();
  });

  it('should toggle maneuvers visibility when button is clicked', async () => {
    const user = userEvent.setup();
    const data = createMockData();
    render(
      <RouteCard data={data} index={0} isActive={true} onSelect={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: /show maneuvers/i }));

    expect(
      screen.getByRole('button', { name: /hide maneuvers/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId('mock-maneuvers-0')).toBeInTheDocument();
  });

  it('should hide maneuvers when Hide Maneuvers is clicked', async () => {
    const user = userEvent.setup();
    const data = createMockData();
    render(
      <RouteCard data={data} index={0} isActive={true} onSelect={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: /show maneuvers/i }));
    await user.click(screen.getByRole('button', { name: /hide maneuvers/i }));

    expect(
      screen.getByRole('button', { name: /show maneuvers/i })
    ).toBeInTheDocument();
    expect(screen.queryByTestId('mock-maneuvers-0')).not.toBeInTheDocument();
  });

  it('should render Export button', () => {
    const data = createMockData();
    render(
      <RouteCard data={data} index={0} isActive={true} onSelect={vi.fn()} />
    );

    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
  });

  it('should show export dropdown menu when Export is clicked', async () => {
    const user = userEvent.setup();
    const data = createMockData();
    render(
      <RouteCard data={data} index={0} isActive={true} onSelect={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: /export/i }));

    expect(screen.getByText('Format')).toBeInTheDocument();
    expect(screen.getByText('Options')).toBeInTheDocument();
    expect(
      screen.getByRole('menuitemradio', { name: 'JSON' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitemradio', { name: 'GeoJSON' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitemcheckbox', { name: 'Include elevation' })
    ).toBeInTheDocument();
  });

  it('should call exportDataAsJson when JSON format is selected and Export is clicked', async () => {
    const user = userEvent.setup();
    const data = createMockData();
    render(
      <RouteCard data={data} index={0} isActive={true} onSelect={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: /export/i }));
    await user.click(screen.getByRole('menuitemradio', { name: 'JSON' }));
    await user.click(screen.getByTestId('export-action-button'));

    expect(mockExportDataAsJson).toHaveBeenCalledWith(
      data,
      'valhalla-directions'
    );
  });

  it('should call downloadFile with GeoJSON when GeoJSON format is selected and Export is clicked', async () => {
    const user = userEvent.setup();
    const data = createMockData();
    render(
      <RouteCard data={data} index={0} isActive={true} onSelect={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: /export/i }));
    await user.click(screen.getByRole('menuitemradio', { name: 'GeoJSON' }));
    await user.click(screen.getByTestId('export-action-button'));

    expect(mockDownloadFile).toHaveBeenCalledWith({
      data: expect.stringContaining('"type": "Feature"'),
      fileName: 'valhalla-directions_2024-01-01_12-00-00.geojson',
      fileType: 'text/json',
    });
  });

  it('should fetch elevation and export JSON with elevation when option is enabled', async () => {
    const user = userEvent.setup();
    const baseData = createMockData();
    const firstLeg = baseData.trip.legs[0]!;
    const data = createMockData({
      trip: {
        ...baseData.trip,
        legs: [
          ...baseData.trip.legs,
          {
            ...firstLeg,
            shape: 'encoded-2',
          },
        ],
      },
    });

    render(
      <RouteCard data={data} index={0} isActive={true} onSelect={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: /export/i }));
    await user.click(screen.getByRole('menuitemradio', { name: 'JSON' }));
    await user.click(
      screen.getByRole('menuitemcheckbox', { name: 'Include elevation' })
    );
    await user.click(screen.getByTestId('export-action-button'));

    expect(mockFetchHeight).toHaveBeenCalledWith({
      coordinates: data.decodedGeometry,
    });

    const callArg = mockDownloadFile.mock.calls[0]?.[0] as {
      data: string;
      fileName: string;
      fileType: string;
    };
    const exportedJson = JSON.parse(callArg.data);

    expect(callArg.fileName).toBe(
      'valhalla-directions_2024-01-01_12-00-00_with_elevation.json'
    );
    expect(exportedJson.trip.legs).toHaveLength(2);
    expect(exportedJson.trip.legs[0].elevation_interval).toBe(30);
    expect(exportedJson.trip.legs[0].elevation).toEqual([100, 101, 102]);
    expect(exportedJson.trip.legs[1].elevation_interval).toBe(30);
    expect(exportedJson.trip.legs[1].elevation).toEqual([100, 101, 102]);
  });

  it('should show error toast and skip download when elevation fetch fails', async () => {
    const user = userEvent.setup();
    const data = createMockData();
    mockFetchHeight.mockRejectedValueOnce(new Error('network failed'));

    render(
      <RouteCard data={data} index={0} isActive={true} onSelect={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: /export/i }));
    await user.click(
      screen.getByRole('menuitemcheckbox', { name: 'Include elevation' })
    );
    await user.click(screen.getByTestId('export-action-button'));

    expect(mockToastError).toHaveBeenCalledWith(
      'Failed to fetch elevation data.',
      expect.any(Object)
    );
    expect(mockDownloadFile).not.toHaveBeenCalled();
  });

  it('should convert coordinates to GeoJSON format (lng, lat)', async () => {
    const user = userEvent.setup();
    const data = createMockData({
      decodedGeometry: [[52.5, 13.4]],
    });
    render(
      <RouteCard data={data} index={0} isActive={true} onSelect={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: /export/i }));
    await user.click(screen.getByRole('menuitemradio', { name: 'GeoJSON' }));
    await user.click(screen.getByTestId('export-action-button'));

    const callArg = mockDownloadFile.mock.calls[0]?.[0] as {
      data: string;
      fileName: string;
      fileType: string;
    };
    const geoJson = JSON.parse(callArg.data);
    expect(geoJson.geometry.coordinates).toEqual([[13.4, 52.5]]);
  });

  it('should apply hover styles to card', () => {
    const data = createMockData();
    render(
      <RouteCard data={data} index={0} isActive={false} onSelect={vi.fn()} />
    );

    const card = screen.getByTestId('mock-summary-0').parentElement;
    expect(card).toHaveClass('hover:bg-muted/50');
  });

  it('should apply different background when maneuvers are shown', async () => {
    const user = userEvent.setup();
    const data = createMockData();
    render(
      <RouteCard data={data} index={0} isActive={false} onSelect={vi.fn()} />
    );

    const card = screen.getByTestId('mock-summary-0').parentElement;
    expect(card).toHaveClass('bg-background');

    await user.click(screen.getByRole('button', { name: /show maneuvers/i }));

    expect(card).toHaveClass('bg-muted/50');
  });

  it('should apply active styling when isActive is true', () => {
    const data = createMockData();
    render(
      <RouteCard data={data} index={-1} isActive={true} onSelect={vi.fn()} />
    );

    const card = screen.getByTestId('mock-summary--1').parentElement;
    expect(card).toHaveClass('border-l-4');
    expect(card).toHaveClass('border-l-primary');
  });

  it('should not apply active styling when isActive is false', () => {
    const data = createMockData();
    render(
      <RouteCard data={data} index={-1} isActive={false} onSelect={vi.fn()} />
    );

    const card = screen.getByTestId('mock-summary--1').parentElement;
    expect(card).not.toHaveClass('border-l-4');
  });

  it('should call onSelect when card is clicked', async () => {
    const user = userEvent.setup();
    const data = createMockData();
    const onSelect = vi.fn();
    render(
      <RouteCard data={data} index={-1} isActive={false} onSelect={onSelect} />
    );

    const card = screen.getByTestId('mock-summary--1').parentElement!;
    await user.click(card);

    expect(onSelect).toHaveBeenCalled();
  });
});
