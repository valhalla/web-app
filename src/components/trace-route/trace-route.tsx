import { useTraceRouteQuery } from '@/hooks/use-trace-route-query';
import { useCommonStore, type Profile } from '@/stores/common-store';
import { useTraceRouteStore } from '@/stores/trace-route-store';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { AccessibleIcon } from '@radix-ui/react-accessible-icon';
import { ChevronDown, Settings } from 'lucide-react';
import { decode } from '@/utils/polyline';
import { parseGpxToLatLng } from '@/utils/parse-gpx';
import { useSearch } from '@tanstack/react-router';
import type { ParsedDirectionsGeometry } from '@/components/types';
import { Summary } from './summary';
import { Maneuvers } from './maneuvers';

type TraceRouteErrorPayload = {
  status?: string;
  error?: string;
  error_code?: number;
};

export const TraceRouteControl = () => {
  const [encodedPolyline, setEncodedPolyline] = useState('');
  const [fileText, setFileText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { profile } = useSearch({ from: '/$activeTab' }) as {
    profile: Profile;
  };
  const [shapeMatch, setShapeMatch] = useState<
    'walk_or_snap' | 'map_snap' | 'edge_walk'
  >('map_snap');
  const [accuracy, setAccuracy] = useState<number>(5);
  const [radius, setRadius] = useState<number>(50);
  const [breakageDistance, setBreakageDistance] = useState<number>(50);
  const [interpolationDistance, setInterpolationDistance] =
    useState<number>(10);
  const [showManeuvers, setShowManeuvers] = useState(false);
  const isMountedRef = useRef(true);
  const loadingTimeoutRef = useRef<number | null>(null);
  const fileReadSeqRef = useRef(0);
  const showLoading = useCommonStore((state) => state.showLoading);
  const zoomTo = useCommonStore((state) => state.zoomTo);
  const [fileName, setFileName] = useState<string>('');

  const receiveTraceRouteResults = useTraceRouteStore(
    (state) => state.receiveTraceRouteResults
  );
  const clearTraceRoute = useTraceRouteStore((state) => state.clearTraceRoute);
  const traceRouteResults = useTraceRouteStore((state) => state.results);
  const traceRouteSuccessful = useTraceRouteStore((state) => state.successful);
  const activeRouteIndex = useTraceRouteStore(
    (state) => state.activeRouteIndex
  );
  const setActiveRouteIndex = useTraceRouteStore(
    (state) => state.setActiveRouteIndex
  );

  const shapeBuilder = (coords: [number, number][]) => {
    const shape = coords.map(([lat, lon]) => ({ lat, lon })) as {
      lat: number;
      lon: number;
      type?: 'break' | 'via' | 'through';
    }[];

    if (shape.length >= 2) {
      shape[0]!.type = 'break';
      shape[shape.length - 1]!.type = 'break';
    }
    return shape;
  };

  const MAX_GPX_BYTES = 2 * 1024 * 1024; // 2 MB

  const { traceRoute } = useTraceRouteQuery({
    polyline: encodedPolyline || undefined,
    fileText: fileText || undefined,
    costing: profile,
    shape_match: shapeMatch,
    trace_options: {
      accuracy,
      radius,
      breakage_distance: breakageDistance,
      interpolation_distance: interpolationDistance,
    },
  });
  const setInputGeometry = useTraceRouteStore(
    (state) => state.setInputGeometry
  );
  const setInputShape = useTraceRouteStore((state) => state.setInputShape);

  const routeOptions = traceRouteResults.data
    ? [
        {
          index: 0,
          title: 'Main Route',
          data: traceRouteResults.data as ParsedDirectionsGeometry,
        },
        ...((traceRouteResults.data.alternates ?? []).map((alternate, i) => ({
          index: i + 1,
          title: `Alternate Route #${i + 1}`,
          data: alternate as ParsedDirectionsGeometry,
        })) ?? []),
      ]
    : [];

  const selectedRoute =
    routeOptions.find((route) => route.index === activeRouteIndex) ??
    routeOptions[0];

  useEffect(() => {
    setShowManeuvers(false);
  }, [activeRouteIndex, traceRouteResults.data]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (loadingTimeoutRef.current !== null) {
        window.clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const value = encodedPolyline.trim();
      if (!value) {
        setInputGeometry(null);
        setInputShape(null);
        clearTraceRoute();
        return;
      }

      const coords = decode(value, 6) as [number, number][];
      setInputGeometry(coords.length >= 2 ? coords : null);
    }, 250);

    return () => window.clearTimeout(t);
  }, [encodedPolyline, setInputGeometry, setInputShape, clearTraceRoute]);

  const onPolylineChange = (value: string) => {
    setEncodedPolyline(value);
    const v = value.trim();
    if (!v) {
      setInputGeometry(null);
      setInputShape(null);
      clearTraceRoute();

      return;
    }
    const coords = decode(v, 6) as [number, number][];
    zoomTo(coords);
    setInputGeometry(coords.length >= 2 ? coords : null);

    if (coords.length >= 2) {
      const shape = shapeBuilder(coords);
      setInputShape(shape);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const readSeq = ++fileReadSeqRef.current;
    setFile(e.target.files?.[0] || null);
    const file = e.target.files?.[0];
    if (!file) {
      setFileName('');
      setFileText('');
      setInputGeometry(null);
      setInputShape(null);
      clearTraceRoute();
      return;
    }

    if (file.size > MAX_GPX_BYTES) {
      e.target.value = '';

      setFile(null);
      setFileName('');
      setFileText('');
      setInputGeometry(null);
      setInputShape(null);

      toast.warning('File too large', {
        description: `Max GPX size is ${(MAX_GPX_BYTES / (1024 * 1024)).toFixed(0)} MB.`,
        position: 'bottom-center',
        duration: 5000,
        closeButton: true,
      });
      return;
    }

    setFileName(file.name);

    const text = await file.text();
    if (!isMountedRef.current || readSeq !== fileReadSeqRef.current) {
      return;
    }
    setFileText(text);
    const coords = parseGpxToLatLng(text);
    zoomTo(coords);
    setInputGeometry(coords.length >= 2 ? coords : null);
    const shape = shapeBuilder(coords);
    setInputShape(shape.length >= 2 ? shape : null);
  };

  const handleTraceRoute = async () => {
    try {
      setIsProcessing(true);
      showLoading(true);
      const data = await traceRoute();
      if (isMountedRef.current && data) {
        receiveTraceRouteResults({ data });
        zoomTo(data.decodedGeometry);
      }
      return data;
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }
      clearTraceRoute();
      if (axios.isAxiosError(error) && error.response) {
        const payload = (error.response.data ?? {}) as TraceRouteErrorPayload;
        const statusText = payload.status ?? 'Trace route failed';
        let errorMsg =
          payload.error ??
          (error instanceof Error ? error.message : 'Unknown error');
        if (payload.error_code === 154 && !errorMsg.endsWith('for route.')) {
          errorMsg += ' for route.';
        }

        toast.warning(statusText, {
          description: errorMsg,
          position: 'bottom-center',
          duration: 5000,
          closeButton: true,
        });
      } else {
        toast.warning('Trace route failed', {
          description: error instanceof Error ? error.message : 'Unknown error',
          position: 'bottom-center',
          duration: 5000,
          closeButton: true,
        });
      }
    } finally {
      if (!isMountedRef.current) {
        return;
      }
      setIsProcessing(false);
      if (loadingTimeoutRef.current !== null) {
        window.clearTimeout(loadingTimeoutRef.current);
      }
      loadingTimeoutRef.current = window.setTimeout(() => {
        if (isMountedRef.current) {
          showLoading(false);
        }
      }, 500);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={encodedPolyline}
        onChange={(e) => onPolylineChange(e.target.value)}
        placeholder="Enter encoded polyline"
        className="w-full p-2 border rounded"
      />

      <input
        type="file"
        accept=".gpx"
        className="sr-only"
        onChange={onFileChange}
        id="file-upload"
        aria-describedby="gpx-file-help"
        aria-label="Upload GPX file"
      />
      <label
        htmlFor="file-upload"
        className={`w-full p-2 border rounded cursor-pointer block ${fileName ? 'text-blue-700' : 'text-gray-500'}`}
        title={fileName || 'Upload GPX file'}
      >
        <span className="block truncate">{fileName || 'Upload GPX file'}</span>
      </label>
      <p id="gpx-file-help" className="text-xs text-muted-foreground">
        Max file size: {(MAX_GPX_BYTES / (1024 * 1024)).toFixed(0)} MB
      </p>

      <Button
        className="w-full"
        disabled={isProcessing || (!encodedPolyline && !file)}
        onClick={handleTraceRoute}
      >
        {isProcessing ? 'Loading...' : 'Trace Route'}
      </Button>

      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <Settings className="size-3" />
              Advanced settings
            </div>
            <AccessibleIcon label="Toggle advanced settings">
              <ChevronDown className="size-3" />
            </AccessibleIcon>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="p-3 mt-1 rounded-md border flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Shape match
            <select
              className="border rounded p-2"
              value={shapeMatch}
              onChange={(e) =>
                setShapeMatch(e.target.value as typeof shapeMatch)
              }
            >
              <option value="walk_or_snap">walk or snap</option>
              <option value="map_snap">map snap</option>
              <option value="edge_walk">edge walk</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Accuracy (m)
            <input
              type="number"
              className="border rounded p-2"
              value={accuracy}
              min={0}
              onChange={(e) => setAccuracy(Number(e.target.value))}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Radius (m)
            <input
              type="number"
              className="border rounded p-2"
              value={radius}
              min={0}
              max={100}
              onChange={(e) => setRadius(Number(e.target.value))}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Breakage distance (m)
            <input
              type="number"
              className="border rounded p-2"
              value={breakageDistance}
              min={0}
              onChange={(e) => setBreakageDistance(Number(e.target.value))}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Interpolation distance (m)
            <input
              type="number"
              className="border rounded p-2"
              value={interpolationDistance}
              min={0}
              onChange={(e) => setInterpolationDistance(Number(e.target.value))}
            />
          </label>
        </CollapsibleContent>
      </Collapsible>

      {traceRouteSuccessful && selectedRoute?.data?.trip && (
        <div className="mt-2 flex flex-col gap-2.5 border rounded-md p-2 bg-background">
          {routeOptions.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {routeOptions.map((route) => (
                <Button
                  key={route.index}
                  type="button"
                  variant={
                    route.index === activeRouteIndex ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() => setActiveRouteIndex(route.index)}
                >
                  {route.title}
                </Button>
              ))}
            </div>
          )}

          <Summary
            title={selectedRoute.title}
            summary={selectedRoute.data.trip.summary}
            index={selectedRoute.index}
            routeCoordinates={selectedRoute.data.decodedGeometry ?? []}
          />

          <Collapsible open={showManeuvers} onOpenChange={setShowManeuvers}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-fit">
                {showManeuvers ? 'Hide Maneuvers' : 'Show Maneuvers'}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <Maneuvers legs={selectedRoute.data.trip.legs} />
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </div>
  );
};
