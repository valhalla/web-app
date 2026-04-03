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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { exportDataAsJson } from '@/utils/export';
import { getDateTimeString } from '@/utils/date-time';
import { fetchHeight } from '@/utils/height';

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
  const [includeElevation, setIncludeElevation] = useState(false);
  const [exportFormat, setExportFormat] = useState<'geojson' | 'json'>(
    'geojson'
  );
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

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

  const exportWithElevation = useCallback(
    async (isGeoJson: boolean = false) => {
      const coordinates = data?.decodedGeometry;
      if (!coordinates) return;
      const elevationData = fetchHeight({ coordinates });
      const elevationResults = await elevationData;
      if (!elevationResults || !elevationResults.height) {
        alert('Failed to fetch elevation data.');
        return;
      }

      if (!isGeoJson) {
        const dataWithElevation = {
          ...data,
          trip: {
            ...data.trip,
            legs: [
              {
                ...data.trip.legs[0],
                elevation_interval: 30,
                elevation: elevationResults.height,
              },
            ],
          },
        };
        const formattedData = JSON.stringify(dataWithElevation, null, 2);
        downloadFile({
          data: formattedData,
          fileName:
            'valhalla-directions_' +
            getDateTimeString() +
            '_with_elevation.json',
          fileType: 'text/json',
        });
        return;
      }

      const geoJsonCoordinates = coordinates.map(([lat, lng]) => [lng, lat]);

      const geoJson = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: geoJsonCoordinates,
        },
        properties: {
          elevation_interval: 30,
          elevation: elevationResults.height,
        },
      };
      const formattedData = JSON.stringify(geoJson, null, 2);
      downloadFile({
        data: formattedData,
        fileName:
          'valhalla-directions_' +
          getDateTimeString() +
          '_with_elevation.geojson',
        fileType: 'text/json',
      });
    },
    [data]
  );

  const handleExport = useCallback(async () => {
    if (exportFormat === 'json') {
      if (includeElevation) {
        await exportWithElevation();
      } else {
        exportDataAsJson(data, 'valhalla-directions');
      }
      setIsExportMenuOpen(false);
      return;
    }

    if (includeElevation) {
      await exportWithElevation(true);
    } else {
      exportToGeoJson();
    }
    setIsExportMenuOpen(false);
  }, [
    data,
    exportFormat,
    includeElevation,
    exportToGeoJson,
    exportWithElevation,
  ]);

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
            <DropdownMenu
              open={isExportMenuOpen}
              onOpenChange={setIsExportMenuOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="size-4" />
                  Export
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 p-2" align="end">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold uppercase tracking-wide px-2 py-1">
                  Format
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup value={exportFormat}>
                  <DropdownMenuRadioItem
                    value="geojson"
                    onClick={() => setExportFormat('geojson')}
                    onSelect={(e) => e.preventDefault()}
                  >
                    GeoJSON
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    value="json"
                    onClick={() => setExportFormat('json')}
                    onSelect={(e) => e.preventDefault()}
                  >
                    JSON
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold uppercase tracking-wide px-2 py-1">
                  Options
                </DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={includeElevation}
                  onCheckedChange={(checked) => setIncludeElevation(!!checked)}
                  onSelect={(e) => e.preventDefault()}
                >
                  Include elevation
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <div className="px-1 pt-1">
                  <Button
                    data-testid="export-action-button"
                    size="sm"
                    className="w-full"
                    onClick={handleExport}
                  >
                    <Download className="size-4" />
                    Export
                  </Button>
                </div>
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
