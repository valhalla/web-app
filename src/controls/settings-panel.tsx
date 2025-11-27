import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { debounce } from 'throttle-debounce';
import { Button } from '@/components/ui/button';
import { profile_settings, settings_general } from './settings-options';
import {
  updateSettings,
  doShowSettings,
  filterProfileSettings,
  resetSettings,
} from '@/actions/common-actions';

import { SliderSetting } from '@/components/ui/slider-setting';
import { CheckboxSetting } from '@/components/ui/checkbox-setting';
import { SelectSetting } from '@/components/ui/select-setting';
import { makeRequest } from '@/actions/directions-actions';
import { makeIsochronesRequest } from '@/actions/isochrones-actions';
import type { AppDispatch, RootState } from '@/store';
import type { Profile } from '@/reducers/common';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { X, Copy, RotateCcw } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// Define the profile keys that have settings (excluding 'auto')
type ProfileWithSettings = Exclude<Profile, 'auto'>;

export const SettingsPanel = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { profile, settings, activeTab, showSettings } = useSelector(
    (state: RootState) => state.common
  );
  const [copied, setCopied] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleUpdateSettings = useCallback(
    debounce(0, ({ name, value }) => {
      dispatch(
        updateSettings({
          name,
          value,
        })
      );
    }),
    [dispatch]
  );

  useEffect(() => {
    if (activeTab === 'directions') {
      dispatch(makeRequest());
    } else {
      dispatch(makeIsochronesRequest());
    }
  }, [settings, activeTab, dispatch]);

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
    dispatch(resetSettings());
  }, [dispatch]);

  const hasProfileSettings =
    profile_settings[profile as ProfileWithSettings].boolean.length > 0;

  return (
    <Sheet open={showSettings} modal={false}>
      <SheetContent
        side="right"
        className="w-[350px] sm:max-w-[unset] max-h-screen overflow-y-auto gap-1"
      >
        <SheetHeader className="justify-between">
          <SheetTitle>Settings</SheetTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => dispatch(doShowSettings())}
            data-testid="close-settings-button"
          >
            <X className="size-4" />
          </Button>
        </SheetHeader>
        <div className="px-3">
          <div className="flex flex-col gap-3 border rounded-md p-2 px-3">
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
                  {profile_settings[profile as ProfileWithSettings].numeric.map(
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
                          handleUpdateSettings({
                            name: option.param,
                            value: values[0],
                          });
                        }}
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
                  {profile_settings[profile as ProfileWithSettings].boolean.map(
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
                  {profile_settings[profile as ProfileWithSettings].enum.map(
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
                {settings_general[profile as ProfileWithSettings].numeric.map(
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
                        handleUpdateSettings({
                          name: option.param,
                          value: values[0],
                        });
                      }}
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
                {settings_general[profile as ProfileWithSettings].boolean.map(
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
                {settings_general.all.boolean.map((option, key) => (
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
                {settings_general.all.numeric.map((option, key) => (
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
                      handleUpdateSettings({
                        name: option.param,
                        value: values[0],
                      });
                    }}
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
