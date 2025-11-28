import { Source, Layer } from 'react-map-gl/maplibre';
import type { FeatureCollection } from 'geojson';

interface IsochroneLocationsProps {
  data: FeatureCollection;
}

export function IsochroneLocations({ data }: IsochroneLocationsProps) {
  if (!data) return null;

  return (
    <Source id="iso-locations" type="geojson" data={data}>
      <Layer
        id="iso-locations-circle"
        type="circle"
        paint={{
          'circle-radius': 6,
          'circle-color': '#fff',
          'circle-stroke-color': '#000',
          'circle-stroke-width': 2,
        }}
      />
    </Source>
  );
}
