import { Marker } from 'react-map-gl/maplibre';
import { useTraceRouteStore } from '@/stores/trace-route-store';
import { useParams } from '@tanstack/react-router';

export function TraceRouteMarkers() {
  const { activeTab } = useParams({ from: '/$activeTab' });

  const results = useTraceRouteStore((s) => s.results);
  const successful = useTraceRouteStore((s) => s.successful);

  if (activeTab !== 'trace-route') return null;

  const data = results.data;
  if (!successful || !data?.trip?.locations?.length) return null;

  const start = data.trip.locations[0];
  const end = data.trip.locations[data.trip.locations.length - 1];

  if (!start || !end) return null;

  return (
    <>
      <Marker longitude={start.lon} latitude={start.lat} anchor="bottom">
        <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
          A
        </div>
      </Marker>

      <Marker longitude={end.lon} latitude={end.lat} anchor="bottom">
        <div className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
          B
        </div>
      </Marker>
    </>
  );
}
