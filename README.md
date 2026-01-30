# Valhalla Demo App

<img width="2253" height="1303" alt="image" src="https://github.com/user-attachments/assets/00f43ea8-51df-4319-ad31-4feadf0024c1" />

This is the ReactJS demo web app running on https://valhalla.openstreetmap.de. It provides routing and isochrones with a magnitude of options and makes requests to [Valhalla](https://github.com/valhalla/valhalla), an open source routing engine and accompanying libraries for use with OpenStreetMap data.

## Commands

### `npm install`

Install the dependencies.

### `npm run start`

Runs the app in hot-reload mode on [http://localhost:3000](http://localhost:3000) to view changes in the browser.

### `npm run build`

Builds and bundles the minified app for production to the `./build` folder.

Your app is ready to be deployed!

## Testing

[![Tests and Linting](https://github.com/valhalla/web-app/actions/workflows/playwright.yml/badge.svg)](https://github.com/valhalla/web-app/actions/workflows/playwright.yml)

This project includes end-to-end tests using [Playwright](https://playwright.dev/) to ensure the application works correctly across different scenarios.

### Running Tests

First install the `playwright` browsers:

```bash
npx playwright install
```

```bash
# Run all e2e tests in headless mode
npm run test:e2e

# Run tests with visible browser (useful for debugging)
npm run test:e2e:headed

# Open Playwright Test UI for interactive testing
npm run test:e2e:ui
```

Tests automatically start the development server if it's not already running.

## Get started with Docker

```bash
git clone https://github.com/nilsnolde/valhalla-app.git
cd valhalla-app
docker compose up --build
```

## Customization

Edit `.env` to manage

- Nominatim API server
- Valhalla API server
- Tile server
- Map start location
