import { useTraceRouteQuery } from '@/hooks/use-trace-route-query';
import { useCommonStore } from '@/stores/common-store';
import { useTraceRouteStore } from '@/stores/trace-route-store';
import axios from 'axios';
import { useEffect, useState } from 'react';
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

export const TraceRouteControl = () => {
  const [encodedPolyline, setEncodedPolyline] = useState('');
  const [fileText, setFileText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shapeMatch, setShapeMatch] = useState<
    'walk_or_snap' | 'map_snap' | 'edge_walk'
  >('map_snap');
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(5);
  const [searchRadius, setSearchRadius] = useState<number>(50);

  const showLoading = useCommonStore((state) => state.showLoading);
  const zoomTo = useCommonStore((state) => state.zoomTo);

  const receiveTraceRouteResults = useTraceRouteStore(
    (state) => state.receiveTraceRouteResults
  );
  const clearTraceRoute = useTraceRouteStore((state) => state.clearTraceRoute);

  const { traceRoute } = useTraceRouteQuery({
    polyline: encodedPolyline || undefined,
    fileText: fileText || undefined,
  });
  const setInputGeometry = useTraceRouteStore(
    (state) => state.setInputGeometry
  );

  useEffect(() => {
    const t = window.setTimeout(() => {
      const value = encodedPolyline.trim();
      if (!value) {
        setInputGeometry(null);
        return;
      }

      const coords = decode(value, 6) as [number, number][];
      setInputGeometry(coords.length >= 2 ? coords : null);
    }, 250);

    return () => window.clearTimeout(t);
  }, [encodedPolyline, setInputGeometry]);

  const onPolylineChange = (value: string) => {
    setEncodedPolyline(value);

    const decoded = decode(value);
    setInputGeometry(decoded);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    const file = e.target.files?.[0];
    if (!file) {
      setInputGeometry(null);
      return;
    }

    const text = await file.text();
    setFileText(text);
    const coords = parseGpxToLatLng(text);

    setInputGeometry(coords.length >= 2 ? coords : null);
  };

  const handleTraceRoute = async () => {
    try {
      setIsProcessing(true);
      showLoading(true);
      const data = await traceRoute();
      if (data) {
        receiveTraceRouteResults({ data });
        zoomTo(data.decodedGeometry);
      }
      return data;
    } catch (error) {
      clearTraceRoute();
      if (axios.isAxiosError(error) && error.response) {
        const response = error.response;
        let error_msg = response.data.error;
        if (response.data.error_code === 154) {
          error_msg += ` for route.`;
        }

        toast.warning(`${response.data.status}`, {
          description: `${error_msg}`,
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
      throw error;
    } finally {
      setIsProcessing(false);
      setTimeout(() => showLoading(false), 500);
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
        className="w-full p-2 border rounded"
        onChange={onFileChange}
      />

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
            GPS accuracy (m)
            <input
              type="number"
              className="border rounded p-2"
              value={gpsAccuracy}
              min={0}
              onChange={(e) => setGpsAccuracy(Number(e.target.value))}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Search radius (m)
            <input
              type="number"
              className="border rounded p-2"
              value={searchRadius}
              min={0}
              max={100}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
            />
          </label>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
