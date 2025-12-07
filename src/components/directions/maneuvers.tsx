import React from 'react';

import type { Leg } from '@/components/types';
import { Clock, MoveHorizontal, DollarSign, Ship } from 'lucide-react';
import { MetricItem } from '@/components/ui/metric-item';
import { RouteAttributes } from '@/components/ui/route-attributes';
import { formatDuration } from '@/utils/date-time';
import { useDirectionsStore } from '@/stores/directions-store';

const getLength = (length: number) => {
  const visibleLength = length * 1000;
  if (visibleLength < 1000) {
    return visibleLength + 'm';
  }
  return (visibleLength / 1000).toFixed(2) + 'km';
};

interface ManeuversProps {
  legs: Leg[];
  index: number;
}

export const Maneuvers = ({ legs, index }: ManeuversProps) => {
  const highlightManeuver = useDirectionsStore(
    (state) => state.highlightManeuver
  );
  const zoomToManeuver = useDirectionsStore((state) => state.zoomToManeuver);

  const highlightMnv = (startIndex: number, endIndex: number) => {
    highlightManeuver({ startIndex, endIndex, alternate: index });
  };

  const zoomToMnv = (startIndex: number) => {
    zoomToManeuver({ index: startIndex, timeNow: Date.now() });
  };

  const startIndices: number[] = [
    0,
    ...(legs
      ?.slice(0, -1)
      .map((leg) => leg.maneuvers[leg.maneuvers.length - 1]!.end_shape_index) ??
      []),
  ];

  return (
    <div className="flex flex-col gap-2">
      {legs?.map((leg, i) =>
        leg.maneuvers.map((mnv, j) => (
          <React.Fragment key={j}>
            <div
              className="flex border justify-between rounded-md p-2 bg-background items-center"
              onMouseEnter={() =>
                highlightMnv(
                  startIndices[i]! + mnv.begin_shape_index,
                  startIndices[i]! + mnv.end_shape_index
                )
              }
              onMouseLeave={() =>
                highlightMnv(
                  startIndices[i]! + mnv.begin_shape_index,
                  startIndices[i]! + mnv.end_shape_index
                )
              }
              onClick={() =>
                zoomToMnv(startIndices[i]! + mnv.begin_shape_index)
              }
            >
              <div>
                <p>{mnv.instruction}</p>
                {mnv.type !== 4 && mnv.type !== 5 && mnv.type !== 6 && (
                  <div className="flex items-center gap-2">
                    <MetricItem
                      icon={MoveHorizontal}
                      label="Length"
                      value={getLength(mnv.length)}
                      variant="outline"
                    />
                    <MetricItem
                      icon={Clock}
                      label="Time"
                      value={formatDuration(mnv.time)}
                      variant="outline"
                    />
                  </div>
                )}
              </div>
              <div>
                <RouteAttributes
                  attributes={[
                    { icon: DollarSign, label: 'Toll', flag: mnv.toll },
                    { icon: Ship, label: 'Ferry', flag: mnv.ferry },
                  ]}
                  variant="outline-destructive"
                />
              </div>
            </div>
          </React.Fragment>
        ))
      )}
    </div>
  );
};
