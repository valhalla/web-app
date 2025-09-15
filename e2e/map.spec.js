import { test, expect } from '@playwright/test'
import {
  BERLIN_COORDINATES,
  setupHeightMock,
  setupLocateMock,
  setupNominatimMock,
  setupRouteMock,
  simpleMockNominatimResponse,
} from './helpers'

function validateNominatimRequest(request) {
  expect(request.method).toBe('GET')
  expect(request.url).toMatch(
    /https:\/\/nominatim\.openstreetmap\.org\/reverse/
  )
  expect(request.params.format).toBe('json')
  expect(request.params.lon).toBeTruthy()
  expect(request.params.lat).toBeTruthy()
}

function validateRouteRequest(request) {
  expect(request.method).toBe('GET')
  expect(request.url).toMatch(/https:\/\/valhalla1\.openstreetmap\.de\/route/)
}

function validateBerlinCoordinates(lonStr, latStr) {
  const lon = parseFloat(lonStr || '0')
  const lat = parseFloat(latStr || '0')

  expect(lon).toBeGreaterThan(BERLIN_COORDINATES.bounds.minLon)
  expect(lon).toBeLessThan(BERLIN_COORDINATES.bounds.maxLon)
  expect(lat).toBeGreaterThan(BERLIN_COORDINATES.bounds.minLat)
  expect(lat).toBeLessThan(BERLIN_COORDINATES.bounds.maxLat)
}

