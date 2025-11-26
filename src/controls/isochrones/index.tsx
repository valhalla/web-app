import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Waypoints } from './waypoints';

import { ProfilePicker } from '@/components/profile-picker';
import { SettingsButton } from '@/components/settings-button';
import { SettingsFooter } from '@/components/settings-footer';

import { makeIsochronesRequest } from '@/actions/isochrones-actions';
import type { AppDispatch, RootState } from '@/store';
import { Separator } from '@/components/ui/separator';
import { IsochronesOutputControl } from './output-control';
import { VALHALLA_OSM_URL } from '@/utils/valhalla';

export const IsochronesControl = () => {
  const { results } = useSelector((state: RootState) => state.isochrones);
  const { profile, loading } = useSelector((state: RootState) => state.common);
  const dispatch = useDispatch<AppDispatch>();

  const handleProfileChange = useCallback(() => {
    dispatch(makeIsochronesRequest());
  }, [dispatch]);

  return (
    <>
      <div className="flex flex-col gap-3 border rounded-md p-2">
        <div className="flex justify-between">
          <ProfilePicker
            loading={loading}
            profiles={[
              { value: 'bicycle', label: 'Bicycle' },
              { value: 'pedestrian', label: 'Pedestrian' },
              { value: 'car', label: 'Car' },
              { value: 'truck', label: 'Truck' },
              { value: 'bus', label: 'Bus' },
              { value: 'motor_scooter', label: 'Motor Scooter' },
            ]}
            activeProfile={profile}
            onProfileChange={handleProfileChange}
          />
          <SettingsButton />
        </div>
        <Waypoints />
        <Separator />
        <SettingsFooter />
      </div>
      {results[VALHALLA_OSM_URL!]!.data && (
        <div>
          <h3 className="font-bold mb-2">Isochrones</h3>
          <IsochronesOutputControl
            data={results[VALHALLA_OSM_URL!]!.data}
            showOnMap={results[VALHALLA_OSM_URL!]!.show}
          />
        </div>
      )}
    </>
  );
};
