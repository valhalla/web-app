import { Marker } from 'react-map-gl/maplibre';
import { useTraceRouteStore } from '@/stores/trace-route-store';
import { useParams } from '@tanstack/react-router';

export function TraceRouteMarkers() {
  const { activeTab } = useParams({ from: '/$activeTab' });

  const inputShape = useTraceRouteStore((s) => s.inputShape);

  if (activeTab !== 'trace-route') return null;

  const breakPoints = inputShape?.filter((p) => p.type === 'break') ?? [];
  if (breakPoints.length === 0) return null;

  return (
    <>
      {breakPoints.map((p, idx) => (
        <Marker
          key={`break-${idx}-${p.lat}-${p.lon}`}
          longitude={p.lon}
          latitude={p.lat}
          anchor="bottom"
        >
          <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            {idx + 1}
          </div>
        </Marker>
      ))}
    </>
  );
}
