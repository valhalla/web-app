import { useCallback, useState } from 'react';

import { downloadFile } from '@/utils/download-file';
import { Summary } from './summary';
import { Maneuvers } from './maneuvers';
import { Button } from '@/components/ui/button';
import type { ParsedDirectionsGeometry } from '@/components/types';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { exportDataAsJson } from '@/utils/export';
import { getDateTimeString } from '@/utils/date-time';

interface RouteCardProps {
  data: ParsedDirectionsGeometry;
  index: number;
  isActive: boolean;
  onSelect: () => void;
}

export const RouteCard = ({
  data,
  index,
  isActive,
  onSelect,
}: RouteCardProps) => {
  const [showManeuvers, setShowManeuvers] = useState(false);

  const exportToGeoJson = useCallback(() => {
    const coordinates = data?.decodedGeometry;
    if (!coordinates) return;

    const geoJsonCoordinates = coordinates.map(([lat, lng]) => [lng, lat]);

    const geoJson = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: geoJsonCoordinates,
      },
      properties: {},
    };

    const formattedData = JSON.stringify(geoJson, null, 2);
    downloadFile({
      data: formattedData,
      fileName: 'valhalla-directions_' + getDateTimeString() + '.geojson',
      fileType: 'text/json',
    });
  }, [data]);

  if (!data.trip) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          'flex flex-col gap-2.5 border rounded-md p-2 cursor-pointer transition-colors',
          'focus-within:bg-muted/50 hover:bg-muted/50',
          showManeuvers ? 'bg-muted/50' : 'bg-background',
          isActive && 'border-l-4 border-l-primary'
        )}
        onClick={onSelect}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect();
          }
        }}
      >
        <Summary
          title={`${index === 0 ? 'Main Route' : 'Alternate Route #' + index}`}
          summary={data.trip.summary}
          index={index}
          routeCoordinates={data.decodedGeometry ?? []}
        />
        <Collapsible open={showManeuvers} onOpenChange={setShowManeuvers}>
          <div className="flex justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                {showManeuvers ? 'Hide Maneuvers' : 'Show Maneuvers'}
              </Button>
            </CollapsibleTrigger>
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
                <DropdownMenuItem onClick={exportToGeoJson}>
                  GeoJSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CollapsibleContent>
            <Separator className="my-2" />
            <Maneuvers legs={data.trip.legs} index={index} />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </>
  );
};
