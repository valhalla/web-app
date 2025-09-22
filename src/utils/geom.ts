import * as turf from '@turf/turf'

export const calcArea = (feature) => {
  try {
    const polygon = turf.polygon(feature.geometry.coordinates)
    return turf.area(polygon) / 1000000
  } catch (e) {
    return -1
  }
}

export const isValidCoordinates = (lat, lng) => {
  const ck_lat = /^(-?[1-8]?\d(?:\.\d{1,18})?|90(?:\.0{1,18})?)$/
  const ck_lng = /^(-?(?:1[0-7]|[1-9])?\d(?:\.\d{1,18})?|180(?:\.0{1,18})?)$/
  const validLat = ck_lat.test(lat)
  const validLon = ck_lng.test(lng)
  return validLat && validLon
}
