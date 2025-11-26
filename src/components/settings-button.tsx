// import { Button, Popup, Icon } from 'semantic-ui-react';
import { Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useCallback } from 'react';
import { doShowSettings } from '@/actions/common-actions';
import type { AppDispatch } from '@/store';
import { useDispatch } from 'react-redux';

export const SettingsButton = () => {
  const dispatch = useDispatch<AppDispatch>();

  const handleSettings = useCallback(() => {
    dispatch(doShowSettings());
  }, [dispatch]);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            data-testid="show-hide-settings-btn"
            variant="outline"
            size="icon"
            onClick={handleSettings}
          >
            <Settings className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Show/Hide Settings</p>
        </TooltipContent>
      </Tooltip>
    </>
  );
};
