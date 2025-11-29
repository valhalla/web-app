import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { CopyButton } from '@/components/ui/copy-button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CoordinateRowProps {
  /** Tooltip content describing the button */
  label: string;
  /** Display value/label shown in the button */
  value: string;
  /** Text to copy to clipboard. If omitted, no copy button is shown */
  copyText?: string;
  /** Optional icon to show before the value */
  icon?: ReactNode;
  /** Click handler for the main button */
  onClick?: () => void;
  /** Shows loading spinner and disables button */
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
  onClick,
  isLoading,
  copyDisabled,
  testId,
}: CoordinateRowProps) {
  return (
    <ButtonGroup>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={onClick}
            disabled={isLoading}
            className="gap-1.5"
            data-testid={testId ? `${testId}-button` : undefined}
          >
            {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : icon}
            {value}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{label}</TooltipContent>
      </Tooltip>
      {copyText && (
        <CopyButton
          value={copyText}
          disabled={copyDisabled}
          data-testid={testId ? `${testId}-copy-button` : undefined}
        />
      )}
    </ButtonGroup>
  );
}

export { CoordinateRow, type CoordinateRowProps };
