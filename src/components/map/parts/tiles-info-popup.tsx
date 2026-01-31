import { Button } from '@/components/ui/button';
import { X, Route, MapPin } from 'lucide-react';
import type { MapGeoJSONFeature } from 'maplibre-gl';

import { TilesProperty } from './tiles-property';

interface TilesInfoPopupProps {
  features: MapGeoJSONFeature[];
  onClose: () => void;
}

export function TilesInfoPopup({ features, onClose }: TilesInfoPopupProps) {
  if (features.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 p-2 max-w-sm max-h-96 overflow-auto">
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onClose}
        className="absolute right-5 top-1"
      >
        <X className="size-4" />
      </Button>

      {features.map((feature, index) => {
        const isEdge = feature.sourceLayer === 'edges';
        const layerType = isEdge ? 'Edge' : 'Node';
        const properties = feature.properties || {};
        const Icon = isEdge ? Route : MapPin;

        return (
          <div
            key={index}
            className="border-b border-border pb-3 last:border-b-0 last:pb-0"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Icon className="size-3.5 text-primary" />
              </div>
              <span className="font-semibold text-sm">
                {layerType} {features.length > 1 ? index + 1 : ''}
              </span>
            </div>

            {Object.keys(properties).length === 0 ? (
              <span className="text-xs text-muted-foreground italic">
                No properties available
              </span>
            ) : (
              <div className="rounded-md border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <tbody>
                    {Object.entries(properties).map(([key, value], idx) => (
                      <tr
                        key={key}
                        className={
                          idx % 2 === 0 ? 'bg-muted/30' : 'bg-transparent'
                        }
                      >
                        <td className="py-1.5 px-2 text-muted-foreground whitespace-nowrap font-bold">
                          {key}
                        </td>
                        <td className="py-1.5 px-2 text-right font-medium">
                          <TilesProperty propertyKey={key} value={value} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
