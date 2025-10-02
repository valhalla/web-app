import type { NominatimResponse } from '@/common/types';
import axios from 'axios';

export const NOMINATIM_URL = `${process.env.REACT_APP_NOMINATIM_URL}/search`;
export const NOMINATIME_URL_REVERSE = `${process.env.REACT_APP_NOMINATIM_URL}/reverse`;

export const forward_geocode = (userInput: string) =>
  axios.get<NominatimResponse>(NOMINATIM_URL, {
    params: {
      q: userInput,
      format: 'json',
      limit: 5,
    },
  });

export const reverse_geocode = (lon: number, lat: number) =>
  axios.get<NominatimResponse>(NOMINATIME_URL_REVERSE, {
    params: {
      lon: lon,
      lat: lat,
      format: 'json',
    },
  });

export const parseGeocodeResponse = (
  results: NominatimResponse | NominatimResponse[],
  lngLat: [number, number]
) => {
  if (!Array.isArray(results)) {
    results = [results];
  }

  const processedResults = [];
  for (const [index, result] of results.entries()) {
    if (
      'error' in result &&
      result.error?.toLowerCase() === 'unable to geocode'
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
      });
    } else {
      processedResults.push({
        title:
          result.display_name.length > 0
            ? result.display_name
            : lngLat.toString(),
        description: `https://www.openstreetmap.org/${result.osm_type}/${result.osm_id}`,
        selected: false,
        addresslnglat: [parseFloat(result.lon), parseFloat(result.lat)],
        sourcelnglat:
          lngLat === undefined
            ? [parseFloat(result.lon), parseFloat(result.lat)]
            : lngLat,
        displaylnglat:
          lngLat !== undefined
            ? lngLat
            : [parseFloat(result.lon), parseFloat(result.lat)],
        key: index,
        addressindex: index,
      });
    }
  }
  return processedResults;
};
