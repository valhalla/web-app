import { Source, Layer } from 'react-map-gl/maplibre';
import type { FeatureCollection } from 'geojson';

interface RouteLinesProps {
  data: FeatureCollection;
}

export function RouteLines({ data }: RouteLinesProps) {
  return (
    <Source id="routes" type="geojson" data={data}>
      <Layer
        id="routes-outline"
        type="line"
        paint={{
          'line-color': '#FFF',
          'line-width': 9,
          'line-opacity': 1,
        }}
      />
      <Layer
        id="routes-line"
        type="line"
        paint={{
          'line-color': ['get', 'color'],
          'line-width': 5,
          'line-opacity': 1,
        }}
      />
    </Source>
  );
}
