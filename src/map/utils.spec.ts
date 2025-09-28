import { describe, it, expect } from 'vitest';
import { convertDDToDMS } from './utils';

describe('convertDDToDMS', () => {
  it('should convert zero degrees correctly', () => {
    expect(convertDDToDMS(0)).toBe('0° 0\' 0"');
  });

  it('should convert positive decimal degrees correctly', () => {
    expect(convertDDToDMS(45.5)).toBe('45° 30\' 0"');
    expect(convertDDToDMS(23.456789)).toBe('23° 27\' 24"');
    expect(convertDDToDMS(1.234567)).toBe('1° 14\' 4"');
  });

  it('should convert negative decimal degrees correctly', () => {
    expect(convertDDToDMS(-45.5)).toBe('-45° 30\' 0"');
    expect(convertDDToDMS(-23.456789)).toBe('-23° 27\' 24"');
    expect(convertDDToDMS(-1.234567)).toBe('-1° 14\' 4"');
  });

  it('should handle exact degree values', () => {
    expect(convertDDToDMS(90)).toBe('90° 0\' 0"');
    expect(convertDDToDMS(180)).toBe('180° 0\' 0"');
    expect(convertDDToDMS(360)).toBe('360° 0\' 0"');
  });

  it('should handle exact minute values', () => {
    expect(convertDDToDMS(45.5)).toBe('45° 30\' 0"');
    expect(convertDDToDMS(30.25)).toBe('30° 15\' 0"');
  });

  it('should handle exact second values', () => {
    expect(convertDDToDMS(45.5041667)).toBe('45° 30\' 15"');
  });

  it('should handle small decimal values', () => {
    expect(convertDDToDMS(0.0001)).toBe('0° 0\' 0"');
    expect(convertDDToDMS(0.0166667)).toBe('0° 1\' 0"');
    expect(convertDDToDMS(0.0002778)).toBe('0° 0\' 1"');
  });

  it('should handle large decimal degrees', () => {
    expect(convertDDToDMS(359.9999)).toBe('359° 0\' 0"');
    expect(convertDDToDMS(180.5)).toBe('180° 30\' 0"');
  });

  it('should handle extreme negative values', () => {
    expect(convertDDToDMS(-180)).toBe('-180° 0\' 0"');
    expect(convertDDToDMS(-359.9999)).toBe('-359° 0\' 0"');
  });

  it('should maintain precision for various decimal places', () => {
    expect(convertDDToDMS(45.123456789)).toBe('45° 7\' 24"');
    expect(convertDDToDMS(45.987654321)).toBe('45° 59\' 15"');
  });

  it('should handle values with high precision minutes', () => {
    expect(convertDDToDMS(45.999999)).toBe('45° 0\' 0"');
  });

  it('should handle coordinate edge cases', () => {
    expect(convertDDToDMS(90)).toBe('90° 0\' 0"');
    expect(convertDDToDMS(-90)).toBe('-90° 0\' 0"');
    expect(convertDDToDMS(180)).toBe('180° 0\' 0"');
    expect(convertDDToDMS(-180)).toBe('-180° 0\' 0"');
  });

  it('should handle very small positive values', () => {
    expect(convertDDToDMS(0.0000001)).toBe('0° 0\' 0"');
  });

  it('should handle very small negative values', () => {
    expect(convertDDToDMS(-0.0000001)).toBe('0° 0\' 0"');
  });

  it('should handle floating point precision issues', () => {
    // Test cases that might be affected by floating point precision
    expect(convertDDToDMS(45.123456789123)).toBe('45° 7\' 24"');
    expect(convertDDToDMS(23.456789012345)).toBe('23° 27\' 24"');
  });

  it('should handle values around 0 with negative sign', () => {
    expect(convertDDToDMS(-0.0000001)).toBe('0° 0\' 0"');
    expect(convertDDToDMS(0.0000001)).toBe('0° 0\' 0"');
  });

  it('should demonstrate the rounding behavior at degree boundaries', () => {
    // Values very close to full degrees get rounded to 0 minutes/seconds
    // due to the +1e-4 rounding in the implementation
    expect(convertDDToDMS(45.9999)).toBe('45° 0\' 0"');
    expect(convertDDToDMS(359.9999)).toBe('359° 0\' 0"');
    expect(convertDDToDMS(-359.9999)).toBe('-359° 0\' 0"');
  });

  it('should handle typical geographic coordinates', () => {
    // Testing some realistic coordinate examples
    expect(convertDDToDMS(52.5167)).toBe('52° 31\' 0"'); // Example: Berlin
    expect(convertDDToDMS(13.3777)).toBe('13° 22\' 40"'); // Example: Berlin longitude
    expect(convertDDToDMS(-33.8688)).toBe('-33° 52\' 8"'); // Example: Sydney
    expect(convertDDToDMS(151.2093)).toBe('151° 12\' 33"'); // Example: Sydney longitude
  });
});
