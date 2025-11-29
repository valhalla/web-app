import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Waypoints } from './waypoints';

import { ProfilePicker } from '@/components/profile-picker';
import { SettingsButton } from '@/components/settings-button';
import { SettingsFooter } from '@/components/settings-footer';

import {
  fetchReverseGeocodeIso,
  makeIsochronesRequest,
} from '@/actions/isochrones-actions';
import type { AppDispatch, RootState } from '@/store';
import { Separator } from '@/components/ui/separator';
import { IsochronesOutputControl } from './isochrone-card';
import { VALHALLA_OSM_URL } from '@/utils/valhalla';
import { parseUrlParams } from '@/utils/parse-url-params';
import { isValidCoordinates } from '@/utils/geom';

export const IsochronesControl = () => {
  const { results } = useSelector((state: RootState) => state.isochrones);
  const { profile, loading } = useSelector((state: RootState) => state.common);
  const dispatch = useDispatch<AppDispatch>();
  const initialUrlParams = useRef(parseUrlParams());
  const urlParamsProcessed = useRef(false);

  const handleProfileChange = useCallback(() => {
    dispatch(makeIsochronesRequest());
  }, [dispatch]);

  useEffect(() => {
    const wpsParam = initialUrlParams.current.wps;

    if (!wpsParam) return;

    if (urlParamsProcessed.current) {
      return;
    }

    urlParamsProcessed.current = true;

    const coordinates = wpsParam.split(',').map(Number);

    for (let i = 0; i < coordinates.length; i += 2) {
      const lng = coordinates[i]!;
      const lat = coordinates[i + 1]!;

      if (!isValidCoordinates(lng, lat) || isNaN(lng) || isNaN(lat)) continue;

      dispatch(fetchReverseGeocodeIso(lng, lat));
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
