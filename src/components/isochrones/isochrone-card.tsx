import { cn } from '@/lib/utils';
import type { ValhallaIsochroneResponse } from '@/components/types';
import { ClockIcon, MoveIcon } from 'lucide-react';
import { exportDataAsJson } from '@/utils/export';

import { useIsochronesStore } from '@/stores/isochrones-store';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MetricItem } from '@/components/ui/metric-item';

interface IsochronesCardProps {
  data: ValhallaIsochroneResponse;
  showOnMap: boolean;
}

export const IsochroneCard = ({ data, showOnMap }: IsochronesCardProps) => {
  const toggleShowOnMap = useIsochronesStore((state) => state.toggleShowOnMap);

  const handleChange = (checked: boolean) => {
    toggleShowOnMap(checked);
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-2.5 border rounded-md p-2',
        'focus-within:bg-muted/50 hover:bg-muted/50'
      )}
    >
      {data.features?.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <span className="font-bold">Main Isochrone</span>
            <div className="flex items-center justify-end space-x-2">
              <Switch
                id="show-on-map"
                checked={showOnMap}
                onCheckedChange={handleChange}
              />
              <Label htmlFor="show-on-map">Show on map</Label>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-2">
            {data.features
              .filter((feature) => !feature.properties?.type)
              .map((feature, key) => {
                return (
                  <div className="flex gap-3 border rounded-md p-2" key={key}>
                    <MetricItem
                      variant="outline"
                      icon={ClockIcon}
                      label="Contour"
                      value={feature.properties?.contour + ' minutes'}
                    />
                    <MetricItem
                      variant="outline"
                      icon={MoveIcon}
                      label="Area"
                      value={
                        (feature.properties?.area > 1
                          ? feature.properties?.area.toFixed(0)
                          : feature.properties?.area.toFixed(1)) + ' km²'
                      }
                    />
                  </div>
                );
              })}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="size-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => exportDataAsJson(data, 'valhalla-directions')}
                >
                  JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      ) : (
        <div>No isochrones found</div>
      )}
    </div>
  );
};
