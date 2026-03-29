import { describe, it, expect, beforeEach } from 'vitest';
import { parseGeocodeResponse } from './nominatim';
import type { NominationResponse } from '@/components/types';

describe('parseGeocodeResponse', () => {
  let counter = 0;

  beforeEach(() => {
    counter = 0;
  });

  const makeResult = (name: string, lat?: string, lon?: string) =>
    ({
      display_name: name,
      lat: lat ?? `${++counter}.0000`,
      lon: lon ?? `${++counter}.0000`,
      osm_type: 'node',
      osm_id: counter,
    }) as unknown as NominationResponse;

  it('returns all results when there are no duplicates', () => {
    const results = [makeResult('Place A'), makeResult('Place B')];

    const processed = parseGeocodeResponse(results);
    expect(processed).toHaveLength(2);
    expect(processed[0]!.title).toBe('Place A');
    expect(processed[1]!.title).toBe('Place B');
  });

  it('removes entries that have identical coordinates and same name after diacritic normalization', () => {
    const lat = `${++counter}.0000`;
    const lon = `${++counter}.0000`;

    const results = [
      makeResult('Pláce C', lat, lon),
      makeResult('Place C', lat, lon),
      makeResult('PLÁCE C', lat, lon),
    ];

    const processed = parseGeocodeResponse(results);
    expect(processed).toHaveLength(1);
    expect(processed[0]!.title).toBe('Pláce C');
  });

  it('keeps entries that have the same name but genuinely different coordinates', () => {
    const results = [
      makeResult('Place D'),
      makeResult('Place D'),
      makeResult('Place D'),
    ];

    const processed = parseGeocodeResponse(results);
    expect(processed).toHaveLength(3);
    expect(processed[0]!.title).toBe('Place D');
    expect(processed[1]!.title).toBe('Place D');
    expect(processed[2]!.title).toBe('Place D');
  });

  it('handles a single non-array result without throwing', () => {
    const result = makeResult('Place E');

    const processed = parseGeocodeResponse(result);
    expect(processed).toHaveLength(1);
    expect(processed[0]!.title).toBe('Place E');
  });
});
