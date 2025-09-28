import React from 'react';
import { Map } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import styleData from './style.json';

export const MapLibreMap: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Map
        mapLib={maplibregl}
        initialViewState={{
          longitude: 0,
          latitude: 0,
          zoom: 2,
        }}
        style={{ width: '100%', height: '100%' }}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mapStyle={styleData as any}
        reuseMaps={true}
      />
    </div>
  );
};

export default MapLibreMap;
