import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  icon?: LucideIcon;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  subtitle?: string;
  className?: string;
}

export function CollapsibleSection({
  title,
  icon: Icon,
  open,
  onOpenChange,
  children,
  subtitle,
  className,
}: CollapsibleSectionProps) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className={className}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-1">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="size-4" />}
          <h3 className="text-sm font-medium">{title}</h3>
          {subtitle && (
            <span className="text-xs text-muted-foreground capitalize">
              {subtitle}
            </span>
          )}
        </div>
        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}
