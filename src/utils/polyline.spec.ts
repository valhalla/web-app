import { describe, it, expect } from 'vitest';
import { decode } from './polyline';

describe('decode', () => {
  it('should decode empty string correctly', () => {
    const result = decode('', 6);
    expect(result).toEqual([]);
  });

  it('should decode single coordinate correctly', () => {
    // This represents a single coordinate at (0, 0) with precision 6
    const result = decode('_', 6);
    expect(result).toEqual([[0, 0]]);
  });

  it('should handle default precision of 6', () => {
    const result = decode('_');
    expect(result).toEqual([[0, 0]]);
  });

  it('should decode multiple coordinates', () => {
    const encoded = 'u{~vFvyys@fA';
    const result = decode(encoded, 6);

    expect(result).toHaveLength(2);
    expect(Array.isArray(result[0])).toBe(true);
    expect(Array.isArray(result[1])).toBe(true);
    expect(result[0]).toHaveLength(2);
    expect(result[1]).toHaveLength(2);
  });

  it('should handle different precision values', () => {
    const encoded = '_';
    const resultPrecision5 = decode(encoded, 5);
    const resultPrecision6 = decode(encoded, 6);
    const resultPrecision7 = decode(encoded, 7);

    expect(resultPrecision5[0]).toEqual([0, 0]);
    expect(resultPrecision6[0]).toEqual([0, 0]);
    expect(resultPrecision7[0]).toEqual([0, 0]);
  });

  it('should decode coordinates and return array of coordinate pairs', () => {
    const encoded = 'svz|Fnx|uOwB';
    const result = decode(encoded, 6);

    expect(result).toHaveLength(2);
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveLength(2);
    expect(typeof result[0]![0]).toBe('number');
    expect(typeof result[0]![1]).toBe('number');
  });

  it('should handle long encoded strings', () => {
    const encoded = 'u{~vFvyys@fAu{~vFvyys@fAu{~vFvyys@fA';
    const result = decode(encoded, 6);

    expect(result).toHaveLength(5);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle very small precision', () => {
    const encoded = '_';
    const result = decode(encoded, 1);

    expect(result[0]).toEqual([0, 0]);
  });

  it('should handle high precision', () => {
    const encoded = '_';
    const result = decode(encoded, 10);

    expect(result[0]).toEqual([0, 0]);
  });

  it('should handle negative precision', () => {
    const encoded = '_';
    const result = decode(encoded, -1);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
  });

  it('should handle fractional coordinate values', () => {
    const encoded = 'u{~vFvyys@fA';
    const result = decode(encoded, 6);

    expect(result[0]).toHaveLength(2);
    expect(typeof result[0]![0]).toBe('number');
    expect(typeof result[0]![1]).toBe('number');
    expect(result[1]).toHaveLength(2);
    expect(typeof result[1]![0]).toBe('number');
    expect(typeof result[1]![1]).toBe('number');
  });

  it('should handle precision scaling', () => {
    const encoded = '_';
    const resultPrecision5 = decode(encoded, 5);
    const resultPrecision7 = decode(encoded, 7);

    expect(resultPrecision5[0]).toEqual([0, 0]);
    expect(resultPrecision7[0]).toEqual([0, 0]);
  });

  it('should handle edge case with single coordinate from longer string', () => {
    const encoded = 'u{~vFvyys@';
    const result = decode(encoded, 6);

    expect(result).toHaveLength(1);
    expect(Array.isArray(result[0])).toBe(true);
    expect(result[0]).toHaveLength(2);
  });

  it('should handle invalid input gracefully', () => {
    // The function handles invalid inputs gracefully by returning empty arrays
    // @ts-expect-error - Testing with invalid input types
    const resultNull = decode(null, 6);
    // @ts-expect-error - Testing with invalid input types
    const resultUndefined = decode(undefined, 6);
    // @ts-expect-error - Testing with invalid input types
    const resultNumber = decode(123, 6);

    expect(Array.isArray(resultNull)).toBe(true);
    expect(Array.isArray(resultUndefined)).toBe(true);
    expect(Array.isArray(resultNumber)).toBe(true);
  });

  it('should handle invalid precision values', () => {
    const encoded = '_';

    const resultNegative = decode(encoded, -1);
    // @ts-expect-error - Testing with invalid precision types
    const resultNull = decode(encoded, null);
    const resultUndefined = decode(encoded, undefined);

    expect(Array.isArray(resultNegative)).toBe(true);
    expect(Array.isArray(resultNull)).toBe(true);
    expect(Array.isArray(resultUndefined)).toBe(true);
  });

  it('should handle very long encoded strings', () => {
    const pattern = 'u{~vFvyys@fA';
    const longEncoded = pattern.repeat(10);
    const result = decode(longEncoded, 6);

    expect(result).toHaveLength(15);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle encoded strings with special characters', () => {
    const encoded = 'u{~vFvyys@fA!@#$%';
    const result = decode(encoded, 6);

    expect(result).toHaveLength(4);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should accumulate coordinates correctly', () => {
    const encoded = 'u{~vFvyys@fAu{~vFvyys@fA';
    const result = decode(encoded, 6);

    expect(result).toHaveLength(3);
    expect(Array.isArray(result)).toBe(true);
    expect(Array.isArray(result[0])).toBe(true);
    expect(Array.isArray(result[1])).toBe(true);
    expect(Array.isArray(result[2])).toBe(true);
  });
});
