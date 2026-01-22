import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { MapGeoJSONFeature } from 'maplibre-gl';

interface TilesInfoPopupProps {
  features: MapGeoJSONFeature[];
  onClose: () => void;
}

export function TilesInfoPopup({ features, onClose }: TilesInfoPopupProps) {
  if (features.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 p-2 max-w-sm max-h-80 overflow-auto">
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onClose}
        className="absolute right-1 top-1"
      >
        <X className="size-4" />
      </Button>

      {features.map((feature, index) => {
        const layerType = feature.sourceLayer === 'edges' ? 'Edge' : 'Node';
        const properties = feature.properties || {};

        return (
          <div
            key={index}
            className="border-b border-border pb-2 last:border-b-0"
          >
            <div className="font-semibold text-sm mb-1 text-primary">
              {layerType} {index + 1}
            </div>
            <div className="flex flex-col gap-0.5">
              {Object.entries(properties).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-2 text-xs">
                  <span className="text-muted-foreground font-medium truncate">
                    {key}:
                  </span>
                  <span className="text-right break-all">
                    {typeof value === 'boolean'
                      ? value.toString()
                      : typeof value === 'object'
                        ? JSON.stringify(value)
                        : String(value)}
                  </span>
                </div>
              ))}
              {Object.keys(properties).length === 0 && (
                <span className="text-xs text-muted-foreground italic">
                  No properties available
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
