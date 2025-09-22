import React, { Fragment, useState, useEffect } from 'react'
import { Form, Label, Popup, Icon } from 'semantic-ui-react'
import { Slider } from '@mui/material'
import { debounce } from 'throttle-debounce'
import {
  settingsInit,
  settingsInitTruckOverride,
} from 'Controls/settings-options'

import PropTypes from 'prop-types'

const CustomSlider = (props) => {
  const { settings, option, profile, handleUpdateSettings } = props
  const { min, max, step } = option.settings
  const [sliderVal, setSliderVal] = useState(parseFloat(settings[option.param]))

  useEffect(() => {
    setSliderVal(parseFloat(settings[option.param]))
  }, [settings, option.param])

  const handleChange = (value) => {
    // reset
    if (isNaN(value)) {
      value =
        profile === 'truck'
          ? settingsInitTruckOverride[option.param]
          : settingsInit[option.param]
    }
    if (value < min) {
      value = min
    } else if (value > max) {
      value = max
    }
    setSliderVal(parseFloat(value))
    debounce(
      300,
      handleUpdateSettings({
        name: option.param,
        value: parseFloat(value),
      })
    )
  }

  return (
    <Fragment>
      <Form.Group inline>
        <Popup
          content={'Reset Value'}
          size={'tiny'}
          trigger={
            <Icon name="repeat" size="small" onClick={() => handleChange()} />
          }
        />
        <Form.Input
          width={16}
          size="small"
          type="number"
          step="any"
          value={sliderVal}
          placeholder="Enter Value"
          name={option.param}
          onChange={(e) => handleChange(e.target.value)}
        />
        <Popup
          content={'Units'}
          size={'tiny'}
          trigger={
            <Label basic size={'small'} style={{ cursor: 'default' }}>
              {option.unit}
            </Label>
          }
        />
      </Form.Group>
      <div>
        <Slider
          min={min}
          size={'small'}
          max={max}
          step={step}
          value={sliderVal}
          color="secondary"
          aria-label="Default"
          valueLabelDisplay="auto"
          onChange={(e) => {
            handleChange(e.target.value)
          }}
        />
      </div>
    </Fragment>
  )
}

CustomSlider.propTypes = {
  option: PropTypes.object,
  settings: PropTypes.object,
  profile: PropTypes.string,
  handleUpdateSettings: PropTypes.func,
}

export default CustomSlider
