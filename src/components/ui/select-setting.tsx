import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { AccessibleIcon } from '@radix-ui/react-accessible-icon';
import { HelpCircle } from 'lucide-react';

interface SelectOption {
  key: string;
  text: string;
  value: string;
}

interface SelectSettingProps {
  id: string;
  label: string;
  description: string;
  placeholder?: string;
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
}

export const SelectSetting = ({
  id,
  label,
  description,
  placeholder = 'Select an option',
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
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.key} value={option.value}>
              {option.text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
