const { test, expect } = require('@playwright/test');

async function openEnglishBattery(page) {
  await page.goto('/');
  const english = page.getByRole('button', { name: /English/ });
  if (await english.isVisible()) await english.click();
  await expect(page.getByRole('heading', { name: /Baseline Cognitive/ })).toBeVisible();
}

async function openGermanBattery(page) {
  await page.goto('/');
  const german = page.getByRole('button', { name: /Deutsch/ });
  if (await german.isVisible()) await german.click();
  await expect(page.getByRole('heading', { name: /Kognitive und räumliche Testbatterie/ })).toBeVisible();
}

test('language selection shows US and German flags', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'English' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Deutsch' })).toBeVisible();
  await expect(page.locator('.language-flag')).toHaveCount(2);
});

test('German administration reaches the German task menu and German visual naming flow', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => Promise.reject(new Error('test permission denial')) }
    });
  });
  await openGermanBattery(page);
  await page.getByRole('button', { name: 'Einrichtung beginnen' }).click();
  await page.locator('input[type="text"]').fill('E2E_DE_PARITY');
  await page.getByRole('button', { name: 'ID bestätigen' }).click();
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByRole('button', { name: 'Ohne Vollbild fortfahren' }).click();
  await expect(page.getByRole('heading', { name: 'Testauswahl' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '8 Scores aus 5 Aufgabenfamilien' })).toBeVisible();
  await page.getByRole('button', { name: 'Auswahl löschen' }).click();
  await page.locator('.task-check[value="ovn"]').check();
  await page.getByRole('button', { name: 'Ausgewählte Aufgaben starten' }).click();
  await page.getByRole('button', { name: 'Weiter' }).click();
  await expect(page.getByRole('heading', { name: 'Benennen Sie jeden Gegenstand' })).toBeVisible();
  await expect(page.getByText('In diesem Protokoll werden während der Testung keine Hinweise gegeben.')).toBeVisible();
  await page.getByRole('button', { name: 'Beginnen' }).click();
  const germanNext = page.getByRole('button', { name: 'Antwort gegeben — nächstes Bild' });
  await expect(germanNext).toBeEnabled({ timeout: 8000 });
  await expect(page.locator('.ovn-stimulus-image')).toBeVisible();
  await expect(page.getByText('Preparing image…')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('battery clearly separates the eight ETI scores and supports custom task selection', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openEnglishBattery(page);
  await page.getByRole('button', { name: 'Begin Setup' }).click();
  await page.locator('input[type="text"]').fill('E2E_001');
  await page.getByRole('button', { name: 'Confirm ID' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue without fullscreen' }).click();
  await expect(page.getByRole('heading', { name: 'Task Menu' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Run ETI core: all 8 scores/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: '8 scores from 5 task families' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Not part of the 8 ETI scores' })).toBeVisible();
  await expect(page.locator('.eti-task-group')).toHaveCSS('border-top-color', 'rgb(91, 192, 222)');
  await expect(page.getByText('Estimated time: 30–45 min')).toBeVisible();
  await expect(page.getByText(/Pilot mode:/)).toHaveCount(0);
  await expect(page.locator('.task-check')).toHaveCount(8);
  await expect(page.locator('.task-check:checked')).toHaveCount(5);
  await page.getByRole('button', { name: 'Select all tasks' }).click();
  await expect(page.locator('.task-check:checked')).toHaveCount(8);
  await expect(page.getByText('Estimated time: 45–65 min')).toBeVisible();
  await page.getByRole('button', { name: 'Select ETI core' }).click();
  await expect(page.locator('.task-check:checked')).toHaveCount(5);
  expect(errors).toEqual([]);
});


test('desktop workspace uses the available screen width', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openEnglishBattery(page);
  const width = await page.locator('.jspsych-content-wrapper').evaluate((element) => element.getBoundingClientRect().width);
  expect(width).toBeGreaterThan(1300);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('participant IDs reject characters that would break remote synchronization', async ({ page }) => {
  await openEnglishBattery(page);
  await page.getByRole('button', { name: 'Begin Setup' }).click();
  const input = page.locator('input[type="text"]');
  await input.fill('P 5/DE@example');
  await expect(input).toHaveValue('P5DEexample');
  await expect(input).toHaveAttribute('maxlength', '64');
  await expect(input).toHaveAttribute('pattern', '[A-Za-z0-9_-]{1,64}');
});

test('Number Span displays a readable digit five and accepts keypad input', async ({ page }) => {
  await openEnglishBattery(page);
  await page.getByRole('button', { name: 'Begin Setup' }).click();
  await page.locator('input[type="text"]').fill('E2E_DIGIT_5');
  await page.getByRole('button', { name: 'Confirm ID' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue without fullscreen' }).click();
  await page.getByRole('button', { name: 'Clear selection' }).click();
  await page.locator('.task-check[value="ns"]').check();
  await page.getByRole('button', { name: 'Run selected tasks' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Number Span — Forward' })).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Continue' }).click();
  const five = page.getByRole('button', { name: 'Digit 5' });
  await expect(five).toBeVisible({ timeout: 10000 });
  const bounds = await five.boundingBox();
  expect(bounds.width).toBeGreaterThanOrEqual(44);
  expect(bounds.height).toBeGreaterThanOrEqual(44);
  await five.click();
  await expect(page.locator('#ns-response-input')).toHaveValue('5');
  await expect(page.getByText('1 of 3 digits entered')).toBeVisible();
});


test('complex figure accepts multiple separate mouse strokes', async ({ page }) => {
  await openEnglishBattery(page);
  await page.getByRole('button', { name: 'Begin Setup' }).click();
  await page.locator('input[type="text"]').fill('E2E_OCF');
  await page.getByRole('button', { name: 'Confirm ID' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue without fullscreen' }).click();
  await page.getByRole('button', { name: 'Clear selection' }).click();
  await page.locator('.task-check[value="ocf"]').check();
  await page.getByRole('button', { name: 'Run selected tasks' }).click();
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

  await openEnglishBattery(page);
  await page.getByRole('button', { name: 'Begin Setup' }).click();
  await page.locator('input[type="text"]').fill('E2E_OVN_ONSET');
  await page.getByRole('button', { name: 'Confirm ID' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue without fullscreen' }).click();
  await page.getByRole('button', { name: 'Clear selection' }).click();
  await page.locator('.task-check[value="ovn"]').check();
  await page.getByRole('button', { name: 'Run selected tasks' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Begin' }).click();

  const next = page.getByRole('button', { name: 'Answer given — next item' });
  await expect(next).toBeDisabled();
  await expect(page.locator('.ovn-stimulus-image')).toBeHidden();
  await expect(page.locator('#ovn-time')).toHaveText('20');
  await page.waitForTimeout(500);
  await expect(page.locator('#ovn-time')).toHaveText('20');

  releaseImage();
  await expect(next).toBeEnabled({ timeout: 5000 });
  await expect(page.locator('.ovn-stimulus-image')).toBeVisible();
  await expect(page.getByText('Speak one answer clearly')).toBeVisible();
  await next.click();
  await expect(page.getByText('Item 2 of 32')).toBeVisible({ timeout: 5000 });
});

test('animal naming requires practice and changes Start to Stop during the timed task', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => Promise.reject(new Error('test permission denial')) }
    });
  });
  await openEnglishBattery(page);
  await page.getByRole('button', { name: 'Begin Setup' }).click();
  await page.locator('input[type="text"]').fill('E2E_ASF_FLOW');
  await page.getByRole('button', { name: 'Confirm ID' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue without fullscreen' }).click();
  await page.getByRole('button', { name: 'Clear selection' }).click();
  await page.locator('.task-check[value="asf"]').check();
  await page.getByRole('button', { name: 'Run selected tasks' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue to practice' }).click();

  await expect(page.getByRole('heading', { name: 'Try a different category first' })).toBeVisible();
  await page.getByRole('button', { name: 'Start practice' }).click();
  await expect(page.getByText('Now say two things that people use for writing.')).toBeVisible();
  await page.waitForTimeout(250);
  await page.getByRole('button', { name: 'Finish practice' }).click();

  await page.getByRole('button', { name: 'Check microphone' }).click();
  await expect(page.getByRole('button', { name: 'Continue with protocol flag' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue with protocol flag' }).click();
  await expect(page.getByText('The real task is about to begin.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Stop', exact: true })).toBeVisible();
  await expect(page.getByText('Timer running; audio is not being recorded.')).toBeVisible();
  await expect(page.locator('#asf-time')).not.toHaveText('60');
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Animal Naming complete' })).toBeVisible();
});


test('authenticated examiner checkpoint opens separately from the participant timeline', async ({ page }) => {
  await page.route('**/api/admin-sessions', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sessions: [] }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });
  await page.addInitScript(() => {
    localStorage.setItem('csb-recovery-v1:ADMIN_E2E', JSON.stringify({
      saved_at: new Date().toISOString(),
      participantId: 'ADMIN_E2E',
      sessionStart: new Date().toISOString(),
      trials: [],
      taskSummaries: {},
      batteryChoice: 'full',
      sessionStatus: 'participant_complete',
      taskState: { ocfCopyCompletedAt: null }
    }));
  });
  await page.goto('/admin.html');
  await expect(page.getByRole('heading', { name: 'Scoring portal' })).toBeVisible();
  await expect(page.locator('.local-load')).toContainText('ADMIN_E2E');
  await expect(page.locator('.local-delete')).toBeVisible();
  await page.locator('.local-load').click();
  await expect(page.getByRole('heading', { name: 'Scoring checkpoint' })).toBeVisible();
  await page.getByRole('button', { name: 'Begin examiner review' }).click();
  await expect(page.getByRole('heading', { name: 'Review complete' })).toBeVisible();
});

test('completed German sessions reopen directly without losing verified status', async ({ page }) => {
  await page.route('**/api/admin-sessions', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sessions: [] }) });
  });
  await page.addInitScript(() => {
    if (localStorage.getItem('csb-recovery-v1:ADMIN_DE')) return;
    localStorage.setItem('csb-recovery-v1:ADMIN_DE', JSON.stringify({
      saved_at: '2026-08-20T10:35:00.000Z',
      participantId: 'ADMIN_DE',
      language: 'de',
      sessionStart: '2026-08-20T10:00:00.000Z',
      participantCompletedAt: '2026-08-20T10:30:00.000Z',
      trials: [],
      taskSummaries: {},
      sessionStatus: 'examiner_review_complete',
      taskState: {}
    }));
  });
  await page.goto('/admin.html');
  await page.locator('.local-load').click();
  await expect(page.getByRole('heading', { name: 'Review complete' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Review and rescore session' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  const state = await page.evaluate(() => ({
    language: window.BatteryLanguage.get(),
    status: window.BatteryData.sessionStatus,
    end: buildSummary().session_end
  }));
  expect(state).toEqual({ language: 'de', status: 'examiner_review_complete', end: '2026-08-20T10:30:00.000Z' });
});

test('collective reports preserve each session language and identify selected ETI subsets', async ({ page }) => {
  await page.goto('/');
  const rows = await page.evaluate(() => window.BatteryReporting.collectiveRows([{
    participantId: 'COLLECTIVE_DE',
    language: 'de',
    sessionStart: '2026-08-20T10:00:00.000Z',
    participantCompletedAt: '2026-08-20T10:20:00.000Z',
    sessionStatus: 'examiner_review_complete',
    trials: [{ task_name: 'number_span' }],
    taskSummaries: { number_span: { ns_forward_correct_trials: 5, ns_backward_correct_trials: 4 } }
  }, {
    participantId: 'COLLECTIVE_EN',
    language: 'en',
    sessionStart: '2026-08-20T11:00:00.000Z',
    participantCompletedAt: '2026-08-20T11:15:00.000Z',
    sessionStatus: 'participant_complete',
    trials: [{ task_name: 'number_span' }],
    taskSummaries: { number_span: { ns_forward_correct_trials: 3, ns_backward_correct_trials: 2 } }
  }]).map(row => ({
    participant: row.participant_id,
    language: row.administration_language,
    form: row.language_form_version,
    status: row.session_status,
    eti: row.eti_input_status
  })));
  expect(rows).toEqual([
    { participant: 'COLLECTIVE_DE', language: 'de', form: 'csb-de-1.0', status: 'examiner_review_complete', eti: 'selected_subset_only' },
    { participant: 'COLLECTIVE_EN', language: 'en', form: 'csb-en-1.0', status: 'participant_complete', eti: 'selected_subset_only' }
  ]);
});
