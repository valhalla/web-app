import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

async function openSettingsPanel(page: Page) {
  await page.getByTestId('tab-directions-button').click();
  await page.getByTestId('show-hide-settings-btn').click();
  // wait for the settings panel content to be visible
  await expect(
    page.getByRole('checkbox', { name: 'Shortest', exact: true })
  ).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto(`${BASE_URL}/directions?profile=car`);
  await openSettingsPanel(page);
});

test('costing options appear in URL when a setting is changed', async ({
  page,
}) => {
  await page.getByRole('checkbox', { name: 'Shortest', exact: true }).click();

  await expect(page).toHaveURL(/costing=/);
  const url = new URL(page.url());
  const costing = JSON.parse(
    decodeURIComponent(url.searchParams.get('costing')!)
  );
  // costing is stored as a plain object in the URL (not double-encoded)
  expect(costing).toHaveProperty('shortest', true);
});

test('costing options persist after page refresh', async ({ page }) => {
  await page.getByRole('checkbox', { name: 'Shortest', exact: true }).click();
  await expect(page).toHaveURL(/costing=/);

  await page.reload();
  await openSettingsPanel(page);

  await expect(
    page.getByRole('checkbox', { name: 'Shortest', exact: true })
  ).toBeChecked();
  await expect(page).toHaveURL(/costing=/);
});

test('costing param is removed from URL when settings are reset to defaults', async ({
  page,
}) => {
  await page.getByRole('checkbox', { name: 'Shortest', exact: true }).click();
  await expect(page).toHaveURL(/costing=/);

  await page.getByRole('button', { name: 'Reset', exact: true }).last().click();

  await expect(page).not.toHaveURL(/costing=/);
  await expect(
    page.getByRole('checkbox', { name: 'Shortest', exact: true })
  ).not.toBeChecked();
});

test('costing param is cleared when switching profiles', async ({ page }) => {
  await page.getByRole('checkbox', { name: 'Shortest', exact: true }).click();
  await expect(page).toHaveURL(/costing=/);

  await page.getByTestId('close-settings-button').click();
  await page.getByTestId('profile-button-bicycle').click();

  await expect(page).not.toHaveURL(/costing=/);
});

test('page loads correctly with costing options in URL', async ({ page }) => {
  // costing is a plain JSON object in the URL (TanStack Router serializes objects natively)
  const costing = encodeURIComponent(JSON.stringify({ shortest: true }));
  await page.goto(`${BASE_URL}/directions?profile=car&costing=${costing}`);
  await openSettingsPanel(page);

  await expect(
    page.getByRole('checkbox', { name: 'Shortest', exact: true })
  ).toBeChecked();
});

test('page loads correctly with invalid costing param in URL', async ({
  page,
}) => {
  // An invalid (non-object) costing param is ignored by the fallback; page loads normally
  await page.goto(`${BASE_URL}/directions?profile=car&costing=not-valid-json`);
  await openSettingsPanel(page);

  await expect(
    page.getByRole('checkbox', { name: 'Shortest', exact: true })
  ).not.toBeChecked();
});
