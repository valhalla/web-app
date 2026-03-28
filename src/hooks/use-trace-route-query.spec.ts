import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { useTraceRouteQuery } from './use-trace-route-query';
import { parseGpxToLatLng } from '@/utils/parse-gpx';
import {
  getValhallaUrl,
  parseDirectionsGeometry,
  showValhallaWarnings,
} from '@/utils/valhalla';

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock('@/utils/parse-gpx', () => ({
  parseGpxToLatLng: vi.fn(),
}));

vi.mock('@/utils/valhalla', () => ({
  getValhallaUrl: vi.fn(() => 'http://mock-valhalla'),
  parseDirectionsGeometry: vi.fn(() => [
    [50, 10],
    [51, 11],
  ]),
  showValhallaWarnings: vi.fn(),
}));

const createRouteResponse = () => ({
  id: 'valhalla_directions' as const,
  trip: {
    locations: [
      {
        type: 'break',
        lat: 52.5,
        lon: 13.4,
        side_of_street: 'none',
        original_index: 0,
      },
      {
        type: 'break',
        lat: 52.6,
        lon: 13.5,
        side_of_street: 'none',
        original_index: 1,
      },
    ],
    legs: [{ shape: 'encoded-shape' }],
    summary: {
      has_time_restrictions: false,
      has_toll: false,
      has_highway: false,
      has_ferry: false,
      min_lat: 0,
      min_lon: 0,
      max_lat: 1,
      max_lon: 1,
      time: 1,
      length: 1,
      cost: 1,
    },
    status_message: 'ok',
    status: 0,
    units: 'kilometers',
    language: 'en-US',
    warnings: [{ code: 101, text: 'Heads up' }],
  },
  alternates: [
    {
      id: 'valhalla_directions' as const,
      trip: {
        locations: [],
        legs: [{ shape: 'alternate-shape' }],
        summary: {
          has_time_restrictions: false,
          has_toll: false,
          has_highway: false,
          has_ferry: false,
          min_lat: 0,
          min_lon: 0,
          max_lat: 1,
          max_lon: 1,
          time: 1,
          length: 1,
          cost: 1,
        },
        status_message: 'ok',
        status: 0,
        units: 'kilometers',
        language: 'en-US',
      },
    },
  ],
});

describe('useTraceRouteQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getValhallaUrl).mockReturnValue('http://mock-valhalla');
  });

  it('should throw when both polyline and file are missing', async () => {
    const { traceRoute } = useTraceRouteQuery({});

    await expect(traceRoute()).rejects.toThrow(
      'Provide an encoded polyline or a GPX file.'
    );
  });

  it('should post encoded polyline request and parse geometry', async () => {
    const response = createRouteResponse();
    vi.mocked(axios.post).mockResolvedValue({ data: response });

    const { traceRoute } = useTraceRouteQuery({
      polyline: '  abc\n123  ',
    });

    const result = await traceRoute();

    expect(axios.post).toHaveBeenCalledWith(
      'http://mock-valhalla/trace_route',
      {
        encoded_polyline: 'abc123',
        shape_match: 'map_snap',
        costing: 'auto',
        trace_options: {
          gps_accuracy: 5,
          search_radius: 50,
          interpolation_distance: 10,
          breakage_distance: 50,
        },
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    expect(parseDirectionsGeometry).toHaveBeenCalledTimes(2);
    expect(showValhallaWarnings).toHaveBeenCalledWith(response.trip.warnings);
    expect(result.decodedGeometry).toEqual([
      [50, 10],
      [51, 11],
    ]);
  });

  it('should build shape request from GPX file text', async () => {
    vi.mocked(parseGpxToLatLng).mockReturnValue([
      [52.5, 13.4],
      [52.6, 13.5],
      [52.7, 13.6],
    ]);

    const response = createRouteResponse();
    vi.mocked(axios.post).mockResolvedValue({ data: response });

    const { traceRoute } = useTraceRouteQuery({ fileText: '<gpx>...</gpx>' });
    await traceRoute();

    expect(axios.post).toHaveBeenCalledWith(
      'http://mock-valhalla/trace_route',
      {
        shape: [
          { lat: 52.5, lon: 13.4, type: 'break' },
          { lat: 52.6, lon: 13.5 },
          { lat: 52.7, lon: 13.6, type: 'break' },
        ],
        shape_match: 'map_snap',
        costing: 'auto',
        trace_options: {
          gps_accuracy: 5,
          search_radius: 50,
          interpolation_distance: 10,
          breakage_distance: 50,
        },
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
  });

  it('should map accuracy and radius to valhalla trace options', async () => {
    const response = createRouteResponse();
    vi.mocked(axios.post).mockResolvedValue({ data: response });

    const { traceRoute } = useTraceRouteQuery({
      polyline: 'abc123',
      trace_options: {
        accuracy: 7,
        radius: 60,
        breakage_distance: 75,
        interpolation_distance: 15,
      },
    });

    await traceRoute();

    expect(axios.post).toHaveBeenCalledWith(
      'http://mock-valhalla/trace_route',
      expect.objectContaining({
        trace_options: {
          gps_accuracy: 7,
          search_radius: 60,
          interpolation_distance: 15,
          breakage_distance: 75,
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  });

  it('should prefer explicit gps_accuracy/search_radius over aliases', async () => {
    const response = createRouteResponse();
    vi.mocked(axios.post).mockResolvedValue({ data: response });

    const { traceRoute } = useTraceRouteQuery({
      polyline: 'abc123',
      trace_options: {
        accuracy: 9,
        radius: 70,
        gps_accuracy: 4,
        search_radius: 25,
      },
    });

    await traceRoute();

    expect(axios.post).toHaveBeenCalledWith(
      'http://mock-valhalla/trace_route',
      expect.objectContaining({
        trace_options: expect.objectContaining({
          gps_accuracy: 4,
          search_radius: 25,
        }),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  });

  it('should fallback to defaults for invalid numeric trace options', async () => {
    const response = createRouteResponse();
    vi.mocked(axios.post).mockResolvedValue({ data: response });

    const { traceRoute } = useTraceRouteQuery({
      polyline: 'abc123',
      trace_options: {
        gps_accuracy: Number.NaN,
        search_radius: Number.POSITIVE_INFINITY,
        interpolation_distance: -1,
        breakage_distance: Number.NaN,
      },
    });

    await traceRoute();

    expect(axios.post).toHaveBeenCalledWith(
      'http://mock-valhalla/trace_route',
      expect.objectContaining({
        trace_options: {
          gps_accuracy: 5,
          search_radius: 50,
          interpolation_distance: 10,
          breakage_distance: 50,
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  });

  it("should map 'car' costing to valhalla 'auto'", async () => {
    const response = createRouteResponse();
    vi.mocked(axios.post).mockResolvedValue({ data: response });

    const { traceRoute } = useTraceRouteQuery({
      polyline: 'abc123',
      costing: 'car',
    });

    await traceRoute();

    expect(axios.post).toHaveBeenCalledWith(
      'http://mock-valhalla/trace_route',
      expect.objectContaining({
        costing: 'auto',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  });

  it('should throw when GPX file has fewer than 2 points', async () => {
    vi.mocked(parseGpxToLatLng).mockReturnValue([[52.5, 13.4]]);

    const { traceRoute } = useTraceRouteQuery({ fileText: '<gpx>...</gpx>' });

    await expect(traceRoute()).rejects.toThrow(
      'GPX must contain at least 2 points.'
    );
  });
});
