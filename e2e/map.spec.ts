import { test, expect } from '@playwright/test';
import {
  BERLIN_COORDINATES,
  setupHeightMock,
  setupLocateMock,
  setupNominatimMock,
  setupRouteMock,
  setupSearchMock,
  simpleMockNominatimResponse,
} from './helpers';
import { customRouteResponse } from './mocks';

interface NominatimApiRequest {
  url: string;
  method: string;
  params?: {
    format?: string | null;
    lon?: string | null;
    lat?: string | null;
  };
}

interface RouteApiRequest {
  url: string;
  method: string;
  body?: {
    costing?: string;
    locations?: Array<{ lat: number; lon: number }>;
  };
}

function validateNominatimRequest(request: NominatimApiRequest): void {
  expect(request.method).toBe('GET');
  expect(request.url).toMatch(
    /https:\/\/nominatim\.openstreetmap\.org\/reverse/
  );
  expect(request.params?.format).toBe('json');
  expect(request.params?.lon).toBeTruthy();
  expect(request.params?.lat).toBeTruthy();
}

function validateRouteApiRequest(request: RouteApiRequest): void {
  expect(request.method).toBe('GET');
  expect(request.url).toMatch(/https:\/\/valhalla1\.openstreetmap\.de\/route/);
}

function validateBerlinCoordinates(
  lonStr: string | null | undefined,
  latStr: string | null | undefined
): void {
  const lon = parseFloat(lonStr || '0');
  const lat = parseFloat(latStr || '0');

  expect(lon).toBeGreaterThan(BERLIN_COORDINATES.bounds.minLon);
  expect(lon).toBeLessThan(BERLIN_COORDINATES.bounds.maxLon);
  expect(lat).toBeGreaterThan(BERLIN_COORDINATES.bounds.minLat);
  expect(lat).toBeLessThan(BERLIN_COORDINATES.bounds.maxLat);
}

