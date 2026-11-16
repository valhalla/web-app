import { test, expect } from '@playwright/test';

const OUT =
  '/tmp/claude-1000/-home-chris-dev-github-valhalla-app/91b03a8f-c3f8-465d-a412-298a4c0d632f/scratchpad';

test('round trip', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('round_trip'))
      requests.push(decodeURIComponent(r.url()));
  });
  page.on('response', async (r) => {
    if (r.status() >= 400)
      console.log(
        'BAD',
        r.status(),
        decodeURIComponent(r.url()).slice(0, 200),
        (await r.text().catch(() => '')).slice(0, 200)
      );
  });
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') console.log('CONSOLE', m.text());
  });
  await page.route('http://localhost:8002/**', async (route) => {
    const cors = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
    };
    if (route.request().method() === 'OPTIONS')
      return route.fulfill({ status: 204, headers: cors });
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: { ...response.headers(), ...cors },
    });
  });
  await page.addInitScript(() =>
    localStorage.setItem('valhalla_base_url', 'http://localhost:8002')
  );

  await page.goto(
    'http://localhost:3000/round-trip?profile=bicycle&wps=16.3738,48.2082&distance=15&heading=90'
  );
  await expect(
    page.getByText('Round Trip', { exact: true }).last()
  ).toBeVisible({ timeout: 30000 });
  await expect(page.locator('h3', { hasText: 'Round Trip' })).toBeVisible({
    timeout: 30000,
  });
  await page.waitForTimeout(2500);
  console.log('URL1', page.url());
  console.log('REQ1', requests.at(-1));
  console.log(
    'CARD1',
    await page.locator('h3:text-is("Round Trip")').locator('..').innerText()
  );
  await page.screenshot({ path: `${OUT}/rt-1.png` });

  // change heading via slider input: click the value to edit
  // right click on the map to set a new start
  await page.mouse.click(1100, 450, { button: 'right' });
  await page.getByRole('button', { name: 'Start round trip here' }).click();
  await page.waitForTimeout(4000);
  console.log('URL2', page.url());
  console.log('REQ2', requests.at(-1));
  console.log(
    'CARD2',
    await page.locator('h3:text-is("Round Trip")').locator('..').innerText()
  );
  await page.screenshot({ path: `${OUT}/rt-2.png` });

  // switch to directions: round trip line should go away, directions has none
  await page.getByTestId('directions-tab-button').click();
  await page.waitForTimeout(1000);
  console.log('URL3', page.url());
  await page.screenshot({ path: `${OUT}/rt-3.png` });
  await page.getByTestId('round-trip-tab-button').click();
  await page.waitForTimeout(1000);
  console.log('URL4', page.url());
  await page.screenshot({ path: `${OUT}/rt-4.png` });
});
