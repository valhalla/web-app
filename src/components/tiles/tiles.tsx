import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import { useCommonStore } from '@/stores/common-store';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ValhallaLayersToggle } from './valhalla-layers-toggle';
import { VALHALLA_SOURCE_ID } from './valhalla-layers';
import { CustomLayerEditor } from './custom-layer-editor';
import { useCustomLayersStore } from '@/stores/custom-layers-store';

interface LayerInfo {
  id: string;
  type: string;
  sourceLayer?: string;
  source?: string;
}

interface GroupedLayers {
  [sourceLayer: string]: LayerInfo[];
}

export const TilesControl = () => {
  const { mainMap } = useMap();
  const mapReady = useCommonStore((state) => state.mapReady);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [visibilityOverrides, setVisibilityOverrides] = useState<
    Record<string, boolean>
  >({});
  const [styleVersion, setStyleVersion] = useState(0);

  const customLayers = useCustomLayersStore((state) => state.layers);
  const removeCustomLayer = useCustomLayersStore((state) => state.removeLayer);
  const setCustomLayerVisibility = useCustomLayersStore(
    (state) => state.setLayerVisibility
  );

  // Keep a ref so the styledata handler always sees the latest custom layers
  // without needing to re-register on every layer change.
  const customLayersRef = useRef(customLayers);
  useEffect(() => {
    customLayersRef.current = customLayers;
  }, [customLayers]);

  useEffect(() => {
    if (!mainMap) return;

    const map = mainMap.getMap();

    const handleStyleData = () => {
      // Re-apply custom layers whose source is already on the map.
      for (const entry of customLayersRef.current) {
        if (!map.getLayer(entry.layer.id)) {
          try {
            map.addLayer(entry.layer);
            if (!entry.visible) {
              map.setLayoutProperty(entry.layer.id, 'visibility', 'none');
            }
          } catch {
            // Source not available yet so skip.
          }
        }
      }

      setStyleVersion((v) => v + 1);
      setVisibilityOverrides({});
      setExpandedGroups(new Set());
    };

    map.on('styledata', handleStyleData);

    return () => {
      map.off('styledata', handleStyleData);
    };
  }, [mainMap]);

  const layers = useMemo(() => {
    if (!mapReady || !mainMap) return [];

    const map = mainMap.getMap();
    const style = map.getStyle();
    if (!style?.layers) return [];

    const customLayerIds = new Set(customLayers.map((e) => e.layer.id));

    return style.layers
      .filter((layer) => {
        if (layer.id.startsWith('maplibregl-inspect-')) return false;
        if (layer.id.startsWith('td-')) return false;
        if (customLayerIds.has(layer.id)) return false;
        return true;
      })
      .map((layer) => ({
        id: layer.id,
        type: layer.type,
        sourceLayer:
          'source-layer' in layer ? layer['source-layer'] : undefined,
        source: 'source' in layer ? (layer.source as string) : undefined,
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- styleVersion is used to invalidate cache on style changes
  }, [mapReady, mainMap, styleVersion, customLayers]);

  const getLayerVisibility = useCallback(
    (layerId: string): boolean => {
      if (layerId in visibilityOverrides) {
        return visibilityOverrides[layerId] ?? true;
      }
      if (!mainMap) return true;
      const map = mainMap.getMap();
      return map.getLayoutProperty(layerId, 'visibility') !== 'none';
    },
    [mainMap, visibilityOverrides]
  );

  const filteredLayers = useMemo(() => {
    if (!searchQuery.trim()) return layers;
    const query = searchQuery.toLowerCase();
    return layers.filter(
      (layer) =>
        layer.id.toLowerCase().includes(query) ||
        layer.sourceLayer?.toLowerCase().includes(query)
    );
  }, [layers, searchQuery]);

  const groupedLayers = useMemo(() => {
    const grouped: GroupedLayers = {};
    const ungrouped: LayerInfo[] = [];

    for (const layer of filteredLayers) {
      if (layer.sourceLayer) {
        if (!grouped[layer.sourceLayer]) {
          grouped[layer.sourceLayer] = [];
        }
        grouped[layer.sourceLayer]!.push(layer);
      } else {
        ungrouped.push(layer);
      }
    }

    return { grouped, ungrouped };
  }, [filteredLayers]);

  const handleToggleLayer = (layerId: string, visible: boolean) => {
    if (!mainMap) return;

    const map = mainMap.getMap();
    map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
    setVisibilityOverrides((prev) => ({ ...prev, [layerId]: visible }));
  };

  const handleToggleGroup = (sourceLayer: string, visible: boolean) => {
    if (!mainMap) return;

    const map = mainMap.getMap();
    const layersInGroup = groupedLayers.grouped[sourceLayer] || [];
    const updates: Record<string, boolean> = {};

    for (const layer of layersInGroup) {
      map.setLayoutProperty(
        layer.id,
        'visibility',
        visible ? 'visible' : 'none'
      );
      updates[layer.id] = visible;
    }

    setVisibilityOverrides((prev) => ({ ...prev, ...updates }));
  };

  const toggleExpanded = (sourceLayer: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(sourceLayer)) {
        next.delete(sourceLayer);
      } else {
        next.add(sourceLayer);
      }
      return next;
    });
  };

  const isGroupVisible = (sourceLayer: string) => {
    const layersInGroup = groupedLayers.grouped[sourceLayer] || [];
    return layersInGroup.every((layer) => getLayerVisibility(layer.id));
  };

  const isGroupPartiallyVisible = (sourceLayer: string) => {
    const layersInGroup = groupedLayers.grouped[sourceLayer] || [];
    const visibleCount = layersInGroup.filter((layer) =>
      getLayerVisibility(layer.id)
    ).length;
    return visibleCount > 0 && visibleCount < layersInGroup.length;
  };

  const isValhallaGroup = (sourceLayer: string) => {
    const layersInGroup = groupedLayers.grouped[sourceLayer] || [];
    return layersInGroup.some((layer) => layer.source === VALHALLA_SOURCE_ID);
  };

  const handleRemoveCustomLayer = (id: string) => {
    if (!mainMap) return;
    const map = mainMap.getMap();
    if (map.getLayer(id)) {
      map.removeLayer(id);
    }
    removeCustomLayer(id);
    setStyleVersion((v) => v + 1);
  };

  const handleToggleCustomLayer = (id: string, visible: boolean) => {
    if (!mainMap) return;
    const map = mainMap.getMap();
    if (map.getLayer(id)) {
      map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
    }
    setCustomLayerVisibility(id, visible);
  };

  return (
    <div className="flex flex-col gap-3 flex-1 overflow-hidden min-h-0">
      <ValhallaLayersToggle />

      <Input
        type="text"
        placeholder="Search layers..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="flex flex-col gap-1 flex-1 overflow-y-auto min-h-0">
        {Object.entries(groupedLayers.grouped).map(
          ([sourceLayer, groupLayers]) => (
            <Collapsible
              key={sourceLayer}
              open={expandedGroups.has(sourceLayer)}
              onOpenChange={() => toggleExpanded(sourceLayer)}
            >
              <div
                className={cn(
                  'flex items-center gap-2 p-2 bg-muted/50 rounded-md',
                  isValhallaGroup(sourceLayer) &&
                    'border-l-2 border-l-green-600'
                )}
              >
                <CollapsibleTrigger className="flex items-center gap-1 flex-1 text-left">
                  {expandedGroups.has(sourceLayer) ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                  <span className="font-medium text-sm">{sourceLayer}</span>
                  <span className="text-xs text-muted-foreground ml-1">
                    ({groupLayers.length})
                  </span>
                  {isValhallaGroup(sourceLayer) && (
                    <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded ml-2">
                      Valhalla
                    </span>
                  )}
                </CollapsibleTrigger>
                <Switch
                  checked={isGroupVisible(sourceLayer)}
                  onCheckedChange={(checked) =>
                    handleToggleGroup(sourceLayer, checked)
                  }
                  className={
                    isGroupPartiallyVisible(sourceLayer) ? 'opacity-50' : ''
                  }
                />
              </div>
              <CollapsibleContent>
                <div className="flex flex-col gap-1 pl-6 pt-1">
                  {groupLayers.map((layer) => (
                    <div
                      key={layer.id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30"
                    >
                      <Label
                        htmlFor={layer.id}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {layer.id}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({layer.type})
                        </span>
                      </Label>
                      <Switch
                        id={layer.id}
                        checked={getLayerVisibility(layer.id)}
                        onCheckedChange={(checked) =>
                          handleToggleLayer(layer.id, checked)
                        }
                      />
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        )}

        {groupedLayers.ungrouped.map((layer) => (
          <div
            key={layer.id}
            className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30"
          >
            <Label htmlFor={layer.id} className="text-sm cursor-pointer flex-1">
              {layer.id}
              <span className="text-xs text-muted-foreground ml-2">
                ({layer.type})
              </span>
            </Label>
            <Switch
              id={layer.id}
              checked={getLayerVisibility(layer.id)}
              onCheckedChange={(checked) =>
                handleToggleLayer(layer.id, checked)
              }
            />
          </div>
        ))}

        {filteredLayers.length === 0 && customLayers.length === 0 && (
          <div className="text-center text-muted-foreground py-4">
            No layers found
          </div>
        )}

        {customLayers.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 pt-2">
              Custom Layers
            </p>
            {customLayers.map(({ layer, visible }) => (
              <div
                key={layer.id}
                className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30 border-l-2 border-l-blue-500"
              >
                <Label
                  htmlFor={`custom-${layer.id}`}
                  className="text-sm cursor-pointer flex-1 truncate min-w-0 mr-2"
                >
                  {layer.id}
                  <span className="text-xs text-muted-foreground ml-2">
                    ({layer.type})
                  </span>
                </Label>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    id={`custom-${layer.id}`}
                    checked={visible}
                    onCheckedChange={(checked) =>
                      handleToggleCustomLayer(layer.id, checked)
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleRemoveCustomLayer(layer.id)}
                    className="text-destructive hover:text-destructive"
                    aria-label={`Remove ${layer.id} layer`}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CustomLayerEditor />
    </div>
  );
};
