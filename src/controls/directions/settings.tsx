import { Button, Popup, Icon } from 'semantic-ui-react';

export const Settings = ({
  handleAddWaypoint,
  handleRemoveWaypoints,
}: {
  handleAddWaypoint: () => void;
  handleRemoveWaypoints: () => void;
}) => (
  <div
    style={{
      marginLeft: 'auto',
      marginRight: 0,
    }}
  >
    <Popup
      content="Add Waypoint"
      size="tiny"
      trigger={
        <Button
          data-testid="add-waypoint-button"
          basic
          size="tiny"
          icon
          onClick={() => handleAddWaypoint()}
        >
          <Icon name="plus" />
        </Button>
      }
    />
    <Popup
      content="Reset Waypoints"
      size="tiny"
      trigger={
        <Button
          data-testid="reset-waypoints-button"
          basic
          size="tiny"
          icon
          onClick={() => handleRemoveWaypoints()}
        >
          <Icon name="trash" />
        </Button>
      }
    />
  </div>
);
