import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from './ui/label';

export interface DateTimePickerProps {
  type: number;
  value: string;
  onChange: (field: 'type' | 'value', value: string) => void;
}

export const DateTimePicker = ({
  type,
  value,
  onChange,
}: DateTimePickerProps) => {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="date-time-picker-value">When to travel?</Label>
      <div className="flex gap-3">
        <Select
          value={type.toString()}
          onValueChange={(value) => onChange('type', value)}
        >
          <SelectTrigger id="date-time-picker-type">
            <SelectValue placeholder="When to travel?" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Time</SelectLabel>
              <SelectItem value="-1">Non-specific time</SelectItem>
              <SelectItem value="0">Leave now</SelectItem>
              <SelectItem value="1">Depart at</SelectItem>
              <SelectItem value="2">Arrive at</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Input
          id="date-time-picker-value"
          data-testid="date-time-picker"
          type="datetime-local"
          value={value}
          onChange={(e) => onChange('value', e.target.value)}
          disabled={type < 0}
        />
      </div>
    </div>
  );
};
