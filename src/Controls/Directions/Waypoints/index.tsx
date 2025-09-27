import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { connect } from 'react-redux';

import Waypoint from './Waypoint';
import {
  doAddWaypoint,
  setWaypoints,
  makeRequest,
} from '@/actions/directionsActions';
import type { RootState } from '@/store';
import type { AnyAction } from 'redux';
import type {
  DirectionsState,
  Waypoint as WaypointType,
} from '@/reducers/directions';
import type { ThunkDispatch } from 'redux-thunk';

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
  paddingLeft: 16,
  paddingRight: 16,
  //background: isDragging ? 'lightgreen' : 'transparent',
  // styles we need to apply on draggables
  ...draggableStyle,
});

interface WaypointsProps {
  directions: DirectionsState;
  dispatch: ThunkDispatch<RootState, unknown, AnyAction>;
}

const Waypoints = ({ directions, dispatch }: WaypointsProps) => {
  const [, setVisible] = useState(false);

  // const handleDismiss = useCallback(() => {
  //   setVisible(false)
  // }, [])

  useEffect(() => {
    setVisible(true);

    if (directions.waypoints.length === 0) {
      Array(2)
        .fill(null)
        .map(() => dispatch(doAddWaypoint()));
    }
  }, [dispatch, directions.waypoints.length]);

  const onDragEnd = useCallback(
    (result) => {
      // dropped outside the list
      if (!result.destination) {
        return;
      }

      const items = reorder(
        directions.waypoints,
        result.source.index,
        result.destination.index
      );
      dispatch(setWaypoints(items));
      dispatch(makeRequest());
    },
    [dispatch, directions.waypoints]
  );

  const { waypoints } = directions;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable">
        {(provided) => (
          <React.Fragment>
            <div
              className="flex flex-column"
              {...provided.droppableProps}
              ref={provided.innerRef}
              style={{ minHeight: '22rem' }}
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

const mapStateToProps = (state: RootState) => {
  const { directions } = state;
  return {
    directions,
  };
};

export default connect(mapStateToProps)(Waypoints);
