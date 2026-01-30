import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Profile } from '@/stores/common-store';
import type {
  ActiveWaypoints,
  IsochronesRequestParams,
  Settings,
  ValhallaRouteResponse,
} from '@/components/types';
import {
  buildLocateRequest,
  buildHeightRequest,
  buildDirectionsRequest,
  parseDirectionsGeometry,
  buildIsochronesRequest,
  makeContours,
  makeLocations,
  buildOptimizedRouteRequest,
} from './valhalla';

// Mock the polyline decode function
vi.mock('./polyline', () => ({
  decode: vi.fn(),
}));

import { decode } from './polyline';

describe('valhalla.ts', () => {
  const mockDecode = vi.mocked(decode);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildLocateRequest', () => {
    it('should create a locate request with auto profile for car', () => {
      const latLng = { lat: 40.7128, lng: -74.006 };
      const profile: Profile = 'car';

      const result = buildLocateRequest(latLng, profile);

      expect(result).toEqual({
        costing: 'auto',
        locations: [{ lat: 40.7128, lon: -74.006 }],
      });
    });

    it('should create a locate request with bicycle profile', () => {
      const latLng = { lat: 40.7128, lng: -74.006 };
      const profile: Profile = 'bicycle';

      const result = buildLocateRequest(latLng, profile);

      expect(result).toEqual({
        costing: 'bicycle',
        locations: [{ lat: 40.7128, lon: -74.006 }],
      });
    });

    it('should create a locate request with pedestrian profile', () => {
      const latLng = { lat: 40.7128, lng: -74.006 };
      const profile: Profile = 'pedestrian';

      const result = buildLocateRequest(latLng, profile);

      expect(result).toEqual({
        costing: 'pedestrian',
        locations: [{ lat: 40.7128, lon: -74.006 }],
      });
    });

    it('should create a locate request with truck profile', () => {
      const latLng = { lat: 40.7128, lng: -74.006 };
      const profile: Profile = 'truck';

      const result = buildLocateRequest(latLng, profile);

      expect(result).toEqual({
        costing: 'truck',
        locations: [{ lat: 40.7128, lon: -74.006 }],
      });
    });

    it('should create a locate request with bus profile', () => {
      const latLng = { lat: 40.7128, lng: -74.006 };
      const profile: Profile = 'bus';

      const result = buildLocateRequest(latLng, profile);

      expect(result).toEqual({
        costing: 'bus',
        locations: [{ lat: 40.7128, lon: -74.006 }],
      });
    });

    it('should create a locate request with motorcycle profile', () => {
      const latLng = { lat: 40.7128, lng: -74.006 };
      const profile: Profile = 'motorcycle';

      const result = buildLocateRequest(latLng, profile);

      expect(result).toEqual({
        costing: 'motorcycle',
        locations: [{ lat: 40.7128, lon: -74.006 }],
      });
    });

    it('should create a locate request with motor_scooter profile', () => {
      const latLng = { lat: 40.7128, lng: -74.006 };
      const profile: Profile = 'motor_scooter';

      const result = buildLocateRequest(latLng, profile);

      expect(result).toEqual({
        costing: 'motor_scooter',
        locations: [{ lat: 40.7128, lon: -74.006 }],
      });
    });
  });

  describe('buildHeightRequest', () => {
    it('should create a height request with single coordinate', () => {
      const latLngs: [number, number][] = [[40.7128, -74.006]];

      const result = buildHeightRequest(latLngs);

      expect(result).toEqual({
        range: false,
        shape: [{ lat: 40.7128, lon: -74.006 }],
        id: 'valhalla_height',
      });
    });

    it('should create a height request with multiple coordinates', () => {
      const latLngs: [number, number][] = [
        [40.7128, -74.006],
        [34.0522, -118.2437],
        [41.8781, -87.6298],
      ];

      const result = buildHeightRequest(latLngs);

      expect(result).toEqual({
        range: true,
        shape: [
          { lat: 40.7128, lon: -74.006 },
          { lat: 34.0522, lon: -118.2437 },
          { lat: 41.8781, lon: -87.6298 },
        ],
        id: 'valhalla_height',
      });
    });

    it('should create a height request with empty coordinates array', () => {
      const latLngs: [number, number][] = [];

      const result = buildHeightRequest(latLngs);

      expect(result).toEqual({
        range: false,
        shape: [],
        id: 'valhalla_height',
      });
    });
  });

  describe('buildDirectionsRequest', () => {
    const mockActiveWaypoints: ActiveWaypoints = [
      {
        title: 'Start',
        description: 'Starting point',
        selected: true,
        addresslnglat: [-74.006, 40.7128],
        sourcelnglat: [-74.006, 40.7128],
        displaylnglat: [-74.006, 40.7128],
        key: 1,
        addressindex: 0,
      },
      {
        title: 'Via',
        description: 'Via point',
        selected: true,
        addresslnglat: [-118.2437, 34.0522],
        sourcelnglat: [-118.2437, 34.0522],
        displaylnglat: [-118.2437, 34.0522],
        key: 2,
        addressindex: 1,
      },
      {
        title: 'End',
        description: 'Ending point',
        selected: true,
        addresslnglat: [-87.6298, 41.8781],
        sourcelnglat: [-87.6298, 41.8781],
        displaylnglat: [-87.6298, 41.8781],
        key: 3,
        addressindex: 2,
      },
    ];

    const mockSettings: Settings = {
      costing: {
        maneuver_penalty: 5,
        country_crossing_penalty: 0,
        country_crossing_cost: 600,
        length: 21.5,
        width: 1.6,
        height: 1.9,
        weight: 21.77,
        axle_load: 9,
        hazmat: false,
        use_highways: 1,
        use_tolls: 1,
        use_ferry: 0.5,
        ferry_cost: 300,
        use_living_streets: 0.1,
        use_tracks: 0,
        private_access_penalty: 450,
        ignore_closures: false,
        ignore_restrictions: false,
        ignore_access: false,
        closure_factor: 9,
        service_penalty: 15,
        service_factor: 1,
        exclude_unpaved: false,
        shortest: false,
        exclude_cash_only_tolls: false,
        bicycle_type: 'Hybrid',
        cycling_speed: 20,
        use_roads: 0.5,
        use_hills: 0.5,
        avoid_bad_surfaces: 0.25,
        top_speed: 140,
        use_primary: 0.5,
        walking_speed: 5.1,
        walkway_factor: 1,
        sidewalk_factor: 1,
        alley_factor: 2,
        driveway_factor: 5,
        step_penalty: 0,
        max_hiking_difficulty: 1,
        exclude_polygons: [],
        use_geocoding: true,
        use_lit: 0,
        axle_count: 5,
        fixed_speed: 0,
        toll_booth_penalty: 0,
        toll_booth_cost: 15,
        gate_penalty: 300,
        gate_cost: 30,
        include_hov2: false,
        include_hov3: false,
        include_hot: false,
        transit_start_end_max_distance: 2145,
        transit_transfer_max_distance: 800,
        disable_hierarchy_pruning: false,
        use_trails: 0,
        denoise: 0.1,
        generalize: 0,
        alternates: 0,
        speed_types: [],
      },
      directions: {
        maneuver_penalty: 5,
        country_crossing_penalty: 0,
        country_crossing_cost: 600,
        length: 21.5,
        width: 1.6,
        height: 1.9,
        weight: 21.77,
        axle_load: 9,
        hazmat: false,
        use_highways: 1,
        use_tolls: 1,
        use_ferry: 0.5,
        ferry_cost: 300,
        use_living_streets: 0.1,
        use_tracks: 0,
        private_access_penalty: 450,
        ignore_closures: false,
        ignore_restrictions: false,
        ignore_access: false,
        closure_factor: 9,
        service_penalty: 15,
        service_factor: 1,
        exclude_unpaved: false,
        shortest: false,
        exclude_cash_only_tolls: false,
        bicycle_type: 'Hybrid',
        cycling_speed: 20,
        use_roads: 0.5,
        use_hills: 0.5,
        avoid_bad_surfaces: 0.25,
        top_speed: 140,
        use_primary: 0.5,
        walking_speed: 5.1,
        walkway_factor: 1,
        sidewalk_factor: 1,
        alley_factor: 2,
        driveway_factor: 5,
        step_penalty: 0,
        max_hiking_difficulty: 1,
        exclude_polygons: [],
        use_geocoding: true,
        use_lit: 0,
        axle_count: 5,
        fixed_speed: 0,
        toll_booth_penalty: 0,
        toll_booth_cost: 15,
        gate_penalty: 300,
        gate_cost: 30,
        include_hov2: false,
        include_hov3: false,
        include_hot: false,
        transit_start_end_max_distance: 2145,
        transit_transfer_max_distance: 800,
        disable_hierarchy_pruning: false,
        use_trails: 0,
        denoise: 0.1,
        generalize: 0,
        alternates: 0,
        speed_types: [],
      },
    };

    const mockDateTime = { type: 1, value: '2023-01-01T12:00' };

    it('should create a directions request with car profile (mapped to auto)', () => {
      const profile: Profile = 'car';

      const result = buildDirectionsRequest({
        profile,
        activeWaypoints: mockActiveWaypoints,
        settings: mockSettings,
        dateTime: mockDateTime,
        language: 'en-US',
      });

      expect(result).toEqual({
        json: {
          costing: 'auto',
          costing_options: {
            auto: mockSettings.costing,
          },
          exclude_polygons: [],
          locations: [
            { lon: -74.006, lat: 40.7128, type: 'break' },
            { lon: -118.2437, lat: 34.0522, type: 'via' },
            { lon: -87.6298, lat: 41.8781, type: 'break' },
          ],
          units: 'kilometers',
          alternates: 0,
          id: 'valhalla_directions',
          language: 'en-US',
          date_time: mockDateTime,
        },
      });
    });

    it('should create a directions request with bicycle profile', () => {
      const profile: Profile = 'bicycle';

      const result = buildDirectionsRequest({
        profile,
        activeWaypoints: mockActiveWaypoints,
        settings: mockSettings,
        dateTime: mockDateTime,
        language: 'de-DE',
      });

      expect(result).toEqual({
        json: {
          costing: 'bicycle',
          costing_options: {
            bicycle: mockSettings.costing,
          },
          exclude_polygons: [],
          locations: [
            { lon: -74.006, lat: 40.7128, type: 'break' },
            { lon: -118.2437, lat: 34.0522, type: 'via' },
            { lon: -87.6298, lat: 41.8781, type: 'break' },
          ],
          units: 'kilometers',
          alternates: 0,
          id: 'valhalla_directions',
          language: 'de-DE',
          date_time: mockDateTime,
        },
      });
    });

    it('should create a directions request without date_time when type is -1', () => {
      const profile: Profile = 'car';
      const dateTimeNoType = { type: -1, value: '2023-01-01T12:00' };

      const result = buildDirectionsRequest({
        profile,
        activeWaypoints: mockActiveWaypoints,
        settings: mockSettings,
        dateTime: dateTimeNoType,
        language: 'en-US',
      });

      expect(result).toEqual({
        json: {
          costing: 'auto',
          costing_options: {
            auto: mockSettings.costing,
          },
          exclude_polygons: [],
          locations: [
            { lon: -74.006, lat: 40.7128, type: 'break' },
            { lon: -118.2437, lat: 34.0522, type: 'via' },
            { lon: -87.6298, lat: 41.8781, type: 'break' },
          ],
          units: 'kilometers',
          alternates: 0,
          id: 'valhalla_directions',
          language: 'en-US',
        },
      });
      expect(result.json).not.toHaveProperty('date_time');
    });

    it('should create a directions request with single waypoint', () => {
      const singleWaypoint: ActiveWaypoints = [mockActiveWaypoints[0]!];
      const profile: Profile = 'car';

      const result = buildDirectionsRequest({
        profile,
        activeWaypoints: singleWaypoint,
        settings: mockSettings,
        dateTime: mockDateTime,
        language: 'en-US',
      });

      expect(result).toEqual({
        json: {
          costing: 'auto',
          costing_options: {
            auto: mockSettings.costing,
          },
          exclude_polygons: [],
          locations: [{ lon: -74.006, lat: 40.7128, type: 'break' }],
          units: 'kilometers',
          alternates: 0,
          id: 'valhalla_directions',
          language: 'en-US',
          date_time: mockDateTime,
        },
      });
    });
  });

  describe('buildOptimizedRouteRequest', () => {
    const mockActiveWaypoints: ActiveWaypoints = [
      {
        title: 'Start',
        description: 'Starting point',
        selected: true,
        addresslnglat: [-74.006, 40.7128],
        sourcelnglat: [-74.006, 40.7128],
        displaylnglat: [-74.006, 40.7128],
        key: 1,
        addressindex: 0,
      },
      {
        title: 'Via 1',
        description: 'Via point 1',
        selected: true,
        addresslnglat: [-73.99, 40.75],
        sourcelnglat: [-73.99, 40.75],
        displaylnglat: [-73.99, 40.75],
        key: 2,
        addressindex: 1,
      },
      {
        title: 'Via 2',
        description: 'Via point 2',
        selected: true,
        addresslnglat: [-73.98, 40.755],
        sourcelnglat: [-73.98, 40.755],
        displaylnglat: [-73.98, 40.755],
        key: 3,
        addressindex: 2,
      },
      {
        title: 'End',
        description: 'Ending point',
        selected: true,
        addresslnglat: [-87.6298, 41.8781],
        sourcelnglat: [-87.6298, 41.8781],
        displaylnglat: [-87.6298, 41.8781],
        key: 4,
        addressindex: 3,
      },
    ];
    const mockSettings: Settings = {
      // @ts-expect-error - Partial mock for testing
      costing: {
        maneuver_penalty: 5,
        use_highways: 1,
      },
      // @ts-expect-error - Partial mock for testing
      directions: {},
    };
    it('should create an optimized route request with proper structure', () => {
      const profile: Profile = 'car';
      const result = buildOptimizedRouteRequest({
        profile,
        activeWaypoints: mockActiveWaypoints,
        settings: mockSettings,
        language: 'en-US',
      });
      expect(result).toEqual({
        json: {
          costing: 'auto',
          costing_options: {
            auto: mockSettings.costing,
          },
          locations: [
            { lon: -74.006, lat: 40.7128, type: 'break' },
            { lon: -73.99, lat: 40.75, type: 'via' },
            { lon: -73.98, lat: 40.755, type: 'via' },
            { lon: -87.6298, lat: 41.8781, type: 'break' },
          ],
          units: 'kilometers',
          id: 'valhalla_optimized_route',
          language: 'en-US',
        },
      });
    });
  });

  describe('parseDirectionsGeometry', () => {
    it('should parse directions geometry with single leg', () => {
      const mockData: ValhallaRouteResponse = {
        trip: {
          legs: [
            {
              shape: 'encoded_shape_1',
              summary: {
                has_time_restrictions: false,
                has_toll: false,
                has_highway: false,
                has_ferry: false,
                min_lat: 40.0,
                min_lon: -75.0,
                max_lat: 41.0,
                max_lon: -74.0,
                time: 300,
                length: 10.5,
                cost: 100,
              },
              maneuvers: [],
            },
          ],
          locations: [],
          summary: {
            has_time_restrictions: false,
            has_toll: false,
            has_highway: false,
            has_ferry: false,
            min_lat: 40.0,
            min_lon: -75.0,
            max_lat: 41.0,
            max_lon: -74.0,
            time: 300,
            length: 10.5,
            cost: 100,
          },
          status_message: 'Found route',
          status: 0,
          units: 'kilometers',
          language: 'en-US',
        },
        id: 'valhalla_directions',
      };

      const mockDecodedCoordinates = [
        [40.7128, -74.006],
        [40.713, -74.005],
        [40.714, -74.004],
      ];
      mockDecode.mockReturnValue(mockDecodedCoordinates);

      const result = parseDirectionsGeometry(mockData);

      expect(mockDecode).toHaveBeenCalledWith('encoded_shape_1', 6);
      expect(result).toEqual(mockDecodedCoordinates);
    });

    it('should parse directions geometry with multiple legs', () => {
      const mockData: ValhallaRouteResponse = {
        trip: {
          legs: [
            {
              shape: 'encoded_shape_1',
              summary: {
                has_time_restrictions: false,
                has_toll: false,
                has_highway: false,
                has_ferry: false,
                min_lat: 40.0,
                min_lon: -75.0,
                max_lat: 41.0,
                max_lon: -74.0,
                time: 150,
                length: 5.0,
                cost: 50,
              },
              maneuvers: [],
            },
            {
              shape: 'encoded_shape_2',
              summary: {
                has_time_restrictions: false,
                has_toll: false,
                has_highway: false,
                has_ferry: false,
                min_lat: 41.0,
                min_lon: -74.0,
                max_lat: 42.0,
                max_lon: -73.0,
                time: 150,
                length: 5.5,
                cost: 50,
              },
              maneuvers: [],
            },
          ],
          locations: [],
          summary: {
            has_time_restrictions: false,
            has_toll: false,
            has_highway: false,
            has_ferry: false,
            min_lat: 40.0,
            min_lon: -75.0,
            max_lat: 42.0,
            max_lon: -73.0,
            time: 300,
            length: 10.5,
            cost: 100,
          },
          status_message: 'Found route',
          status: 0,
          units: 'kilometers',
          language: 'en-US',
        },
        id: 'valhalla_directions',
      };

      const mockDecodedCoordinates1 = [
        [40.7128, -74.006],
        [40.713, -74.005],
      ];
      const mockDecodedCoordinates2 = [
        [40.714, -74.004],
        [40.715, -74.003],
      ];
      mockDecode
        .mockReturnValueOnce(mockDecodedCoordinates1)
        .mockReturnValueOnce(mockDecodedCoordinates2);

      const result = parseDirectionsGeometry(mockData);

      expect(mockDecode).toHaveBeenCalledWith('encoded_shape_1', 6);
      expect(mockDecode).toHaveBeenCalledWith('encoded_shape_2', 6);
      expect(result).toEqual([
        ...mockDecodedCoordinates1,
        ...mockDecodedCoordinates2,
      ]);
    });

    it('should handle empty legs array', () => {
      const mockData: ValhallaRouteResponse = {
        trip: {
          legs: [],
          locations: [],
          summary: {
            has_time_restrictions: false,
            has_toll: false,
            has_highway: false,
            has_ferry: false,
            min_lat: 40.0,
            min_lon: -75.0,
            max_lat: 41.0,
            max_lon: -74.0,
            time: 0,
            length: 0,
            cost: 0,
          },
          status_message: 'No route found',
          status: 1,
          units: 'kilometers',
          language: 'en-US',
        },
        id: 'valhalla_directions',
      };

      const result = parseDirectionsGeometry(mockData);

      expect(mockDecode).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('buildIsochronesRequest', () => {
    const mockCenter: import('@/components/types').Center = {
      title: 'Center',
      description: 'Center point',
      selected: true,
      addresslnglat: [-118.2437, 34.0522],
      sourcelnglat: [-118.2437, 34.0522],
      displaylnglat: [-118.2437, 34.0522],
      key: 1,
      addressindex: 0,
    };

    const mockSettings: Settings = {
      costing: {
        maneuver_penalty: 5,
        country_crossing_penalty: 0,
        country_crossing_cost: 600,
        length: 21.5,
        width: 1.6,
        height: 1.9,
        weight: 21.77,
        axle_load: 9,
        hazmat: false,
        use_highways: 1,
        use_tolls: 1,
        use_ferry: 0.5,
        ferry_cost: 300,
        use_living_streets: 0.1,
        use_tracks: 0,
        private_access_penalty: 450,
        ignore_closures: false,
        ignore_restrictions: false,
        ignore_access: false,
        closure_factor: 9,
        service_penalty: 15,
        service_factor: 1,
        exclude_unpaved: false,
        shortest: false,
        exclude_cash_only_tolls: false,
        bicycle_type: 'Hybrid',
        cycling_speed: 20,
        use_roads: 0.5,
        use_hills: 0.5,
        avoid_bad_surfaces: 0.25,
        top_speed: 140,
        use_primary: 0.5,
        walking_speed: 5.1,
        walkway_factor: 1,
        sidewalk_factor: 1,
        alley_factor: 2,
        driveway_factor: 5,
        step_penalty: 0,
        max_hiking_difficulty: 1,
        exclude_polygons: [],
        use_geocoding: true,
        use_lit: 0,
        axle_count: 5,
        fixed_speed: 0,
        toll_booth_penalty: 0,
        toll_booth_cost: 15,
        gate_penalty: 300,
        gate_cost: 30,
        include_hov2: false,
        include_hov3: false,
        include_hot: false,
        transit_start_end_max_distance: 2145,
        transit_transfer_max_distance: 800,
        disable_hierarchy_pruning: false,
        use_trails: 0,
        denoise: 0.1,
        generalize: 0,
        alternates: 0,
        speed_types: [],
      },
      directions: {
        maneuver_penalty: 5,
        country_crossing_penalty: 0,
        country_crossing_cost: 600,
        length: 21.5,
        width: 1.6,
        height: 1.9,
        weight: 21.77,
        axle_load: 9,
        hazmat: false,
        use_highways: 1,
        use_tolls: 1,
        use_ferry: 0.5,
        ferry_cost: 300,
        use_living_streets: 0.1,
        use_tracks: 0,
        private_access_penalty: 450,
        ignore_closures: false,
        ignore_restrictions: false,
        ignore_access: false,
        closure_factor: 9,
        service_penalty: 15,
        service_factor: 1,
        exclude_unpaved: false,
        shortest: false,
        exclude_cash_only_tolls: false,
        bicycle_type: 'Hybrid',
        cycling_speed: 20,
        use_roads: 0.5,
        use_hills: 0.5,
        avoid_bad_surfaces: 0.25,
        top_speed: 140,
        use_primary: 0.5,
        walking_speed: 5.1,
        walkway_factor: 1,
        sidewalk_factor: 1,
        alley_factor: 2,
        driveway_factor: 5,
        step_penalty: 0,
        max_hiking_difficulty: 1,
        exclude_polygons: [],
        use_geocoding: true,
        use_lit: 0,
        axle_count: 5,
        fixed_speed: 0,
        toll_booth_penalty: 0,
        toll_booth_cost: 15,
        gate_penalty: 300,
        gate_cost: 30,
        include_hov2: false,
        include_hov3: false,
        include_hot: false,
        transit_start_end_max_distance: 2145,
        transit_transfer_max_distance: 800,
        disable_hierarchy_pruning: false,
        use_trails: 0,
        denoise: 0.1,
        generalize: 0,
        alternates: 0,
        speed_types: [],
      },
    };

    const mockParams: IsochronesRequestParams = {
      profile: 'car',
      center: mockCenter,
      settings: mockSettings,
      denoise: 0.5,
      generalize: 10,
      maxRange: 30,
      interval: 10,
    };

    it('should create an isochrones request with car profile (mapped to auto)', () => {
      const result = buildIsochronesRequest(mockParams);

      expect(result).toEqual({
        json: {
          polygons: true,
          denoise: 0.5,
          generalize: 10,
          show_locations: true,
          costing: 'auto',
          costing_options: {
            auto: mockSettings.costing,
          },
          contours: [{ time: 10 }, { time: 20 }, { time: 30 }],
          locations: [{ lon: -118.2437, lat: 34.0522, type: 'break' }],
          units: 'kilometers',
          id: 'valhalla_isochrones_lonlat_-118.2437,34.0522_range_30_interval_10',
        },
      });
    });

    it('should create an isochrones request with bicycle profile', () => {
      const params: IsochronesRequestParams = {
        ...mockParams,
        profile: 'bicycle',
      };

      const result = buildIsochronesRequest(params);

      expect(result.json.costing).toBe('bicycle');
      expect(result.json.costing_options).toEqual({
        bicycle: mockSettings.costing,
      });
    });

    it('should generate correct contours for different maxRange and interval', () => {
      const params: IsochronesRequestParams = {
        ...mockParams,
        maxRange: 20,
        interval: 5,
      };

      const result = buildIsochronesRequest(params);

      expect(result.json.contours).toEqual([
        { time: 5 },
        { time: 10 },
        { time: 15 },
        { time: 20 },
      ]);
    });

    it('should generate unique ID based on parameters', () => {
      const params: IsochronesRequestParams = {
        ...mockParams,
        maxRange: 45,
        interval: 15,
      };

      const result = buildIsochronesRequest(params);

      expect(result.json.id).toBe(
        'valhalla_isochrones_lonlat_-118.2437,34.0522_range_45_interval_15'
      );
    });
  });

  describe('makeContours', () => {
    it('should create contours from maxRange and interval', () => {
      const result = makeContours({ maxRange: 30, interval: 10 });

      expect(result).toEqual([{ time: 10 }, { time: 20 }, { time: 30 }]);
    });

    it('should create contours with different values', () => {
      const result = makeContours({ maxRange: 20, interval: 5 });

      expect(result).toEqual([
        { time: 5 },
        { time: 10 },
        { time: 15 },
        { time: 20 },
      ]);
    });

    it('should handle maxRange smaller than interval', () => {
      const result = makeContours({ maxRange: 5, interval: 10 });

      expect(result).toEqual([{ time: 5 }]);
    });

    it('should handle maxRange equal to 0', () => {
      const result = makeContours({ maxRange: 0, interval: 10 });

      expect(result).toEqual([]);
    });

    it('should handle negative maxRange', () => {
      const result = makeContours({ maxRange: -10, interval: 5 });

      expect(result).toEqual([]);
    });
  });

  describe('makeLocations', () => {
    const mockWaypoints: ActiveWaypoints = [
      {
        title: 'Start',
        description: 'Starting point',
        selected: true,
        addresslnglat: [-74.006, 40.7128],
        sourcelnglat: [-74.006, 40.7128],
        displaylnglat: [-74.006, 40.7128],
        key: 1,
        addressindex: 0,
      },
      {
        title: 'Via 1',
        description: 'Via point 1',
        selected: true,
        addresslnglat: [-118.2437, 34.0522],
        sourcelnglat: [-118.2437, 34.0522],
        displaylnglat: [-118.2437, 34.0522],
        key: 2,
        addressindex: 1,
      },
      {
        title: 'Via 2',
        description: 'Via point 2',
        selected: true,
        addresslnglat: [-87.6298, 41.8781],
        sourcelnglat: [-87.6298, 41.8781],
        displaylnglat: [-87.6298, 41.8781],
        key: 3,
        addressindex: 2,
      },
      {
        title: 'End',
        description: 'Ending point',
        selected: true,
        addresslnglat: [-122.4194, 37.7749],
        sourcelnglat: [-122.4194, 37.7749],
        displaylnglat: [-122.4194, 37.7749],
        key: 4,
        addressindex: 3,
      },
    ];

    it('should create locations from waypoints with correct types', () => {
      const result = makeLocations(mockWaypoints);

      expect(result).toEqual([
        { lon: -74.006, lat: 40.7128, type: 'break' },
        { lon: -118.2437, lat: 34.0522, type: 'via' },
        { lon: -87.6298, lat: 41.8781, type: 'via' },
        { lon: -122.4194, lat: 37.7749, type: 'break' },
      ]);
    });

    it('should create locations from single waypoint', () => {
      const singleWaypoint: ActiveWaypoints = [mockWaypoints[0]!];

      const result = makeLocations(singleWaypoint);

      expect(result).toEqual([{ lon: -74.006, lat: 40.7128, type: 'break' }]);
    });

    it('should create locations from two waypoints', () => {
      const twoWaypoints: ActiveWaypoints = mockWaypoints.slice(0, 2);

      const result = makeLocations(twoWaypoints);

      expect(result).toEqual([
        { lon: -74.006, lat: 40.7128, type: 'break' },
        { lon: -118.2437, lat: 34.0522, type: 'break' },
      ]);
    });

    it('should create locations from empty waypoints array', () => {
      const result = makeLocations([]);

      expect(result).toEqual([]);
    });
  });
});
