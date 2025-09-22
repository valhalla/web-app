import React from 'react'
import { Button, Popup, Icon } from 'semantic-ui-react'
import PropTypes from 'prop-types'

export const Settings = ({ handleRemoveIsos }) => {
  return (
    <div>
      <Popup
        content={'Reset Center'}
        size={'tiny'}
        trigger={
          <Button basic icon onClick={handleRemoveIsos}>
            <Icon name="trash" />
          </Button>
        }
      />
    </div>
  )
}

Settings.propTypes = {
  handleRemoveIsos: PropTypes.func,
}
