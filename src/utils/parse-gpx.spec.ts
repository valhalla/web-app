import { describe, expect, it } from 'vitest';
import { parseGpxToLatLng } from './parse-gpx';

describe('parseGpxToLatLng', () => {
  it('should parse track points from GPX', () => {
    const gpx = `
      <gpx>
        <trk><trkseg>
          <trkpt lat="52.500000" lon="13.400000" />
          <trkpt lat="52.510000" lon="13.410000" />
        </trkseg></trk>
      </gpx>
    `;

    expect(parseGpxToLatLng(gpx)).toEqual([
      [52.5, 13.4],
      [52.51, 13.41],
    ]);
  });

  it('should parse route points from GPX', () => {
    const gpx = `
      <gpx>
        <rte>
          <rtept lat="40.000000" lon="-3.000000" />
          <rtept lat="41.000000" lon="-4.000000" />
        </rte>
      </gpx>
    `;

    expect(parseGpxToLatLng(gpx)).toEqual([
      [40, -3],
      [41, -4],
    ]);
  });

  it('should return empty array for invalid xml', () => {
    const invalid = '<gpx><trkpt lat="1" lon="2"></gpx';
    expect(parseGpxToLatLng(invalid)).toEqual([]);
  });

  it('should skip invalid points and keep valid ones', () => {
    const gpx = `
      <gpx>
        <trk><trkseg>
          <trkpt lat="52.500000" lon="13.400000" />
          <trkpt lat="abc" lon="13.410000" />
          <trkpt lat="52.520000" lon="13.420000" />
        </trkseg></trk>
      </gpx>
    `;

    expect(parseGpxToLatLng(gpx)).toEqual([
      [52.5, 13.4],
      [52.52, 13.42],
    ]);
  });
});
