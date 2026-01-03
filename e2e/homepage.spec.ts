import { test, expect } from '@playwright/test';
import { setupStatusMock } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/');
});

test('has title', async ({ page }) => {
  await expect(page).toHaveTitle(/Valhalla FOSSGIS/);
});

test('should retain profile when switching between tabs', async ({ page }) => {
  await expect(page.getByTestId('profile-button-bicycle')).toHaveAttribute(
    'data-state',
    'on'
  );
  expect(page.url()).toContain('profile=bicycle');

  await page.getByTestId('profile-button-car').click();
  await expect(page.getByTestId('profile-button-car')).toHaveAttribute(
    'data-state',
    'on'
  );
  expect(page.url()).toContain('profile=car');

  await page.getByTestId('isochrones-tab-button').click();

  await expect(page.getByTestId('profile-button-car')).toHaveAttribute(
    'data-state',
    'on'
  );
  expect(page.url()).toContain('profile=car');
  expect(page.url()).toContain('/isochrones');

  await page.getByTestId('directions-tab-button').click();

  await expect(page.getByTestId('profile-button-car')).toHaveAttribute(
    'data-state',
    'on'
  );
  expect(page.url()).toContain('profile=car');
  expect(page.url()).toContain('/directions');
});

test('has default elements in the page', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  await setupStatusMock(page);

  await expect(page.getByRole('region', { name: 'Map' })).toBeVisible();

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

  expect(await page.getByText('Select a waypoint...').count()).toBe(2);

  await expect(page.getByTestId('add-waypoint-button')).toBeVisible();
  await expect(page.getByTestId('reset-waypoints-button')).toBeVisible();

  await expect(page.getByText('Non-specific time')).toBeVisible();
  await expect(page.getByTestId('date-time-picker')).toBeVisible();

  await expect(
    page.getByText(/^Calculations by Valhalla • Visualized with Valhalla App$/)
  ).toBeVisible();

  await page.getByTestId('isochrones-tab-button').click();

  await page.getByTestId('remove-waypoint-button').click();

  await expect(page.getByText(/^Isochrones Settings$/)).toBeVisible();

  await page.getByText(/^Isochrones Settings$/).click();

  await expect(page.getByText('Maximum Range', { exact: true })).toBeVisible();
  await expect(page.getByText('Interval Step', { exact: true })).toBeVisible();
  await expect(page.getByText('Denoise', { exact: true })).toBeVisible();
  await expect(page.getByText('Generalize', { exact: true })).toBeVisible();

  await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Zoom out' })).toBeVisible();

  await expect(page.getByRole('button', { name: 'Polygon' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Select' })).toBeVisible();

  await expect(page.getByRole('button', { name: 'Open OSM' })).toBeVisible();
});
