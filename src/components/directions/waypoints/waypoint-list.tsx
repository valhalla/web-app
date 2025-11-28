import React, { useEffect, useCallback } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import { useDispatch, useSelector } from 'react-redux';

import { Waypoint } from './waypoint-item';
import {
  doAddWaypoint,
  setWaypoints,
  makeRequest,
} from '@/actions/directions-actions';
import type { AppDispatch, RootState } from '@/store';
import type { Waypoint as WaypointType } from '@/reducers/directions';

const reorder = (
  list: WaypointType[],
  startIndex: number,
  endIndex: number
) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed!);

  return result;
};

const getItemStyle = (
  isDragging: boolean,
  draggableStyle: React.CSSProperties
) => ({
  userSelect: 'none',
  // styles we need to apply on draggables
  ...draggableStyle,
});

export const Waypoints = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { waypoints } = useSelector((state: RootState) => state.directions);

  useEffect(() => {
    if (waypoints.length === 0) {
      Array(2)
        .fill(null)
        .map(() => dispatch(doAddWaypoint()));
    }
  }, [dispatch, waypoints.length]);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      // dropped outside the list
      if (!result.destination) {
        return;
      }

      const items = reorder(
        waypoints,
        result.source.index,
        result.destination.index
      );
      dispatch(setWaypoints(items));
      dispatch(makeRequest());
    },
    [dispatch, waypoints]
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable">
        {(provided) => (
          <React.Fragment>
            <div
              className="flex flex-col gap-2"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {waypoints.map((wp, index) => (
                <Draggable key={wp.id} draggableId={wp.id} index={index}>
                  {(provided_inner, snapshot_inner) => (
                    <div
                      ref={provided_inner.innerRef}
                      {...provided_inner.draggableProps}
                      {...provided_inner.dragHandleProps}
                      // @ts-expect-error todo: fix this
                      style={getItemStyle(
                        snapshot_inner.isDragging,
                        provided_inner.draggableProps
                          .style as React.CSSProperties
                      )}
                    >
                      <Waypoint index={index} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          </React.Fragment>
        )}
      </Droppable>
    </DragDropContext>
  );
};
