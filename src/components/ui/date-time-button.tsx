import { useState } from 'react';
import { format, parseISO, isValid, isToday } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export interface DateTimeButtonProps {
  type: number;
  value: string;
  onChange: (field: 'type' | 'value', value: string) => void;
}

const TYPE_LABELS: Record<number, string> = {
  [-1]: 'Non-specific time',
  0: 'Leave now',
  1: 'Depart at',
  2: 'Arrive at',
};

const TYPE_PREFIX: Record<number, string> = {
  0: 'Now',
  1: 'Dep',
  2: 'Arr',
};

const formatTriggerLabel = (type: number, value: string): string | null => {
  if (type === -1) return null;
  if (type === 0) return 'Now';
  const date = parseISO(value);
  if (!isValid(date)) return TYPE_PREFIX[type] ?? '';
  // Drop the date when it's today; keep it short and avoid wrapping.
  const stamp = isToday(date)
    ? format(date, 'HH:mm')
    : format(date, 'd MMM HH:mm');
  return `${TYPE_PREFIX[type]} ${stamp}`;
};

const toLocalDateTimeString = (date: Date): string =>
  format(date, "yyyy-MM-dd'T'HH:mm");

export const DateTimeButton = ({
  type,
  value,
  onChange,
}: DateTimeButtonProps) => {
  const [open, setOpen] = useState(false);
  const triggerLabel = formatTriggerLabel(type, value);
  const tooltipText = `When to travel: ${triggerLabel ?? TYPE_LABELS[-1]}`;

  const parsedDate = parseISO(value);
  const selectedDate = isValid(parsedDate) ? parsedDate : new Date();
  const timeValue = isValid(parsedDate) ? format(parsedDate, 'HH:mm') : '00:00';

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const [hh, mm] = timeValue.split(':');
    const next = new Date(date);
    next.setHours(Number(hh ?? 0));
    next.setMinutes(Number(mm ?? 0));
    onChange('value', toLocalDateTimeString(next));
  };

  const handleTimeChange = (newTime: string) => {
    const [hh, mm] = newTime.split(':');
    const next = new Date(selectedDate);
    next.setHours(Number(hh ?? 0));
    next.setMinutes(Number(mm ?? 0));
    onChange('value', toLocalDateTimeString(next));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip open={open ? false : undefined}>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-9 gap-1.5 px-2.5"
                aria-label={`Travel time: ${triggerLabel ?? TYPE_LABELS[-1]}`}
                data-testid="date-time-button"
              >
                <Clock className="size-5" />
                {triggerLabel && (
                  <span className="text-xs">{triggerLabel}</span>
                )}
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
          </span>
        </TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
      <PopoverContent side="top" align="start" className="w-auto p-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date-time-button-type">When to travel?</Label>
            <Select
              value={type.toString()}
              onValueChange={(next) => onChange('type', next)}
            >
              <SelectTrigger id="date-time-button-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-1">Non-specific time</SelectItem>
                <SelectItem value="0">Leave now</SelectItem>
                <SelectItem value="1">Depart at</SelectItem>
                <SelectItem value="2">Arrive at</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type > 0 && (
            <>
              <div className="flex items-center gap-2">
                <CalendarIcon className="size-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={timeValue}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="flex-1"
                />
              </div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                captionLayout="dropdown"
                className="border rounded-md"
              />
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
