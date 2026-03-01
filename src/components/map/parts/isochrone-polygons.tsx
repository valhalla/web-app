import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { useIsochronesStore } from '@/stores/isochrones-store';
import type { Feature, FeatureCollection } from 'geojson';
import {
  ISOCHRONE_PALETTES,
  getPaletteColor,
  DEFAULT_FILL,
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

    // Fallback to the first palette (Default) if the stored id is unrecognised
    const palette =
      ISOCHRONE_PALETTES.find((p) => p.id === colorPalette) ??
      ISOCHRONE_PALETTES[0];
    const selectedPaletteColors = palette?.colors ?? null;

    const polygonFeatures = isoResults.data.features.filter((f) =>
      ['Polygon', 'MultiPolygon'].includes(f.geometry.type)
    );

    // Ensure consistent color assignment based on contour order
    const sorted = [...polygonFeatures].sort(
      (a, b) => (a.properties?.contour ?? 0) - (b.properties?.contour ?? 0)
    );
    const total = sorted.length;

    const features: Feature[] = sorted.map((feature, index) => {
      const fillColor =
        selectedPaletteColors !== null
          ? getPaletteColor(selectedPaletteColors, index, total)
          : (feature.properties?.fill ?? DEFAULT_FILL);

      return {
        ...feature,
        properties: {
          ...feature.properties,
          fill: fillColor,
        },
      };
    });

    // Reverse order so inner rings are not hidden by outer polygons
    features.reverse();

    return {
      type: 'FeatureCollection',
      features,
    } as FeatureCollection;
    // only re-run when the data or palette changes, not on every opacity drag
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
