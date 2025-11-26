import { useState, useEffect, useMemo, memo } from 'react';
import { Popup } from 'semantic-ui-react';
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
          style={{
            border: `3px solid ${isSelected ? '#2185d0' : 'transparent'}`,
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'border-color 0.2s ease',
            overflow: 'hidden',
          }}
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
          style={{
            marginTop: '6px',
            fontSize: '13px',
            fontWeight: isSelected ? 'bold' : 'normal',
            color: isSelected ? '#2185d0' : '#666',
            textAlign: 'center',
          }}
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

  const { current: map } = useMap();
  const mapCenter = map?.getCenter();
  const zoom = map?.getZoom();

  // Save to localStorage whenever selectedStyle changes
  useEffect(() => {
    localStorage.setItem(MAP_STYLE_STORAGE_KEY, selectedStyle);
    onStyleChange?.(selectedStyle);
  }, [selectedStyle, onStyleChange]);

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
    <Popup
      trigger={
        <CustomControl position="topRight">
          <ControlButton
            title="Map Styles"
            onClick={toggleDrawer}
            icon={<LayersIcon size={17} />}
          />
        </CustomControl>
      }
      content={
        isOpen ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
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
        ) : null
      }
      on="click"
      open={isOpen}
      onClose={() => setIsOpen(false)}
      onOpen={() => setIsOpen(true)}
    />
  );
};
