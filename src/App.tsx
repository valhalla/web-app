import MainControl from './Controls';
import SettingsPanel from './Controls/settings-panel';
import { OpenLayersMap } from './Map/open-layers-map';
// import MapLibreMap from './Map/maplibre-map';

export const App = () => {
  return (
    <div>
      {/* <Map /> */}
      {/* <MapLibreMap /> */}
      <OpenLayersMap />
      <MainControl />
      <SettingsPanel />
    </div>
  );
};
