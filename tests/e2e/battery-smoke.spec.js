const { test, expect } = require('@playwright/test');

test('battery loads all eight task choices without browser errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Baseline Cognitive/ })).toBeVisible();
  await page.getByRole('button', { name: 'Begin Setup' }).click();
  await page.locator('input[type="text"]').fill('E2E_001');
  await page.getByRole('button', { name: 'Confirm ID' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue without fullscreen' }).click();
  await expect(page.getByRole('heading', { name: 'Task Menu' })).toBeVisible();
  for (const label of [
    'Original Story Recall only',
    'Animal Naming only',
    'Original Visual Naming only',
    'Original Complex Figure only',
    'Visual Sequencing & Set-Shifting only',
    'Object-Location Memory only',
    'Spatial Pointing only',
    'Number Span only'
  ]) await expect(page.getByRole('button', { name: label })).toBeVisible();
  expect(errors).toEqual([]);
});


test('desktop workspace uses the available screen width', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const width = await page.locator('.jspsych-content-wrapper').evaluate((element) => element.getBoundingClientRect().width);
  expect(width).toBeGreaterThan(1300);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
