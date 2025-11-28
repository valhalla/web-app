import { useState, useEffect, useMemo, memo, useRef } from 'react';
import { LayersIcon } from 'lucide-react';
import Map, { useMap } from 'react-map-gl/maplibre';
import type maplibregl from 'maplibre-gl';
import { ControlButton, CustomControl } from './custom-control';

import shortbreadStyle from './style.json';
import cartoStyle from './carto.json';

export const MAP_STYLE_STORAGE_KEY = 'selectedMapStyle';

type MapStyleType = 'shortbread' | 'carto';

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

export const getInitialMapStyle = (): MapStyleType => {
  // check url params first
  const urlParams = new URLSearchParams(window.location.search);
  const styleParam = urlParams.get('style');
  if (styleParam === 'carto' || styleParam === 'shortbread') {
    return styleParam;
  }

  // fallback to localStorage
  const savedStyle = localStorage.getItem(MAP_STYLE_STORAGE_KEY);
  return savedStyle === 'shortbread' || savedStyle === 'carto'
    ? savedStyle
    : 'shortbread';
};

interface MapStyleControlProps {
  onStyleChange?: (style: MapStyleType) => void;
}

interface MapStyleOptionProps {
  id: MapStyleType;
  label: string;
  style: typeof shortbreadStyle | typeof cartoStyle;
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
            style={{
              width: '226px',
              height: '64px',
              display: 'block',
            }}
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

export const MapStyleControl = ({ onStyleChange }: MapStyleControlProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] =
    useState<MapStyleType>(getInitialMapStyle);
  const containerRef = useRef<HTMLDivElement>(null);

  const { current: map } = useMap();
  const mapCenter = map?.getCenter();
  const zoom = map?.getZoom();

  // Save to localStorage whenever selectedStyle changes
  useEffect(() => {
    localStorage.setItem(MAP_STYLE_STORAGE_KEY, selectedStyle);
    onStyleChange?.(selectedStyle);
  }, [selectedStyle, onStyleChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDrawer = () => {
    setIsOpen((prevState) => !prevState);
  };

  // Memoize the map options to prevent re-creating them on every render
  const mapOptions = useMemo(
    () =>
      MAP_STYLES.map((mapStyle) => ({
        ...mapStyle,
        isSelected: selectedStyle === mapStyle.id,
      })),
    [selectedStyle]
  );

  return (
    <CustomControl position="topRight">
      <div ref={containerRef} className="relative">
        <ControlButton
          title="Map Styles"
          onClick={toggleDrawer}
          icon={<LayersIcon size={17} />}
        />
        {isOpen && (
          <div className="absolute right-0 top-full mt-1 z-50 rounded-md border bg-popover p-4 shadow-md animate-in fade-in-0 zoom-in-95">
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
            </div>
          </div>
        )}
      </div>
    </CustomControl>
  );
};
