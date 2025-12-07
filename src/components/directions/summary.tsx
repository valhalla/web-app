import React from 'react';

import { formatDuration } from '@/utils/date-time';
import type { Summary as SummaryType } from '@/components/types';
import {
  ArrowUp,
  Clock,
  DollarSign,
  Milestone,
  MoveHorizontal,
  Ship,
  ArrowDown,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MetricItem } from '@/components/ui/metric-item';
import { RouteAttributes } from '@/components/ui/route-attributes';
import { useDirectionsStore } from '@/stores/directions-store';

export const Summary = ({
  summary,
  title,
  index,
}: {
  summary: SummaryType;
  title: string;
  index: number;
}) => {
  const results = useDirectionsStore((state) => state.results);
  const inclineDeclineTotal = useDirectionsStore(
    (state) => state.inclineDeclineTotal
  );
  const toggleShowOnMap = useDirectionsStore((state) => state.toggleShowOnMap);

  const handleChange = (checked: boolean) => {
    toggleShowOnMap({ show: checked, idx: index });
  };

  if (!summary) {
    return <div>No route found</div>;
  }

  const routeAttributes = [
    {
      flag: summary.has_highway,
      label: 'Route includes highway',
      icon: Milestone,
    },
    {
      flag: summary.has_ferry,
      label: 'Route includes ferry',
      icon: Ship,
    },
    {
      flag: summary.has_toll,
      label: 'Route includes toll',
      icon: DollarSign,
    },
  ].filter(({ flag }) => Boolean(flag));

  const metrics = [
    {
      icon: MoveHorizontal,
      label: 'Route length',
      value: `${summary.length.toFixed(summary.length > 1000 ? 0 : 1)} km`,
    },
    {
      icon: Clock,
      label: 'Route duration',
      value: formatDuration(summary.time),
    },
    ...(inclineDeclineTotal
      ? [
          {
            icon: ArrowUp,
            label: 'Total Incline',
            value: `${inclineDeclineTotal.inclineTotal} m`,
          },
          {
            icon: ArrowDown,
            label: 'Total Decline',
            value: `${inclineDeclineTotal.declineTotal} m`,
          },
        ]
      : []),
  ];

  return (
    <React.Fragment>
      <div className="flex items-center justify-between">
        <span className="font-bold">{title}</span>
        <RouteAttributes attributes={routeAttributes} />
      </div>
      <div className="grid grid-cols-5 items-start gap-2">
        <div className="col-span-3 flex flex-wrap gap-2">
          {metrics.map((metric) => (
            <MetricItem key={metric.label} variant="outline" {...metric} />
          ))}
        </div>
        <div className="col-span-2 flex items-center justify-end space-x-2">
          <Switch
            id="show-on-map"
            checked={results.show[index]}
            onCheckedChange={handleChange}
          />
          <Label htmlFor="show-on-map">Show on map</Label>
        </div>
      </div>
    </React.Fragment>
  );
};
