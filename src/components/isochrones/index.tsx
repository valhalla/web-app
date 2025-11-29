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
import { useNavigate, useSearch } from '@tanstack/react-router';
import type { Profile } from '@/reducers/common';
import { useMap } from 'react-map-gl/maplibre';

export const IsochronesControl = () => {
  const { mainMap } = useMap();
  const { results, geocodeResults } = useSelector(
    (state: RootState) => state.isochrones
  );
  const { loading } = useSelector((state: RootState) => state.common);
  const dispatch = useDispatch<AppDispatch>();
  const initialUrlParams = useRef(parseUrlParams());
  const urlParamsProcessed = useRef(false);
  const { profile } = useSearch({ from: '/$activeTab' });
  const navigate = useNavigate({ from: '/$activeTab' });

  const handleProfileChange = useCallback(
    (value: Profile) => {
      navigate({
        search: (prev) => ({ ...prev, profile: value }),
        replace: true,
      });
      dispatch(makeIsochronesRequest());
    },
    [dispatch, navigate]
  );

  useEffect(() => {
    if (urlParamsProcessed.current || !mainMap) return;

    const wpsParam = initialUrlParams.current.wps;

    if (wpsParam) {
      const coordinates = wpsParam.split(',').map(Number);

      for (let i = 0; i < coordinates.length; i += 2) {
        const lng = coordinates[i]!;
        const lat = coordinates[i + 1]!;

        if (!isValidCoordinates(lng, lat) || isNaN(lng) || isNaN(lat)) continue;

        dispatch(fetchReverseGeocodeIso(lng, lat));
      }

      mainMap.flyTo({
        center: [coordinates[0]!, coordinates[1]!],
        zoom: 12,
      });
    }

    urlParamsProcessed.current = true;
  }, [mainMap, dispatch]);

  // Sync isochrone center to URL
  useEffect(() => {
    let center: string | undefined;

    for (const result of geocodeResults) {
      if (result.selected && result.sourcelnglat) {
        center = result.sourcelnglat.join(',');
      }
    }

    navigate({
      search: (prev) => ({ ...prev, wps: center || undefined }),
      replace: true,
    });
  }, [geocodeResults, navigate]);

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
            activeProfile={profile || 'bicycle'}
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
