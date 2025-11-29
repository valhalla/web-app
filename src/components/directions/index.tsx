import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Waypoints } from './waypoints/waypoint-list';

import { ProfilePicker } from '@/components/profile-picker';
import { SettingsButton } from '@/components/settings-button';
import { SettingsFooter } from '@/components/settings-footer';
import { DateTimePicker } from '@/components/date-time-picker';
import { Separator } from '@/components/ui/separator';

import {
  clearRoutes,
  doAddWaypoint,
  doRemoveWaypoint,
  fetchReverseGeocodePerma,
  makeRequest,
} from '@/actions/directions-actions';
import { doUpdateDateTime } from '@/actions/common-actions';
import type { AppDispatch, RootState } from '@/store';
import type { ParsedDirectionsGeometry } from '@/components/types';
import { Button } from '@/components/ui/button';
import { MapPinPlus, MapPinXInside } from 'lucide-react';
import { RouteCard } from './route-card';
import { VALHALLA_OSM_URL } from '@/utils/valhalla';
import { parseUrlParams } from '@/utils/parse-url-params';
import { isValidCoordinates } from '@/utils/geom';
import { useNavigate, useSearch } from '@tanstack/react-router';
import type { Profile } from '@/reducers/common';

export const DirectionsControl = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { waypoints } = useSelector((state: RootState) => state.directions);
  const { results } = useSelector((state: RootState) => state.directions);
  const initialUrlParams = useRef(parseUrlParams());
  const urlParamsProcessed = useRef(false);
  const { profile } = useSearch({ from: '/$activeTab' });
  const navigate = useNavigate({ from: '/$activeTab' });

  const { loading, dateTime } = useSelector((state: RootState) => state.common);

  useEffect(() => {
    if (urlParamsProcessed.current) return;

    const wpsParam = initialUrlParams.current.wps;

    if (wpsParam) {
      const coordinates = wpsParam.split(',').map(Number);

      for (let i = 0; i < coordinates.length; i += 2) {
        const lng = coordinates[i]!;
        const lat = coordinates[i + 1]!;

        if (!isValidCoordinates(lng, lat) || isNaN(lng) || isNaN(lat)) continue;

        const index = i / 2;
        const payload = { latLng: { lat, lng }, fromPerma: true, index };

        dispatch(fetchReverseGeocodePerma(payload));
      }
      dispatch(makeRequest());
    }

    urlParamsProcessed.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const wps: number[] = [];

    for (const wp of waypoints) {
      for (const result of wp.geocodeResults) {
        if (result.selected && result.sourcelnglat) {
          wps.push(result.sourcelnglat[0], result.sourcelnglat[1]);
        }
      }
    }

    navigate({
      search: (prev) => ({
        ...prev,
        wps: wps.length > 0 ? wps.join(',') : undefined,
      }),
      replace: true,
    });
  }, [waypoints, navigate]);

  const handleProfileChange = useCallback(
    (value: Profile) => {
      navigate({
        search: (prev) => ({ ...prev, profile: value }),
        replace: true,
      });
      dispatch(makeRequest());
    },
    [dispatch, navigate]
  );

  const handleDateTimeChange = useCallback(
    (field: 'type' | 'value', value: string) => {
      dispatch(doUpdateDateTime(field, value));
      dispatch(makeRequest());
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

  const routeResult = results[VALHALLA_OSM_URL!];

  return (
    <>
      <div className="flex flex-col gap-3 border rounded-md p-2">
        <div className="flex justify-between">
          <ProfilePicker
            profiles={[
              { value: 'bicycle', label: 'Bicycle' },
              { value: 'pedestrian', label: 'Pedestrian' },
              { value: 'car', label: 'Car' },
              { value: 'truck', label: 'Truck' },
              { value: 'bus', label: 'Bus' },
              { value: 'motor_scooter', label: 'Motor Scooter' },
              { value: 'motorcycle', label: 'Motorcycle' },
            ]}
            loading={loading}
            activeProfile={profile || 'bicycle'}
            onProfileChange={handleProfileChange}
          />
          <SettingsButton />
        </div>
        <Waypoints />
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={handleAddWaypoint}
            data-testid="add-waypoint-button"
            className="w-full shrink"
          >
            <MapPinPlus className="size-5" />
            Add Waypoint
          </Button>
          <Button
            variant="destructive-outline"
            onClick={handleRemoveWaypoints}
            data-testid="reset-waypoints-button"
            className="w-full shrink"
          >
            <MapPinXInside className="size-5" />
            Reset Waypoints
          </Button>
        </div>
        <DateTimePicker
          type={dateTime.type}
          value={dateTime.value}
          onChange={handleDateTimeChange}
        />
        <Separator />
        <SettingsFooter />
      </div>
      {routeResult?.data && (
        <div>
          <h3 className="font-bold mb-2">Directions</h3>
          <div className="flex flex-col gap-3">
            <RouteCard data={routeResult.data} index={-1} />
            {routeResult.data.alternates?.map((alternate, index) => (
              <RouteCard
                data={alternate as ParsedDirectionsGeometry}
                key={alternate.id}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};
