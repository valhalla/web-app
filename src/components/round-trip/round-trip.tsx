import { useMemo, useState } from 'react';
import { debounce } from 'throttle-debounce';
import { useShallow } from 'zustand/react/shallow';
import { Settings, Trash } from 'lucide-react';

import { WaypointSearch } from '@/components/ui/waypoint-search';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { SliderSetting } from '@/components/ui/slider-setting';
import { GeneralSettings } from '@/components/general-settings';
import { SettingsFooter } from '@/components/settings-footer';
import { RouteCard } from '@/components/directions/route-card';
import type { ActiveWaypoint } from '@/components/types';
import {
  roundTripSettingsInit,
  useRoundTripStore,
  type RoundTripSettings,
} from '@/stores/round-trip-store';
import { useRoundTripQuery } from '@/hooks/use-round-trip-queries';

interface RoundTripSliderConfig {
  name: keyof RoundTripSettings;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}

const ROUND_TRIP_SLIDERS: RoundTripSliderConfig[] = [
  {
    name: 'distance',
    label: 'Distance',
    description:
      'The desired length of the round trip. The server caps it at a per-profile maximum.',
    min: 1,
    max: 200,
    step: 0.5,
    unit: 'km',
  },
  {
    name: 'distanceTolerance',
    label: 'Distance Tolerance',
    description:
      'How far the round trip may deviate from the desired distance. A larger tolerance finds a round trip faster.',
    min: 2,
    max: 50,
    step: 1,
    unit: '%',
  },
  {
    name: 'heading',
    label: 'Heading',
    description:
      'The direction the round trip heads out to, in degrees clockwise from north (0 = north, 90 = east, 180 = south, 270 = west).',
    min: 0,
    max: 359,
    step: 1,
    unit: '°',
  },
  {
    name: 'headingTolerance',
    label: 'Heading Tolerance',
    description:
      'The width of the sector around the heading in which the round trip turns around.',
    min: 10,
    max: 180,
    step: 1,
    unit: '°',
  },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const RoundTripControl = () => {
  const userInput = useRoundTripStore((state) => state.userInput);
  const geocodeResults = useRoundTripStore((state) => state.geocodeResults);
  const results = useRoundTripStore((state) => state.results);
  const roundTripSettings = useRoundTripStore(
    useShallow((state) => ({
      distance: state.distance,
      distanceTolerance: state.distanceTolerance,
      heading: state.heading,
      headingTolerance: state.headingTolerance,
    }))
  );
  const receiveGeocodeResults = useRoundTripStore(
    (state) => state.receiveGeocodeResults
  );
  const updateTextInput = useRoundTripStore((state) => state.updateTextInput);
  const updateSettings = useRoundTripStore((state) => state.updateSettings);
  const clearRoundTrip = useRoundTripStore((state) => state.clearRoundTrip);
  const { refetch: refetchRoundTrip } = useRoundTripQuery();
  const [settingsOpen, setSettingsOpen] = useState(true);

  const refetchRoundTripDebounced = useMemo(
    () => debounce(100, () => refetchRoundTrip()),
    [refetchRoundTrip]
  );

  const handleResultSelect = (address: ActiveWaypoint) => {
    updateTextInput({
      userInput: address.title,
      addressIndex: address.addressindex,
    });
    refetchRoundTripDebounced();
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <WaypointSearch
          userInput={userInput}
          geocodeResults={geocodeResults}
          onGeocodeResults={receiveGeocodeResults}
          onResultSelect={handleResultSelect}
          placeholder="Select a start..."
          className="flex-1"
          testId="round-trip-start-input"
          rightContent={
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={clearRoundTrip}
                  data-testid="reset-round-trip-button"
                >
                  <Trash className="size-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset the start</p>
              </TooltipContent>
            </Tooltip>
          }
        />
        <CollapsibleSection
          title="Round trip settings"
          icon={Settings}
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          className="bg-muted/60 rounded-md px-3 py-2"
        >
          {ROUND_TRIP_SLIDERS.map(({ name, min, max, ...slider }) => (
            <SliderSetting
              key={name}
              id={name}
              min={min}
              max={max}
              value={roundTripSettings[name]}
              onValueChange={(values) => {
                updateSettings({ name, value: values[0] ?? min });
              }}
              onValueCommit={refetchRoundTripDebounced}
              onInputChange={(values) => {
                const value = values[0];
                updateSettings({
                  name,
                  value:
                    value === undefined || isNaN(value)
                      ? roundTripSettingsInit[name]
                      : clamp(value, min, max),
                });
                refetchRoundTripDebounced();
              }}
              {...slider}
            />
          ))}
        </CollapsibleSection>
      </div>
      <GeneralSettings showAlternates={false} />
      <SettingsFooter />
      {results.data && (
        <div>
          <h3 className="font-bold mb-2">Round Trip</h3>
          <RouteCard
            data={results.data}
            index={0}
            isActive
            onSelect={() => {}}
            title="Round Trip"
            exportFileName="valhalla-round-trip"
          />
        </div>
      )}
    </>
  );
};
