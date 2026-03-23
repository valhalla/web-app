import { useState } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import type { LayerSpecification, SourceSpecification } from 'maplibre-gl';
import { useCommonStore } from '@/stores/common-store';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { VALHALLA_SOURCE_ID, getValhallaStyle } from './valhalla-layers';

interface ValhallaLayersToggleProps {
  customLayers: { layer: LayerSpecification; visible: boolean }[];
}

export const ValhallaLayersToggle = ({
  customLayers,
}: ValhallaLayersToggleProps) => {
  const { mainMap } = useMap();
  const mapReady = useCommonStore((state) => state.mapReady);
  const [enabled, setEnabled] = useState(false);

  const handleToggle = async (checked: boolean) => {
    if (!mainMap || !mapReady) return;

    const map = mainMap.getMap();
    setEnabled(checked);

    const style = await getValhallaStyle();

    Object.entries(style.sources).forEach(([sourceId, source]) => {
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, source as SourceSpecification);
      }
    });

    style.layers.forEach((layer: LayerSpecification) => {
      if (!map.getLayer(layer.id)) {
        map.addLayer(layer);
      }
    });

    for (const entry of customLayers) {
      const layerSource =
        'source' in entry.layer ? entry.layer.source : undefined;

      if (layerSource === VALHALLA_SOURCE_ID) {
        if (!map.getLayer(entry.layer.id)) {
          try {
            map.addLayer(entry.layer);
          } catch {
            continue;
          }
        }
        map.setLayoutProperty(
          entry.layer.id,
          'visibility',
          checked && entry.visible ? 'visible' : 'none'
        );
      }
    }

    ['edges', 'shortcuts', 'nodes'].forEach((id) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', checked ? 'visible' : 'none');
      }
    });
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