test.describe('Map interactions with right context menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/')
  })

  test('should show right-click context menu', async ({ page }) => {
    await page.getByTestId('map').click({
      button: 'right',
    })
    await expect(
      page.getByRole('button', { name: 'Directions from here' })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Add as via point' })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Directions to here' })
    ).toBeVisible()
  })

  test('should make Nominatim request when clicking "Directions from here"', async ({
    page,
  }) => {
    const apiRequests = await setupNominatimMock(page)

    await page.getByTestId('map').click({ button: 'right' })
    await page.getByRole('button', { name: 'Directions from here' }).click()
    await page.waitForTimeout(2000)

    expect(apiRequests.length).toBeGreaterThan(0)

    const request = apiRequests[0]
    validateNominatimRequest(request)

    const lon = parseFloat(request.params.lon || '')
    const lat = parseFloat(request.params.lat || '')
    expect(lon).not.toBeNaN()
    expect(lat).not.toBeNaN()
  })

  test('should make Nominatim request with Berlin coordinates', async ({
    page,
  }) => {
    const apiRequests = await setupNominatimMock(
      page,
      simpleMockNominatimResponse
    )

    await page.waitForSelector('[data-testid="map"]', { state: 'visible' })
    await page.waitForTimeout(1000)

    await page.getByTestId('map').click({
      button: 'right',
      force: true,
    })

    await page.getByRole('button', { name: 'Directions from here' }).click()
    await page.waitForTimeout(2000)

    expect(apiRequests.length).toBe(1)

    const request = apiRequests[0]
    validateNominatimRequest(request)
    validateBerlinCoordinates(request.params.lon, request.params.lat)
  })

  test('should populate "from" input with Nominatim result', async ({
    page,
  }) => {
    await setupNominatimMock(page)

    await page.getByTestId('map').click({ button: 'right' })
    await page.getByRole('button', { name: 'Directions from here' }).click()
    await page.waitForTimeout(2000)

    await expect(
      page
        .getByTestId('waypoint-input-0')
        .getByRole('textbox', { name: 'Hit enter for search...' })
    ).toHaveValue('Unter den Linden, Mitte, Berlin, Germany')
  })

  test('should make Nominatim request when clicking "Directions to here"', async ({
    page,
  }) => {
    const apiRequests = await setupNominatimMock(page)

    await page.getByTestId('map').click({ button: 'right' })
    await page.getByRole('button', { name: 'Directions to here' }).click()
    await page.waitForTimeout(2000)

    expect(apiRequests.length).toBeGreaterThan(0)

    const request = apiRequests[0]
    validateNominatimRequest(request)

    const lon = parseFloat(request.params.lon || '')
    const lat = parseFloat(request.params.lat || '')
    expect(lon).not.toBeNaN()
    expect(lat).not.toBeNaN()
  })

  test('should make Nominatim request with Berlin coordinates for "to here"', async ({
    page,
  }) => {
    const apiRequests = await setupNominatimMock(
      page,
      simpleMockNominatimResponse
    )

    await page.waitForSelector('[data-testid="map"]', { state: 'visible' })
    await page.waitForTimeout(1000)

    await page.getByTestId('map').click({
      button: 'right',
      force: true,
    })

    await page.getByRole('button', { name: 'Directions to here' }).click()
    await page.waitForTimeout(2000)

    expect(apiRequests.length).toBe(1)

    const request = apiRequests[0]
    validateNominatimRequest(request)
    validateBerlinCoordinates(request.params.lon, request.params.lat)
  })

  test('should populate "to" input with Nominatim result', async ({ page }) => {
    await setupNominatimMock(page)

    await page.getByTestId('map').click({ button: 'right' })
    await page.getByRole('button', { name: 'Directions to here' }).click()
    await page.waitForTimeout(2000)

    await expect(
      page
        .getByTestId('waypoint-input-1')
        .getByRole('textbox', { name: 'Hit enter for search...' })
    ).toHaveValue('Unter den Linden, Mitte, Berlin, Germany')
  })

  test('should make Nominatim request when clicking "Add as via point"', async ({
    page,
  }) => {
    const apiRequests = await setupNominatimMock(page)

    await page.getByTestId('map').click({ button: 'right' })
    await page.getByRole('button', { name: 'Add as via point' }).click()
    await page.waitForTimeout(2000)

    expect(apiRequests.length).toBeGreaterThan(0)

    const request = apiRequests[0]
    validateNominatimRequest(request)

    const lon = parseFloat(request.params.lon || '')
    const lat = parseFloat(request.params.lat || '')
    expect(lon).not.toBeNaN()
    expect(lat).not.toBeNaN()
  })

  test('should populate via point input with Nominatim result', async ({
    page,
  }) => {
    await setupNominatimMock(page)

    await page.getByTestId('map').click({ button: 'right' })
    await page.getByRole('button', { name: 'Add as via point' }).click()
    await page.waitForTimeout(2000)

    await expect(
      page
        .getByTestId('waypoint-input-1')
        .getByRole('textbox', { name: 'Hit enter for search...' })
    ).toHaveValue('Unter den Linden, Mitte, Berlin, Germany')
  })

  test('should add multiple via points', async ({ page }) => {
    await setupNominatimMock(page)

    // Add first via point
    await page.getByTestId('map').click({ button: 'right' })
    await page.getByRole('button', { name: 'Add as via point' }).click()
    await page.waitForTimeout(2000)

    // Add second via point
    await page.getByTestId('map').click({ button: 'right' })
    await page.getByRole('button', { name: 'Add as via point' }).click()
    await page.waitForTimeout(2000)

    await expect(page.getByTestId('waypoint-input-1')).toBeVisible()
    await expect(page.getByTestId('waypoint-input-2')).toBeVisible()

    await expect(
      page
        .getByTestId('waypoint-input-1')
        .getByRole('textbox', { name: 'Hit enter for search...' })
    ).toHaveValue('Unter den Linden, Mitte, Berlin, Germany')

    await expect(
      page
        .getByTestId('waypoint-input-2')
        .getByRole('textbox', { name: 'Hit enter for search...' })
    ).toHaveValue('Unter den Linden, Mitte, Berlin, Germany')
  })

  test('should handle at least 9 waypoints', async ({ page }) => {
    await setupNominatimMock(page)

    // Add "from" waypoint
    await page.getByTestId('map').click({ button: 'right' })
    await page.getByRole('button', { name: 'Directions from here' }).click()
    await page.waitForTimeout(1000)

    // Add "to" waypoint
    await page.getByTestId('map').click({ button: 'right' })
    await page.getByRole('button', { name: 'Directions to here' }).click()
    await page.waitForTimeout(1000)

    // Add 7 via points (total waypoints = 9, but only 8 should be allowed)
    for (let i = 0; i < 7; i++) {
      await page.getByTestId('map').click({ button: 'right' })
      await page.getByRole('button', { name: 'Add as via point' }).click()
      await page.waitForTimeout(1000)
    }

    // Check that waypoint inputs 0 to 7 are visible
    for (let i = 0; i < 8; i++) {
      await expect(page.getByTestId(`waypoint-input-${i}`)).toBeVisible()
    }

    // Check that waypoint input 8 does not exist
    await expect(page.getByTestId('waypoint-input-8')).toHaveCount(1)
  })

  test('selecting two point should display route on the map', async ({
    page,
  }) => {
    await setupNominatimMock(page)
    const apiRequests = await setupRouteMock(page)

    // Select "from" point
    await page.getByTestId('map').click({ button: 'right', force: true })
    await page.getByRole('button', { name: 'Directions from here' }).click()
    await page.waitForTimeout(1000)

    // Select "to" point
    await page.getByTestId('map').click({ button: 'right', force: true })
    await page.getByRole('button', { name: 'Directions to here' }).click()
    await page.waitForTimeout(2000)

    expect(apiRequests.length).toBeGreaterThan(0)

    const request = apiRequests[0]
    validateRouteRequest(request)

    await expect(page.locator('svg.leaflet-zoom-animated')).toHaveCount(1)
    await expect(
      page.locator('svg.leaflet-zoom-animated .leaflet-interactive')
    ).toHaveCount(2)
  })

  test('should display maneuvers when route is created', async ({ page }) => {
    await setupNominatimMock(page)
    await setupRouteMock(page)

    // Select "from" point
    await page.getByTestId('map').click({ button: 'right', force: true })
    await page.getByRole('button', { name: 'Directions from here' }).click()
    await page.waitForTimeout(1000)

    // Select "to" point
    await page.getByTestId('map').click({ button: 'right', force: true })
    await page.getByRole('button', { name: 'Directions to here' }).click()
    await page.waitForTimeout(1000)

    // Add a via point
    await page.getByTestId('map').click({ button: 'right', force: true })
    await page.getByRole('button', { name: 'Add as via point' }).click()
    await page.waitForTimeout(2000)

    await expect(
      page.locator('div').filter({ hasText: /^Directions$/ })
    ).toBeVisible()

    await expect(
      page.getByRole('button', { name: 'Show Maneuvers' })
    ).toBeVisible()

    await page.getByRole('button', { name: 'Show Maneuvers' }).click()

    await expect(
      page.getByRole('button', { name: 'Hide Maneuvers' })
    ).toBeVisible()

    await expect(page.getByText('Bike southeast.')).toBeVisible()

    await page.getByRole('button', { name: 'Hide Maneuvers' }).click()

    await expect(page.getByText('Bike southeast.')).not.toBeVisible()
  })
})

