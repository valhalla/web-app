import React from 'react'
import PropTypes from 'prop-types'
import { Button, Popup, Icon } from 'semantic-ui-react'

export const Settings = ({ handleAddWaypoint, handleRemoveWaypoints }) => (
  <div
    style={{
      marginLeft: 'auto',
      marginRight: 0,
    }}
  >
    <Popup
      content={'Add Waypoint'}
      size={'tiny'}
      trigger={
        <Button basic size="tiny" icon onClick={() => handleAddWaypoint()}>
          <Icon name="plus" />
        </Button>
      }
    />
    <Popup
      content={'Reset Waypoints'}
      size={'tiny'}
      trigger={
        <Button basic size="tiny" icon onClick={() => handleRemoveWaypoints()}>
          <Icon name="trash" />
        </Button>
      }
    />
  </div>
)
Settings.propTypes = {
  handleAddWaypoint: PropTypes.func,
  handleRemoveWaypoints: PropTypes.func,
  group: PropTypes.string,
}
