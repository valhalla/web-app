import type { Profile } from '@/stores/common-store';
import { decode } from './polyline';
import type {
  ActiveWaypoint,
  ActiveWaypoints,
  IsochronesRequestParams,
  Settings,
} from '@/components/types';
import { getBaseUrl } from './base-url';

export const getValhallaUrl = () => getBaseUrl();

export const buildLocateRequest = (
  latLng: { lat: number; lng: number },
  profile: Profile
) => {
  let valhalla_profile = profile;
  if (profile === 'car') {
    valhalla_profile = 'auto';
  }
  return {
    costing: valhalla_profile,
    locations: [{ lat: latLng.lat, lon: latLng.lng }],
  };
};

export const buildHeightRequest = (latLngs: [number, number][]) => {
  const shape = [];
  for (const latLng of latLngs) {
    shape.push({ lat: latLng[0], lon: latLng[1] });
  }
  return {
    range: latLngs.length > 1,
    shape,
    id: 'valhalla_height',
  };
};

export const buildDirectionsRequest = ({
  profile,
  activeWaypoints,
  settings,
  dateTime,
  language,
}: {
  profile: Profile;
  activeWaypoints: ActiveWaypoints;
  settings: Settings;
  dateTime: { type: number; value: string };
  language: string;
}) => {
  let valhalla_profile = profile;

  if (profile === 'car') {
    valhalla_profile = 'auto';
  }

  const req = {
    json: {
      costing: valhalla_profile,
      costing_options: {
        [valhalla_profile]: { ...settings.costing },
      },
      exclude_polygons: settings.directions.exclude_polygons,
      locations: makeLocations(activeWaypoints),
      units: 'kilometers',
      alternates: settings.directions.alternates,
      id: 'valhalla_directions',
      language,
    },
  };

  if (dateTime.type > -1) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req.json as any).date_time = dateTime;
  }
  return req;
};

export const buildOptimizedRouteRequest = ({
  profile,
  activeWaypoints,
  settings,
  language,
}: {
  profile: Profile;
  activeWaypoints: ActiveWaypoints;
  settings: Settings;
  language: string;
}) => {
  let valhalla_profile = profile;
  if (profile === 'car') {
    valhalla_profile = 'auto';
  }
  const req = {
    json: {
      costing: valhalla_profile,
      costing_options: {
        [valhalla_profile]: { ...settings.costing },
      },
      locations: makeLocations(activeWaypoints),
      units: 'kilometers',
      id: 'valhalla_optimized_route',
      language,
    },
  };
  return req;
};

export const parseDirectionsGeometry = (data: {
  trip: { legs: { shape: string }[] };
}) => {
  const coordinates: number[][] = [];

  for (const feat of data.trip.legs) {
    coordinates.push(...decode(feat.shape, 6));
  }

  return coordinates;
};

export const buildIsochronesRequest = ({
  profile,
  center,
  settings,
  denoise,
  generalize,
  maxRange,
  interval,
}: IsochronesRequestParams) => {
  let valhalla_profile = profile;

  if (profile === 'car') {
    valhalla_profile = 'auto';
  }

  return {
    json: {
      polygons: true,
      denoise,
      generalize,
      show_locations: true,
      costing: valhalla_profile,
      costing_options: {
        [valhalla_profile]: { ...settings.costing },
      },
      contours: makeContours({ maxRange, interval }),
      locations: makeLocations([center as ActiveWaypoint]),
      units: 'kilometers',
      id: `valhalla_isochrones_lonlat_${center.displaylnglat.toString()}_range_${maxRange.toString()}_interval_${interval.toString()}`,
    },
  };
};

export const makeContours = ({
  maxRange,
  interval,
}: {
  maxRange: number;
  interval: number;
}) => {
  let contours = [];
  while (maxRange > 0) {
    contours.push({ time: maxRange });
    maxRange -= interval;
  }
  contours = contours.reverse();
  return contours;
};

export const makeLocations = (waypoints: ActiveWaypoint[]) => {
  const locations = [];
  for (const [idx, waypoint] of waypoints.entries()) {
    const type = [0, waypoints.length - 1].includes(idx) ? 'break' : 'via';
    locations.push({
      lon: waypoint.displaylnglat[0],
      lat: waypoint.displaylnglat[1],
      type: type,
    });
  }

  return locations;
};
