import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function authenticate(page: Page) {
  const password = process.env.NEXUS_TEST_PASSWORD;
  if (!password) throw new Error('NEXUS_TEST_PASSWORD is required.');
  await page.goto('/login');
  await page.getByLabel('Workspace password').fill(password);
  await page.getByRole('button', { name: 'Open workspace' }).click();
  await expect(page).toHaveURL(/\/$/);
}

test.beforeEach(async ({ page }) => authenticate(page));

test('shows held-out metrics and investigator navigation', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: 'Detection verdict' }),
  ).toBeVisible();
  await expect(page.getByText('Held-out synthetic evaluation')).toBeVisible();
  await page.goto('/runs');
  await expect(
    page.getByRole('heading', { name: 'Run history' }),
  ).toBeVisible();
  await page.getByRole('row').nth(1).click();
  await expect(
    page.getByRole('heading', { name: 'Analysis run' }),
  ).toBeVisible();
  await page.goto('/methodology');
  await expect(
    page.getByRole('heading', { name: /How Nexus measures/ }),
  ).toBeVisible();
});

test('has no serious or critical automated accessibility violations', async ({
  page,
}) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (violation) =>
      violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(blocking).toEqual([]);
});

test('keeps relationship evidence available on mobile without the graph', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile',
    'Mobile-only fallback assertion.',
  );
  await page.goto('/');
  await expect(page.locator('.relationship-map')).toBeHidden();
  await expect(page.getByLabel('Relationship evidence table')).toBeVisible();
});
