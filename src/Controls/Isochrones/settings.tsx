import { Button, Popup, Icon } from 'semantic-ui-react';

interface SettingsProps {
  handleRemoveIsos: () => void;
}

export const Settings = ({ handleRemoveIsos }: SettingsProps) => {
  return (
    <div>
      <Popup
        content="Reset Center"
        size="tiny"
        trigger={
          <Button basic icon onClick={handleRemoveIsos}>
            <Icon name="trash" />
          </Button>
        }
      />
    </div>
  );
};
