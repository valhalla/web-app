import { useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMap } from 'react-map-gl/maplibre';
import { useShallow } from 'zustand/react/shallow';
import {
  useRoundTripStore,
  type RoundTripSettings,
} from '@/stores/round-trip-store';
import {
  useRoundTripQuery,
  useSetRoundTripStart,
} from '@/hooks/use-round-trip-queries';
import { parseUrlParams } from '@/utils/parse-url-params';
import { isValidCoordinates } from '@/utils/geom';

const SETTINGS_URL_PARAMS: Record<keyof RoundTripSettings, string> = {
  distance: 'distance',
  distanceTolerance: 'distance_tolerance',
  heading: 'heading',
  headingTolerance: 'heading_tolerance',
};

/**
 * Hydrates the round trip start (`wps`) and settings from the URL once and
 * keeps the URL in sync with them afterwards.
 *
 * Must be called from an always-mounted component: the round trip panel
 * content is unmounted while the sidebar is closed (default on mobile).
 */
export function useRoundTripPermalink(enabled: boolean) {
  const { mainMap } = useMap();
  const navigate = useNavigate({ from: '/$activeTab' });
  const urlParamsProcessed = useRef(false);
  const { refetch: refetchRoundTrip } = useRoundTripQuery();
  const { setRoundTripStart } = useSetRoundTripStart();
  const geocodeResults = useRoundTripStore((state) => state.geocodeResults);
  const roundTripSettings = useRoundTripStore(
    useShallow((state) => ({
      distance: state.distance,
      distanceTolerance: state.distanceTolerance,
      heading: state.heading,
      headingTolerance: state.headingTolerance,
    }))
  );

  useEffect(() => {
    if (!enabled || urlParamsProcessed.current || !mainMap) return;
    urlParamsProcessed.current = true;

    const urlParams = parseUrlParams();
    const { updateSettings } = useRoundTripStore.getState();
    for (const [name, param] of Object.entries(SETTINGS_URL_PARAMS)) {
      const value = parseFloat(urlParams[param] ?? '');
      if (!isNaN(value)) {
        updateSettings({ name: name as keyof RoundTripSettings, value });
      }
    }

    const alreadyHydrated = useRoundTripStore
      .getState()
      .geocodeResults.some((address) => address.selected);
    if (alreadyHydrated || !urlParams.wps) return;

    const [lng, lat] = urlParams.wps.split(',').map(Number);
    if (lng === undefined || lat === undefined) return;
    if (isNaN(lng) || isNaN(lat) || !isValidCoordinates(lat, lng)) return;

    setRoundTripStart(lng, lat).then(() => {
      refetchRoundTrip();
    });
    mainMap.flyTo({ center: [lng, lat], zoom: 12 });
  }, [enabled, mainMap, setRoundTripStart, refetchRoundTrip]);

  useEffect(() => {
    // Writing before hydration (e.g. map not ready yet) would wipe the params
    if (!enabled || !urlParamsProcessed.current) return;

    const start = geocodeResults.find((address) => address.selected);
    navigate({
      search: (prev) => ({
        ...prev,
        wps: start?.sourcelnglat?.join(',') || undefined,
        distance: roundTripSettings.distance,
        distance_tolerance: roundTripSettings.distanceTolerance,
        heading: roundTripSettings.heading,
        heading_tolerance: roundTripSettings.headingTolerance,
      }),
      replace: true,
    });
  }, [enabled, geocodeResults, roundTripSettings, navigate]);
}
