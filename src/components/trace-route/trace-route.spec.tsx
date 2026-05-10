import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TraceRouteControl } from './trace-route';
import { useTraceRouteQuery } from '@/hooks/use-trace-route-query';
import type { ParsedDirectionsGeometry } from '@/components/types';
import { parseGpxToLatLng } from '@/utils/parse-gpx';

const mockTraceRoute = vi.fn();
const mockShowLoading = vi.fn();
const mockZoomTo = vi.fn();
const mockReceiveTraceRouteResults = vi.fn();
const mockClearTraceRoute = vi.fn();
const mockSetInputGeometry = vi.fn();
const mockSetInputShape = vi.fn();
const mockSetActiveRouteIndex = vi.fn();
const mockToastWarning = vi.fn();
const mockDecode = vi.fn(() => [
  [52.5, 13.4],
  [52.6, 13.5],
]);

interface MockTraceRouteStoreState {
  receiveTraceRouteResults: typeof mockReceiveTraceRouteResults;
  clearTraceRoute: typeof mockClearTraceRoute;
  setInputGeometry: typeof mockSetInputGeometry;
  setInputShape: typeof mockSetInputShape;
  results: {
    data: ParsedDirectionsGeometry | null;
    show: Record<number, boolean>;
  };
  successful: boolean;
  activeRouteIndex: number;
  setActiveRouteIndex: typeof mockSetActiveRouteIndex;
}

const mockTraceRouteStoreState: MockTraceRouteStoreState = {
  receiveTraceRouteResults: mockReceiveTraceRouteResults,
  clearTraceRoute: mockClearTraceRoute,
  setInputGeometry: mockSetInputGeometry,
  setInputShape: mockSetInputShape,
  results: { data: null, show: { 0: true } },
  successful: false,
  activeRouteIndex: 0,
  setActiveRouteIndex: mockSetActiveRouteIndex,
};

vi.mock('@/hooks/use-trace-route-query', () => ({
  useTraceRouteQuery: vi.fn(() => ({ traceRoute: mockTraceRoute })),
}));

vi.mock('@/stores/common-store', () => ({
  useCommonStore: vi.fn((selector) =>
    selector({
      showLoading: mockShowLoading,
      zoomTo: mockZoomTo,
    })
  ),
}));

vi.mock('@/stores/trace-route-store', () => ({
  useTraceRouteStore: vi.fn((selector) => selector(mockTraceRouteStoreState)),
}));

vi.mock('@/utils/polyline', () => ({
  decode: () => mockDecode(),
}));

vi.mock('@/utils/parse-gpx', () => ({
  parseGpxToLatLng: vi.fn(() => []),
}));

vi.mock('sonner', () => ({
  toast: {
    warning: (...args: unknown[]) => mockToastWarning(...args),
  },
}));

vi.mock('@tanstack/react-router', () => ({
  useSearch: vi.fn(() => ({ profile: 'auto' })),
}));

vi.mock('react-map-gl/maplibre', () => ({
  useMap: vi.fn(() => ({ mainMap: null })),
}));

