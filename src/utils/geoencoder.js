import {
  reverse_geocode as ph_reverse_geocode,
  forward_geocode as ph_forward_geocode,
  parseGeocodeResponse as ph_parseGeocodeResponse,
} from 'utils/photon'
import {
  reverse_geocode as nm_reverse_geocode,
  forward_geocode as nm_forward_geocode,
  parseGeocodeResponse as nm_parseGeocodeResponse,
} from 'utils/nominatim'

export const PHOTON_URL = `${process.env.REACT_APP_PHOTON_URL}`

export const forward_geocode = (userInput) => {
  if (PHOTON_URL.length > 0 && PHOTON_URL !== 'null') {
    return ph_forward_geocode(userInput)
  }
  return nm_forward_geocode(userInput)
}

export const reverse_geocode = (lon, lat) => {
  if (PHOTON_URL.length > 0 && PHOTON_URL !== 'null') {
    return ph_reverse_geocode(lon, lat)
  }
  return nm_reverse_geocode(lon, lat)
}

export const parseGeocodeResponse = (results, lngLat) => {
  if (PHOTON_URL.length > 0 && PHOTON_URL !== 'null') {
    return ph_parseGeocodeResponse(results, lngLat)
  }
  return nm_parseGeocodeResponse(results, lngLat)
}
