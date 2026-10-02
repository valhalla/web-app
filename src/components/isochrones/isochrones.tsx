import { useEffect, useRef } from 'react';
import { Waypoints } from './waypoints';
import { SettingsFooter } from '@/components/settings-footer';
import { QuickSettings } from '@/components/quick-settings';
import { useIsochronesStore } from '@/stores/isochrones-store';
import { IsochroneCard } from './isochrone-card';
import { parseUrlParams } from '@/utils/parse-url-params';
import { isValidCoordinates } from '@/utils/geom';
import { useNavigate } from '@tanstack/react-router';
import { useMap } from 'react-map-gl/maplibre';
import {
  useIsochronesQuery,
  useReverseGeocodeIsochrones,
} from '@/hooks/use-isochrones-queries';

export const IsochronesControl = () => {
  const { mainMap } = useMap();
  const results = useIsochronesStore((state) => state.results);
  const selectedAddress = useIsochronesStore((state) => state.selectedAddress);
  const initialUrlParams = useRef(parseUrlParams());
  const urlParamsProcessed = useRef(false);
  const navigate = useNavigate({ from: '/$activeTab' });
  const { refetch: refetchIsochrones } = useIsochronesQuery();
  const { reverseGeocode } = useReverseGeocodeIsochrones();

  useEffect(() => {
    if (urlParamsProcessed.current || !mainMap) return;

    const alreadyHydrated =
      useIsochronesStore.getState().selectedAddress !== null;
    if (alreadyHydrated) {
      urlParamsProcessed.current = true;
      return;
    }

    const wpsParam = initialUrlParams.current.wps;

    if (wpsParam) {
      const coordinates = wpsParam.split(',').map(Number);

      for (let i = 0; i < coordinates.length; i += 2) {
        const lng = coordinates[i]!;
        const lat = coordinates[i + 1]!;

        if (!isValidCoordinates(lat, lng) || isNaN(lng) || isNaN(lat)) continue;

        reverseGeocode(lng, lat).then(() => {
          refetchIsochrones();
        });
      }

      mainMap.flyTo({
        center: [coordinates[0]!, coordinates[1]!],
        zoom: 12,
      });
    }

    urlParamsProcessed.current = true;
  }, [mainMap, reverseGeocode, refetchIsochrones]);

  // Sync isochrone center to URL
  useEffect(() => {
    const center = selectedAddress?.sourcelnglat?.join(',');

    navigate({
      search: (prev) => ({ ...prev, wps: center || undefined }),
      replace: true,
    });
  }, [selectedAddress, navigate]);

  return (
    <>
      <Waypoints />
      <QuickSettings showAlternates={false} showLanguage={false} />
      <SettingsFooter />
      {results.data && (
        <div>
          <h3 className="font-bold mb-2">Isochrones</h3>
          <IsochroneCard data={results.data} showOnMap={results.show} />
        </div>
      )}
    </>
  );
};
