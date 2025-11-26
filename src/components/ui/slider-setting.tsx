import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';

interface SliderSettingProps {
  id: string;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit?: string;
  inputType?: 'integer' | 'float';
  onValueChange: (values: number[]) => void;
  onValueCommit?: () => void;
  onInputChange: (values: number[]) => void;
}

export const SliderSetting = ({
  id,
  label,
  description,
  min,
  max,
  step,
  value,
  unit,
  inputType = 'integer',
  onValueChange,
  onValueCommit,
  onInputChange,
}: SliderSettingProps) => {
  const parseValue = (inputValue: string): number => {
    return inputType === 'float'
      ? parseFloat(inputValue)
      : parseInt(inputValue);
  };

  return (
    <div className="flex flex-1 flex-col gap-2 mt-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex gap-2">
        <Slider
          id={id}
          min={min}
          max={max}
          step={step}
          onValueChange={onValueChange}
          onValueCommit={onValueCommit}
          value={[value]}
        />
        <InputGroup className="w-44">
          <InputGroupInput
            max={max}
            min={min}
            onChange={(e) => {
              const parsedValue = parseValue(e.target.value);
              onInputChange([parsedValue]);
            }}
            type="number"
            value={value}
            placeholder="Enter Value"
            step={inputType === 'float' ? step : undefined}
          />
          {unit && (
            <InputGroupAddon align="inline-end">
              <InputGroupText className="text-xs">{unit}</InputGroupText>
            </InputGroupAddon>
          )}
        </InputGroup>
      </div>
    </div>
  );
};
