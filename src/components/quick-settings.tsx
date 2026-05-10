import { useCallback, useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import {
  Star,
  Milestone,
  DollarSign,
  Ship,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { SliderSetting } from '@/components/ui/slider-setting';
import { SelectSetting } from '@/components/ui/select-setting';
import {
  IconEnumButton,
  type IconEnumOption,
} from '@/components/ui/icon-enum-setting';
import { DateTimeButton } from '@/components/ui/date-time-button';
import { SettingsButton } from '@/components/settings-button';
import { cn } from '@/lib/utils';
import { useCommonStore } from '@/stores/common-store';
import {
  languageOptions,
  type DirectionsLanguage,
} from '@/components/settings-panel/settings-options';
import {
  getDirectionsLanguage,
  setDirectionsLanguage,
} from '@/utils/directions-language';
import { useDirectionsQuery } from '@/hooks/use-directions-queries';
import { useIsochronesQuery } from '@/hooks/use-isochrones-queries';
import type { PossibleSettings } from '@/components/types';
import type { Profile } from '@/stores/common-store';

type IconState = 'no' | 'yes' | 'preferred';

const StateIcon = ({ Base, state }: { Base: LucideIcon; state: IconState }) => (
  <span className="relative inline-block size-4 shrink-0">
    <Base
      className={cn('size-4', state === 'no' && 'text-muted-foreground/60')}
    />
    {state === 'no' && (
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <span className="block h-[2px] w-[140%] rotate-45 rounded-full bg-destructive" />
      </span>
    )}
    {state === 'preferred' && (
      <Star
        aria-hidden
        className="absolute -top-1 -right-1 size-2.5 fill-amber-400 text-amber-500"
      />
    )}
  </span>
);

const tristateOptions = (Base: LucideIcon): IconEnumOption[] => [
  {
    value: 'no',
    label: 'No',
    renderIcon: () => <StateIcon Base={Base} state="no" />,
  },
  {
    value: 'yes',
    label: 'Yes',
    renderIcon: () => <StateIcon Base={Base} state="yes" />,
  },
  {
    value: 'preferred',
    label: 'Preferred',
    renderIcon: () => <StateIcon Base={Base} state="preferred" />,
  },
];

const binaryOptions = (Base: LucideIcon): IconEnumOption[] => [
  {
    value: 'no',
    label: 'No',
    renderIcon: () => <StateIcon Base={Base} state="no" />,
  },
  {
    value: 'yes',
    label: 'Yes',
    renderIcon: () => <StateIcon Base={Base} state="yes" />,
  },
];

const HIGHWAY_OPTIONS = tristateOptions(Milestone);
const TOLL_OPTIONS = tristateOptions(DollarSign);
const FERRY_OPTIONS = binaryOptions(Ship);

const willingnessToOption = (value: number): string => {
  if (value <= 0) return 'no';
  if (value >= 1) return 'preferred';
  return 'yes';
};

const optionToWillingness = (option: string): number => {
  if (option === 'no') return 0;
  if (option === 'preferred') return 1;
  return 0.5;
};

const HIGHWAY_TOLL_PROFILES: Profile[] = ['car', 'truck', 'bus', 'motorcycle'];

interface QuickSettingsProps {
  showTravelTime?: boolean;
  showAlternates?: boolean;
  showLanguage?: boolean;
}

export const QuickSettings = ({
  showTravelTime = true,
  showAlternates = true,
  showLanguage = true,
}: QuickSettingsProps) => {
  const { profile } = useSearch({ from: '/$activeTab' });
  const settings = useCommonStore((state) => state.settings);
  const updateSettings = useCommonStore((state) => state.updateSettings);
  const dateTime = useCommonStore((state) => state.dateTime);
  const updateDateTime = useCommonStore((state) => state.updateDateTime);
  const { refetch: refetchDirections } = useDirectionsQuery();
  const { refetch: refetchIsochrones } = useIsochronesQuery();

  const [open, setOpen] = useState(true);
  const [language, setLanguage] = useState<DirectionsLanguage>(() =>
    getDirectionsLanguage()
  );

  const supportsHighwayToll = profile
    ? HIGHWAY_TOLL_PROFILES.includes(profile)
    : false;

  const refetchAll = useCallback(() => {
    refetchDirections();
    refetchIsochrones();
  }, [refetchDirections, refetchIsochrones]);

  const handleSettingChange = useCallback(
    (
      name: keyof PossibleSettings,
      value: PossibleSettings[keyof PossibleSettings]
    ) => {
      updateSettings(name, value);
      refetchAll();
    },
    [updateSettings, refetchAll]
  );

  const handleDateTimeChange = useCallback(
    (field: 'type' | 'value', value: string) => {
      updateDateTime(field, value);
      refetchAll();
    },
    [updateDateTime, refetchAll]
  );

  const handleLanguageChange = useCallback(
    (value: string) => {
      const newLanguage = value as DirectionsLanguage;
      setDirectionsLanguage(newLanguage);
      setLanguage(newLanguage);
      refetchDirections();
    },
    [refetchDirections]
  );

  return (
    <div className="flex flex-col gap-2">
      <CollapsibleSection
        title="General settings"
        icon={Settings}
        open={open}
        onOpenChange={setOpen}
        className="bg-muted/60 rounded-md px-3 py-2"
      >
        <div className="space-y-1.25">
          <div className="flex items-center gap-2 py-1">
            <IconEnumButton
              id="use_ferry"
              label="Use ferries"
              value={(settings.use_ferry as number) > 0 ? 'yes' : 'no'}
              options={FERRY_OPTIONS}
              onValueChange={(value) =>
                handleSettingChange('use_ferry', value === 'yes' ? 0.5 : 0)
              }
            />
            {supportsHighwayToll && (
              <>
                <IconEnumButton
                  id="use_highways"
                  label="Use highways"
                  value={willingnessToOption(settings.use_highways as number)}
                  options={HIGHWAY_OPTIONS}
                  onValueChange={(value) =>
                    handleSettingChange(
                      'use_highways',
                      optionToWillingness(value)
                    )
                  }
                />
                <IconEnumButton
                  id="use_tolls"
                  label="Use tolls"
                  value={willingnessToOption(settings.use_tolls as number)}
                  options={TOLL_OPTIONS}
                  onValueChange={(value) =>
                    handleSettingChange('use_tolls', optionToWillingness(value))
                  }
                />
              </>
            )}
            {showTravelTime && (
              <div className="ml-auto">
                <DateTimeButton
                  type={dateTime.type}
                  value={dateTime.value}
                  onChange={handleDateTimeChange}
                />
              </div>
            )}
          </div>

          {showAlternates && (
            <SliderSetting
              id="alternates"
              label="Alternative routes"
              description="How many alternative routes to request alongside the main route."
              min={0}
              max={5}
              step={1}
              value={(settings.alternates as number) ?? 0}
              unit="routes"
              onValueChange={(values) => {
                updateSettings('alternates', values[0] ?? 0);
              }}
              onValueCommit={() => refetchDirections()}
              onInputChange={(values) => {
                let parsed = values[0] ?? 0;
                if (isNaN(parsed)) parsed = 0;
                parsed = Math.max(0, Math.min(parsed, 5));
                handleSettingChange('alternates', parsed);
              }}
            />
          )}

          {showLanguage && (
            <SelectSetting
              id="directions-language"
              label="Directions language"
              description="The language used for turn-by-turn navigation instructions."
              placeholder="Select language"
              value={language}
              options={[...languageOptions]}
              onValueChange={handleLanguageChange}
            />
          )}
        </div>
      </CollapsibleSection>

      <SettingsButton />
    </div>
  );
};
