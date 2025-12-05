import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { isValidCoordinates } from '@/utils/geom';
import { forward_geocode, parseGeocodeResponse } from '@/utils/nominatim';
import type { ActiveWaypoint, NominationResponse } from '@/components/types';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronsUpDownIcon, ExternalLink } from 'lucide-react';
import { useMap } from 'react-map-gl/maplibre';
import { useCommonStore } from '@/stores/common-store';

interface WaypointSearchProps {
  index?: number;
  userInput: string;
  geocodeResults: ActiveWaypoint[];
  onGeocodeResults?: (addresses: ActiveWaypoint[]) => void;
  onResultSelect: (result: ActiveWaypoint) => void;
  placeholder?: string;
  testId?: string;
  className?: string;
  triggerClassName?: string;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export const WaypointSearch = ({
  index = 0,
  userInput,
  geocodeResults,
  onGeocodeResults,
  onResultSelect,
  placeholder = 'Select a waypoint...',
  testId,
  className = '',
  triggerClassName = '',
  leftContent,
  rightContent,
}: WaypointSearchProps) => {
  const { mainMap } = useMap();
  const use_geocoding = useCommonStore((state) => state.settings.use_geocoding);

  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState('');

  const {
    mutate: geocodeMutate,
    isPending: isGeocoding,
    isSuccess,
  } = useMutation({
    mutationFn: async () => {
      if (use_geocoding) {
        const response = await forward_geocode(internalValue);
        return { type: 'forward' as const, data: response.data };
      }

      // coordinate parsing
      const coords = internalValue.split(/[\s,;]+/);
      if (coords.length === 2) {
        const lat = coords[1];
        const lng = coords[0];
        if (isValidCoordinates(lat!, lng!)) {
          const lngLat: [number, number] = [parseFloat(lng!), parseFloat(lat!)];
          return { type: 'coordinates' as const, lngLat };
        }
      }

      return { type: 'error' as const, data: null };
    },
    onSuccess: (result) => {
      if (result.type === 'coordinates') {
        const addresses: ActiveWaypoint[] = [
          {
            title: internalValue,
            description: '',
            selected: false,
            addresslnglat: result.lngLat,
            sourcelnglat: result.lngLat,
            displaylnglat: result.lngLat,
            key: index,
            addressindex: 0,
          },
        ];
        onGeocodeResults?.(addresses);
      } else if (result.type === 'forward') {
        const lngLat: [number, number] | undefined = undefined;
        const addresses = parseGeocodeResponse(
          result.data as NominationResponse | NominationResponse[],
          lngLat!
        );
        onGeocodeResults?.(addresses as ActiveWaypoint[]);
      } else {
        onGeocodeResults?.([]);
      }
    },
    onError: (error) => {
      console.error('Geocoding error:', error);
      onGeocodeResults?.([]);
    },
  });

  const fetchGeocodeResults = useCallback(() => {
    if (internalValue.length === 0) return;
    geocodeMutate();
  }, [internalValue, geocodeMutate]);

  const handleResultSelect = useCallback(
    (result: ActiveWaypoint) => {
      setOpen(false);

      if (result.addresslnglat) {
        if (mainMap) {
          mainMap.flyTo({
            center: [result.addresslnglat[0], result.addresslnglat[1]],
          });
        }
      }

      onResultSelect(result);
    },
    [mainMap, onResultSelect]
  );

  return (
    <div className={`flex items-center gap-2 w-full ${className}`}>
      {leftContent}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={`justify-between w-full min-w-0 shrink ${triggerClassName}`}
            data-testid={testId}
          >
            <span className="truncate">{userInput || placeholder}</span>
            <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
          <Command shouldFilter={false} value={internalValue}>
            <CommandInput
              placeholder="Hit enter for search"
              onValueChange={(value) => {
                setInternalValue(value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && internalValue.length > 0) {
                  fetchGeocodeResults();
                }
              }}
            />
            <CommandList>
              <CommandEmpty>
                {isGeocoding && 'Searching...'}
                {isSuccess &&
                  geocodeResults.length === 0 &&
                  'No search results found'}
              </CommandEmpty>
              <CommandGroup>
                {geocodeResults.map((result) => (
                  <CommandItem
                    key={result.key}
                    value={result.displaylnglat.toString()}
                    onSelect={() => handleResultSelect(result)}
                  >
                    <div data-testid="search-result">
                      <span className="font-medium line-clamp-2">
                        {result.title}
                      </span>
                      {result.description && result.description.length > 0 && (
                        <div className="flex mt-1 items-center gap-1">
                          <ExternalLink className="size-3 text-blue-700" />
                          <a
                            className="text-xs font-bold text-blue-700"
                            target="_blank"
                            rel="noopener noreferrer"
                            href={result.description}
                            onClick={(e) => e.stopPropagation()}
                          >
                            OSM Link
                          </a>
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {rightContent}
    </div>
  );
};
