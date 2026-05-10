import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface IconEnumOption {
  value: string;
  label: string;
  renderIcon: () => ReactNode;
}

interface IconEnumButtonProps {
  id?: string;
  label: string;
  value: string;
  options: IconEnumOption[];
  onValueChange: (value: string) => void;
}

export const IconEnumButton = ({
  id,
  label,
  value,
  options,
  onValueChange,
}: IconEnumButtonProps) => {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value) ?? options[0];
  const currentLabel = current?.label ?? '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip open={open ? false : undefined}>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <PopoverTrigger asChild>
              <Button
                id={id}
                type="button"
                variant="outline"
                className="h-9 gap-1.5 px-2.5"
                aria-label={`${label}: ${currentLabel}`}
              >
                {current?.renderIcon()}
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {label}: {currentLabel}
        </TooltipContent>
      </Tooltip>
      <PopoverContent side="top" align="center" className="w-auto p-1">
        <ToggleGroup
          type="single"
          variant="outline"
          value={value}
          onValueChange={(next: string) => {
            if (next && next !== value) {
              onValueChange(next);
            }
            setOpen(false);
          }}
        >
          {options.map((option) => (
            <Tooltip key={option.value}>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value={option.value}
                  aria-label={option.label}
                  data-state={option.value === value ? 'on' : 'off'}
                >
                  {option.renderIcon()}
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                {label}: {option.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </ToggleGroup>
      </PopoverContent>
    </Popover>
  );
};
