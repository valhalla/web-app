import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { useDirectionsStore } from '@/stores/directions-store';
import { routeObjects } from '../constants';
import type { Feature, FeatureCollection, LineString } from 'geojson';
import type { ParsedDirectionsGeometry } from '@/components/types';
import { useParams } from '@tanstack/react-router';
import { useTraceRouteStore } from '@/stores/trace-route-store';

export function RouteLines() {
  const { activeTab } = useParams({ from: '/$activeTab' });
  const isTraceRoute = activeTab === 'trace-route';

  const directionResults = useDirectionsStore((state) => state.results);
  const directionsSuccessful = useDirectionsStore((state) => state.successful);
  const activeDirectionRouteIndex = useDirectionsStore(
    (state) => state.activeRouteIndex
  );

  const traceRouteResults = useTraceRouteStore((state) => state.results);
  const traceRouteSuccessful = useTraceRouteStore((state) => state.successful);
  const traceRouteActiveIndex = useTraceRouteStore(
    (state) => state.activeRouteIndex
  );

  const results = isTraceRoute ? traceRouteResults : directionResults;
  const successful = isTraceRoute ? traceRouteSuccessful : directionsSuccessful;
  const activeRouteIndex = isTraceRoute
    ? traceRouteActiveIndex
    : activeDirectionRouteIndex;

  const data = useMemo(() => {
    if (!results.data || !successful) return null;

    const hasNoData = Object.keys(results.data).length === 0;
    if (hasNoData) return null;

    const response = results.data;
    const showRoutes = results.show || {};
    const features: Feature<LineString>[] = [];

    if (response.alternates) {
      response.alternates.forEach((alternate, i) => {
        if (!showRoutes[i + 1]) return;
        const coords = (alternate! as ParsedDirectionsGeometry)!
          .decodedGeometry;
        const summary = alternate!.trip.summary;
        const isActive = activeRouteIndex === i + 1;

        features.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: coords.map((c) => [c[1] ?? 0, c[0] ?? 0]),
          },
          properties: {
            color: isActive ? routeObjects.color : routeObjects.inactiveColor,
            type: 'alternate',
            routeIndex: i + 1,
            summary,
          },
        });
      });
    }

    if (showRoutes[0] !== false) {
      const coords = response.decodedGeometry;
      const summary = response.trip.summary;
      const isActive = activeRouteIndex === 0;

      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coords.map((c) => [c[1] ?? 0, c[0] ?? 0]),
        },
        properties: {
          color: isActive ? routeObjects.color : routeObjects.inactiveColor,
          type: 'main',
          routeIndex: 0,
          summary,
        },
      });
    }

    // Sort so active route renders last (on top)
    features.sort((a, b) => {
      const aActive = a.properties?.routeIndex === activeRouteIndex ? 1 : 0;
      const bActive = b.properties?.routeIndex === activeRouteIndex ? 1 : 0;
      return aActive - bActive;
    });

    return {
      type: 'FeatureCollection',
      features,
    } as FeatureCollection;
  }, [results, successful, activeRouteIndex]);

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
          'line-opacity': [
            'case',
            ['==', ['get', 'routeIndex'], activeRouteIndex],
            1,
            0.5,
          ],
        }}
      />
    </Source>
  );
}
