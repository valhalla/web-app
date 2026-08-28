import { getValhallaUrl } from './valhalla';

type LatLng = [lat: number, lng: number];

interface HeightResponse {
  height?: number[];
}

export const fetchHeight = async ({
  coordinates,
}: {
  coordinates: LatLng[];
}): Promise<HeightResponse> => {
  const resample_distance = 30; // meters
  const height_precision = 2;

  const heightPayload = {
    shape: coordinates.map(([lat, lng]) => ({ lat, lon: lng })),
    resample_distance,
    height_precision,
    id: 'valhalla_height',
  };

  try {
    const res = await fetch(`${getValhallaUrl()}/height`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(heightPayload),
    });

    if (!res.ok) {
      throw new Error(
        `Failed to fetch height (${res.status} ${res.statusText})`
      );
    }

    const data = await res.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch height data: ${error.message}`);
    }
    throw new Error('Failed to fetch height data: Unknown error');
  }
};
