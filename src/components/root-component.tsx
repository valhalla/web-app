import { Outlet } from '@tanstack/react-router';
import { lazy, Suspense, useEffect } from 'react';
import { toast } from 'sonner';

const TanStackDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-devtools').then((mod) => ({
        default: mod.TanStackDevtools,
      }))
    )
  : () => null;

const ReactQueryDevtoolsPanel = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((mod) => ({
        default: mod.ReactQueryDevtoolsPanel,
      }))
    )
  : () => null;

const TanStackRouterDevtoolsPanel = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-router-devtools').then((mod) => ({
        default: mod.TanStackRouterDevtoolsPanel,
      }))
    )
  : () => null;

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
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <TanStackDevtools
            plugins={[
              {
                name: 'TanStack Query',
                render: (
                  <Suspense fallback={null}>
                    <ReactQueryDevtoolsPanel />
                  </Suspense>
                ),
                defaultOpen: true,
              },
              {
                name: 'TanStack Router',
                render: (
                  <Suspense fallback={null}>
                    <TanStackRouterDevtoolsPanel />
                  </Suspense>
                ),
                defaultOpen: false,
              },
            ]}
          />
        </Suspense>
      )}
    </>
  );
};
