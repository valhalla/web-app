import React, { useEffect, useCallback, useRef } from 'react';
import { connect } from 'react-redux';
import { Divider } from 'semantic-ui-react';

import Waypoints from './waypoints';

import { ProfilePicker } from '@/components/profile-picker';
import { SettingsButton } from '@/components/settings-button';
import { SettingsFooter } from '@/components/settings-footer';

import {
  updateProfile,
  doShowSettings,
  updatePermalink,
  resetSettings,
} from '@/actions/common-actions';
import { makeIsochronesRequest } from '@/actions/isochrones-actions';
import type { RootState } from '@/store';
import type { AnyAction } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';
import type { Profile } from '@/reducers/common';

interface IsochronesControlProps {
  profile: Profile;
  loading: boolean;
  dispatch: ThunkDispatch<RootState, unknown, AnyAction>;
}

const IsochronesControl = ({
  profile,
  loading,
  dispatch,
}: IsochronesControlProps) => {
  const prevPropsRef = useRef<{
    profile: Profile;
  }>({ profile });

  const handleUpdateProfile = useCallback(
    (event, data) => {
      dispatch(updateProfile({ profile: data.valhalla_profile }));
      dispatch(resetSettings());
      dispatch(updatePermalink());
    },
    [dispatch]
  );

  useEffect(() => {
    if (prevPropsRef.current && prevPropsRef.current.profile !== profile) {
      dispatch(makeIsochronesRequest());
    }
  }, [profile, dispatch]);

  useEffect(() => {
    prevPropsRef.current = { profile };
  });

  const handleSettings = useCallback(() => {
    dispatch(doShowSettings());
  }, [dispatch]);

  // handleRemoveIsos = () => {
  //   const { dispatch } = this.props
  //   dispatch(clearIsos())
  // }

  return (
    <React.Fragment>
      <div className="flex flex-column content-between">
        <div className="pa2 flex flex-row justify-between">
          <ProfilePicker
            group="directions"
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
  );
};

const mapStateToProps = (state: RootState) => {
  const { profile, loading } = state.common;
  return {
    profile,
    loading,
  };
};

export default connect(mapStateToProps)(IsochronesControl);
