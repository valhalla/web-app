import { useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { ActiveWaypoint } from '@/components/types';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { WaypointSearch } from '@/components/ui/waypoint-search';
import { GripVertical, Trash } from 'lucide-react';
import {
  defaultWaypoints,
  useDirectionsStore,
} from '@/stores/directions-store';
import { useDirectionsQuery } from '@/hooks/use-directions-queries';

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
  const doRemoveWaypoint = useDirectionsStore(
    (state) => state.doRemoveWaypoint
  );
  const waypoint = waypoints[index];
  const { userInput, geocodeResults } = waypoint!;

  const handleGeocodeResults = useCallback(
    (addresses: ActiveWaypoint[]) => {
      receiveGeocodeResults({ addresses, index });
    },
    [receiveGeocodeResults, index]
  );

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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  doRemoveWaypoint({ index });
                  refetchDirections();
                }}
                data-testid="remove-waypoint-button"
                disabled={
                  JSON.stringify(waypoints) === JSON.stringify(defaultWaypoints)
                }
              >
                <Trash className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Remove this waypoint</p>
            </TooltipContent>
          </Tooltip>
        }
      />
    </div>
  );
};
