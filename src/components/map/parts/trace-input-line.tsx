import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { useParams } from '@tanstack/react-router';
import { useTraceRouteStore } from '@/stores/trace-route-store';
import type { FeatureCollection, LineString, Position } from 'geojson';

export function TraceRouteInputLine() {
  const { activeTab } = useParams({ from: '/$activeTab' });
  const coords = useTraceRouteStore((s) => s.inputGeometry);

  const isTraceRoute = activeTab === 'trace-route';

  const data = useMemo(() => {
    if (!isTraceRoute || !coords || coords.length < 2) return null;

    const positions: Position[] = coords
      .map((p) => {
        const lat = p[0];
        const lng = p[1];
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return [lng, lat] as Position;
      })
      .filter((p): p is Position => p !== null);

    if (positions.length < 2) return null;

    const geojson: FeatureCollection<LineString> = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: positions,
          },
        },
      ],
    };

    return geojson;
  }, [isTraceRoute, coords]);

  if (!data) return null;

  return (
    <Source id="trace-input" type="geojson" data={data}>
      <Layer
        id="trace-input-line"
        type="line"
        paint={{
          'line-color': '#6B7280',
          'line-width': 3,
          'line-opacity': 0.6,
        }}
      />
    </Source>
  );
}
