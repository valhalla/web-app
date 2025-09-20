import React, { useEffect, useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Divider } from 'semantic-ui-react'

import Waypoints from './Waypoints'

import { ProfilePicker } from '../../components/profile-picker'
import { SettingsButton } from '../../components/SettingsButton'
import { SettingsFooter } from 'components/SettingsFooter'

import {
  updateProfile,
  doShowSettings,
  updatePermalink,
  resetSettings,
} from 'actions/commonActions'
import { makeIsochronesRequest } from 'actions/isochronesActions'

const IsochronesControl = ({ profile, loading, dispatch }) => {
  const prevPropsRef = useRef()

  const handleUpdateProfile = useCallback(
    (event, data) => {
      dispatch(updateProfile({ profile: data.valhalla_profile }))
      dispatch(resetSettings())
      dispatch(updatePermalink())
    },
    [dispatch]
  )

  useEffect(() => {
    if (prevPropsRef.current && prevPropsRef.current.profile !== profile) {
      dispatch(makeIsochronesRequest())
    }
  }, [profile, dispatch])

  useEffect(() => {
    prevPropsRef.current = { profile }
  })

  const handleSettings = useCallback(() => {
    dispatch(doShowSettings())
  }, [dispatch])

  // handleRemoveIsos = () => {
  //   const { dispatch } = this.props
  //   dispatch(clearIsos())
  // }

  return (
    <React.Fragment>
      <div className="flex flex-column content-between">
        <div className="pa2 flex flex-row justify-between">
          <ProfilePicker
            group={'directions'}
            loading={loading}
            profiles={[
              'bicycle',
              'pedestrian',
              'car',
              'truck',
              'bus',
              'motor_scooter',
            ]}
            popupContent={[
              'Bicycle',
              'Pedestrian',
              'Car',
              'Truck',
              'Bus',
              'Motor Scooter',
            ]}
            activeProfile={profile}
            handleUpdateProfile={handleUpdateProfile}
          />
          <SettingsButton handleSettings={handleSettings} />
        </div>
        <Waypoints />
        <Divider fitted />
        <SettingsFooter />
      </div>
    </React.Fragment>
  )
}

IsochronesControl.propTypes = {
  profile: PropTypes.string.isRequired,
  loading: PropTypes.bool,
  dispatch: PropTypes.func.isRequired,
}

const mapStateToProps = (state) => {
  const { profile, loading } = state.common
  return {
    profile,
    loading,
  }
}

export default connect(mapStateToProps)(IsochronesControl)
