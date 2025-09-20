import { updateSettings } from 'actions/commonActions'
import PropTypes from 'prop-types'
import React from 'react'
import { Form } from 'semantic-ui-react'

export const Checkbox = (props) => {
  const { settings, option, dispatch } = props

  const handleChange = (e, { checked }) => {
    const value = !!checked
    dispatch(
      updateSettings({
        name: option.param,
        value,
      })
    )
  }

  return (
    <>
      <Form.Checkbox
        width={10}
        label={option.name}
        checked={settings[option.param]}
        onChange={handleChange}
      />
    </>
  )
}

Checkbox.propTypes = {
  option: PropTypes.object,
  settings: PropTypes.object,
  dispatch: PropTypes.func,
}
