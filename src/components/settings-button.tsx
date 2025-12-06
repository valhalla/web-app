import { Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useCommonStore } from '@/stores/common-store';

export const SettingsButton = () => {
  const toggleSettings = useCommonStore((state) => state.toggleSettings);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          data-testid="show-hide-settings-btn"
          variant="outline"
          size="icon"
          onClick={toggleSettings}
        >
          <Settings className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Show/Hide Settings</p>
      </TooltipContent>
    </Tooltip>
  );
};
