import type { ParsedDirectionsGeometry } from '@/components/types';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTraceRouteStore } from './trace-route-store';

const createMockTraceRouteData = (): ParsedDirectionsGeometry => ({
  id: 'valhalla_directions',
  decodedGeometry: [
    [40.7128, -74.006],
    [34.0522, -118.2437],
  ],
  trip: {
    locations: [
      {
        type: 'break',
        lat: 40.7128,
        lon: -74.006,
        side_of_street: 'none',
        original_index: 0,
      },
      {
        type: 'break',
        lat: 34.0522,
        lon: -118.2437,
        side_of_street: 'none',
        original_index: 1,
      },
    ],
    legs: [],
    summary: {
      has_time_restrictions: false,
      has_toll: false,
      has_highway: true,
      has_ferry: false,
      min_lat: 34.0522,
      min_lon: -118.2437,
      max_lat: 40.7128,
      max_lon: -74.006,
      time: 100,
      length: 10,
      cost: 12,
    },
    status_message: 'Found route',
    status: 0,
    units: 'kilometers',
    language: 'en-US',
  },
  alternates: [],
});

describe('useTraceRouteStore', () => {
  beforeEach(() => {
    useTraceRouteStore.getState().clearTraceRoute();
  });

  it('should initialize with exactly start and end waypoints', () => {
    const { waypoints } = useTraceRouteStore.getState();

    expect(waypoints).toHaveLength(2);
    expect(waypoints[0].id).toBe('start');
    expect(waypoints[1].id).toBe('end');
    expect(waypoints[0].userInput).toBe('');
    expect(waypoints[1].userInput).toBe('');
  });

  it('should keep only two waypoints when setWaypoints is called', () => {
    useTraceRouteStore.getState().setWaypoints([
      { id: 'start', geocodeResults: [], userInput: 'A' },
      { id: 'end', geocodeResults: [], userInput: 'B' },
      { id: 'end', geocodeResults: [], userInput: 'C' },
    ]);

    const { waypoints } = useTraceRouteStore.getState();
    expect(waypoints).toHaveLength(2);
    expect(waypoints[0].id).toBe('start');
    expect(waypoints[1].id).toBe('end');
    expect(waypoints[0].userInput).toBe('A');
    expect(waypoints[1].userInput).toBe('B');
  });

  it('should populate start/end waypoints from trace route results', () => {
    useTraceRouteStore.getState().receiveTraceRouteResults({
      data: createMockTraceRouteData(),
    });

    const { waypoints } = useTraceRouteStore.getState();

    expect(waypoints[0].id).toBe('start');
    expect(waypoints[0].userInput).toBe('-74.006000, 40.712800');
    expect(waypoints[0].geocodeResults[0]?.selected).toBe(true);

    expect(waypoints[1].id).toBe('end');
    expect(waypoints[1].userInput).toBe('-118.243700, 34.052200');
    expect(waypoints[1].geocodeResults[0]?.selected).toBe(true);
  });

  it('should set and clear input geometry', () => {
    useTraceRouteStore.getState().setInputGeometry([
      [1, 2],
      [3, 4],
    ]);

    expect(useTraceRouteStore.getState().inputGeometry).toEqual([
      [1, 2],
      [3, 4],
    ]);

    useTraceRouteStore.getState().clearTraceRoute();

    expect(useTraceRouteStore.getState().inputGeometry).toBeNull();
  });

  it('should reset waypoints when clearWaypoints is called', () => {
    useTraceRouteStore.getState().setWaypoints([
      { id: 'start', geocodeResults: [], userInput: 'custom-start' },
      { id: 'end', geocodeResults: [], userInput: 'custom-end' },
    ]);

    useTraceRouteStore.getState().clearWaypoints();

    const { waypoints } = useTraceRouteStore.getState();
    expect(waypoints[0].userInput).toBe('');
    expect(waypoints[1].userInput).toBe('');
  });
});
