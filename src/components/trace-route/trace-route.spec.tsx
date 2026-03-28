import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TraceRouteControl } from './trace-route';

const mockTraceRoute = vi.fn();
const mockShowLoading = vi.fn();
const mockZoomTo = vi.fn();
const mockReceiveTraceRouteResults = vi.fn();
const mockClearTraceRoute = vi.fn();
const mockSetInputGeometry = vi.fn();
const mockDecode = vi.fn(() => [
  [52.5, 13.4],
  [52.6, 13.5],
]);

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
  useTraceRouteStore: vi.fn((selector) =>
    selector({
      receiveTraceRouteResults: mockReceiveTraceRouteResults,
      clearTraceRoute: mockClearTraceRoute,
      setInputGeometry: mockSetInputGeometry,
    })
  ),
}));

vi.mock('@/utils/polyline', () => ({
  decode: () => mockDecode(),
}));

vi.mock('@/utils/parse-gpx', () => ({
  parseGpxToLatLng: vi.fn(() => []),
}));

describe('TraceRouteControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
