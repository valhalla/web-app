import React from 'react';

import { formatDuration } from '@/utils/date-time';
import type { Summary as SummaryType } from '@/components/types';
import {
  ArrowUp,
  Clock,
  Crosshair,
  DollarSign,
  Milestone,
  MoveHorizontal,
  Ship,
  ArrowDown,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { MetricItem } from '@/components/ui/metric-item';
import { RouteAttributes } from '@/components/ui/route-attributes';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDirectionsStore } from '@/stores/directions-store';
import { useCommonStore } from '@/stores/common-store';
import { useMap } from 'react-map-gl/maplibre';

export const Summary = ({
  summary,
  title,
  index,
  routeCoordinates,
}: {
  summary: SummaryType;
  title: string;
  index: number;
  routeCoordinates: number[][];
}) => {
  const results = useDirectionsStore((state) => state.results);
  const inclineDeclineTotal = useDirectionsStore(
    (state) => state.inclineDeclineTotal
  );
  const toggleShowOnMap = useDirectionsStore((state) => state.toggleShowOnMap);
  const successful = useDirectionsStore((state) => state.successful);

  const { mainMap } = useMap();

  const handleChange = (checked: boolean) => {
    toggleShowOnMap({ show: checked, idx: index });
  };

  const handleRecenter = () => {
    if (!mainMap || routeCoordinates.length === 0) return;

    const firstCoord = routeCoordinates[0];
    if (!firstCoord || !firstCoord[0] || !firstCoord[1]) return;

    const bounds: [[number, number], [number, number]] =
      routeCoordinates.reduce<[[number, number], [number, number]]>(
        (acc, coord) => {
          if (!coord || !coord[0] || !coord[1]) return acc;
          return [
            [Math.min(acc[0][0], coord[1]), Math.min(acc[0][1], coord[0])],
            [Math.max(acc[1][0], coord[1]), Math.max(acc[1][1], coord[0])],
          ];
        },
        [
          [firstCoord[1], firstCoord[0]],
          [firstCoord[1], firstCoord[0]],
        ]
      );

    const state = useCommonStore.getState();
    const dpOpen = state.directionsPanelOpen;
    const spOpen = state.settingsPanelOpen;

    const paddingTopLeft = [screen.width < 550 ? 50 : dpOpen ? 420 : 50, 50];
    const paddingBottomRight = [
      screen.width < 550 ? 50 : spOpen ? 420 : 50,
      50,
    ];

    mainMap.fitBounds(bounds, {
      padding: {
        top: paddingTopLeft[1] as number,
        bottom: paddingBottomRight[1] as number,
        left: paddingTopLeft[0] as number,
        right: paddingBottomRight[0] as number,
      },
      maxZoom: routeCoordinates.length === 1 ? 11 : 18,
      duration: 800,
    });
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
        <div className="col-span-2 flex items-center justify-end gap-1">
          <Switch
            id="show-on-map"
            checked={results.show[index]}
            onCheckedChange={handleChange}
          />
          {successful && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={handleRecenter}
                  aria-label="Recenter route"
                >
                  <Crosshair className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Recenter route</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </React.Fragment>
  );
};
