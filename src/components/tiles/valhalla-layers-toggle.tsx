import { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import { useCommonStore } from '@/stores/common-store';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { LayerSpecification } from 'maplibre-gl';
import {
  VALHALLA_SOURCE_ID,
  fetchValhallaLayers,
  getValhallaSourceSpec,
} from './valhalla-layers';

export const ValhallaLayersToggle = () => {
  const { mainMap } = useMap();
  const mapReady = useCommonStore((state) => state.mapReady);
  const [enabled, setEnabled] = useState(false);
  const layersRef = useRef<LayerSpecification[]>([]);
  const toggleIdRef = useRef(0);

  useEffect(() => {
    if (!mainMap) return;

    const map = mainMap.getMap();

    const handleStyleData = () => {
      const hasSource = !!map.getSource(VALHALLA_SOURCE_ID);
      setEnabled(hasSource);
    };

    map.on('styledata', handleStyleData);

    return () => {
      map.off('styledata', handleStyleData);
    };
  }, [mainMap]);

  const handleToggle = async (checked: boolean) => {
    if (!mainMap || !mapReady) return;

    const map = mainMap.getMap();
    const currentToggleId = ++toggleIdRef.current;
    setEnabled(checked);

    if (checked) {
      const layers = await fetchValhallaLayers();

      // If the toggle was flipped again while we were fetching, bail out.
      if (toggleIdRef.current !== currentToggleId) return;

      layersRef.current = layers;

      if (!map.getSource(VALHALLA_SOURCE_ID)) {
        map.addSource(VALHALLA_SOURCE_ID, getValhallaSourceSpec());
      }
      for (const layer of layers) {
        if (!map.getLayer(layer.id)) {
          map.addLayer(layer);
        }
      }
    } else {
      for (const layer of layersRef.current) {
        if (map.getLayer(layer.id)) {
          map.removeLayer(layer.id);
        }
      }

      if (map.getSource(VALHALLA_SOURCE_ID)) {
        map.removeSource(VALHALLA_SOURCE_ID);
      }
    }
  };

  if (!mapReady) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-muted/50 rounded-md">
      <Label
        htmlFor="valhalla-layers-toggle"
        className="text-sm font-medium cursor-pointer"
      >
        Append Valhalla layers
      </Label>
      <Switch
        id="valhalla-layers-toggle"
        checked={enabled}
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-green-600"
      />
    </div>
  );
};
