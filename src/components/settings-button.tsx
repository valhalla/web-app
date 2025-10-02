import { Button, Popup, Icon } from 'semantic-ui-react';

interface SettingsButtonProps {
  handleSettings: () => void;
}

export const SettingsButton = ({ handleSettings }: SettingsButtonProps) => {
  return (
    <Popup
      content="Show/Hide Settings"
      trigger={
        <Button
          data-testid="show-hide-settings-btn"
          tertiary="true"
          icon
          onClick={() => handleSettings()}
        >
          <Icon name="cogs" />
        </Button>
      }
    />
  );
};
