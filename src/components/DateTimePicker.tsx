import React from 'react'
import PropTypes from 'prop-types'
import { Input, Dropdown } from 'semantic-ui-react'

export const DateTimePicker = ({ type, value, onChange }) => {
  return (
    <div className="pa2 flex flex-wrap justify-between">
      <Dropdown
        clearable
        options={[
          {
            key: 0,
            text: 'Nonspecific time',
            value: -1,
          },
          {
            key: 1,
            text: 'Leave now',
            value: 0,
          },
          {
            key: 2,
            text: 'Depart at',
            value: 1,
          },
          {
            key: 3,
            text: 'Arrive at',
            value: 2,
          },
        ]}
        selection
        defaultValue={type}
        style={{ marginLeft: '3px' }}
        onChange={(e, data) => {
          onChange('type', data.value)
        }}
      />
      <Input placeholder="Search..." style={{ marginLeft: '3px' }}>
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => onChange('value', e.target.value)}
          disabled={type < 0}
        />
      </Input>
    </div>
  )
}

DateTimePicker.propTypes = {
  type: PropTypes.number,
  value: PropTypes.string,
  onChange: PropTypes.func,
}
