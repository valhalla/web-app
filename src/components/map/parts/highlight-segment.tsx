import { Source, Layer } from 'react-map-gl/maplibre';
import type { Feature, LineString } from 'geojson';

interface HighlightSegmentProps {
  data: Feature<LineString>;
}

export function HighlightSegment({ data }: HighlightSegmentProps) {
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
