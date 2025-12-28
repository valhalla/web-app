import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { useIsochronesStore } from '@/stores/isochrones-store';
import type { Feature, FeatureCollection } from 'geojson';

export function IsochronePolygons() {
  const isoResults = useIsochronesStore((state) => state.results);
  const isoSuccessful = useIsochronesStore((state) => state.successful);

  const data = useMemo(() => {
    if (!isoResults || !isoSuccessful) return null;
    if (!isoResults.data || !isoResults.show) return null;

    const hasNoFeatures = Object.keys(isoResults.data).length === 0;
    if (hasNoFeatures) return null;

    const features: Feature[] = [];

    for (const feature of isoResults.data.features) {
      if (['Polygon', 'MultiPolygon'].includes(feature.geometry.type)) {
        features.push({
          ...feature,
          properties: {
            ...feature.properties,
            fillColor: feature.properties?.fill || '#6200ea',
          },
        });
      }
    }

    return {
      type: 'FeatureCollection',
      features,
    } as FeatureCollection;
  }, [isoResults, isoSuccessful]);

  if (!data) return null;

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
