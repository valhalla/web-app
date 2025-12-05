import { Popup } from 'react-map-gl/maplibre';
import { MoveHorizontal, Clock } from 'lucide-react';
import { formatDuration } from '@/utils/date-time';
import type { Summary } from '@/components/types';

interface RouteHoverPopupProps {
  lng: number;
  lat: number;
  summary: Summary;
}

export function RouteHoverPopup({ lng, lat, summary }: RouteHoverPopupProps) {
  return (
    <Popup
      longitude={lng}
      latitude={lat}
      anchor="bottom"
      closeButton={false}
      closeOnClick={false}
      maxWidth="none"
    >
      <div className="min-w-[120px] px-2">
        <div className="font-bold text-muted-foreground">Route Summary</div>
        <div className="flex items-center gap-1">
          <MoveHorizontal className="size-3.5" />
          <span>
            {`${summary.length.toFixed(summary.length > 1000 ? 0 : 1)} km`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="size-3.5" />
          <span>{formatDuration(summary.time)}</span>
        </div>
      </div>
    </Popup>
  );
}
