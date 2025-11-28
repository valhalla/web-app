import { MapComponent } from './components/map';
import { RoutePlanner } from './components/route-planner';
import { SettingsPanel } from './components/settings-panel/settings-panel';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export const App = () => {
  useEffect(() => {
    toast.success(
      'Welcome to Valhalla! Global Routing Service - funded by FOSSGIS e.V.',
      { position: 'bottom-center', duration: 5000, closeButton: true }
    );
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <MapComponent />
      <RoutePlanner />
      <SettingsPanel />
      <Toaster position="bottom-center" duration={5000} richColors />
    </QueryClientProvider>
  );
};
