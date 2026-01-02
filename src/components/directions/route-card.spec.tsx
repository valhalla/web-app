import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouteCard } from './route-card';
import type { ParsedDirectionsGeometry } from '@/components/types';

const mockExportDataAsJson = vi.fn();
const mockDownloadFile = vi.fn();

vi.mock('@/utils/export', () => ({
  exportDataAsJson: (...args: unknown[]) => mockExportDataAsJson(...args),
}));

vi.mock('@/utils/download-file', () => ({
  downloadFile: (...args: unknown[]) => mockDownloadFile(...args),
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
  });

  it('should render without crashing', () => {
    const data = createMockData();
    expect(() => render(<RouteCard data={data} index={-1} />)).not.toThrow();
  });

  it('should return null when trip is missing', () => {
    const data = {
      ...createMockData(),
      trip: undefined,
    } as unknown as ParsedDirectionsGeometry;
    const { container } = render(<RouteCard data={data} index={-1} />);

    expect(container.firstChild).toBeNull();
  });

  it('should render Summary component with Main Route title', () => {
    const data = createMockData();
    render(<RouteCard data={data} index={-1} />);

    expect(screen.getByTestId('mock-summary--1')).toBeInTheDocument();
    expect(screen.getByText('Summary: Main Route')).toBeInTheDocument();
  });

  it('should render Summary component with Alternate Route title', () => {
    const data = createMockData();
    render(<RouteCard data={data} index={0} />);

    expect(screen.getByText('Summary: Alternate Route #1')).toBeInTheDocument();
  });

  it('should render Show Maneuvers button', () => {
    const data = createMockData();
    render(<RouteCard data={data} index={-1} />);

    expect(
      screen.getByRole('button', { name: /show maneuvers/i })
    ).toBeInTheDocument();
  });

  it('should toggle maneuvers visibility when button is clicked', async () => {
    const user = userEvent.setup();
    const data = createMockData();
    render(<RouteCard data={data} index={-1} />);

    await user.click(screen.getByRole('button', { name: /show maneuvers/i }));

    expect(
      screen.getByRole('button', { name: /hide maneuvers/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId('mock-maneuvers--1')).toBeInTheDocument();
  });

  it('should hide maneuvers when Hide Maneuvers is clicked', async () => {
    const user = userEvent.setup();
    const data = createMockData();
    render(<RouteCard data={data} index={-1} />);

    await user.click(screen.getByRole('button', { name: /show maneuvers/i }));
    await user.click(screen.getByRole('button', { name: /hide maneuvers/i }));

    expect(
      screen.getByRole('button', { name: /show maneuvers/i })
    ).toBeInTheDocument();
    expect(screen.queryByTestId('mock-maneuvers--1')).not.toBeInTheDocument();
  });

  it('should render Export button', () => {
    const data = createMockData();
    render(<RouteCard data={data} index={-1} />);

    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
  });

  it('should show export dropdown menu when Export is clicked', async () => {
    const user = userEvent.setup();
    const data = createMockData();
    render(<RouteCard data={data} index={-1} />);

    await user.click(screen.getByRole('button', { name: /export/i }));

    expect(screen.getByRole('menuitem', { name: 'JSON' })).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'GeoJSON' })
    ).toBeInTheDocument();
  });

  it('should call exportDataAsJson when JSON is clicked', async () => {
    const user = userEvent.setup();
    const data = createMockData();
    render(<RouteCard data={data} index={-1} />);

    await user.click(screen.getByRole('button', { name: /export/i }));
    await user.click(screen.getByRole('menuitem', { name: 'JSON' }));

    expect(mockExportDataAsJson).toHaveBeenCalledWith(
      data,
      'valhalla-directions'
    );
  });

  it('should call downloadFile with GeoJSON when GeoJSON is clicked', async () => {
    const user = userEvent.setup();
    const data = createMockData();
    render(<RouteCard data={data} index={-1} />);

    await user.click(screen.getByRole('button', { name: /export/i }));
    await user.click(screen.getByRole('menuitem', { name: 'GeoJSON' }));

    expect(mockDownloadFile).toHaveBeenCalledWith({
      data: expect.stringContaining('"type": "Feature"'),
      fileName: 'valhalla-directions_2024-01-01_12-00-00.geojson',
      fileType: 'text/json',
    });
  });

  it('should convert coordinates to GeoJSON format (lng, lat)', async () => {
    const user = userEvent.setup();
    const data = createMockData({
      decodedGeometry: [[52.5, 13.4]],
    });
    render(<RouteCard data={data} index={-1} />);

    await user.click(screen.getByRole('button', { name: /export/i }));
    await user.click(screen.getByRole('menuitem', { name: 'GeoJSON' }));

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
    render(<RouteCard data={data} index={-1} />);

    const card = screen.getByTestId('mock-summary--1').parentElement;
    expect(card).toHaveClass('hover:bg-muted/50');
  });

  it('should apply different background when maneuvers are shown', async () => {
    const user = userEvent.setup();
    const data = createMockData();
    render(<RouteCard data={data} index={-1} />);

    const card = screen.getByTestId('mock-summary--1').parentElement;
    expect(card).toHaveClass('bg-background');

    await user.click(screen.getByRole('button', { name: /show maneuvers/i }));

    expect(card).toHaveClass('bg-muted/50');
  });
});
