import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { useDirectionsStore } from '@/stores/directions-store';
import type { Feature, LineString } from 'geojson';
import type { ParsedDirectionsGeometry } from '@/components/types';

export function HighlightSegment() {
  const directionResults = useDirectionsStore((state) => state.results);
  const highlightSegment = useDirectionsStore(
    (state) => state.highlightSegment
  );

  const data = useMemo(() => {
    if (!highlightSegment || !directionResults.data) return null;

    const { startIndex, endIndex, alternate } = highlightSegment;

    let coords;
    if (alternate == -1) {
      coords = directionResults.data.decodedGeometry;
    } else {
      if (!directionResults.data.alternates?.[alternate]) {
        return null;
      }
      coords = (directionResults.data.alternates?.[
        alternate
      ] as ParsedDirectionsGeometry)!.decodedGeometry;
    }

    if (startIndex > -1 && endIndex > -1 && coords) {
      return {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coords
            .slice(startIndex, endIndex + 1)
            .map((c) => [c[1] ?? 0, c[0] ?? 0]),
        },
        properties: {},
      } as Feature<LineString>;
    }

    return null;
  }, [highlightSegment, directionResults]);

  if (!data) return null;

  return (
    <Source id="highlight-segment" type="geojson" data={data}>
      <Layer
        id="highlight-segment-line"
        type="line"
        paint={{
          'line-color': 'yellow',
          'line-width': 4,
          'line-opacity': 1,
        }}
      />
    </Source>
  );
}
