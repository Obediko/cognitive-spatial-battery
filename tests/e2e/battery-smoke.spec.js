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


test('complex figure accepts multiple separate mouse strokes', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin Setup' }).click();
  await page.locator('input[type="text"]').fill('E2E_OCF');
  await page.getByRole('button', { name: 'Confirm ID' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue without fullscreen' }).click();
  await page.getByRole('button', { name: 'Original Complex Figure only' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Begin copy' }).click();

  const box = await page.locator('#ocf-canvas').boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box.x + 80, box.y + 90);
  await page.mouse.down();
  await page.mouse.move(box.x + 210, box.y + 170, { steps: 8 });
  await page.mouse.up();
  await page.mouse.move(box.x + 280, box.y + 110);
  await page.mouse.down();
  await page.mouse.move(box.x + 410, box.y + 230, { steps: 8 });
  await page.mouse.up();
  await page.getByRole('button', { name: 'Finish drawing' }).click();

  await expect.poll(() => page.evaluate(() => {
    const row = window.BatteryData.trials.find((trial) => trial.phase === 'copy_drawing');
    return row ? row.stroke_count : null;
  })).toBe(2);
});


test('visual naming starts its clock only after the image is available', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => Promise.reject(new Error('test permission denial')) }
    });
  });
  let releaseImage;
  const imageGate = new Promise((resolve) => { releaseImage = resolve; });
  await page.route('**/assets/images/visual-naming/cup.png', async (route) => {
    await imageGate;
    await route.continue();
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Begin Setup' }).click();
  await page.locator('input[type="text"]').fill('E2E_OVN_ONSET');
  await page.getByRole('button', { name: 'Confirm ID' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue without fullscreen' }).click();
  await page.getByRole('button', { name: 'Original Visual Naming only' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Begin' }).click();

  const next = page.getByRole('button', { name: 'Answer given — next item' });
  await expect(next).toBeDisabled();
  await expect(page.locator('#ovn-time')).toHaveText('20');
  await page.waitForTimeout(500);
  await expect(page.locator('#ovn-time')).toHaveText('20');

  releaseImage();
  await expect(next).toBeEnabled({ timeout: 5000 });
  await expect(page.getByText('Speak one answer clearly')).toBeVisible();
});
