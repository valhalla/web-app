import type {
  ParsedDirectionsGeometry,
  ValhallaRouteResponse,
} from '@/components/types';
import type { Profile } from '@/stores/common-store';
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
const withDefaultNonNegative = (value: number | undefined, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : fallback;

type ShapeMatch = 'map_snap' | 'edge_walk' | 'walk_or_snap';

interface TraceOptions {
  accuracy?: number;
  radius?: number;
  gps_accuracy?: number;
  breakage_distance?: number;
  search_radius?: number;
  interpolation_distance?: number;
}

export const useTraceRouteQuery = ({
  polyline,
  fileText,
  costing = 'auto',
  shape_match = 'map_snap',
  trace_options,
}: {
  polyline?: string;
  fileText?: string;
  costing?: Profile;
  shape_match?: ShapeMatch;
  trace_options?: TraceOptions;
}) => {
  const valhallaCosting = costing === 'car' ? 'auto' : costing;

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

  const resolvedTraceOptions = {
    gps_accuracy: withDefaultNonNegative(
      trace_options?.gps_accuracy ?? trace_options?.accuracy,
      5
    ),
    search_radius: withDefaultNonNegative(
      trace_options?.search_radius ?? trace_options?.radius,
      50
    ),
    interpolation_distance: withDefaultNonNegative(
      trace_options?.interpolation_distance,
      10
    ),
    breakage_distance: withDefaultNonNegative(
      trace_options?.breakage_distance,
      50
    ),
  };

  const valhallaRequest = {
    json: {
      ...(hasPolyline
        ? {
            encoded_polyline: normalizePolyline(polyline!),
            shape_match: shape_match ?? 'map_snap',
          }
        : {
            shape,
            shape_match: shape_match ?? 'map_snap',
          }),
      costing: valhallaCosting,
      trace_options: resolvedTraceOptions,
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
