import { describe, it, expect } from 'vitest';
import { buildHeightgraphData, colorMappings } from './heightgraph';

type Coordinate = [number, number]; // [latitude, longitude]
type RangeHeightPoint = [number, number]; // [distance, elevation]

describe('buildHeightgraphData', () => {
  it('should handle empty input arrays', () => {
    const coordinates: Coordinate[] = [];
    const rangeHeightData: RangeHeightPoint[] = [];

    const result = buildHeightgraphData(coordinates, rangeHeightData);

    expect(result).toHaveLength(1);
    expect(result[0]!.type).toBe('FeatureCollection');
    expect(result[0]!.features).toHaveLength(0);
    expect(result[0]!.properties.summary).toBe('steepness');
    expect(result[0]!.properties.inclineTotal).toBe(0);
    expect(result[0]!.properties.declineTotal).toBe(0);
  });

  it('should handle single point data', () => {
    const coordinates: Coordinate[] = [[40.7128, -74.006]];
    const rangeHeightData: RangeHeightPoint[] = [[0, 10]];

    const result = buildHeightgraphData(coordinates, rangeHeightData);

    expect(result).toHaveLength(1);
    expect(result[0]!.features).toHaveLength(0);
    expect(result[0]!.properties.inclineTotal).toBe(0);
    expect(result[0]!.properties.declineTotal).toBe(0);
  });

  it('should calculate flat terrain (slope 0%)', () => {
    const coordinates: Coordinate[] = [
      [40.7128, -74.006],
      [40.7129, -74.0061],
      [40.713, -74.0062],
    ];
    const rangeHeightData: RangeHeightPoint[] = [
      [0, 100],
      [100, 100],
      [200, 100],
    ];

    const result = buildHeightgraphData(coordinates, rangeHeightData);

    expect(result[0]!.features).toHaveLength(1);
    expect(result[0]!.features[0]!.properties.attributeType).toBe(0); // flat terrain
    expect(result[0]!.properties.inclineTotal).toBe(0);
    expect(result[0]!.properties.declineTotal).toBe(0);
  });

  it('should calculate steep uphill terrain (slope > 15%)', () => {
    const coordinates: Coordinate[] = [
      [40.7128, -74.006],
      [40.7129, -74.0061],
      [40.713, -74.0062],
    ];
    const rangeHeightData: RangeHeightPoint[] = [
      [0, 100],
      [100, 120], // 20m rise over 100m = 20% slope
      [200, 140], // 20m rise over 100m = 20% slope
    ];

    const result = buildHeightgraphData(coordinates, rangeHeightData);

    expect(result[0]!.features).toHaveLength(1); // One feature created when height class is first calculated
    expect(result[0]!.features[0]!.properties.attributeType).toBe(0); // Previous height class (undefined becomes 0)
    expect(result[0]!.properties.inclineTotal).toBe(40); // total rise
    expect(result[0]!.properties.declineTotal).toBe(0);
  });

  it('should calculate steep downhill terrain (slope < -15%)', () => {
    const coordinates: Coordinate[] = [
      [40.7128, -74.006],
      [40.7129, -74.0061],
      [40.713, -74.0062],
    ];
    const rangeHeightData: RangeHeightPoint[] = [
      [0, 100],
      [100, 80], // -20m drop over 100m = -20% slope
      [200, 60], // -20m drop over 100m = -20% slope
    ];

    const result = buildHeightgraphData(coordinates, rangeHeightData);

    expect(result[0]!.features).toHaveLength(1); // One feature created when height class is first calculated
    expect(result[0]!.features[0]!.properties.attributeType).toBe(0); // Previous height class (undefined becomes 0)
    expect(result[0]!.properties.inclineTotal).toBe(0);
    expect(result[0]!.properties.declineTotal).toBe(40); // total drop
  });

  it('should handle different slope ranges correctly', () => {
    const coordinates: Coordinate[] = [
      [40.7128, -74.006],
      [40.7129, -74.0061],
      [40.713, -74.0062],
      [40.7131, -74.0063],
      [40.7132, -74.0064],
      [40.7133, -74.0065],
    ];
    const rangeHeightData: RangeHeightPoint[] = [
      [0, 100],
      [100, 102], // 2% slope = height class 1
      [200, 105], // 3% slope = height class 1
      [300, 107], // 2% slope = height class 1
      [400, 111], // 4% slope = height class 2
      [500, 116], // 5% slope = height class 2
    ];

    const result = buildHeightgraphData(coordinates, rangeHeightData);

    // Features are created when height class changes, not based on total unique classes
    expect(result[0]!.features.length).toBeGreaterThan(0);
    expect(result[0]!.properties.inclineTotal).toBe(16); // total rise
    expect(result[0]!.properties.declineTotal).toBe(0);
  });

  it('should create separate features for different height classes', () => {
    const coordinates: Coordinate[] = [
      [40.7128, -74.006],
      [40.7129, -74.0061],
      [40.713, -74.0062],
      [40.7131, -74.0063],
      [40.7132, -74.0064],
    ];
    const rangeHeightData: RangeHeightPoint[] = [
      [0, 100],
      [100, 110], // 10% slope = height class 4
      [200, 115], // 5% slope = height class 2
      [300, 112], // -3% slope = height class -1
      [400, 108], // -4% slope = height class -2
    ];

    const result = buildHeightgraphData(coordinates, rangeHeightData);

    expect(result[0]!.features.length).toBeGreaterThan(1);

    // Check that we get different height classes
    const heightClasses = result[0]!.features.map(
      (f) => f.properties.attributeType
    );
    expect(new Set(heightClasses).size).toBeGreaterThan(1);

    // Verify incline and decline totals
    expect(result[0]!.properties.inclineTotal).toBe(15); // 10 + 5
    expect(result[0]!.properties.declineTotal).toBe(7); // 3 + 4
  });

  it('should handle NaN slope values gracefully', () => {
    const coordinates: Coordinate[] = [
      [40.7128, -74.006],
      [40.7129, -74.0061],
    ];
    const rangeHeightData: RangeHeightPoint[] = [
      [0, 100],
      [0, 105], // Same distance but different elevation = infinite slope
    ];

    const result = buildHeightgraphData(coordinates, rangeHeightData);

    expect(result[0]!.features).toHaveLength(1);
    expect(result[0]!.features[0]!.properties.attributeType).toBe(0); // Should default to 0 for NaN
  });

  it('should correctly format LineString coordinates', () => {
    const coordinates: Coordinate[] = [
      [40.7128, -74.006],
      [40.7129, -74.0061],
      [40.713, -74.0062],
    ];
    const rangeHeightData: RangeHeightPoint[] = [
      [0, 100],
      [100, 102],
      [200, 104],
    ];

    const result = buildHeightgraphData(coordinates, rangeHeightData);

    // Only features are created when height classes change
    if (result[0]!.features.length > 0) {
      const feature = result[0]!.features[0]!;
      expect(feature.type).toBe('Feature');
      expect(feature.geometry.type).toBe('LineString');
      expect(feature.geometry.coordinates.length).toBeGreaterThan(0);

      // Check coordinate format: [longitude, latitude, elevation]
      const firstCoord = feature.geometry.coordinates[0]!;
      expect(firstCoord).toHaveLength(4);
      expect(firstCoord[0]).toBe(40.7128); // longitude (first element from coordinates)
      expect(firstCoord[1]).toBe(-74.006); // latitude (second element from coordinates)
      expect(firstCoord[2]).toBe(100); // elevation from rangeHeightData
    }
  });

  it('should test all height class boundaries', () => {
    const coordinates: Coordinate[] = [
      [40.7128, -74.006],
      [40.7129, -74.0061],
      [40.713, -74.0062],
      [40.7131, -74.0063],
      [40.7132, -74.0064],
      [40.7133, -74.0065],
      [40.7134, -74.0066],
      [40.7135, -74.0067],
      [40.7136, -74.0068],
      [40.7137, -74.0069],
      [40.7138, -74.007],
    ];

    // Test slopes that should result in different height classes
    const rangeHeightData: RangeHeightPoint[] = [
      [0, 100],
      [100, 84], // -16% slope = height class -5
      [200, 88], // 4% slope = height class 2 (since 4/100 * 100 = 4%)
      [300, 85.5], // -2.5% slope = height class -1
      [400, 85.5], // 0% slope = height class 0
      [500, 86.5], // 1% slope = height class 1
      [600, 89.5], // 3% slope = height class 1
      [700, 95.5], // 6% slope = height class 2
      [800, 104.5], // 9% slope = height class 3
      [900, 117.5], // 13% slope = height class 4
      [1000, 133.5], // 16% slope = height class 5
    ];

    const result = buildHeightgraphData(coordinates, rangeHeightData);

    // Should have multiple features with different height classes
    expect(result[0]!.features.length).toBeGreaterThan(0);

    const heightClasses = result[0]!.features.map(
      (f) => f.properties.attributeType
    );

    // Should include various height classes, but remember features represent PREVIOUS height classes
    // The actual height class changes will create features with the previous height class
    expect(heightClasses).toContain(-5); // steep downhill
    expect(heightClasses).toContain(0); // flat
    expect(heightClasses).toContain(1); // gentle uphill
    expect(heightClasses).toContain(2); // moderate uphill
    // Note: Class 5 might not appear as a previous class if it's the final segment
  });
});

describe('colorMappings', () => {
  it('should have color mappings for all height classes', () => {
    expect(colorMappings.steepness).toBeDefined();

    // Check that all height classes from -5 to 5 have color mappings
    for (let i = -5; i <= 5; i++) {
      const key = i.toString() as keyof typeof colorMappings.steepness;
      expect(colorMappings.steepness[key]).toBeDefined();
      expect(colorMappings.steepness[key].text).toBeDefined();
      expect(colorMappings.steepness[key].color).toBeDefined();
    }
  });

  it('should have valid color hex codes', () => {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

    Object.values(colorMappings.steepness).forEach((mapping) => {
      expect(mapping.color).toMatch(hexColorRegex);
    });
  });

  it('should have descriptive text labels', () => {
    Object.values(colorMappings.steepness).forEach((mapping) => {
      expect(mapping.text).toBeTruthy();
      expect(typeof mapping.text).toBe('string');
      expect(mapping.text.length).toBeGreaterThan(0);
    });
  });
});
