import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { useDirectionsStore } from '@/stores/directions-store';
import { routeObjects } from '../constants';
import type { Feature, FeatureCollection, LineString } from 'geojson';
import type { ParsedDirectionsGeometry } from '@/components/types';

export function RouteLines() {
  const directionResults = useDirectionsStore((state) => state.results);
  const directionsSuccessful = useDirectionsStore((state) => state.successful);

  const data = useMemo(() => {
    if (!directionResults.data || !directionsSuccessful) return null;

    const hasNoData = Object.keys(directionResults.data).length === 0;
    if (hasNoData) return null;

    const response = directionResults.data;
    const showRoutes = directionResults.show || {};
    const features: Feature<LineString>[] = [];

    if (response.alternates) {
      response.alternates.forEach((alternate, i) => {
        if (!showRoutes[i]) return;
        const coords = (alternate! as ParsedDirectionsGeometry)!
          .decodedGeometry;
        const summary = alternate!.trip.summary;

        features.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: coords.map((c) => [c[1] ?? 0, c[0] ?? 0]),
          },
          properties: {
            color: routeObjects.alternativeColor,
            type: 'alternate',
            summary,
          },
        });
      });
    }

    if (showRoutes[-1] !== false) {
      const coords = response.decodedGeometry;
      const summary = response.trip.summary;

      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coords.map((c) => [c[1] ?? 0, c[0] ?? 0]),
        },
        properties: {
          color: routeObjects.color,
          type: 'main',
          summary,
        },
      });
    }

    return {
      type: 'FeatureCollection',
      features,
    } as FeatureCollection;
  }, [directionResults, directionsSuccessful]);

  if (!data) return null;

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
