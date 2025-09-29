import { test, expect } from '@playwright/test';
import { setupStatusMock } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/');
});

test('has title', async ({ page }) => {
  await expect(page).toHaveTitle(/Valhalla FOSSGIS/);
});

test('has default elements in the page', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  await setupStatusMock(page);

  await expect(page.getByTestId('map')).toBeVisible();

  await expect(page.getByTestId('directions-tab-button')).toBeVisible();
  await expect(page.getByTestId('isochrones-tab-button')).toBeVisible();
  await expect(page.getByTestId('close-directions-button')).toBeVisible();

  await expect(page.getByTestId('profile-button-bicycle')).toBeVisible();
  await expect(page.getByTestId('profile-button-pedestrian')).toBeVisible();
  await expect(page.getByTestId('profile-button-car')).toBeVisible();
  await expect(page.getByTestId('profile-button-truck')).toBeVisible();
  await expect(page.getByTestId('profile-button-bus')).toBeVisible();
  await expect(page.getByTestId('profile-button-motor_scooter')).toBeVisible();
  await expect(page.getByTestId('profile-button-motorcycle')).toBeVisible();

  await expect(page.getByTestId('show-hide-settings-btn')).toBeVisible();

  await expect(page.getByRole('button', { name: '1' })).toBeVisible();
  await expect(page.getByRole('button', { name: '2' })).toBeVisible();

  await expect(page.getByTestId('add-waypoint-button')).toBeVisible();
  await expect(page.getByTestId('reset-waypoints-button')).toBeVisible();

  await expect(page.getByText('Nonspecific timeNonspecific')).toBeVisible();
  await expect(page.getByTestId('date-time-picker')).toBeVisible();

  await expect(
    page.locator('div').filter({
      hasText: /^Calculations by Valhalla • Visualized with Valhalla App$/,
    })
  ).toBeVisible();

  await page.getByTestId('isochrones-tab-button').click();

  await expect(
    page.getByRole('textbox', { name: 'Hit enter for search...' })
  ).toBeVisible();
  await page.getByTestId('reset-center-button').click();

  await expect(
    page.locator('div').filter({ hasText: /^Settings$/ })
  ).toBeVisible();

  await expect(page.getByText('Maximum Rangemins10')).toBeVisible();
  await expect(page.getByText('Interval Stepmins10')).toBeVisible();
  await expect(page.getByText('Denoise0.1')).toBeVisible();
  await expect(page.getByText('Generalizemeters0')).toBeVisible();

  await expect(
    page.getByText('Last Data Update: 2025-09-17, 04:19')
  ).toBeVisible();

  await expect(page.getByRole('button', { name: 'Layers' })).toBeVisible();

  await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Zoom out' })).toBeVisible();

  await expect(
    page.getByTitle('Draw Polygons').getByRole('button')
  ).toBeVisible();
  await expect(page.getByTitle('Draw Text').getByRole('button')).toBeVisible();

  await expect(
    page.getByTitle('Edit Layers').getByRole('button')
  ).toBeVisible();
  await expect(
    page.getByTitle('Drag Layers').getByRole('button')
  ).toBeVisible();
  await expect(
    page.getByTitle('Remove Layers').getByRole('button')
  ).toBeVisible();
  await expect(
    page.getByTitle('Rotate Layers').getByRole('button')
  ).toBeVisible();

  await expect(page.getByRole('button', { name: 'Open OSM' })).toBeVisible();
  await expect(page.getByTitle('Height Graph')).toBeVisible();
});
