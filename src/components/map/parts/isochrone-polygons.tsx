import { Source, Layer } from 'react-map-gl/maplibre';
import type { FeatureCollection } from 'geojson';

interface IsochronePolygonsProps {
  data: FeatureCollection;
}

export function IsochronePolygons({ data }: IsochronePolygonsProps) {
  return (
    <Source id="isochrones" type="geojson" data={data}>
      <Layer
        id="isochrones-fill"
        type="fill"
        paint={{
          'fill-color': ['get', 'fill'],
          'fill-opacity': 0.4,
        }}
      />
      <Layer
        id="isochrones-outline"
        type="line"
        paint={{
          'line-color': '#fff',
          'line-width': 1,
          'line-opacity': 1,
        }}
      />
    </Source>
  );
}
