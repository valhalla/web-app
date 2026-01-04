import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  profileSettings,
  generalSettings,
  languageOptions,
  type DirectionsLanguage,
} from './settings-options';
import { filterProfileSettings } from '@/utils/filter-profile-settings';
import {
  getDirectionsLanguage,
  setDirectionsLanguage,
} from '@/utils/directions-language';
import type { PossibleSettings } from '@/components/types';

import { SliderSetting } from '@/components/ui/slider-setting';
import { CheckboxSetting } from '@/components/ui/checkbox-setting';
import { SelectSetting } from '@/components/ui/select-setting';
import { useCommonStore, type Profile } from '@/stores/common-store';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { X, Copy, RotateCcw } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useParams, useSearch } from '@tanstack/react-router';
import { useDirectionsQuery } from '@/hooks/use-directions-queries';
import { useIsochronesQuery } from '@/hooks/use-isochrones-queries';

// Define the profile keys that have settings (excluding 'auto')
type ProfileWithSettings = Exclude<Profile, 'auto'>;

export const SettingsPanel = () => {
  const { profile } = useSearch({ from: '/$activeTab' });
  const { activeTab } = useParams({ from: '/$activeTab' });
  const settings = useCommonStore((state) => state.settings);
  const settingsPanelOpen = useCommonStore((state) => state.settingsPanelOpen);
  const updateSettings = useCommonStore((state) => state.updateSettings);
  const resetSettings = useCommonStore((state) => state.resetSettings);
  const toggleSettings = useCommonStore((state) => state.toggleSettings);
  const [copied, setCopied] = useState(false);
  const { refetch: refetchDirections } = useDirectionsQuery();
  const { refetch: refetchIsochrones } = useIsochronesQuery();

  const [language, setLanguage] = useState<DirectionsLanguage>(() =>
    getDirectionsLanguage()
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

  const handleMakeRequest = useCallback(() => {
    if (activeTab === 'directions') {
      refetchDirections();
    } else {
      refetchIsochrones();
    }
  }, [activeTab, refetchDirections, refetchIsochrones]);

  const handleUpdateSettings = useCallback(
    ({
      name,
      value,
    }: {
      name: keyof PossibleSettings;
      value: PossibleSettings[keyof PossibleSettings];
    }) => {
      updateSettings(name, value);

      if (activeTab === 'directions') {
        refetchDirections();
      } else {
        refetchIsochrones();
      }
    },
    [activeTab, updateSettings, refetchDirections, refetchIsochrones]
  );

  const handleCopySettings = useCallback(async () => {
    const text = JSON.stringify(
      filterProfileSettings(profile as ProfileWithSettings, settings)
    );
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  }, [profile, settings]);

  const resetConfigSettings = useCallback(() => {
    resetSettings(profile || 'bicycle');
    if (activeTab === 'directions') {
      refetchDirections();
    } else {
      refetchIsochrones();
    }
  }, [activeTab, profile, resetSettings, refetchDirections, refetchIsochrones]);

  const hasProfileSettings =
    profileSettings[profile as ProfileWithSettings].boolean.length > 0;

  return (
    <Sheet open={settingsPanelOpen} modal={false}>
      <SheetContent
        side="right"
        className="w-[350px] sm:max-w-[unset] max-h-screen overflow-y-auto gap-1"
      >
        <SheetHeader className="justify-between">
          <SheetTitle>Settings</SheetTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSettings}
            data-testid="close-settings-button"
          >
            <X className="size-4" />
          </Button>
        </SheetHeader>
        <div className="px-3">
          <div className="flex flex-col gap-3 border rounded-md p-2 px-3 mb-3">
            {activeTab === 'directions' && (
              <>
                <section>
                  <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-1">
                    Directions Language
                  </h3>
                  <SelectSetting
                    id="directions-language"
                    label="Language"
                    description="The language used for turn-by-turn navigation instructions"
                    placeholder="Select Language"
                    value={language}
                    options={[...languageOptions]}
                    onValueChange={handleLanguageChange}
                  />
                </section>
                <Separator />
              </>
            )}

            {hasProfileSettings && (
              <section>
                <div className="flex items-baseline justify-between">
                  <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Profile Settings
                  </h3>
                  <span className="text-xs text-muted-foreground capitalize">
                    {profile}
                  </span>
                </div>
                <div className="space-y-1.25">
                  {profileSettings[profile as ProfileWithSettings].numeric.map(
                    (option, key) => (
                      <SliderSetting
                        key={key}
                        id={option.param}
                        label={option.name}
                        description={option.description}
                        min={option.settings.min}
                        max={option.settings.max}
                        step={option.settings.step}
                        value={(settings[option.param] as number) ?? 0}
                        unit={option.unit}
                        onValueChange={(values) => {
                          updateSettings(option.param, values[0] ?? 0);
                        }}
                        onValueCommit={handleMakeRequest}
                        onInputChange={(values) => {
                          let value = values[0] ?? 0;
                          if (isNaN(value)) value = option.settings.min;
                          value = Math.max(
                            option.settings.min,
                            Math.min(value, option.settings.max)
                          );
                          handleUpdateSettings({
                            name: option.param,
                            value,
                          });
                        }}
                      />
                    )
                  )}
                  {profileSettings[profile as ProfileWithSettings].boolean.map(
                    (option, key) => (
                      <CheckboxSetting
                        key={key}
                        id={option.param}
                        label={option.name}
                        description={option.description}
                        checked={Boolean(settings[option.param])}
                        onCheckedChange={(checked) => {
                          handleUpdateSettings({
                            name: option.param,
                            value: checked,
                          });
                        }}
                      />
                    )
                  )}
                  {profileSettings[profile as ProfileWithSettings].enum.map(
                    (option, key) => (
                      <SelectSetting
                        key={key}
                        id={option.param}
                        label={option.name}
                        description={option.description}
                        placeholder="Select Bicycle Type"
                        value={settings.bicycle_type as string}
                        options={option.enums}
                        onValueChange={(value) => {
                          handleUpdateSettings({
                            name: option.param,
                            value,
                          });
                        }}
                      />
                    )
                  )}
                </div>
              </section>
            )}

            <Separator />

            <section>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  General Settings
                </h3>
              </div>
              <div className="space-y-1.25">
                {generalSettings[profile as ProfileWithSettings].numeric.map(
                  (option, key) => (
                    <SliderSetting
                      key={key}
                      id={option.param}
                      label={option.name}
                      description={option.description}
                      min={option.settings.min}
                      max={option.settings.max}
                      step={option.settings.step}
                      value={(settings[option.param] as number) ?? 0}
                      unit={option.unit}
                      onValueChange={(values) => {
                        updateSettings(option.param, values[0] ?? 0);
                      }}
                      onValueCommit={handleMakeRequest}
                      onInputChange={(values) => {
                        let value = values[0] ?? 0;
                        if (isNaN(value)) value = option.settings.min;
                        value = Math.max(
                          option.settings.min,
                          Math.min(value, option.settings.max)
                        );
                        handleUpdateSettings({
                          name: option.param,
                          value,
                        });
                      }}
                    />
                  )
                )}
                {generalSettings[profile as ProfileWithSettings].boolean.map(
                  (option, key) => (
                    <CheckboxSetting
                      key={key}
                      id={option.param}
                      label={option.name}
                      description={option.description}
                      checked={Boolean(settings[option.param])}
                      onCheckedChange={(checked) => {
                        handleUpdateSettings({
                          name: option.param,
                          value: checked,
                        });
                      }}
                    />
                  )
                )}
                {generalSettings.all.boolean.map((option, key) => (
                  <CheckboxSetting
                    key={key}
                    id={option.param}
                    label={option.name}
                    description={option.description}
                    checked={Boolean(settings[option.param])}
                    onCheckedChange={(checked) => {
                      handleUpdateSettings({
                        name: option.param,
                        value: checked,
                      });
                    }}
                  />
                ))}
                {generalSettings.all.numeric.map((option, key) => (
                  <SliderSetting
                    key={key}
                    id={option.param}
                    label={option.name}
                    description={option.description}
                    min={option.settings.min}
                    max={option.settings.max}
                    step={option.settings.step}
                    value={(settings[option.param] as number) ?? 0}
                    unit={option.unit}
                    onValueChange={(values) => {
                      updateSettings(option.param, values[0] ?? 0);
                    }}
                    onValueCommit={handleMakeRequest}
                    onInputChange={(values) => {
                      let value = values[0] ?? 0;
                      if (isNaN(value)) value = option.settings.min;
                      value = Math.max(
                        option.settings.min,
                        Math.min(value, option.settings.max)
                      );
                      handleUpdateSettings({
                        name: option.param,
                        value,
                      });
                    }}
                  />
                ))}
              </div>
            </section>

            <Separator />

            <div className="flex gap-2 pt-1">
              <Button
                variant={copied ? 'default' : 'outline'}
                size="sm"
                onClick={handleCopySettings}
                className={copied ? 'bg-green-600 hover:bg-green-600' : ''}
              >
                <Copy className="size-3.5" />
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </Button>
              <Button variant="outline" size="sm" onClick={resetConfigSettings}>
                <RotateCcw className="size-3.5" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
