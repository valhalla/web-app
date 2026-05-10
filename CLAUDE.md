# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`valhalla-web` (package name) is the ReactJS demo app that runs on https://valhalla.openstreetmap.de. It is a SPA frontend over the [Valhalla](https://github.com/valhalla/valhalla/CLAUDE.md) routing engine — it builds Valhalla `/route`, `/isochrone`, `/locate`, and `/height` requests and renders results on a MapLibre map. There is no backend in this repo.

## Commands

```bash
npm run dev            # Vite dev server on http://localhost:3000 (alias: npm start)
npm run build          # Vite production build → ./build (NOT ./dist)
npm run preview        # Serve the production build

npm test               # Vitest (watch mode); single test: npx vitest run path/to/file.spec.ts
npm run test:coverage  # Vitest with v8 coverage
npm run test:e2e       # Playwright (chromium + firefox); auto-starts dev server if not running
npm run test:e2e -- --project=chromium   # Single browser
npm run test:e2e:ui    # Playwright Test UI
npm run test:e2e:headed -- --project=firefox

npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm run prettier       # Format
npm run check          # prettier:check && lint  (run before opening a PR)
npm run check:deps     # taze: list outdated deps interactively
```

Husky `pre-commit` runs `npm run typecheck && npx lint-staged` (eslint --fix on `*.{js,jsx,ts,tsx}`, prettier on `*.{json,md,scss,yaml,yml}`). CI (`.github/workflows/playwright.yml`) runs typecheck → lint → vitest → playwright (chromium only) on every PR.

## Tech stack

