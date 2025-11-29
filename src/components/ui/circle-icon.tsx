import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { AccessibleIcon } from '@radix-ui/react-accessible-icon';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const circleIconVariants = cva(
  'rounded-full flex items-center justify-center shrink-0 transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 dark:bg-gray-800 text-foreground',
        primary:
          'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary',
        secondary:
          'bg-secondary text-secondary-foreground dark:bg-secondary/80',
        destructive:
          'bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive',
        success:
          'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
        warning:
          'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
        info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        outline:
          'border-1 border-input bg-background text-foreground dark:border-input',
        'outline-primary':
          'border-1 border-primary bg-background text-primary dark:border-primary',
        'outline-destructive':
          'border-1 border-destructive bg-background text-destructive dark:border-destructive',
        ghost: 'bg-transparent text-muted-foreground hover:bg-accent',
        muted: 'bg-muted text-muted-foreground dark:bg-muted/80',
      },
      size: {
        sm: 'size-5 [&_svg]:size-3',
        default: 'size-6 [&_svg]:size-4',
        lg: 'size-8 [&_svg]:size-5',
        xl: 'size-10 [&_svg]:size-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface CircleIconProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof circleIconVariants> {
  icon: LucideIcon;
  label: string;
}

const CircleIcon = React.forwardRef<HTMLDivElement, CircleIconProps>(
  ({ className, variant, size, icon: Icon, label, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(circleIconVariants({ variant, size, className }))}
        {...props}
      >
        <AccessibleIcon label={label}>
          <Icon />
        </AccessibleIcon>
      </div>
    );
  }
);

CircleIcon.displayName = 'CircleIcon';

// Reusable circle icon with tooltip (for route attributes)
interface CircleIconWithTooltipProps extends CircleIconProps {
  tooltipContent?: React.ReactNode;
}

const CircleIconWithTooltip = React.forwardRef<
  HTMLDivElement,
  CircleIconWithTooltipProps
>(({ tooltipContent, label, ...props }, ref) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <CircleIcon ref={ref} label={label} {...props} />
    </TooltipTrigger>
    <TooltipContent>{tooltipContent || <p>{label}</p>}</TooltipContent>
  </Tooltip>
));

CircleIconWithTooltip.displayName = 'CircleIconWithTooltip';

export { CircleIcon, CircleIconWithTooltip, circleIconVariants };
