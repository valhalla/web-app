import {
  doRemoveWaypoint,
  receiveGeocodeResults,
  makeRequest,
  updateTextInput,
} from '@/actions/directions-actions';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { ActiveWaypoint } from '@/components/types';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { WaypointSearch } from '@/components/ui/waypoint-search';
import type { AppDispatch, RootState } from '@/store';
import { GripVertical, Trash } from 'lucide-react';

interface WaypointProps {
  index: number;
}

export const Waypoint = ({ index }: WaypointProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const waypoints = useSelector(
    (state: RootState) => state.directions.waypoints
  );
  const waypoint = waypoints[index];
  const { userInput, geocodeResults } = waypoint!;

  const handleGeocodeResults = useCallback(
    (addresses: ActiveWaypoint[]) => {
      dispatch(receiveGeocodeResults({ addresses, index }));
    },
    [dispatch, index]
  );

  const handleResultSelect = useCallback(
    (result: ActiveWaypoint) => {
      dispatch(
        updateTextInput({
          inputValue: result.title,
          index: index,
          addressindex: result.addressindex,
        })
      );

      dispatch(makeRequest());
    },
    [dispatch, index]
  );

  return (
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
            <Button variant="ghost" className="cursor-grab" size="sm">
              {index + 1}
              <GripVertical className="size-4" />
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
              onClick={() => dispatch(doRemoveWaypoint(index))}
              data-testid="remove-waypoint-button"
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
  );
};
