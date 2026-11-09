import { useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMap } from 'react-map-gl/maplibre';
import { useIsochronesStore } from '@/stores/isochrones-store';
import {
  useIsochronesQuery,
  useReverseGeocodeIsochrones,
} from '@/hooks/use-isochrones-queries';
import { parseUrlParams } from '@/utils/parse-url-params';
import { isValidCoordinates } from '@/utils/geom';

/**
 * Hydrates the isochrone center from the `wps` URL param once and keeps the
 * URL in sync with the selected center afterwards.
 *
 * Must be called from an always-mounted component: the isochrones panel
 * content is unmounted while the sidebar is closed (default on mobile).
 */
export function useIsochronesPermalink(enabled: boolean) {
  const { mainMap } = useMap();
  const geocodeResults = useIsochronesStore((state) => state.geocodeResults);
  const urlParamsProcessed = useRef(false);
  const navigate = useNavigate({ from: '/$activeTab' });
  const { refetch: refetchIsochrones } = useIsochronesQuery();
  const { reverseGeocode } = useReverseGeocodeIsochrones();

  useEffect(() => {
    if (!enabled || urlParamsProcessed.current || !mainMap) return;
    urlParamsProcessed.current = true;

    const alreadyHydrated = useIsochronesStore
      .getState()
      .geocodeResults.some((r) => r.selected);
    if (alreadyHydrated) return;

    const wpsParam = parseUrlParams().wps;
    if (!wpsParam) return;

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
  }, [enabled, mainMap, reverseGeocode, refetchIsochrones]);

  useEffect(() => {
    // Writing before hydration (e.g. map not ready yet) would wipe `wps`
    if (!enabled || !urlParamsProcessed.current) return;

    let center: string | undefined;
    for (const geocodeResult of geocodeResults) {
      if (geocodeResult.selected && geocodeResult.sourcelnglat) {
        center = geocodeResult.sourcelnglat.join(',');
      }
    }

    navigate({
      search: (prev) => ({ ...prev, wps: center || undefined }),
      replace: true,
    });
  }, [enabled, geocodeResults, navigate]);
}
