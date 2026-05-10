import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
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
  settingsInit,
  HIGHWAY_TOLL_PROFILES,
  DEFAULT_DIRECTIONS_LANGUAGE,
  type DirectionsLanguage,
} from '@/components/settings-panel/settings-options';
import {
  getDirectionsLanguage,
  setDirectionsLanguage,
} from '@/utils/directions-language';
import { useDirectionsQuery } from '@/hooks/use-directions-queries';
import { useIsochronesQuery } from '@/hooks/use-isochrones-queries';
import type { PossibleSettings } from '@/components/types';

type IconState = 'no' | 'yes' | 'preferred';

const StateIcon = ({ Base, state }: { Base: LucideIcon; state: IconState }) => (
  <span className="relative inline-block size-5 shrink-0">
    <Base
      className={cn('size-5', state === 'no' && 'text-muted-foreground/60')}
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

const HIGHWAY_OPTIONS = tristateOptions(Milestone);
const TOLL_OPTIONS = tristateOptions(DollarSign);
const FERRY_OPTIONS = tristateOptions(Ship);

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
  const search = useSearch({ from: '/$activeTab' });
  const navigate = useNavigate({ from: '/$activeTab' });
  const { profile } = search;
  const settings = useCommonStore((state) => state.settings);
  const updateSettings = useCommonStore((state) => state.updateSettings);
  const dateTime = useCommonStore((state) => state.dateTime);
  const updateDateTime = useCommonStore((state) => state.updateDateTime);
  const { refetch: refetchDirections } = useDirectionsQuery();
  const { refetch: refetchIsochrones } = useIsochronesQuery();

  const [open, setOpen] = useState(true);
  const [language, setLanguage] = useState<DirectionsLanguage>(() => {
    // URL wins on first render; otherwise localStorage / system locale.
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href).searchParams.get('lang');
      if (url && languageOptions.some((opt) => opt.value === url)) {
        return url as DirectionsLanguage;
      }
    }
    return getDirectionsLanguage();
  });

  const supportsHighwayToll = profile
    ? (HIGHWAY_TOLL_PROFILES as readonly string[]).includes(profile)
    : false;

  // Hydrate store from URL on mount (URL wins when present).
  const urlSettingsHydrated = useRef(false);
  useEffect(() => {
    if (urlSettingsHydrated.current) return;
    urlSettingsHydrated.current = true;

    if (search.use_ferry !== undefined) {
      updateSettings('use_ferry', search.use_ferry);
    }
    if (search.use_highways !== undefined) {
      updateSettings('use_highways', search.use_highways);
    }
    if (search.use_tolls !== undefined) {
      updateSettings('use_tolls', search.use_tolls);
    }
    if (search.alternates !== undefined) {
      updateSettings('alternates', search.alternates);
    }
    if (search.lang) {
      setDirectionsLanguage(search.lang as DirectionsLanguage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mirror store → URL (omit values at default to keep URLs clean).
  useEffect(() => {
    navigate({
      search: (prev) => ({
        ...prev,
        use_ferry:
          settings.use_ferry === settingsInit.use_ferry
            ? undefined
            : (settings.use_ferry as number),
        use_highways:
          settings.use_highways === settingsInit.use_highways
            ? undefined
            : (settings.use_highways as number),
        use_tolls:
          settings.use_tolls === settingsInit.use_tolls
            ? undefined
            : (settings.use_tolls as number),
        alternates:
          settings.alternates === settingsInit.alternates
            ? undefined
            : (settings.alternates as number),
        lang: language === DEFAULT_DIRECTIONS_LANGUAGE ? undefined : language,
      }),
      replace: true,
    });
  }, [
    settings.use_ferry,
    settings.use_highways,
    settings.use_tolls,
    settings.alternates,
    language,
    navigate,
  ]);

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
          <div className="flex flex-wrap items-center gap-2 py-1">
            <IconEnumButton
              id="use_ferry"
              label="Use ferries"
              value={willingnessToOption(settings.use_ferry as number)}
              options={FERRY_OPTIONS}
              onValueChange={(value) =>
                handleSettingChange('use_ferry', optionToWillingness(value))
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
              inline
            />
          )}
        </div>
      </CollapsibleSection>

      <SettingsButton />
    </div>
  );
};
