// import MainControl from './Controls';
// import SettingsPanel from './Controls/settings-panel';
import { OpenLayersMap } from './Map/open-layers-map';
import MapLibreMap from './Map/maplibre-map';
import Map from './Map/Map';
import { useState } from 'react';

export const App = () => {
  const [mapType, setMapType] = useState<'leaflet' | 'maplibre' | 'openlayers'>(
    'leaflet'
  );

  return (
    <div>
      <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 2000 }}>
        <button
          disabled={mapType === 'leaflet'}
          onClick={() => setMapType('leaflet')}
        >
          Leaflet
        </button>
        <button
          disabled={mapType === 'maplibre'}
          onClick={() => setMapType('maplibre')}
        >
          MapLibre
        </button>
        <button
          disabled={mapType === 'openlayers'}
          onClick={() => setMapType('openlayers')}
        >
          OpenLayers
        </button>
      </div>
      {mapType === 'leaflet' && <Map />}
      {mapType === 'maplibre' && <MapLibreMap />}
      {mapType === 'openlayers' && <OpenLayersMap />}
      {/* <MainControl /> */}
      {/* <SettingsPanel /> */}
    </div>
  );
};
