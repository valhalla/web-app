import { useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMap } from 'react-map-gl/maplibre';

import type { ActiveWaypoint } from '@/components/types';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { WaypointSearch } from '@/components/ui/waypoint-search';
import { GripVertical, Locate, Search, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { useDirectionsStore } from '@/stores/directions-store';
import {
  useDirectionsQuery,
  useSetWaypointFromCoords,
} from '@/hooks/use-directions-queries';

interface WaypointProps {
  id: string;
  index: number;
}

export const Waypoint = ({ id, index }: WaypointProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const waypoints = useDirectionsStore((state) => state.waypoints);
  const receiveGeocodeResults = useDirectionsStore(
    (state) => state.receiveGeocodeResults
  );
  const updateTextInput = useDirectionsStore((state) => state.updateTextInput);
  const { refetch: refetchDirections } = useDirectionsQuery();
  const { setWaypointFromCoords } = useSetWaypointFromCoords();
  const doRemoveWaypoint = useDirectionsStore(
    (state) => state.doRemoveWaypoint
  );
  const { mainMap } = useMap();
  const waypoint = waypoints[index];
  const { userInput, geocodeResults } = waypoint!;
  const selectedCoords = geocodeResults?.find((r) => r.selected)?.displaylnglat;

  const handleGeocodeResults = useCallback(
    (addresses: ActiveWaypoint[]) => {
      receiveGeocodeResults({ addresses, index });
    },
    [receiveGeocodeResults, index]
  );

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Your browser doesn't support geolocation.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await setWaypointFromCoords(
          pos.coords.longitude,
          pos.coords.latitude,
          index
        );
        refetchDirections();
      },
      (error) => {
        toast.error(
          error.code === error.PERMISSION_DENIED
            ? "We couldn't get your location. Please check your browser settings and allow location access."
            : "We couldn't get your location. Please try again."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [setWaypointFromCoords, refetchDirections, index]);

  const handleZoomToWaypoint = useCallback(() => {
    if (!mainMap || !selectedCoords) return;
    mainMap.flyTo({ center: [selectedCoords[0], selectedCoords[1]], zoom: 14 });
  }, [mainMap, selectedCoords]);

  const handleResultSelect = useCallback(
    (result: ActiveWaypoint) => {
      updateTextInput({
        inputValue: result.title,
        index: index,
        addressindex: result.addressindex,
      });

      refetchDirections();
    },
    [updateTextInput, index, refetchDirections]
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      role="listitem"
      aria-label={`Waypoint ${index + 1}`}
      className="cursor-auto"
    >
      <WaypointSearch
        index={index}
        userInput={userInput}
        geocodeResults={geocodeResults}
        onGeocodeResults={handleGeocodeResults}
        onResultSelect={handleResultSelect}
        placeholder="Select a waypoint..."
        testId={`waypoint-input-${index}`}
        leftContent={
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="cursor-grab active:cursor-grabbing"
                size="sm"
                {...listeners}
                aria-label={`Drag handle for waypoint ${index + 1}. Press space bar to pick up, use arrow keys to move, space bar to drop.`}
              >
                {index + 1}
                <GripVertical className="size-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Re-shuffle this waypoint</p>
            </TooltipContent>
          </Tooltip>
        }
        rightContent={
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleUseCurrentLocation}
                  data-testid="use-current-location-button"
                  aria-label={`Use my current location for waypoint ${index + 1}`}
                >
                  <Locate className="size-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Use my current location</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleZoomToWaypoint}
                  disabled={!selectedCoords}
                  data-testid="zoom-to-waypoint-button"
                  aria-label={`Zoom map to waypoint ${index + 1}`}
                >
                  <Search className="size-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Zoom to this waypoint</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => {
                    doRemoveWaypoint({ index });
                    refetchDirections();
                  }}
                  data-testid="remove-waypoint-button"
                  disabled={
                    waypoints.length < 3 &&
                    !geocodeResults?.some((r) => r.selected)
                  }
                >
                  <Trash className="size-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remove this waypoint</p>
              </TooltipContent>
            </Tooltip>
          </div>
        }
      />
    </div>
  );
};
