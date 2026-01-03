import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  retainSearchParams,
} from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { App } from './app';
import { RootComponent } from './components/root-component';
import * as TanStackQueryProvider from './lib/tanstack-query/root-provider';
import { searchParamsSchema, isValidTab } from './utils/route-schemas';

export const rootRoute = createRootRoute({ component: RootComponent });

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
  beforeLoad: ({ params, search }) => {
    if (!isValidTab(params.activeTab)) {
      throw redirect({
        to: '/$activeTab',
        params: { activeTab: 'directions' },
        search: {
          profile: 'bicycle',
        },
      });
    }
    if (!search.profile) {
      throw redirect({
        to: '/$activeTab',
        params: { activeTab: params.activeTab },
        search: {
          ...search,
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
  basepath: import.meta.env.BASE_URL,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
