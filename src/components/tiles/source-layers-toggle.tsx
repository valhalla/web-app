import { useCallback, useEffect, useState } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import type { LayerSpecification, SourceSpecification } from 'maplibre-gl';
import { useCommonStore } from '@/stores/common-store';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface SourceLayersToggleProps {
  label: string;
  sourceId: string;
  layers: LayerSpecification[];
  customLayers: { layer: LayerSpecification; visible: boolean }[];
  buildSourceSpec: () => SourceSpecification;
}

export const SourceLayersToggle = ({
  label,
  sourceId,
  layers,
  customLayers,
  buildSourceSpec,
}: SourceLayersToggleProps) => {
  const { mainMap } = useMap();
  const mapReady = useCommonStore((state) => state.mapReady);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!mainMap) return;

    const map = mainMap.getMap();

    const handleStyleData = () => {
      setEnabled(!!map.getSource(sourceId));
    };

    map.on('styledata', handleStyleData);

    return () => {
      map.off('styledata', handleStyleData);
    };
  }, [mainMap, sourceId]);

  const applyLayers = useCallback(
    (visible: boolean) => {
      if (!mainMap || !mapReady) return;

      const map = mainMap.getMap();
      setEnabled(visible);

      if (visible) {
        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, buildSourceSpec());
        }

        for (const layer of layers) {
          if (!map.getLayer(layer.id)) {
            map.addLayer(layer);
          }
        }

        for (const entry of customLayers) {
          const layerSource =
            'source' in entry.layer ? entry.layer.source : undefined;

          if (layerSource !== sourceId || map.getLayer(entry.layer.id)) {
            continue;
          }

          try {
            map.addLayer(entry.layer);
            if (!entry.visible) {
              map.setLayoutProperty(entry.layer.id, 'visibility', 'none');
            }
          } catch {
            // The layer can only be added after the source becomes available.
          }
        }
        return;
      }

      for (const layer of layers) {
        if (map.getLayer(layer.id)) {
          map.removeLayer(layer.id);
        }
      }

      for (const entry of customLayers) {
        const layerSource =
          'source' in entry.layer ? entry.layer.source : undefined;

        if (layerSource !== sourceId || !map.getLayer(entry.layer.id)) {
          continue;
        }

        map.removeLayer(entry.layer.id);
      }

      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    },
    [buildSourceSpec, customLayers, layers, mainMap, mapReady, sourceId]
  );

  if (!mapReady) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-muted/50 rounded-md">
      <Label
        htmlFor={`${sourceId}-toggle`}
        className="text-sm font-medium cursor-pointer"
      >
        {label}
      </Label>
      <Switch
        id={`${sourceId}-toggle`}
        checked={enabled}
        onCheckedChange={applyLayers}
        className="data-[state=checked]:bg-green-600"
      />
    </div>
  );
};