test.describe('Map interactions with right context menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
  });

  test('should show right-click context menu', async ({ page }) => {
    await page.getByRole('region', { name: 'Map' }).click({
      button: 'right',
    });
    await expect(
      page.getByRole('button', { name: 'Directions from here' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Add as via point' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Directions to here' })
    ).toBeVisible();
  });

  test('should make Nominatim request when clicking "Directions from here"', async ({
    page,
  }) => {
    const apiRequests = await setupNominatimMock(page);

    await page.getByRole('region', { name: 'Map' }).click({ button: 'right' });
    await page.getByRole('button', { name: 'Directions from here' }).click();
    await page.waitForTimeout(2000);

    await expect(page.getByLabel('Map marker').getByRole('img')).toBeVisible();

    expect(apiRequests.length).toBeGreaterThan(0);

    const request = apiRequests[0] as NominatimApiRequest;
    validateNominatimRequest(request);

    const lon = parseFloat(request.params?.lon || '');
    const lat = parseFloat(request.params?.lat || '');
    expect(lon).not.toBeNaN();
    expect(lat).not.toBeNaN();
  });

  test('should make Nominatim request with Berlin coordinates', async ({
    page,
  }) => {
    const apiRequests = await setupNominatimMock(
      page,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      simpleMockNominatimResponse as any
    );

    await page.getByRole('region', { name: 'Map' }).click({
      button: 'right',
      force: true,
    });

    await page.getByRole('button', { name: 'Directions from here' }).click();
    await page.waitForTimeout(2000);

    await expect(page.getByLabel('Map marker').getByRole('img')).toBeVisible();

    expect(apiRequests.length).toBe(1);

    const request = apiRequests[0] as NominatimApiRequest;
    validateNominatimRequest(request);
    validateBerlinCoordinates(request.params?.lon, request.params?.lat);
  });

  test('should populate "from" input with Nominatim result', async ({
    page,
  }) => {
    await setupNominatimMock(page);

    await page.getByRole('region', { name: 'Map' }).click({ button: 'right' });
    await page.getByRole('button', { name: 'Directions from here' }).click();
    await page.waitForTimeout(2000);

    await expect(page.getByLabel('Map marker').getByRole('img')).toBeVisible();

    await expect(
      page.getByTestId('waypoint-input-0').getByText('Unter den Linden, Mitte,')
    ).toBeVisible();
  });

  test('should make Nominatim request when clicking "Directions to here"', async ({
    page,
  }) => {
    const apiRequests = await setupNominatimMock(page);

    await page.getByRole('region', { name: 'Map' }).click({ button: 'right' });
    await page.getByRole('button', { name: 'Directions to here' }).click();
    await page.waitForTimeout(2000);

    await expect(page.getByLabel('Map marker').getByRole('img')).toBeVisible();

    expect(apiRequests.length).toBeGreaterThan(0);

    const request = apiRequests[0] as NominatimApiRequest;
    validateNominatimRequest(request);

    const lon = parseFloat(request.params?.lon || '');
    const lat = parseFloat(request.params?.lat || '');
    expect(lon).not.toBeNaN();
    expect(lat).not.toBeNaN();
  });

  test('should make Nominatim request with Berlin coordinates for "to here"', async ({
    page,
  }) => {
    const apiRequests = await setupNominatimMock(
      page,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      simpleMockNominatimResponse as any
    );

    await page.getByRole('region', { name: 'Map' }).click({
      button: 'right',
      force: true,
    });

    await page.getByRole('button', { name: 'Directions to here' }).click();
    await page.waitForTimeout(2000);

    await expect(page.getByLabel('Map marker').getByRole('img')).toBeVisible();

    expect(apiRequests.length).toBe(1);

    const request = apiRequests[0] as NominatimApiRequest;
    validateNominatimRequest(request);
    validateBerlinCoordinates(request.params?.lon, request.params?.lat);
  });

  test('should populate "to" input with Nominatim result', async ({ page }) => {
    await setupNominatimMock(page);

    await page.getByRole('region', { name: 'Map' }).click({ button: 'right' });
    await page.getByRole('button', { name: 'Directions to here' }).click();
    await page.waitForTimeout(2000);

    await expect(page.getByLabel('Map marker').getByRole('img')).toBeVisible();

    await expect(
      page.getByTestId('waypoint-input-1').getByText('Unter den Linden, Mitte,')
    ).toBeVisible();
  });

  test('should make Nominatim request when clicking "Add as via point"', async ({
    page,
  }) => {
    const apiRequests = await setupNominatimMock(page);

    await page.getByRole('region', { name: 'Map' }).click({ button: 'right' });
    await page.getByRole('button', { name: 'Add as via point' }).click();
    await page.waitForTimeout(2000);

    await expect(page.getByLabel('Map marker').getByRole('img')).toBeVisible();

    expect(apiRequests.length).toBeGreaterThan(0);

    const request = apiRequests[0] as NominatimApiRequest;
    validateNominatimRequest(request);

    const lon = parseFloat(request.params?.lon || '');
    const lat = parseFloat(request.params?.lat || '');
    expect(lon).not.toBeNaN();
    expect(lat).not.toBeNaN();
  });

  test('should populate via point input with Nominatim result', async ({
    page,
  }) => {
    await setupNominatimMock(page);

    await page.getByRole('region', { name: 'Map' }).click({ button: 'right' });
    await page.getByRole('button', { name: 'Add as via point' }).click();
    await page.waitForTimeout(2000);

    await expect(page.getByLabel('Map marker').getByRole('img')).toBeVisible();

    await expect(
      page.getByTestId('waypoint-input-1').getByText('Unter den Linden, Mitte,')
    ).toBeVisible();
  });

  test('should add multiple via points', async ({ page }) => {
    await setupNominatimMock(page);

    // Add first via point
    await page.getByRole('region', { name: 'Map' }).click({ button: 'right' });
    await page.getByRole('button', { name: 'Add as via point' }).click();

    await expect(page.getByLabel('Map marker').getByRole('img')).toBeVisible();

    // Add second via point
    await page
      .getByRole('region', { name: 'Map' })
      .click({ button: 'right', position: { x: 800, y: 300 }, force: true });
    await page.getByRole('button', { name: 'Add as via point' }).click();

    await expect(page.getByTestId('waypoint-input-1')).toBeVisible();
    await expect(page.getByTestId('waypoint-input-2')).toBeVisible();
    await expect(
      page.getByLabel('Map marker 2').getByRole('img')
    ).toBeVisible();
    await expect(
      page.getByLabel('Map marker 3').getByRole('img')
    ).toBeVisible();

    await expect(
      page.getByTestId('waypoint-input-1').getByText('Unter den Linden, Mitte,')
    ).toBeVisible();

    await expect(
      page.getByTestId('waypoint-input-2').getByText('Unter den Linden, Mitte,')
    ).toBeVisible();
  });

  test('should handle at least 9 waypoints', async ({ page }) => {
    await setupNominatimMock(page);

    // Add "from" waypoint
    await page.getByRole('region', { name: 'Map' }).click({ button: 'right' });
    await page.getByRole('button', { name: 'Directions from here' }).click();
    await page.waitForTimeout(1000);

    await expect(
      page.getByLabel('Map marker 1').getByRole('img')
    ).toBeVisible();

    // Add "to" waypoint
    await page
      .getByRole('region', { name: 'Map' })
      .click({ button: 'right', position: { x: 800, y: 300 }, force: true });
    await page.getByRole('button', { name: 'Directions to here' }).click();
    await page.waitForTimeout(1000);

    await expect(
      page.getByLabel('Map marker 2').getByRole('img')
    ).toBeVisible();

    // Add 7 via points (total waypoints = 9, but only 8 should be allowed)
    for (let i = 0; i < 7; i++) {
      await page.getByRole('region', { name: 'Map' }).click({
        button: 'right',
        position: { x: 800, y: 100 + i * 100 },
        force: true,
      });
      await page.getByRole('button', { name: 'Add as via point' }).click();
      await page.waitForTimeout(1000);
    }

    for (let i = 0; i < 8; i++) {
      await expect(page.getByTestId(`waypoint-input-${i}`)).toBeVisible();
      await expect(
        page.getByLabel(`Map marker ${i + 1}`).getByRole('img')
      ).toBeVisible();
    }
  });

  test('selecting two point should display route on the map', async ({
    page,
  }) => {
    await setupNominatimMock(page);
    const apiRequests = await setupRouteMock(page);

    // Select "from" point
    await page
      .getByRole('region', { name: 'Map' })
      .click({ button: 'right', position: { x: 800, y: 100 }, force: true });
    await page.getByRole('button', { name: 'Directions from here' }).click();
    await page.waitForTimeout(1000);

    await expect(
      page.getByLabel('Map marker 1').getByRole('img')
    ).toBeVisible();

    // Select "to" point
    await page
      .getByRole('region', { name: 'Map' })
      .click({ button: 'right', position: { x: 800, y: 300 }, force: true });
    await page.getByRole('button', { name: 'Directions to here' }).click();
    await page.waitForTimeout(2000);

    await expect(
      page.getByLabel('Map marker 2').getByRole('img')
    ).toBeVisible();

    expect(apiRequests.length).toBeGreaterThan(0);

    const request = apiRequests[0] as RouteApiRequest;
    validateRouteApiRequest(request);
  });

  test('should display maneuvers when route is created', async ({ page }) => {
    await setupNominatimMock(page);
    await setupRouteMock(page);

    // Select "from" point
    await page
      .getByRole('region', { name: 'Map' })
      .click({ button: 'right', force: true });
    await page.getByRole('button', { name: 'Directions from here' }).click();
    await page.waitForTimeout(1000);

    await expect(
      page.getByLabel('Map marker 1').getByRole('img')
    ).toBeVisible();

    // Select "to" point
    await page
      .getByRole('region', { name: 'Map' })
      .click({ button: 'right', position: { x: 800, y: 300 }, force: true });
    await page.getByRole('button', { name: 'Directions to here' }).click();
    await page.waitForTimeout(1000);

    await expect(
      page.getByLabel('Map marker 2').getByRole('img')
    ).toBeVisible();

    // Add a via point
    await page
      .getByRole('region', { name: 'Map' })
      .click({ button: 'right', position: { x: 800, y: 100 }, force: true });
    await page.getByRole('button', { name: 'Add as via point' }).click();
    await page.waitForTimeout(2000);

    await expect(
      page.getByLabel('Map marker 3').getByRole('img')
    ).toBeVisible();

    await expect(
      page.getByRole('heading', { level: 3, name: 'Directions' })
    ).toBeVisible();

    await expect(
      page.getByRole('button', { name: 'Show Maneuvers' })
    ).toBeVisible();

    await page.getByRole('button', { name: 'Show Maneuvers' }).click();

    await expect(
      page.getByRole('button', { name: 'Hide Maneuvers' })
    ).toBeVisible();

    await expect(page.getByText('Bike southeast.')).toBeVisible();

    await page.getByRole('button', { name: 'Hide Maneuvers' }).click();

    await expect(page.getByText('Bike southeast.')).not.toBeVisible();
  });

  test('should send route request again when waypoint is moved', async ({
    page,
  }) => {
    const nominatimRequests = await setupNominatimMock(page);
    const routeRequests = await setupRouteMock(
      page,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      customRouteResponse as any
    );

    // Add "from" waypoint
    await page
      .getByRole('region', { name: 'Map' })
      .click({ button: 'right', position: { x: 800, y: 100 }, force: true });
    await page.getByRole('button', { name: 'Directions from here' }).click();
    await page.waitForTimeout(1000);

    const fromWaypoint = page.getByLabel('Map marker 1').getByRole('img');

    await expect(fromWaypoint).toBeVisible();

    // Add "to" waypoint
    await page
      .getByRole('region', { name: 'Map' })
      .click({ button: 'right', position: { x: 800, y: 200 }, force: true });
    await page.getByRole('button', { name: 'Directions to here' }).click();
    await page.waitForTimeout(1000);

    const toWaypoint = page.getByLabel('Map marker 2').getByRole('img');

    await expect(toWaypoint).toBeVisible();

    expect(nominatimRequests.length).toBe(2);
    expect(routeRequests.length).toBe(1);

    // Drag waypoint
    const boundingBox = await toWaypoint.boundingBox();
    expect(boundingBox).not.toBeNull();

    if (boundingBox !== null) {
      const startX = boundingBox.x + boundingBox.width / 2;
      const startY = boundingBox.y + boundingBox.height / 2;

      page.mouse.move(startX, startY);
      await page.waitForTimeout(500);

      page.mouse.down();
      await page.waitForTimeout(500);

      page.mouse.move(startX + 100, startY);
      await page.waitForTimeout(500);

      page.mouse.up();
      await page.waitForTimeout(1000);

      expect(nominatimRequests.length).toBe(3);
      expect(routeRequests.length).toBe(2);
    }
  });
});

