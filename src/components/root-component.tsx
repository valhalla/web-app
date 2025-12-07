import { Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';

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
      <TanStackDevtools
        plugins={[
          {
            name: 'TanStack Query',
            render: <ReactQueryDevtoolsPanel />,
            defaultOpen: true,
          },
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel />,
            defaultOpen: false,
          },
        ]}
      />
    </>
  );
};