describe('TraceRouteControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTraceRouteStoreState.results = { data: null, show: { 0: true } };
    mockTraceRouteStoreState.successful = false;
    mockTraceRouteStoreState.activeRouteIndex = 0;
  });

  it('should render controls and keep Trace Route button disabled initially', () => {
    render(<TraceRouteControl />);

    expect(
      screen.getByPlaceholderText('Enter encoded polyline')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trace Route' })).toBeDisabled();
    expect(screen.getByText(/Calculations by/i)).toBeInTheDocument();
  });

  it('should decode polyline and set input geometry on textarea change', async () => {
    const user = userEvent.setup();
    render(<TraceRouteControl />);

    await user.type(
      screen.getByPlaceholderText('Enter encoded polyline'),
      'abc'
    );

    expect(mockDecode).toHaveBeenCalled();
    expect(mockSetInputGeometry).toHaveBeenCalledWith([
      [52.5, 13.4],
      [52.6, 13.5],
    ]);
    expect(screen.getByRole('button', { name: 'Trace Route' })).toBeEnabled();
  });

  it('should trace route and store results on successful request', async () => {
    const user = userEvent.setup();

    const response = {
      decodedGeometry: [
        [52.5, 13.4],
        [52.6, 13.5],
      ],
    };
    mockTraceRoute.mockResolvedValue(response);

    render(<TraceRouteControl />);

    await user.type(
      screen.getByPlaceholderText('Enter encoded polyline'),
      'abc'
    );
    await user.click(screen.getByRole('button', { name: 'Trace Route' }));

    await waitFor(() => {
      expect(mockTraceRoute).toHaveBeenCalled();
      expect(mockReceiveTraceRouteResults).toHaveBeenCalledWith({
        data: response,
      });
      expect(mockZoomTo).toHaveBeenCalledWith(response.decodedGeometry);
      expect(mockShowLoading).toHaveBeenCalledWith(true);
    });

    await waitFor(() => {
      expect(mockShowLoading).toHaveBeenCalledWith(false);
    });
  });

  it('should pass all advanced trace options to trace query hook', () => {
    render(<TraceRouteControl />);

    expect(vi.mocked(useTraceRouteQuery)).toHaveBeenCalledWith(
      expect.objectContaining({
        trace_options: {
          accuracy: 5,
          radius: 50,
          breakage_distance: 50,
          interpolation_distance: 10,
        },
      })
    );
  });

  it('should clear route when polyline input is cleared', async () => {
    const user = userEvent.setup();
    render(<TraceRouteControl />);

    const input = screen.getByPlaceholderText('Enter encoded polyline');
    await user.type(input, 'abc');
    await user.clear(input);

    expect(mockClearTraceRoute).toHaveBeenCalled();
  });

  it('should keep Trace Route disabled while GPX file is still being read', async () => {
    const user = userEvent.setup();

    vi.mocked(parseGpxToLatLng).mockReturnValue([
      [52.5, 13.4],
      [52.6, 13.5],
    ]);

    const deferredFileText: { resolve?: (value: string) => void } = {};
    const file = new File(['<gpx></gpx>'], 'route.gpx', {
      type: 'application/gpx+xml',
    });
    Object.defineProperty(file, 'text', {
      value: () =>
        new Promise<string>((resolve) => {
          deferredFileText.resolve = resolve;
        }),
    });

    render(<TraceRouteControl />);

    const traceButton = screen.getByRole('button', { name: 'Trace Route' });
    const fileInput = screen.getByLabelText('Upload GPX file');

    await user.upload(fileInput, file);
    expect(traceButton).toBeDisabled();

    if (!deferredFileText.resolve) {
      throw new Error('Expected file text resolver to be initialized');
    }

    deferredFileText.resolve(
      '<gpx><trk><trkseg><trkpt lat="52.5" lon="13.4" /><trkpt lat="52.6" lon="13.5" /></trkseg></trk></gpx>'
    );

    await waitFor(() => {
      expect(traceButton).toBeEnabled();
    });
  });

  it('should reject oversized GPX files and show warning toast', async () => {
    const user = userEvent.setup();
    render(<TraceRouteControl />);

    const oversizedFile = new File(
      ['x'.repeat(2 * 1024 * 1024 + 1)],
      'too-big.gpx',
      {
        type: 'application/gpx+xml',
      }
    );

    await user.upload(screen.getByLabelText('Upload GPX file'), oversizedFile);

    expect(mockToastWarning).toHaveBeenCalledWith(
      'File too large',
      expect.objectContaining({
        description: expect.stringContaining('Max GPX size is 2 MB'),
      })
    );
    expect(mockClearTraceRoute).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Trace Route' })).toBeDisabled();
  });

  it('should keep maneuvers hidden by default and show them on click', async () => {
    const user = userEvent.setup();

    mockTraceRouteStoreState.successful = true;
    mockTraceRouteStoreState.results = {
      data: {
        decodedGeometry: [
          [52.5, 13.4],
          [52.6, 13.5],
        ],
        trip: {
          summary: {
            has_highway: false,
            has_ferry: false,
            has_toll: false,
            length: 12.3,
            time: 900,
          },
          legs: [
            {
              maneuvers: [
                {
                  type: 1,
                  instruction: 'Head north on Main St',
                  length: 0.4,
                  time: 60,
                },
              ],
            },
          ],
        },
        alternates: [],
      } as unknown as ParsedDirectionsGeometry,
      show: { 0: true },
    };

    render(<TraceRouteControl />);

    expect(screen.queryByText('Head north on Main St')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show Maneuvers' }));

    expect(screen.getByText('Head north on Main St')).toBeInTheDocument();
  });
});
