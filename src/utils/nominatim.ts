import type { NominationResponse } from '@/components/types';

export const NOMINATIM_URL = `${import.meta.env.VITE_NOMINATIM_URL}/search`;
export const NOMINATIME_URL_REVERSE = `${import.meta.env.VITE_NOMINATIM_URL}/reverse`;

export const forward_geocode = async (userInput: string) => {
  const params = new URLSearchParams({
    q: userInput,
    format: 'json',
    limit: '5',
  });
  const response = await fetch(`${NOMINATIM_URL}?${params}`);

  if (!response.ok) {
    throw new Error(`Could not fetch resource`);
  }
  const data: NominationResponse = await response.json();
  return { data };
};
export const reverse_geocode = async (lon: number, lat: number) => {
  const params = new URLSearchParams({
    lon: lon.toString(),
    lat: lat.toString(),
    format: 'json',
  });
  const response = await fetch(`${NOMINATIME_URL_REVERSE}?${params}`);

  if (!response.ok) {
    throw new Error(`Could not fetch resource`);
  }

  const data: NominationResponse = await response.json();
  return { data };
};

export const parseGeocodeResponse = (
  results: NominationResponse | NominationResponse[],
  lngLat?: [number, number]
) => {
  if (!Array.isArray(results)) {
    results = [results];
  }

  const processedResults = [];
  for (const [index, result] of results.entries()) {
    if (
      'error' in result &&
      // @ts-expect-error we know error exists in this case
      result.error.toLowerCase() === 'unable to geocode'
    ) {
      processedResults.push({
        title: lngLat?.toString() || '',
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
            : lngLat?.toString() || '',
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