test.describe('Map interactions with left context menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
  });

  test('should show left-click context menu', async ({ page }) => {
    await setupHeightMock(page);

    await page.getByRole('region', { name: 'Map' }).click({
      button: 'left',
    });

    await expect(page.getByTestId('dd-button')).toContainText(
      '13.393707, 52.518310'
    );
    await expect(page.getByTestId('dd-copy-button')).toBeVisible();

    await expect(page.getByTestId('latlng-button')).toContainText(
      '52.518310, 13.393707'
    );
    await expect(page.getByTestId('latlng-copy-button')).toBeVisible();

    await expect(page.getByTestId('dms-button')).toContainText(
      '52° 31\' 6" N 13° 23\' 37" E'
    );
    await expect(page.getByTestId('dms-copy-button')).toBeVisible();

    await expect(
      page.getByRole('button', { name: 'Locate Point' })
    ).toBeVisible();
    await expect(page.getByTestId('locate-point-copy-button')).toBeVisible();

    await expect(
      page.getByRole('button', { name: 'Valhalla Location JSON' })
    ).toBeVisible();
    await expect(page.getByTestId('location-json-copy-button')).toBeVisible();

    await expect(page.getByTestId('elevation-button')).toContainText('34 m');
  });

  test('should show height from api response', async ({ page }) => {
    await setupHeightMock(page);

    await page.getByRole('region', { name: 'Map' }).click({
      button: 'left',
    });

    await expect(page.getByTestId('elevation-button')).toContainText('34 m');
  });

  test('should call locate', async ({ page }) => {
    await setupHeightMock(page);
    const locateRequests = await setupLocateMock(page);

    await page.getByRole('region', { name: 'Map' }).click({
      button: 'left',
    });

    await expect(
      page.getByRole('button', { name: 'Locate Point' })
    ).toBeVisible();

    await page.getByRole('button', { name: 'Locate Point' }).click();

    expect(locateRequests.length).toBeGreaterThan(0);

    const locateRequest = locateRequests[0] as RouteApiRequest;
    expect(locateRequest.method).toBe('POST');
    expect(locateRequest.url).toMatch(
      /https:\/\/valhalla1\.openstreetmap\.de\/locate/
    );
    expect(locateRequest.body).toBeDefined();
    expect(locateRequest.body?.costing).toBe('bicycle');
    expect(locateRequest.body?.locations).toStrictEqual([
      { lat: 52.51830999999976, lon: 13.393706999999239 },
    ]);
  });

  test('should copy text to clipboard', async ({ page }) => {
    await setupHeightMock(page);

    await page.getByRole('region', { name: 'Map' }).click({
      button: 'left',
    });

    await page.getByTestId('dd-copy-button').click();

    const clipboardContent = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clipboardContent).toBe('13.393707,52.518310');
  });
});

