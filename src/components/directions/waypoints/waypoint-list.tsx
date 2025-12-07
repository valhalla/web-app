import { useCallback } from 'react';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';

import { Waypoint } from './waypoint-item';
import { useDirectionsStore } from '@/stores/directions-store';
import { useDirectionsQuery } from '@/hooks/use-directions-queries';

export const Waypoints = () => {
  const { refetch: refetchDirections } = useDirectionsQuery();
  const waypoints = useDirectionsStore((state) => state.waypoints);
  const setWaypoint = useDirectionsStore((state) => state.setWaypoint);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      // dropped outside the list
      if (!over || active.id === over.id) {
        return;
      }

      const oldIndex = waypoints.findIndex((wp) => wp.id === active.id);
      const newIndex = waypoints.findIndex((wp) => wp.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const items = arrayMove(waypoints, oldIndex, newIndex);
        setWaypoint(items);
        refetchDirections();
      }
    },
    [setWaypoint, refetchDirections, waypoints]
  );

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={onDragEnd}
      accessibility={{
        announcements: {
          onDragStart({ active }) {
            const waypointIndex =
              waypoints.findIndex((wp) => wp.id === active.id) + 1;
            return `Picked up waypoint ${waypointIndex}. Use arrow keys to move, space bar to drop, escape to cancel.`;
          },
          onDragOver({ active, over }) {
            if (!over) return '';
            const activeIndex =
              waypoints.findIndex((wp) => wp.id === active.id) + 1;
            const overIndex =
              waypoints.findIndex((wp) => wp.id === over.id) + 1;
            if (activeIndex !== overIndex) {
              return `Moving waypoint ${activeIndex} to position ${overIndex}.`;
            }
            return '';
          },
          onDragEnd({ active, over }) {
            if (!over || active.id === over.id) {
              return 'Drag cancelled. Waypoint returned to original position.';
            }
            const activeIndex =
              waypoints.findIndex((wp) => wp.id === active.id) + 1;
            const newIndex = waypoints.findIndex((wp) => wp.id === over.id) + 1;
            return `Waypoint ${activeIndex} moved to position ${newIndex}.`;
          },
          onDragCancel({ active }) {
            const waypointIndex =
              waypoints.findIndex((wp) => wp.id === active.id) + 1;
            return `Drag cancelled. Waypoint ${waypointIndex} returned to original position.`;
          },
        },
      }}
    >
      <SortableContext
        items={waypoints.map((wp) => wp.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          role="list"
          aria-label="Waypoints list"
          className="flex flex-col gap-2"
        >
          {waypoints.map((wp, index) => (
            <Waypoint key={wp.id} id={wp.id} index={index} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
