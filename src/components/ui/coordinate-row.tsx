import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { CopyButton } from '@/components/ui/copy-button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface CoordinateRowProps {
  /** Tooltip content describing the label */
  label: string;
  /** Display value/label shown */
  value: string;
  /** Text to copy to clipboard. If omitted, no copy button is shown */
  copyText?: string;
  /** Optional icon to show before the value */
  icon?: ReactNode;
  /** Shows loading spinner */
  isLoading?: boolean;
  /** Disables the copy button */
  copyDisabled?: boolean;
  /** Base test ID. Generates `${testId}-button` and `${testId}-copy-button` */
  testId?: string;
}

function CoordinateRow({
  label,
  value,
  copyText,
  icon,
  isLoading,
  copyDisabled,
  testId,
}: CoordinateRowProps) {
  return (
    <div
      className={cn(
        'flex items-center border rounded-lg gap-1.5',
        copyText ? 'justify-between' : 'self-start'
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="flex items-center gap-1.5 px-2 py-1"
            data-testid={testId ? `${testId}-button` : undefined}
          >
            {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : icon}
            {value}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">{label}</TooltipContent>
      </Tooltip>
      {copyText && (
        <CopyButton
          variant="ghost"
          value={copyText}
          disabled={copyDisabled}
          data-testid={testId ? `${testId}-copy-button` : undefined}
        />
      )}
    </div>
  );
}

export { CoordinateRow, type CoordinateRowProps };