test.describe('Map interactions with URL parameters', () => {
  test('should show the route if url has route parameters', async ({
    page,
  }) => {
    const nominatimRequests = await setupNominatimMock(page);
    const routeRequests = await setupRouteMock(page);

    await page.goto(
      `http://localhost:3000/directions?profile=pedestrian&wps=13.343067169189455%2C52.5296422146409%2C13.33414077758789%2C52.50901237642168`
    );

    await page.waitForTimeout(2000);

    // Check that waypoint inputs 0 to 1 and waypoint markers 1 to 2 are visible
    for (let i = 0; i < 2; i++) {
      await expect(page.getByTestId(`waypoint-input-${i}`)).toBeVisible();
      await expect(
        page.getByLabel(`Map marker ${i + 1}`).getByRole('img')
      ).toBeVisible();
    }

    expect(nominatimRequests.length).toBe(2);
    expect(routeRequests.length).toBe(1);
  });

  test('should show the route if url has route parameters for many waypoints', async ({
    page,
  }) => {
    const nominatimRequests = await setupNominatimMock(page);
    const routeRequests = await setupRouteMock(page);

    await page.goto(
      `http://localhost:3000/directions?profile=pedestrian&wps=13.343067169189455%2C52.5296422146409%2C13.33414077758789%2C52.50901237642168%2C13.358602523803713%2C52.49354670463552%2C13.39439392089844%2C52.49751813950203%2C13.416624069213869%2C52.51078849036718%2C13.40829849243164%2C52.527710210603935%2C13.386325836181642%2C52.53460237630518%2C13.355512619018555%2C52.53507225730483`
    );

    await page.waitForTimeout(2000);

    // Check that waypoint inputs 0 to 7 and waypoint markers 1 to 8 are visible
    for (let i = 0; i < 8; i++) {
      await expect(page.getByTestId(`waypoint-input-${i}`)).toBeVisible();
      await expect(
        page.getByLabel(`Map marker ${i + 1}`).getByRole('img')
      ).toBeVisible();
    }

    expect(nominatimRequests.length).toBe(8);
    expect(routeRequests.length).toBe(1);
  });
});

