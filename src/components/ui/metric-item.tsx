import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CircleIcon,
  type circleIconVariants,
} from '@/components/ui/circle-icon';
import type { VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

interface MetricItemProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Pick<VariantProps<typeof circleIconVariants>, 'variant' | 'size'> {
  icon: LucideIcon;
  label: string;
  value: string;
  tooltipContent?: React.ReactNode;
  valueClassName?: string;
}

const MetricItem = React.forwardRef<HTMLDivElement, MetricItemProps>(
  (
    {
      className,
      icon,
      label,
      value,
      variant,
      size,
      tooltipContent,
      valueClassName,
      ...props
    },
    ref
  ) => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={ref}
            className={cn('flex items-center gap-2', className)}
            {...props}
          >
            <CircleIcon
              icon={icon}
              label={label}
              variant={variant}
              size={size}
            />
            <span className={cn('text-sm', valueClassName)}>{value}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>{tooltipContent || <p>{label}</p>}</TooltipContent>
      </Tooltip>
    );
  }
);

MetricItem.displayName = 'MetricItem';

export { MetricItem };
