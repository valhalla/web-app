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
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className={`border rounded-md p-2 px-3 ${className || ''}`}
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="size-4 text-muted-foreground" />}
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {title}
          </h3>
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
      <CollapsibleContent className="pt-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}
