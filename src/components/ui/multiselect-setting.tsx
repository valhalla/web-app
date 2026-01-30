import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { AccessibleIcon } from '@radix-ui/react-accessible-icon';
import { HelpCircle } from 'lucide-react';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from './combobox';

interface SelectSettingProps {
  id: string;
  label: string;
  description: string;
  value: string[];
  options: string[];
  onValueChange: (values: string[]) => void;
}

export const MultiSelectSetting = ({
  id,
  label,
  description,
  value,
  options,
  onValueChange,
}: SelectSettingProps) => {
  return (
    <div className="flex flex-col gap-1 py-1">
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
      <Combobox
        value={value}
        items={options}
        multiple
        onValueChange={onValueChange}
      >
        <ComboboxChips>
          <ComboboxValue>
            {value.map((item) => (
              <ComboboxChip key={item}>{item}</ComboboxChip>
            ))}
          </ComboboxValue>
          <ComboboxChipsInput placeholder="" />
        </ComboboxChips>
        <ComboboxContent>
          <ComboboxEmpty>No items found.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
};
