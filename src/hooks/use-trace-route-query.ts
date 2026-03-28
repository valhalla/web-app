import type {
  ParsedDirectionsGeometry,
  ValhallaRouteResponse,
} from '@/components/types';
import { parseGpxToLatLng } from '@/utils/parse-gpx';
import {
  getValhallaUrl,
  parseDirectionsGeometry,
  showValhallaWarnings,
} from '@/utils/valhalla';
import axios from 'axios';

type Shape = {
  lat: number;
  lon: number;
  type?: 'break' | 'via' | 'through';
  time?: number;
};

const normalizePolyline = (input: string) => input.trim().replace(/\r?\n/g, '');

export const useTraceRouteQuery = ({
  polyline,
  fileText,
}: {
  polyline?: string;
  fileText?: string;
}) => {
  const hasPolyline = !!polyline?.trim();
  const hasFile = !!fileText?.trim();

  let shape: Shape[] = [];
  if (!hasPolyline && hasFile) {
    const coords = parseGpxToLatLng(fileText!);
    shape = coords.map(([lat, lon]) => ({ lat, lon }));

    if (shape.length >= 2) {
      shape[0]!.type = 'break';
      shape[shape.length - 1]!.type = 'break';
    }
  }

  const valhallaRequest = {
    json: {
      ...(hasPolyline
        ? {
            encoded_polyline: normalizePolyline(polyline!),
            shape_match: 'map_snap',
          }
        : {
            shape,
            shape_match: 'map_snap',
          }),
      costing: 'auto',
    },
  };

  const traceRoute = async () => {
    if (!hasPolyline && !hasFile) {
      throw new Error('Provide an encoded polyline or a GPX file.');
    }
    if (!hasPolyline && hasFile && shape.length < 2) {
      throw new Error('GPX must contain at least 2 points.');
    }

    const { data } = await axios.post<ValhallaRouteResponse>(
      `${getValhallaUrl()}/trace_route`,
      valhallaRequest.json,
      { headers: { 'Content-Type': 'application/json' } }
    );

    (data as ParsedDirectionsGeometry).decodedGeometry =
      parseDirectionsGeometry(data);

    data.alternates?.forEach((alternate, i) => {
      if (alternate) {
        (data.alternates![i] as ParsedDirectionsGeometry).decodedGeometry =
          parseDirectionsGeometry(alternate);
      }
    });

    showValhallaWarnings(data.trip.warnings);

    return data as ParsedDirectionsGeometry;
  };

  return { traceRoute };
};
