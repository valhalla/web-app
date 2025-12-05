import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button, type buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VariantProps } from 'class-variance-authority';

interface CopyButtonProps
  extends
    Omit<React.ComponentProps<'button'>, 'children'>,
    VariantProps<typeof buttonVariants> {
  /** The text to copy to clipboard */
  value: string;
  /** Duration in ms to show the "copied" state. Default: 1500 */
  copiedDuration?: number;
  /** Callback fired after text is copied */
  onCopied?: () => void;
  /** Custom icon size class. Default: "size-3.5" */
  iconClassName?: string;
}

function CopyButton({
  value,
  copiedDuration = 1500,
  onCopied,
  variant = 'outline',
  size = 'icon-sm',
  className,
  iconClassName = 'size-3.5',
  disabled,
  ...props
}: CopyButtonProps) {
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setHasCopied(true);
      onCopied?.();
      setTimeout(() => {
        setHasCopied(false);
      }, copiedDuration);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  }, [value, copiedDuration, onCopied]);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled}
      onClick={handleCopy}
      className={cn(
        'transition-all duration-200',
        hasCopied &&
          'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        className
      )}
      {...props}
    >
      {hasCopied ? (
        <Check className={iconClassName} />
      ) : (
        <Copy className={iconClassName} />
      )}
    </Button>
  );
}

export { CopyButton };
