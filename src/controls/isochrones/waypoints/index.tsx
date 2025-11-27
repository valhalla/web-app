import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { WaypointSearch } from '@/components/ui/waypoint-search';
import type { ActiveWaypoint } from '@/common/types';

import {
  updateTextInput,
  updateIsoSettings,
  makeIsochronesRequest,
  clearIsos,
} from '@/actions/isochrones-actions';
import { RECEIVE_GEOCODE_RESULTS_ISO } from '@/actions/types';

import { settingsInit } from '@/controls/settings-options';

import { updatePermalink, zoomTo } from '@/actions/common-actions';

import { debounce } from 'throttle-debounce';
import type { AppDispatch, RootState } from '@/store';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { ChevronDown, Settings, Trash } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { SliderSetting } from '@/components/ui/slider-setting';
import { AccessibleIcon } from '@radix-ui/react-accessible-icon';
import { parseUrlParams } from '@/utils/parse-url-params';

export const Waypoints = () => {
  const params = parseUrlParams();
  const dispatch = useDispatch<AppDispatch>();
  const isochrones = useSelector((state: RootState) => state.isochrones);

  const handleIsoSliderUpdateSettings = useCallback(
    ({
      value,
      maxRangeName,
      intervalName,
      denoiseName,
      generalizeName,
    }: {
      value: number;
      maxRangeName?: string;
      intervalName?: string;
      denoiseName?: string;
      generalizeName?: string;
    }) => {
      // maxRangeName can be undefined if interval is being updated
      dispatch(
        updateIsoSettings({
          maxRangeName,
          intervalName,
          denoiseName,
          generalizeName,
          value: parseFloat(value.toString()),
        })
      );

      dispatch(updatePermalink());
    },
    [dispatch]
  );

  const makeIsochronesRequestDebounced = useMemo(
    () => debounce(100, () => dispatch(makeIsochronesRequest())),
    [dispatch]
  );

  const handleRemoveIsos = () => {
    dispatch(clearIsos());
  };

  const handleGeocodeResults = (addresses: ActiveWaypoint[]) => {
    dispatch({
      type: RECEIVE_GEOCODE_RESULTS_ISO,
      payload: addresses,
    });
  };

  const handleResultSelect = (result: ActiveWaypoint) => {
    dispatch(
      updateTextInput({
        userInput: result.title,
        addressindex: result.addressindex,
      })
    );
    dispatch(zoomTo([[result.addresslnglat![1], result.addresslnglat![0]]]));
    makeIsochronesRequestDebounced();
  };

  useEffect(() => {
    if (params.range && params.interval) {
      dispatch(
        updateIsoSettings({
          maxRangeName: 'maxRange',
          intervalName: 'interval',
          value: parseInt(params.range, 10),
        })
      );
      dispatch(
        updateIsoSettings({
          intervalName: 'interval',
          value: parseInt(params.interval, 10),
        })
      );
    }

    if (params.denoise) {
      dispatch(
        updateIsoSettings({
          denoiseName: 'denoise',
          value: parseFloat(params.denoise),
        })
      );
    }

    if (params.generalize) {
      dispatch(
        updateIsoSettings({
          generalizeName: 'generalize',
          value: parseInt(params.generalize, 10),
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { geocodeResults, userInput, maxRange, interval, denoise, generalize } =
    isochrones;

  return (
    <div className="flex flex-col gap-2">
      <WaypointSearch
        userInput={userInput}
        geocodeResults={geocodeResults}
        onGeocodeResults={handleGeocodeResults}
        onResultSelect={handleResultSelect}
        placeholder="Select a waypoint..."
        className="flex-1"
        rightContent={
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleRemoveIsos}
                data-testid="remove-waypoint-button"
              >
                <Trash className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reset this waypoint</p>
            </TooltipContent>
          </Tooltip>
        }
      />
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <Settings className="size-3" />
              Isochrones Settings
            </div>
            <AccessibleIcon label="Toggle isochrones settings">
              <ChevronDown className="size-3" />
            </AccessibleIcon>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-3 mt-1 rounded-md border">
          <SliderSetting
            id="maxRange"
            label="Maximum Range"
            description="The maximum range in minutes"
            min={1}
            max={120}
            step={1}
            value={maxRange}
            unit="mins"
            onValueChange={(values) => {
              const value = values[0] ?? 0;
              handleIsoSliderUpdateSettings({
                maxRangeName: 'maxRange',
                intervalName: 'interval',
                value,
              });
            }}
            onValueCommit={makeIsochronesRequestDebounced}
            onInputChange={(values) => {
              let value = values[0] ?? 0;
              value = isNaN(value) ? 0 : Math.min(value, 120);
              handleIsoSliderUpdateSettings({
                maxRangeName: 'maxRange',
                intervalName: 'interval',
                value,
              });
              makeIsochronesRequestDebounced();
            }}
          />

          <SliderSetting
            id="interval"
            label="Interval Step"
            description="The interval length in minutes"
            min={1}
            max={maxRange}
            step={1}
            value={interval}
            unit="mins"
            onValueChange={(values) => {
              const value = values[0] ?? 0;
              handleIsoSliderUpdateSettings({
                intervalName: 'interval',
                value,
              });
            }}
            onValueCommit={makeIsochronesRequestDebounced}
            onInputChange={(values) => {
              let value = values[0] ?? 0;
              value = isNaN(value) ? 0 : Math.min(value, maxRange);
              handleIsoSliderUpdateSettings({
                intervalName: 'interval',
                value,
              });
              makeIsochronesRequestDebounced();
            }}
          />

          <SliderSetting
            id="denoise"
            label="Denoise"
            description="A floating point value from 0 to 1 (default of 1) which can be used to remove smaller contours. A value of 1 will only return the largest contour for a given time value. A value of 0.5 drops any contours that are less than half the area of the largest contour in the set of contours for that same time value."
            min={0}
            max={1}
            step={0.1}
            value={denoise}
            onValueChange={(values) => {
              const value = values[0] ?? 0;
              handleIsoSliderUpdateSettings({
                denoiseName: 'denoise',
                value,
              });
            }}
            onValueCommit={makeIsochronesRequestDebounced}
            onInputChange={(values) => {
              const value = values[0] ?? settingsInit.denoise;
              const validValue = isNaN(value) ? settingsInit.denoise : value;
              handleIsoSliderUpdateSettings({
                denoiseName: 'denoise',
                value: validValue,
              });
              makeIsochronesRequestDebounced();
            }}
          />

          <SliderSetting
            id="generalize"
            label="Generalize"
            description="A floating point value in meters used as the tolerance for Douglas-Peucker generalization. Note: Generalization of contours can lead to self-intersections, as well as intersections of adjacent contours."
            min={0}
            max={1000}
            step={1}
            value={generalize}
            unit="meters"
            onValueChange={(values) => {
              const value = values[0] ?? 0;
              handleIsoSliderUpdateSettings({
                generalizeName: 'generalize',
                value,
              });
            }}
            onValueCommit={makeIsochronesRequestDebounced}
            onInputChange={(values) => {
              const value = values[0] ?? settingsInit.generalize;
              const validValue = isNaN(value) ? settingsInit.generalize : value;
              handleIsoSliderUpdateSettings({
                generalizeName: 'generalize',
                value: validValue,
              });
              makeIsochronesRequestDebounced();
            }}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
