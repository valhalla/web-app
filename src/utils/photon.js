import axios from 'axios'

export const PHOTON_URL = `${process.env.REACT_APP_PHOTON_URL}/api`
export const PHOTON_URL_REVERSE = `${process.env.REACT_APP_PHOTON_URL}/reverse`

export const forward_geocode = (userInput) =>
  axios.get(PHOTON_URL, {
    params: {
      // eslint-disable-next-line
      q: userInput,
      limit: 5,
    },
  })

export const reverse_geocode = (lon, lat) =>
  axios.get(PHOTON_URL_REVERSE, {
    params: {
      lon: lon,
      lat: lat,
    },
  })

export const parseGeocodeResponse = (results, lngLat) => {
  results = results.features
  const processedResults = []
  for (const [index, result] of results.entries()) {
    if (
      'error' in result &&
      result.error.toLowerCase() === 'unable to geocode'
    ) {
      processedResults.push({
        title: lngLat.toString(),
        description: '',
        selected: true,
        addresslnglat: '',
        sourcelnglat: lngLat,
        displaylnglat: lngLat,
        key: index,
        addressindex: index,
      })
    } else {
      processedResults.push({
        title:
          result.properties.name.length > 0
            ? result.properties.name
            : lngLat.toString(),
        description: `https://www.openstreetmap.org/${result.properties.osm_type}/${result.properties.osm_id}`,
        selected: false,
        addresslnglat: [
          parseFloat(result.geometry.coordinates[0]),
          parseFloat(result.geometry.coordinates[1]),
        ],
        sourcelnglat:
          lngLat === undefined
            ? [
                parseFloat(result.geometry.coordinates[0]),
                parseFloat(result.geometry.coordinates[1]),
              ]
            : lngLat,
        displaylnglat:
          lngLat !== undefined
            ? lngLat
            : [
                parseFloat(result.geometry.coordinates[0]),
                parseFloat(result.geometry.coordinates[1]),
              ],
        key: index,
        addressindex: index,
      })
    }
  }
  return processedResults
}
