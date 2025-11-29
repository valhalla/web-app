import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { CircleIconWithTooltip } from './circle-icon';
import type { VariantProps } from 'class-variance-authority';
import { circleIconVariants } from './circle-icon';
import { cn } from '@/lib/utils';

interface RouteAttribute {
  icon: LucideIcon;
  label: string;
  flag?: boolean;
}

interface RouteAttributesProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Pick<VariantProps<typeof circleIconVariants>, 'variant' | 'size'> {
  attributes: RouteAttribute[];
}

export const RouteAttributes = React.forwardRef<
  HTMLDivElement,
  RouteAttributesProps
>(({ attributes, variant, size, className, ...props }, ref) => {
  // Filter out attributes where flag is not truthy
  const visibleAttributes = attributes.filter((attr) => Boolean(attr.flag));

  if (visibleAttributes.length === 0) {
    return null;
  }

  return (
    <div ref={ref} className={cn('flex gap-2', className)} {...props}>
      {visibleAttributes.map(({ label, icon }) => (
        <CircleIconWithTooltip
          key={label}
          icon={icon}
          label={label}
          variant={variant}
          size={size}
        />
      ))}
    </div>
  );
});

RouteAttributes.displayName = 'RouteAttributes';
