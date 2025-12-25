import { useState, useEffect, useMemo, memo } from 'react';
import { LayersIcon } from 'lucide-react';
import Map, { useMap } from 'react-map-gl/maplibre';
import type maplibregl from 'maplibre-gl';
import { ControlButton, CustomControl } from './custom-control';

import shortbreadStyle from './style.json';
import cartoStyle from './carto.json';
import type { SearchParamsSchema } from '@/routes';
import { z } from 'zod';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CustomStylesDialog } from './custom-styles-dialog';
import { EditStylesDialog } from './edit-styles-dialog';

export const MAP_STYLE_STORAGE_KEY = 'selectedMapStyle';
export const CUSTOM_STYLE_STORAGE_KEY = 'customMapStyle';

export type MapStyleType = 'shortbread' | 'carto' | 'custom';

// Map style configurations
const MAP_STYLES = [
  {
    id: 'shortbread',
    label: 'Shortbread',
    style: shortbreadStyle,
  },
  {
    id: 'carto',
    label: 'Carto',
    style: cartoStyle,
  },
] as const;

export const getInitialMapStyle = (
  urlValue?: SearchParamsSchema['style']
): MapStyleType => {
  // check url params first
  if (urlValue === 'carto' || urlValue === 'shortbread') return urlValue;

  if (urlValue === 'custom') {
    const customStyle = localStorage.getItem(CUSTOM_STYLE_STORAGE_KEY);
    if (customStyle) return 'custom';
    return 'shortbread';
  }

  // fallback to localStorage
  const savedStyle = localStorage.getItem(MAP_STYLE_STORAGE_KEY);

  const parsedSavedStyle = z
    .enum(['shortbread', 'carto', 'custom'])
    .safeParse(savedStyle);

  if (parsedSavedStyle.data === 'custom') {
    const customStyle = localStorage.getItem(CUSTOM_STYLE_STORAGE_KEY);
    if (!customStyle) return 'shortbread';
  }

  return parsedSavedStyle.success ? parsedSavedStyle.data : 'shortbread';
};

interface MapStyleControlProps {
  customStyleData: maplibregl.StyleSpecification | null;
  onStyleChange?: (style: MapStyleType) => void;
  onCustomStyleLoaded?: (styleData: maplibregl.StyleSpecification) => void;
}

export const getCustomStyle = (): maplibregl.StyleSpecification | null => {
  const customStyleJson = localStorage.getItem(CUSTOM_STYLE_STORAGE_KEY);
  if (!customStyleJson) return null;
  try {
    return JSON.parse(customStyleJson) as maplibregl.StyleSpecification;
  } catch {
    return null;
  }
};

interface MapStyleOptionProps {
  id: MapStyleType;
  label: string;
  style: maplibregl.StyleSpecification;
  isSelected: boolean;
  onSelect: (id: MapStyleType) => void;
  mapCenter: { lng: number; lat: number } | undefined;
  zoom: number | undefined;
}

const MapStyleOption = memo(
  ({
    id,
    label,
    style,
    isSelected,
    onSelect,
    mapCenter,
    zoom,
  }: MapStyleOptionProps) => {
    // Memoize the map style to prevent unnecessary re-renders
    const memoizedMapStyle = useMemo(
      () => style as unknown as maplibregl.StyleSpecification,
      [style]
    );

    return (
      <div>
        <div
          onClick={() => onSelect(id)}
          className={`cursor-pointer overflow-hidden rounded border-3 transition-colors ${
            isSelected ? 'border-primary' : 'border-transparent'
          }`}
        >
          <Map
            id={`${id}-map`}
            onMove={() => {}}
            longitude={mapCenter?.lng}
            latitude={mapCenter?.lat}
            zoom={zoom}
            attributionControl={false}
            style={{ width: '226px', height: '64px', display: 'block' }}
            mapStyle={memoizedMapStyle}
            boxZoom={false}
            doubleClickZoom={false}
            dragPan={false}
            dragRotate={false}
            interactive={false}
          />
        </div>
        <div
          className={`mt-1.5 text-center text-[13px] ${
            isSelected
              ? 'font-bold text-primary'
              : 'font-normal text-muted-foreground'
          }`}
        >
          {label}
        </div>
      </div>
    );
  }
);

MapStyleOption.displayName = 'MapStyleOption';

export const MapStyleControl = ({
  customStyleData,
  onStyleChange,
  onCustomStyleLoaded,
}: MapStyleControlProps) => {
  const [selectedStyle, setSelectedStyle] =
    useState<MapStyleType>(getInitialMapStyle);

  const { current: map } = useMap();
  const mapCenter = map?.getCenter();
  const zoom = map?.getZoom();

  // Save to localStorage whenever selectedStyle changes
  useEffect(() => {
    localStorage.setItem(MAP_STYLE_STORAGE_KEY, selectedStyle);
    onStyleChange?.(selectedStyle);
  }, [selectedStyle, onStyleChange]);

  // Memoize the map options to prevent re-creating them on every render
  const mapOptions = useMemo(() => {
    const options: Array<{
      id: MapStyleType;
      label: string;
      style: maplibregl.StyleSpecification;
      isSelected: boolean;
    }> = MAP_STYLES.map((mapStyle) => ({
      id: mapStyle.id,
      label: mapStyle.label,
      style: mapStyle.style as unknown as maplibregl.StyleSpecification,
      isSelected: selectedStyle === mapStyle.id,
    }));

    if (customStyleData) {
      options.push({
        id: 'custom',
        label: customStyleData.name || 'Custom',
        style: customStyleData,
        isSelected: selectedStyle === 'custom',
      });
    }

    return options;
  }, [selectedStyle, customStyleData]);

  return (
    <CustomControl position="topRight">
      <Popover>
        <PopoverTrigger asChild>
          <ControlButton title="Map Styles" icon={<LayersIcon size={17} />} />
        </PopoverTrigger>
        <PopoverContent className="mt-1 mr-2 rounded-md animate-in fade-in-0 zoom-in-95 w-[266px]">
          <div className="space-y-2">
            <div className="flex flex-col gap-2.5">
              {mapOptions.map((mapOption) => (
                <MapStyleOption
                  key={mapOption.id}
                  id={mapOption.id}
                  label={mapOption.label}
                  style={mapOption.style}
                  isSelected={mapOption.isSelected}
                  onSelect={setSelectedStyle}
                  mapCenter={mapCenter}
                  zoom={zoom}
                />
              ))}
              <CustomStylesDialog
                onStyleLoaded={(styleData) => {
                  setSelectedStyle('custom');
                  onCustomStyleLoaded?.(styleData);
                }}
              />
              {customStyleData && selectedStyle === 'custom' && (
                <EditStylesDialog
                  styleData={customStyleData}
                  onStyleSaved={(styleData) => {
                    onCustomStyleLoaded?.(styleData);
                  }}
                />
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </CustomControl>
  );
};
