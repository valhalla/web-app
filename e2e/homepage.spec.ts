import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/')
})

test('has title', async ({ page }) => {
  await expect(page).toHaveTitle(/Valhalla FOSSGIS/)
})

test('has default elements in the page', async ({ page }) => {
  await page.goto('http://localhost:3000/')
  await expect(
    page.locator('div').filter({
      hasText: /^Calculations by Valhalla • Visualized with Valhalla App$/,
    })
  ).toBeVisible()
  await expect(page.getByTestId('map')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open OSM' })).toBeVisible()
  await expect(page.getByTitle('Height Graph')).toBeVisible()
  await expect(page.getByTitle('Edit Layers').getByRole('button')).toBeVisible()
  await expect(page.getByTitle('Drag Layers').getByRole('button')).toBeVisible()
  await expect(
    page.getByTitle('Remove Layers').getByRole('button')
  ).toBeVisible()
  await expect(
    page.getByTitle('Rotate Layers').getByRole('button')
  ).toBeVisible()
  await expect(page.getByTitle('Draw Text').getByRole('button')).toBeVisible()
  await expect(
    page.getByTitle('Draw Polygons').getByRole('button')
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Zoom out' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible()
})
