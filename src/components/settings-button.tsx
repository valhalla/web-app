import { Settings2 } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useCommonStore } from '@/stores/common-store';

interface SettingsButtonProps {
  className?: string;
}

export const SettingsButton = ({ className }: SettingsButtonProps) => {
  const toggleSettings = useCommonStore((state) => state.toggleSettings);

  return (
    <Button
      data-testid="show-hide-settings-btn"
      variant="default"
      onClick={toggleSettings}
      className={cn(
        'w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900',
        className
      )}
    >
      <Settings2 className="size-4" />
      Advanced settings
    </Button>
  );
};
