import React, { useEffect, useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Divider } from 'semantic-ui-react'

import Waypoints from './Waypoints'

import { ProfilePicker } from 'components/profile-picker'
import { SettingsButton } from 'components/SettingsButton'
import { SettingsFooter } from 'components/SettingsFooter'
import { Settings } from './settings'
import { DateTimePicker } from 'components/DateTimePicker'

import {
  doAddWaypoint,
  doRemoveWaypoint,
  makeRequest,
  clearRoutes,
} from 'actions/directionsActions'
import {
  updateProfile,
  doShowSettings,
  updatePermalink,
  resetSettings,
  doUpdateDateTime,
} from 'actions/commonActions'

const DirectionsControl = ({ profile, dispatch, loading, dateTime }) => {
  const prevPropsRef = useRef()

  const handleUpdateProfile = useCallback(
    (event, data) => {
      dispatch(updateProfile({ profile: data.valhalla_profile }))
      dispatch(resetSettings())
      dispatch(updatePermalink())
    },
    [dispatch]
  )

  const handleAddWaypoint = useCallback(
    (event, data) => {
      dispatch(doAddWaypoint())
    },
    [dispatch]
  )

  const handleRemoveWaypoints = useCallback(() => {
    dispatch(doRemoveWaypoint())
    dispatch(clearRoutes())
  }, [dispatch])

  const handleSettings = useCallback(() => {
    dispatch(doShowSettings())
  }, [dispatch])

  const handleDateTime = useCallback(
    (type, value) => {
      dispatch(doUpdateDateTime(type, value))
    },
    [dispatch]
  )

  useEffect(() => {
    if (
      prevPropsRef.current &&
      (prevPropsRef.current.dateTime.type !== dateTime.type ||
        prevPropsRef.current.dateTime.value !== dateTime.value ||
        prevPropsRef.current.profile !== profile)
    ) {
      dispatch(makeRequest())
    }
  }, [dateTime.type, dateTime.value, profile, dispatch])

  useEffect(() => {
    prevPropsRef.current = { profile, dateTime }
  })

  return (
    <div className="flex flex-column content-between">
      <div>
        <div className="pa2 flex flex-row justify-between">
          <ProfilePicker
            group={'directions'}
            profiles={[
              'bicycle',
              'pedestrian',
              'car',
              'truck',
              'bus',
              'motor_scooter',
              'motorcycle',
            ]}
            loading={loading}
            popupContent={[
              'Bicycle',
              'Pedestrian',
              'Car',
              'Truck',
              'Bus',
              'Motor Scooter',
              'Motorcycle',
            ]}
            activeProfile={profile}
            handleUpdateProfile={handleUpdateProfile}
          />
          <SettingsButton handleSettings={handleSettings} />
        </div>
        <div className="flex flex-wrap justify-between">
          <Waypoints />
        </div>
        <div className="pa2 flex flex-wrap justify-between">
          <Settings
            handleAddWaypoint={handleAddWaypoint}
            handleRemoveWaypoints={handleRemoveWaypoints}
          />
        </div>
        <DateTimePicker
          type={dateTime.type}
          value={dateTime.value}
          onChange={handleDateTime}
        />
      </div>
      <Divider fitted />
      <SettingsFooter />
    </div>
  )
}

// PropTypes for the functional component
DirectionsControl.propTypes = {
  profile: PropTypes.string.isRequired,
  dispatch: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  dateTime: PropTypes.shape({
    type: PropTypes.number,
    value: PropTypes.string,
  }),
}

const mapStateToProps = (state) => {
  const { profile, loading, dateTime } = state.common
  return {
    profile,
    loading,
    dateTime,
  }
}

export default connect(mapStateToProps)(DirectionsControl)
