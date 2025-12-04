import { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { AccessibleIcon } from '@radix-ui/react-accessible-icon';
import { HelpCircle } from 'lucide-react';

interface SliderSettingProps {
  id: string;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit?: string;
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
  onValueChange,
  onValueCommit,
  onInputChange,
}: SliderSettingProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(value));

  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  const inputRefCallback = useCallback((node: HTMLInputElement | null) => {
    if (node) {
      node.focus();
      node.select();
    }
  }, []);

  const parseValue = (val: string): number => {
    return parseFloat(val);
  };

  const handleCommit = () => {
    let parsed = parseValue(inputValue);
    if (isNaN(parsed)) parsed = min;
    parsed = Math.max(min, Math.min(parsed, max));

    if (parsed !== value) {
      onInputChange([parsed]);
      setInputValue(String(parsed));
    }

    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommit();
    } else if (e.key === 'Escape') {
      setInputValue(String(value));
      setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-col gap-1 py-1">
      {/* Header row: Label + help icon ... value + unit */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Label htmlFor={id} className="text-sm font-medium">
            {label}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground/70 hover:text-muted-foreground hover:bg-transparent"
              >
                <AccessibleIcon label={`More info about ${label}`}>
                  <HelpCircle className="size-3.5" />
                </AccessibleIcon>
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-64 p-3">
              <p className="text-xs text-muted-foreground">{description}</p>
            </PopoverContent>
          </Popover>
        </div>

        {isEditing ? (
          <Input
            ref={inputRefCallback}
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={handleKeyDown}
            min={min}
            max={max}
            step={step || 1}
            className="w-20 h-7 px-2 text-right font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-7 px-2 font-normal items-center tabular-nums cursor-text gap-0.75"
          >
            <span className="font-medium">{value}</span>
            {unit && <span className="text-muted-foreground">{unit}</span>}
          </Button>
        )}
      </div>

      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        onValueChange={onValueChange}
        onValueCommit={onValueCommit}
        value={[value]}
      />
    </div>
  );
};