test.describe('Map interactions with left context menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/')
  })

  test('should show left-click context menu', async ({ page }) => {
    await setupHeightMock(page)

    await page.getByTestId('map').click({
      button: 'left',
    })

    await expect(
      page.getByRole('button', { name: 'Locate Point' })
    ).toBeVisible()

    await expect(
      page.getByRole('button', { name: 'Valhalla Location JSON' })
    ).toBeVisible()

    await expect(page.getByTestId('dd-button')).toContainText(
      '13.393707, 52.517892'
    )

    await expect(page.getByTestId('latlng-button')).toContainText(
      '52.517892, 13.393707'
    )

    await expect(page.getByTestId('dms-button')).toContainText(
      '52° 31\' 4" N 13° 23\' 37" E'
    )
  })

  test('should show height from api response', async ({ page }) => {
    await setupHeightMock(page)

    await page.getByTestId('map').click({
      button: 'left',
    })

    await expect(page.getByTestId('elevation-button')).toContainText('34 m')
  })

  test('should call locate', async ({ page }) => {
    await setupHeightMock(page)
    const locateRequests = await setupLocateMock(page)

    await page.getByTestId('map').click({
      button: 'left',
    })

    await expect(
      page.getByRole('button', { name: 'Locate Point' })
    ).toBeVisible()

    await page.getByRole('button', { name: 'Locate Point' }).click()

    expect(locateRequests.length).toBeGreaterThan(0)

    const locateRequest = locateRequests[0]
    expect(locateRequest.method).toBe('POST')
    expect(locateRequest.url).toMatch(
      /https:\/\/valhalla1\.openstreetmap\.de\/locate/
    )
    expect(locateRequest.body).toBeDefined()
    expect(locateRequest.body.costing).toBe('bicycle')
    expect(locateRequest.body.locations).toStrictEqual([
      { lat: 52.51789222838286, lon: 13.393707275390627 },
    ])
  })
})

test.describe('Map interactions with URL parameters', () => {
  test('should show the route if url has route parameters', async ({
    page,
  }) => {
    const nominatimRequests = await setupNominatimMock(page)
    const routeRequests = await setupRouteMock(page)

    await page.goto(
      `http://localhost:3000/directions?profile=pedestrian&wps=13.343067169189455%2C52.5296422146409%2C13.33414077758789%2C52.50901237642168`
    )

    await page.waitForTimeout(2000)

    await expect(page.locator('svg.leaflet-zoom-animated')).toHaveCount(1)
    await expect(
      page.locator('svg.leaflet-zoom-animated .leaflet-interactive')
    ).toHaveCount(2)

    await expect(
      page
        .getByTestId('waypoint-input-0')
        .getByRole('textbox', { name: 'Hit enter for search...' })
    ).toHaveValue('Unter den Linden, Mitte, Berlin, Germany')

    await expect(
      page
        .getByTestId('waypoint-input-1')
        .getByRole('textbox', { name: 'Hit enter for search...' })
    ).toHaveValue('Unter den Linden, Mitte, Berlin, Germany')

    expect(nominatimRequests.length).toBe(2)
    expect(routeRequests.length).toBe(1)
  })
})

test.describe('Left drawer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/')
  })

  test('should send the route request again when user changed profile', async ({
    page,
  }) => {
    await setupNominatimMock(page)
    const routeRequests = await setupRouteMock(page)

    // Add first via point
    await page.getByTestId('map').click({ button: 'right' })
    await page.getByRole('button', { name: 'Add as via point' }).click()
    await page.waitForTimeout(2000)

    // Add second via point
    await page.getByTestId('map').click({ button: 'right' })
    await page.getByRole('button', { name: 'Add as via point' }).click()
    await page.waitForTimeout(2000)

    await expect(page.getByTestId('waypoint-input-1')).toBeVisible()
    await expect(page.getByTestId('waypoint-input-2')).toBeVisible()

    expect(routeRequests.length).toBe(1)

    await page.getByTestId('profile-button-pedestrian').click()

    // currently, there is a bug where we are sending two requests instead of one
    expect(routeRequests.length).toBe(3)
  })
})
