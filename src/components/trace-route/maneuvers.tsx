import React from 'react';

import type { Leg } from '@/components/types';
import { Clock, MoveHorizontal, DollarSign, Ship } from 'lucide-react';
import { MetricItem } from '@/components/ui/metric-item';
import { RouteAttributes } from '@/components/ui/route-attributes';
import { formatDuration } from '@/utils/date-time';
import { getManeuverIcon } from '@/utils/get-maneuver-icon';

const getLength = (length: number) => {
  const visibleLength = length * 1000;
  if (visibleLength < 1000) {
    return visibleLength + 'm';
  }
  return (visibleLength / 1000).toFixed(2) + 'km';
};

interface ManeuversProps {
  legs: Leg[];
}

export const Maneuvers = ({ legs }: ManeuversProps) => {
  return (
    <div className="flex flex-col gap-2">
      {legs?.map((leg) =>
        leg.maneuvers.map((mnv, j) => (
          <React.Fragment key={j}>
            <div className="flex border justify-between rounded-md p-2 bg-background items-center">
              <div className="flex items-start gap-3">
                {React.createElement(getManeuverIcon(mnv.type), {
                  size: 20,
                  className: 'mt-1 shrink-0 text-muted-foreground',
                })}
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
