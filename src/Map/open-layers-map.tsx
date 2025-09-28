import React, { useEffect, useRef } from 'react';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import { apply } from 'ol-mapbox-style';
import 'ol/ol.css';

interface OpenLayersMapProps {
  className?: string;
}

export const OpenLayersMap: React.FC<OpenLayersMapProps> = ({
  className = '',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = new Map({
      target: mapRef.current,
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
    });

    apply(map, '/style.json')
      .then(() => {
        console.log('Map style applied successfully');
      })
      .catch((error) => {
        console.error('Error applying map style:', error);
      });

    mapInstanceRef.current = map;

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: '100vh' }}
      className={className}
      data-testid="openlayers-map"
    />
  );
};