- **React 18** + **TypeScript** (strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`) + **Vite 7**
- **TanStack Router** (code-based, not file-based — see `src/routes.tsx`)
- **TanStack Query** for all Valhalla/Nominatim fetches
- **Zustand** + `immer` + `devtools` middleware for client state (3 stores in `src/stores/`)
- **Tailwind CSS v4** via `@tailwindcss/vite` + **shadcn/ui** (style `new-york`, base `slate`, lucide icons; see `components.json`)
- **maplibre-gl** + **react-map-gl** + `@watergis/maplibre-gl-terradraw` for drawing exclude-polygons
- **zod** for env/search-param/URL validation
- Path alias: `@/*` → `src/*`

## Architecture

### Entry & routing

```
src/index.tsx                      Mounts <RouterProvider> wrapped in TanStackQuery <Provider>
└─ src/routes.tsx                  Defines the router (code-based)
   └─ rootRoute → RootComponent    Renders <Outlet/> + dev-only TanStack devtools
      ├─ '/'                       beforeLoad redirects to '/directions'
      └─ '/$activeTab'             component=<App/>; validateSearch=zodValidator(searchParamsSchema)
                                   activeTab ∈ {'directions','isochrones','tiles'}; invalid → redirect
```

`<App/>` (`src/app.tsx`) wraps everything in `MapProvider` and renders three siblings: `MapComponent`, `RoutePlanner`, `SettingsPanel`, plus a sonner `<Toaster/>`.

URL search params are the source of truth for `profile` (costing model) and `style` (map style); a `retainSearchParams` middleware keeps them across tab switches. Schema is in `src/utils/route-schemas.ts`.

The Vite `base` is derived from `package.json` `homepage` (see `vite.config.ts → getBaseUrl()`), and the router uses `import.meta.env.BASE_URL`. The PR-preview workflow rewrites `homepage` before building so the bundle is served from `/{PR_NUMBER}/`.

### State

Three Zustand stores, each with `immer` + `devtools`:

- `src/stores/common-store.ts` — settings panel/directions panel open state, costing settings, dateTime, map-ready flag. `Profile` enum and `profileEnum` zod schema live here.
- `src/stores/directions-store.ts` — waypoints (with geocode results), route results, highlighted maneuver, optimized-route flag, active-route index.
- `src/stores/isochrones-store.ts` — input/result, range/interval/denoise/generalize, color palette, opacity.

Server-state lives in TanStack Query. The global `QueryClient` (`src/lib/tanstack-query/root-provider.tsx`) sets `refetchOnWindowFocus: false`, `retry: 1`, `staleTime: 5min`, `gcTime: 10min`. Query hooks are in `src/hooks/use-*-queries.ts`. They read inputs directly from Zustand stores via `useStore.getState()` and from the router via `router.state.location.search` rather than parameters — keep that pattern when adding new queries.

### Components

- `src/components/map/` — MapLibre map. `index.tsx` is the orchestrator; `parts/` holds map sublayers (route lines, isochrone polygons, hover popups, draw controls, marker icons). `valhalla-layers.ts` defines internal Valhalla edge/node/shortcut/access-restriction MVT layer IDs.
- `src/components/directions/`, `src/components/isochrones/`, `src/components/tiles/` — the three tab panels.
- `src/components/settings-panel/` — profile-specific costing options. `settings-options.ts` holds `settingsInit` (default) and `settingsInitTruckOverride`.
- `src/components/ui/` — shadcn/ui primitives (do not rename — they're tracked by `components.json`).
- `src/components/types.ts` — shared `PossibleSettings`, `ActiveWaypoint`, Valhalla response types.

### Backend integration

- **Valhalla base URL**: `getBaseUrl()` in `src/utils/base-url.ts` reads `localStorage['valhalla_base_url']` first, then falls back to `VITE_VALHALLA_URL`. The settings panel lets users override and `testConnection()` validates by hitting `/status` and checking `available_actions` includes `route` and `isochrone`.
- **Client ID header**: every Valhalla request sends `X-Client-Id: ${VITE_CLIENT_ID}`. `src/index.tsx` warns at startup if it's unset or `unknown-web-app`. Production CI sets it to `public-web-app`.
- **Nominatim**: `src/utils/nominatim.ts`, base URL from `VITE_NOMINATIM_URL`.

### Conventions

- **File and folder names are KEBAB_CASE**, enforced by `eslint-plugin-check-file`. Spec/test/`.d.ts`/config files are exempt. Test files are `*.spec.ts(x)` colocated next to source.
- Vitest uses `jsdom` + `pool: 'vmForks'`. Setup in `src/test-setup.ts` polyfills `ResizeObserver` and imports `@testing-library/jest-dom/vitest`.
- Don't edit `src/components/ui/*` to add app-specific behavior — wrap them. `lib/utils.ts` exports `cn()` (clsx + tailwind-merge).

## Environment variables

All build-time, prefixed `VITE_`. Defined in `.env`, typed in `src/vite-env.d.ts`:

| Var                          | Purpose                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------- |
| `VITE_VALHALLA_URL`          | Valhalla server base URL (overridable via UI/localStorage)                       |
| `VITE_NOMINATIM_URL`         | Nominatim server for geocoding                                                   |
| `VITE_TILE_SERVER_URL`       | Raster tile URL template `{z}/{x}/{y}.png`                                       |
| `VITE_CENTER_COORDS`         | Initial map center `"lat,lng"`                                                   |
| `VITE_DEFAULT_COSTING_MODEL` | Default profile (auto/bicycle/pedestrian/car/truck/bus/motor_scooter/motorcycle) |
| `VITE_CLIENT_ID`             | Sent as `X-Client-Id` on Valhalla requests                                       |

## Deployment

- **Production** (`.github/workflows/deploy.yml`): on push to `master`, builds with `VITE_CLIENT_ID=public-web-app` (written to `.env.production.local`) and rsyncs `./build/` to the host server over SSH.
- **PR previews**: `preview-build.yml` rewrites the `homepage` field in `package.json` to `https://valhalla-app-tests.gis-ops.com/<PR#>` before building; `preview-deploy.yml` consumes that artifact, generates an `.htaccess` for SPA rewrites, rsyncs to `<host>/<PR#>/`, posts a status check, and comments the URL. `preview-cleanup.yml` removes the directory when the PR closes.
- **Docker** (`Dockerfile` + `docker-compose.yml`): node:24-alpine builder → nginx:1.29-alpine serving `./build` on port 80. Build-args do not pass through to Vite, so `.env` values are baked at image build time.
- The `npm run deploy` script (`gh-pages`) is defined but **not** used by any workflow — production goes via rsync.

## Working with this team

- **Maintainability beats performance.** Don't micro-optimize at the cost of readable code; only reach for performance work when there's a (relevant) measurable problem.
- **Value code elegance.** Prefer clear, concise solutions over clever ones; small, well-named units over sprawling abstractions.
- **Variable names shouldn't be too generic.** Avoid `data`, `result`, `item`, `tmp` — pick names that say what the value actually is (`routeResponse`, `selectedWaypoint`, `decodedShape`).
- **Test new features the way a user would.** After adding or changing a feature, exercise the 90th-percentile happy path in the running app (dev server + browser) — not exhaustively, but enough to confirm the feature actually works end-to-end. Typecheck and unit tests prove the code compiles, not that the feature behaves. If you can't run it (no browser available, etc.), say so explicitly instead of claiming success.
- **Keep this file (and other docs) current.** After non-trivial changes — new architectural pieces, store/route restructures, build/deploy changes, env-var additions — update `CLAUDE.md` and any other affected docs as part of the same change.
- **Draft the commit message, but ask before committing.** Produce a descriptive but terse message yourself (concise over chatty, but the "why" should still be readable) — don't ask the user what to write. Do still ask before actually running `git commit`; as maintainers we prefer to approve the commit boundary ourselves. Commit messages are the one place we want AI-written prose in normal English; everything else AI writes (issue/PR bodies) goes in pirate english.
- **Issue and PR descriptions: write in pirate english.** When asked to draft an issue or PR description, do not ask for confirmation — output it directly in pirate english (see https://www.polytranslator.com/pirate-english/ for the target style). This applies only to issue/PR body text; commit messages and code stay in normal English.
