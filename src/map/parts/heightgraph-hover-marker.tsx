import { useMemo } from 'react';
import { Marker } from 'react-map-gl/maplibre';
import type { FeatureCollection } from 'geojson';

interface HeightgraphHoverMarkerProps {
  hoverDistance: number | null;
  heightgraphData: FeatureCollection[];
}

export function HeightgraphHoverMarker({
  hoverDistance,
  heightgraphData,
}: HeightgraphHoverMarkerProps) {
  const closestCoord = useMemo(() => {
    if (hoverDistance === null || heightgraphData.length === 0) {
      return null;
    }

    let result: [number, number] | null = null;
    let minDistanceDiff = Infinity;

    for (const feature of heightgraphData[0]?.features || []) {
      if (feature.geometry.type === 'LineString') {
        const coords = feature.geometry.coordinates as number[][];
        for (const coord of coords) {
          const [lng, lat, , distance] = coord;
          if (distance !== undefined) {
            const diff = Math.abs(distance - hoverDistance);
            if (diff < minDistanceDiff) {
              minDistanceDiff = diff;
              result = [lng ?? 0, lat ?? 0];
            }
          }
        }
      }
    }

    return result;
  }, [hoverDistance, heightgraphData]);

  if (!closestCoord) {
    return null;
  }

  return (
    <Marker
      longitude={closestCoord[0]}
      latitude={closestCoord[1]}
      anchor="center"
    >
      <div
        style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: 'blue',
          border: '3px solid white',
          boxShadow: '0 0 8px rgba(0,0,0,0.5)',
        }}
      />
    </Marker>
  );
}
