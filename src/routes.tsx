import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  retainSearchParams,
} from '@tanstack/react-router';
import { fallback, zodValidator } from '@tanstack/zod-adapter';
import { App } from './app';
import { z } from 'zod';
import { RootComponent } from './components/root-component';
import { profileEnum } from './reducers/common';
import * as TanStackQueryProvider from './lib/tanstack-query/root-provider';

// Zod schema for search params validation
const searchParamsSchema = z.object({
  profile: fallback(profileEnum.optional(), 'bicycle'),
  wps: z.string().optional(),
  range: z.number().optional(),
  interval: z.number().optional(),
  generalize: z.number().optional(),
  denoise: z.number().optional(),
  style: z.enum(['shortbread', 'carto']).optional(),
});

export const rootRoute = createRootRoute({
  component: RootComponent,
});

const TanStackQueryProviderContext = TanStackQueryProvider.getContext();

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: App,
  beforeLoad: () => {
    throw redirect({
      to: '/$activeTab',
      params: { activeTab: 'directions' },
      search: {
        profile: 'bicycle',
      },
    });
  },
});

const activeTabRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$activeTab',
  component: App,
  validateSearch: zodValidator(searchParamsSchema),
  search: {
    middlewares: [retainSearchParams(['profile', 'style'])],
  },
  beforeLoad: ({ params }) => {
    const validTabs = ['directions', 'isochrones'];
    if (!validTabs.includes(params.activeTab)) {
      throw redirect({
        to: '/$activeTab',
        params: { activeTab: 'directions' },
        search: {
          profile: 'bicycle',
        },
      });
    }
  },
});

export const routeTree = rootRoute.addChildren([indexRoute, activeTabRoute]);

export const router = createRouter({
  routeTree,
  context: { ...TanStackQueryProviderContext },
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