https: test.describe('Left drawer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
  });

  test('add/remove waypoint behaviour should work correctly', async ({
    page,
  }) => {
    // Add waypoint
    await expect(page.getByRole('button', { name: '3' })).not.toBeVisible();

    await page.getByTestId('add-waypoint-button').click();

    await expect(page.getByRole('button', { name: '3' }).first()).toBeVisible();

    // Remove waypoint
    await page.getByTestId('reset-waypoints-button').click();

    await expect(page.getByRole('button', { name: '3' })).not.toBeVisible();
  });

  test('should make Nominatim request when entering address in search box', async ({
    page,
  }) => {
    await setupNominatimMock(page);
    const searchRequests = await setupSearchMock(page);

    await page.getByTestId('waypoint-input-0').click();
    const searchBox = page.getByPlaceholder('Hit enter for search');
    await searchBox.fill('Unter den Linden');
    await searchBox.press('Enter');

    const searchResult = page.getByTestId('search-result');

    await expect(searchResult).toBeVisible();
    await searchResult.click();

    await expect(
      page.getByLabel('Map marker 1').getByRole('img')
    ).toBeVisible();

    expect(searchRequests.length).toBe(1);
  });

  test('should display route for two points via entering addresses in search box', async ({
    page,
  }) => {
    await setupNominatimMock(page);
    const searchRequests = await setupSearchMock(page);
    const routeRequests = await setupRouteMock(page);

    await page.getByTestId('waypoint-input-0').click();
    const searchBox = page.getByPlaceholder('Hit enter for search');
    await searchBox.fill('Unter den Linden');
    await searchBox.press('Enter');

    const firstSearchResult = page.getByTestId('search-result');

    await expect(firstSearchResult).toBeVisible();
    await firstSearchResult.click();

    await expect(
      page.getByLabel('Map marker 1').getByRole('img')
    ).toBeVisible();

    // Add "to" waypoint
    await page.getByTestId('waypoint-input-1').click();
    const secondSearchBox = page.getByPlaceholder('Hit enter for search');
    await secondSearchBox.fill('Unter den Linden');
    await secondSearchBox.press('Enter');

    const secondSearchResult = page
      .getByTestId('search-result')
      .getByText('Unter den Linden, Mitte,');

    await expect(secondSearchResult).toBeVisible();
    await secondSearchResult.click();

    await expect(
      page.getByLabel('Map marker 2').getByRole('img')
    ).toBeVisible();

    expect(routeRequests.length).toBe(1);
    expect(searchRequests.length).toBe(2);
  });

  test('should display correct behaviour for removing waypoints after route is determined', async ({
    page,
  }) => {
    await setupNominatimMock(page);

    // Add first via waypoint
    await page.getByRole('region', { name: 'Map' }).click({ button: 'right' });
    await page.getByRole('button', { name: 'Add as via point' }).click();
    await page.waitForTimeout(2000);

    await expect(
      page.getByLabel('Map marker 2').getByRole('img')
    ).toBeVisible();

    // Add "to" waypoint
    await page
      .getByRole('region', { name: 'Map' })
      .click({ button: 'right', position: { x: 800, y: 200 }, force: true });
    await page.getByRole('button', { name: 'Directions to here' }).click();
    await page.waitForTimeout(2000);

    await expect(
      page.getByLabel('Map marker 3').getByRole('img')
    ).toBeVisible();

    await expect(
      page.getByTestId('waypoint-input-1').getByText('Unter den Linden, Mitte,')
      // .getByRole('textbox', { name: 'Hit enter for search...' })
    ).toBeVisible();
    await expect(
      page.getByTestId('waypoint-input-2').getByText('Unter den Linden, Mitte,')
    ).toBeVisible();

    await page.getByTestId('remove-waypoint-button').nth(2).click();
    await expect(
      page.getByTestId('waypoint-input-2').getByText('Unter den Linden, Mitte,')
    ).not.toBeVisible();

    // Remove waypoint (should just clear text without removing actual element)
    await page.getByTestId('remove-waypoint-button').nth(1).click();
    await expect(
      page.getByTestId('waypoint-input-1').getByText('Select a waypoint...')
    ).toBeVisible();

    await expect(
      page.getByTestId('waypoint-input-0').getByText('Select a waypoint...')
    ).toBeVisible();
  });

  test('should send the route request again when user changed profile', async ({
    page,
  }) => {
    await setupNominatimMock(page);
    const routeRequests = await setupRouteMock(page);

    // Add first via point
    await page.getByRole('region', { name: 'Map' }).click({ button: 'right' });
    await page.getByRole('button', { name: 'Add as via point' }).click();
    await page.waitForTimeout(2000);

    await expect(
      page.getByLabel('Map marker 2').getByRole('img')
    ).toBeVisible();

    // Add second via point
    await page.getByRole('region', { name: 'Map' }).click({
      button: 'right',
      position: { x: 800, y: 100 },
      force: true,
    });
    await page.getByRole('button', { name: 'Add as via point' }).click();
    await page.waitForTimeout(2000);

    await expect(
      page.getByLabel('Map marker 3').getByRole('img')
    ).toBeVisible();

    await expect(page.getByTestId('waypoint-input-1')).toBeVisible();
    await expect(page.getByTestId('waypoint-input-2')).toBeVisible();

    expect(routeRequests.length).toBe(1);

    await page.getByTestId('profile-button-pedestrian').click();

    expect(routeRequests.length).toBe(2);
  });
});
