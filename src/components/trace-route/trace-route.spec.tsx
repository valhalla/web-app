import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TraceRouteControl } from './trace-route';
import { useTraceRouteQuery } from '@/hooks/use-trace-route-query';
import type { ParsedDirectionsGeometry } from '@/components/types';

const mockTraceRoute = vi.fn();
const mockShowLoading = vi.fn();
const mockZoomTo = vi.fn();
const mockReceiveTraceRouteResults = vi.fn();
const mockClearTraceRoute = vi.fn();
const mockSetInputGeometry = vi.fn();
const mockSetInputShape = vi.fn();
const mockSetActiveRouteIndex = vi.fn();
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
