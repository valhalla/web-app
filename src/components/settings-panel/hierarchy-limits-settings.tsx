import { useState } from 'react';
import { Layers } from 'lucide-react';
import { CheckboxSetting } from '@/components/ui/checkbox-setting';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { SliderSetting } from '@/components/ui/slider-setting';
import { useCommonStore } from '@/stores/common-store';
import type { PossibleSettings } from '@/components/types';
import {
  hierarchyLevelSettings,
  sendHierarchyLimits,
} from './settings-options';

interface HierarchyLimitsSettingsProps {
  onSettingChange: (setting: {
    name: keyof PossibleSettings;
    value: PossibleSettings[keyof PossibleSettings];
  }) => void;
  onSliderCommit: () => void;
}

export const HierarchyLimitsSettings = ({
  onSettingChange,
  onSliderCommit,
}: HierarchyLimitsSettingsProps) => {
  const settings = useCommonStore((state) => state.settings);
  const updateSettings = useCommonStore((state) => state.updateSettings);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <CollapsibleSection
      title="Hierarchy Limits"
      icon={Layers}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <div className="space-y-1.25">
        <CheckboxSetting
          id={sendHierarchyLimits.param}
          label={sendHierarchyLimits.name}
          description={sendHierarchyLimits.description}
          checked={Boolean(settings.use_hierarchy_limits)}
          onCheckedChange={(checked) => {
            onSettingChange({
              name: sendHierarchyLimits.param,
              value: checked,
            });
          }}
        />
        {settings.use_hierarchy_limits &&
          hierarchyLevelSettings.map((level) => (
            <div key={level.title} className="pt-2">
              <h4 className="text-sm font-semibold">{level.title}</h4>
              {level.options.map((option) => (
                <SliderSetting
                  key={option.param}
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
                  onValueCommit={onSliderCommit}
                  onInputChange={(values) => {
                    onSettingChange({
                      name: option.param,
                      value: values[0] ?? 0,
                    });
                  }}
                />
              ))}
            </div>
          ))}
      </div>
    </CollapsibleSection>
  );
};
