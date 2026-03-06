import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { useIsochronesStore } from '@/stores/isochrones-store';
import type { Feature, FeatureCollection } from 'geojson';
import {
  ISOCHRONE_PALETTES,
  getPaletteColor,
} from '@/utils/isochrone-palettes';

export function IsochronePolygons() {
  const isoResults = useIsochronesStore((state) => state.results);
  const isoSuccessful = useIsochronesStore((state) => state.successful);
  const colorPalette = useIsochronesStore((state) => state.colorPalette);
  const opacity = useIsochronesStore((state) => state.opacity);

  const data = useMemo(() => {
    if (!isoResults || !isoSuccessful) return null;
    if (!isoResults.data || !isoResults.show) return null;

    const hasNoFeatures = Object.keys(isoResults.data).length === 0;
    if (hasNoFeatures) return null;

    const palette =
      ISOCHRONE_PALETTES.find((p) => p.id === colorPalette) ??
      ISOCHRONE_PALETTES[0];
    const selectedPaletteColors = palette?.colors ?? null;

    const polygonFeatures = isoResults.data.features.filter((f) =>
      ['Polygon', 'MultiPolygon'].includes(f.geometry.type)
    );

    if (selectedPaletteColors === null) {
      return {
        type: 'FeatureCollection',
        features: polygonFeatures,
      } as FeatureCollection;
    }

    const actualMax = polygonFeatures.reduce(
      (m, f) => Math.max(m, f.properties?.contour ?? 0),
      0
    );

    const features: Feature[] = polygonFeatures.map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        fill: getPaletteColor(
          selectedPaletteColors,
          actualMax > 0 ? (feature.properties?.contour ?? 0) / actualMax : 1
        ),
      },
    }));

    features.reverse();

    return {
      type: 'FeatureCollection',
      features,
    } as FeatureCollection;
  }, [isoResults, isoSuccessful, colorPalette]);

  if (!data) return null;

  return (
    <Source id="isochrones" type="geojson" data={data}>
      <Layer
        id="isochrones-fill"
        type="fill"
        paint={{
          'fill-color': ['get', 'fill'],
          'fill-opacity': opacity,
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
