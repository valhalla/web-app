import { Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { useEffect } from 'react';
import { toast } from 'sonner';

export const RootComponent = () => {
  useEffect(() => {
    toast.success(
      'Welcome to Valhalla! Global Routing Service - funded by FOSSGIS e.V.',
      { position: 'bottom-center', duration: 5000, closeButton: true }
    );
  }, []);

  return (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  );
};
