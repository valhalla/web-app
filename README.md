> [!NOTE]
> This repository is currently widely unmaintained. We're looking for dedicated OSS heroes who would be willing to help/contribute. The promise is a place in the glorious hall of Valhalla! In case of interest, open an issue or email nilsnolde+github@proton.me.

# Valhalla Demo App

![valhalla_screenshot](https://user-images.githubusercontent.com/10322094/144841673-18ec0772-129d-443e-a040-5172480b0f92.png)

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

This project includes end-to-end tests using [Playwright](https://playwright.dev/) to ensure the application works correctly across different scenarios.

### Running Tests

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
