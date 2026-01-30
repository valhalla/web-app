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
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  X,
  Copy,
  RotateCcw,
  Languages,
  SlidersHorizontal,
  Settings2,
} from 'lucide-react';
import { useParams, useSearch } from '@tanstack/react-router';
import { useDirectionsQuery } from '@/hooks/use-directions-queries';
import { useIsochronesQuery } from '@/hooks/use-isochrones-queries';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { ServerSettings } from '@/components/settings-panel/server-settings';
import { MultiSelectSetting } from '../ui/multiselect-setting';

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

  const [languageSettingsOpen, setLanguageSettingsOpen] = useState(true);
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(true);
  const [generalSettingsOpen, setGeneralSettingsOpen] = useState(true);

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
        className="w-[350px] sm:max-w-[unset] max-h-screen overflow-y-scroll"
      >
        <SheetHeader className="justify-between">
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription className="sr-only">
            Settings for the current profile
          </SheetDescription>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSettings}
            data-testid="close-settings-button"
          >
            <X className="size-4" />
          </Button>
        </SheetHeader>
        <div className="px-3 space-y-3">
          <ServerSettings />

          {activeTab === 'directions' && (
            <CollapsibleSection
              title="Directions Language"
              icon={Languages}
              open={languageSettingsOpen}
              onOpenChange={setLanguageSettingsOpen}
            >
              <SelectSetting
                id="directions-language"
                label="Language"
                description="The language used for turn-by-turn navigation instructions"
                placeholder="Select Language"
                value={language}
                options={[...languageOptions]}
                onValueChange={handleLanguageChange}
              />
            </CollapsibleSection>
          )}

          {hasProfileSettings && (
            <CollapsibleSection
              title="Profile Settings"
              icon={SlidersHorizontal}
              subtitle={`(${profile})`}
              open={profileSettingsOpen}
              onOpenChange={setProfileSettingsOpen}
            >
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
                {profileSettings[profile as ProfileWithSettings].list.map(
                  (option, key) => (
                    <MultiSelectSetting
                      key={key}
                      id={option.param}
                      label={option.name}
                      description={option.description}
                      value={
                        (settings[option.param] as string[]) ?? ['current']
                      }
                      options={option.options}
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
            </CollapsibleSection>
          )}

          <CollapsibleSection
            title="General Settings"
            icon={Settings2}
            open={generalSettingsOpen}
            onOpenChange={setGeneralSettingsOpen}
          >
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
          </CollapsibleSection>

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
      </SheetContent>
    </Sheet>
  );
};
