import { MapProvider } from 'react-map-gl/maplibre';
import { MapComponent } from './components/map';
import { RoutePlanner } from './components/route-planner';
import { SettingsPanel } from './components/settings-panel/settings-panel';
import { Toaster } from '@/components/ui/sonner';

export const App = () => {
  return (
    <MapProvider>
      <MapComponent />
      <RoutePlanner />
      <SettingsPanel />
      <Toaster position="bottom-center" duration={5000} richColors />
    </MapProvider>
  );
};
