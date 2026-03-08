import { useState, useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import { useCommonStore } from '@/stores/common-store';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  VALHALLA_SOURCE_ID,
  VALHALLA_LAYERS,
  getValhallaSourceSpec,
} from './valhalla-layers';
import { useCustomLayersStore } from '@/stores/custom-layers-store';

export const ValhallaLayersToggle = () => {
  const { mainMap } = useMap();
  const mapReady = useCommonStore((state) => state.mapReady);
  const [enabled, setEnabled] = useState(false);

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

  const handleToggle = (checked: boolean) => {
    if (!mainMap || !mapReady) return;

    const map = mainMap.getMap();
    setEnabled(checked);

    if (checked) {
      if (!map.getSource(VALHALLA_SOURCE_ID)) {
        map.addSource(VALHALLA_SOURCE_ID, getValhallaSourceSpec());
      }
      for (const layer of VALHALLA_LAYERS) {
        if (!map.getLayer(layer.id)) {
          map.addLayer(layer);
        }
      }
      const { layers: customLayers } = useCustomLayersStore.getState();
      for (const entry of customLayers) {
        const layerSource =
          'source' in entry.layer ? entry.layer.source : undefined;
        if (
          layerSource === VALHALLA_SOURCE_ID &&
          !map.getLayer(entry.layer.id)
        ) {
          try {
            map.addLayer(entry.layer);
            if (!entry.visible) {
              map.setLayoutProperty(entry.layer.id, 'visibility', 'none');
            }
          } catch {
            // skip
          }
        }
      }
    } else {
      for (const layer of VALHALLA_LAYERS) {
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
