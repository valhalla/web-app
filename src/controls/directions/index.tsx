import { useEffect, useCallback, useRef } from 'react';
import { connect } from 'react-redux';
import type { ThunkDispatch } from 'redux-thunk';
import { Divider, type ButtonProps } from 'semantic-ui-react';

import Waypoints from './waypoints';

import { ProfilePicker } from '@/components/profile-picker';
import { SettingsButton } from '@/components/settings-button';
import { SettingsFooter } from '@/components/settings-footer';
import { Settings } from './settings';
import { DateTimePicker } from '@/components/date-time-picker';

import {
  doAddWaypoint,
  doRemoveWaypoint,
  makeRequest,
  clearRoutes,
} from '@/actions/directions-actions';
import {
  updateProfile,
  doShowSettings,
  updatePermalink,
  resetSettings,
  doUpdateDateTime,
} from '@/actions/common-actions';
import type { RootState } from '@/store';
import type { Profile } from '@/reducers/common';
import type { AnyAction } from 'redux';

interface DirectionsControlProps {
  profile: Profile;
  dispatch: ThunkDispatch<RootState, unknown, AnyAction>;
  loading: boolean;
  dateTime: {
    type: number;
    value: string;
  };
}

const DirectionsControl = ({
  profile,
  dispatch,
  loading,
  dateTime,
}: DirectionsControlProps) => {
  const prevPropsRef = useRef<{
    profile: Profile;
    dateTime: {
      type: number;
      value: string;
    };
  }>({ profile, dateTime });

  const handleUpdateProfile = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) => {
      dispatch(updateProfile({ profile: data.valhalla_profile }));
      dispatch(resetSettings());
      dispatch(updatePermalink());
    },
    [dispatch]
  );

  const handleAddWaypoint = useCallback(() => {
    dispatch(doAddWaypoint());
  }, [dispatch]);

  const handleRemoveWaypoints = useCallback(() => {
    dispatch(doRemoveWaypoint());
    dispatch(clearRoutes());
  }, [dispatch]);

  const handleSettings = useCallback(() => {
    dispatch(doShowSettings());
  }, [dispatch]);

  const handleDateTime = useCallback(
    (type, value) => {
      dispatch(doUpdateDateTime(type, value));
    },
    [dispatch]
  );

  useEffect(() => {
    if (
      prevPropsRef.current &&
      (prevPropsRef.current.dateTime.type !== dateTime.type ||
        prevPropsRef.current.dateTime.value !== dateTime.value ||
        prevPropsRef.current.profile !== profile)
    ) {
      dispatch(makeRequest());
    }
  }, [dateTime.type, dateTime.value, profile, dispatch]);

  useEffect(() => {
    prevPropsRef.current = { profile, dateTime };
  });

  return (
    <div className="flex flex-column content-between">
      <div>
        <div className="pa2 flex flex-row justify-between">
          <ProfilePicker
            group="directions"
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
  );
};

const mapStateToProps = (state: RootState) => {
  const { profile, loading, dateTime } = state.common;
  return {
    profile,
    loading,
    dateTime,
  };
};

export default connect(mapStateToProps)(DirectionsControl);
