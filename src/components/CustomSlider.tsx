import { Fragment, useState, useEffect } from 'react';
import { Form, Label, Popup, Icon } from 'semantic-ui-react';
import { Slider } from '@mui/material';
import { type debounce } from 'throttle-debounce';
import {
  settingsInit,
  settingsInitTruckOverride,
} from '@/Controls/settings-options';
import type { RootState } from '@/store';
import type { Profile } from '@/reducers/common';

interface CustomSliderProps {
  settings: RootState['common']['settings'];
  option: {
    param: string;
    settings: {
      min: number;
      max: number;
      step: number;
    };
    unit: string;
  };
  profile: Omit<Profile, 'auto'>;
  handleUpdateSettings: debounce<
    ({ name, value }: { name: string; value: number }) => void
  >;
}

const CustomSlider = ({
  settings,
  option,
  profile,
  handleUpdateSettings,
}: CustomSliderProps) => {
  const { min, max, step } = option.settings;
  const [sliderVal, setSliderVal] = useState(
    parseFloat(String(settings[option.param] ?? 0))
  );

  useEffect(() => {
    setSliderVal(parseFloat(String(settings[option.param] ?? 0)));
  }, [settings, option.param]);

  // todo: in here, handle change can be undefined, number and string in same time.
  // we should come up with better type instead of any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (value?: any) => {
    // reset

    if (isNaN(value)) {
      value =
        profile === 'truck'
          ? (settingsInitTruckOverride as Record<string, unknown>)[option.param]
          : (settingsInit as Record<string, unknown>)[option.param];
    }
    if (value < min) {
      value = min;
    } else if (value > max) {
      value = max;
    }

    setSliderVal(parseFloat(value));
    handleUpdateSettings({
      name: option.param,

      value: parseFloat(value),
    });
  };

  return (
    <Fragment>
      <Form.Group inline>
        <Popup
          content="Reset Value"
          size="tiny"
          trigger={
            <Icon name="repeat" size="small" onClick={() => handleChange()} />
          }
        />
        <Form.Input
          width={16}
          size="small"
          type="number"
          step="any"
          value={sliderVal}
          placeholder="Enter Value"
          name={option.param}
          onChange={(e) => handleChange((e.target as HTMLInputElement).value)}
        />
        <Popup
          content="Units"
          size="tiny"
          trigger={
            <Label basic size="small" style={{ cursor: 'default' }}>
              {option.unit}
            </Label>
          }
        />
      </Form.Group>
      <div>
        <Slider
          min={min}
          size="small"
          max={max}
          step={step}
          value={sliderVal}
          color="secondary"
          aria-label="Default"
          valueLabelDisplay="auto"
          onChange={(e) => {
            handleChange((e.target as HTMLInputElement).value);
          }}
        />
      </div>
    </Fragment>
  );
};

export default CustomSlider;
