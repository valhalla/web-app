import { Settings2 } from 'lucide-react';
import { Button } from './ui/button';
import { useCommonStore } from '@/stores/common-store';

interface SettingsButtonProps {
  className?: string;
}

export const SettingsButton = ({ className }: SettingsButtonProps) => {
  const toggleSettings = useCommonStore((state) => state.toggleSettings);

  return (
    <Button
      data-testid="show-hide-settings-btn"
      variant="outline"
      onClick={toggleSettings}
      className={className ?? 'w-full'}
    >
      <Settings2 className="size-4" />
      Advanced settings
    </Button>
  );
};
