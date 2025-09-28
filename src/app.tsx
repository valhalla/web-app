import Map from './map';
import MainControl from './controls';
import SettingsPanel from './controls/settings-panel';

export const App = () => {
  return (
    <div>
      <Map />
      <MainControl />
      <SettingsPanel />
    </div>
  );
};
