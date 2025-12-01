import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Waypoints } from './waypoints';

import { SettingsFooter } from '@/components/settings-footer';

import { fetchReverseGeocodeIso } from '@/actions/isochrones-actions';
import type { AppDispatch, RootState } from '@/store';
import { Separator } from '@/components/ui/separator';
import { IsochronesOutputControl } from './isochrone-card';
import { VALHALLA_OSM_URL } from '@/utils/valhalla';
import { parseUrlParams } from '@/utils/parse-url-params';
import { isValidCoordinates } from '@/utils/geom';
import { useNavigate } from '@tanstack/react-router';
import { useMap } from 'react-map-gl/maplibre';

export const IsochronesControl = () => {
  const { mainMap } = useMap();
  const { results, geocodeResults } = useSelector(
    (state: RootState) => state.isochrones
  );
  const dispatch = useDispatch<AppDispatch>();
  const initialUrlParams = useRef(parseUrlParams());
  const urlParamsProcessed = useRef(false);
  const navigate = useNavigate({ from: '/$activeTab' });

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
