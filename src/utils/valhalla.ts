import { decode } from './polyline'

export const VALHALLA_OSM_URL = process.env.REACT_APP_VALHALLA_URL

export const buildLocateRequest = (latLng, profile) => {
  let valhalla_profile = profile
  if (profile === 'car') {
    valhalla_profile = 'auto'
  }
  return {
    costing: valhalla_profile,
    locations: [{ lat: latLng.lat, lon: latLng.lng }],
  }
}

export const buildHeightRequest = (latLngs) => {
  const shape = []
  for (const latLng of latLngs) {
    shape.push({ lat: latLng[0], lon: latLng[1] })
  }
  return {
    range: latLngs.length > 1,
    shape,
    id: 'valhalla_height',
  }
}

export const buildDirectionsRequest = ({
  profile,
  activeWaypoints,
  settings,
  dateTime,
}) => {
  let valhalla_profile = profile
  if (profile === 'car') {
    valhalla_profile = 'auto'
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
    },
  }

  if (dateTime.type > -1) {
    req.json.date_time = dateTime
  }
  return req
}

export const parseDirectionsGeometry = (data) => {
  const coordinates = []

  for (const feat of data.trip.legs) {
    coordinates.push(...decode(feat.shape, 6))
  }

  return coordinates
}

export const buildIsochronesRequest = ({
  profile,
  center,
  settings,
  denoise,
  generalize,
  maxRange,
  interval,
}) => {
  let valhalla_profile = profile
  if (profile === 'car') {
    valhalla_profile = 'auto'
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
      locations: makeLocations([center]),
      units: 'kilometers',
      id: `valhalla_isochrones_lonlat_${center.displaylnglat.toString()}_range_${maxRange.toString()}_interval_${interval.toString()}`,
    },
  }
}

const makeContours = ({ maxRange, interval }) => {
  let contours = []
  while (maxRange > 0) {
    contours.push({ time: maxRange })
    maxRange -= interval
  }
  contours = contours.reverse()
  return contours
}

const makeLocations = (waypoints) => {
  const locations = []
  for (const [idx, waypoint] of waypoints.entries()) {
    const type = [0, waypoints.length - 1].includes(idx) ? 'break' : 'via'
    locations.push({
      lon: waypoint.displaylnglat[0],
      lat: waypoint.displaylnglat[1],
      type: type,
    })
  }

  return locations
}
