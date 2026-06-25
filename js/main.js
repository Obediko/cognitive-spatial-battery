/* ============================================================
   main.js - Battery orchestration
   ============================================================
   Initialises jsPsych, presents the welcome/ID/menu screens,
   runs selected task(s), and shows the completion/download screen.
   All task-builder functions are defined in js/tasks/*.js and
   js/utils.js, which are loaded before this file in index.html.
   ============================================================ */
'use strict';

/* ── Progress bar helpers ─────────────────────────────────── */
function injectProgressBar() {
  if (document.getElementById('battery-progress-bar-container')) return;
  const c = document.createElement('div');
  c.id = 'battery-progress-bar-container';
  c.innerHTML = '<div id="battery-progress-bar" style="width:0%"></div>';
  document.body.appendChild(c);
}
function setProgress(pct) {
  const bar = document.getElementById('battery-progress-bar');
  if (bar) bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
}

/* ── Small-screen JS check ────────────────────────────────── */
function checkScreenSize() {
  const warning = document.getElementById('small-screen-warning');
  const dims    = document.getElementById('screen-dims');
  if (dims) dims.textContent = window.innerWidth + 'x' + window.innerHeight + 'px';
  if (warning) {
    warning.style.display = (window.innerWidth < 750 || window.innerHeight < 520) ? 'flex' : 'none';
  }
}
window.addEventListener('resize', checkScreenSize);
checkScreenSize();

/* ── Welcome + participant ID screen ──────────────────────── */
function makeWelcomeTrials() {
  /* Step 1: Welcome */
  const welcome = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div style="max-width:700px;margin:0 auto;text-align:center;padding:1em">
        <h1 style="color:#a8d8ea">Baseline Cognitive &amp; Spatial Battery</h1>
        <div class="info-box" style="text-align:left">
          <p><strong>What this is:</strong> A brief computerized baseline cognitive/spatial battery
          administered during the intake session to characterize individual differences relevant to
          spatial navigation performance.</p>
          <p><strong>What this is NOT:</strong> This is not a stimulation-outcome task. It will not
          measure effects of any stimulation. Results will be used for participant characterization
          and may serve as covariates or exploratory moderators in analyses.</p>
          <p><strong>Duration:</strong> Approximately 15–25 minutes for the full battery.</p>
          <p><strong>Tasks included:</strong> Visual Sequencing &amp; Set-Shifting &bull;
          Object-Location Memory &bull; Spatial Pointing</p>
        </div>
        <p style="color:#8899aa;font-size:0.9rem;margin-top:1em">
          Please run this on a <strong>laptop or desktop computer</strong> in a quiet environment.<br>
          A mouse or trackpad is required.
        </p>
      </div>`,
    choices: ['Begin Setup →'],
    data: { battery_phase: 'welcome' }
  };

  /* Step 2: Participant ID */
  const participantId = {
    type: jsPsychSurveyText,
    questions: [{
      prompt: `<div style="text-align:center">
        <h3 style="color:#a8d8ea">Participant ID</h3>
        <p style="color:#cdd9e5;max-width:500px;margin:0 auto 1em">
          Please enter your <strong>pseudonymous participant ID</strong>
          (e.g. P001, CSB_042).<br>
          <span style="color:#ef9a9a;font-size:0.85rem">
            Do NOT enter your name, email, student number, date of birth, or any identifying information.
          </span>
        </p>
      </div>`,
      name: 'participant_id',
      required: true,
      placeholder: 'e.g. P001'
    }],
    button_label: 'Confirm ID →',
    data: { battery_phase: 'participant_id' },
    on_finish(data) {
      const pid = (data.response && data.response.participant_id)
                    ? data.response.participant_id.trim() : 'UNKNOWN';
      window.BatteryData.participantId = pid;
      window.BatteryData.sessionStart  = getTimestamp();
    }
  };

  /* Step 3: Device check info */
  const deviceCheck = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div style="max-width:660px;margin:0 auto;text-align:center">
        <h3 style="color:#a8d8ea;margin-bottom:0.6em">Before We Start</h3>
        <div class="info-box" style="text-align:left">
          <p>&#10003; Use a <strong>laptop or desktop</strong> — not a phone or tablet.</p>
          <p>&#10003; Use <strong>Google Chrome</strong> for best compatibility.</p>
          <p>&#10003; Ensure your screen is at least <strong>900 × 600 px</strong>.</p>
          <p>&#10003; Close other applications to minimise distractions.</p>
          <p>&#10003; You will be prompted to enter <strong>fullscreen mode</strong>.</p>
        </div>
        <p style="color:#8899aa;font-size:0.85rem;margin-top:0.5em">
          Current window: <strong id="curr-dims">—</strong>
        </p>
      </div>`,
    choices: ['Continue →'],
    data: { battery_phase: 'device_check' },
    on_load() {
      const el = document.getElementById('curr-dims');
      if (el) el.textContent = window.innerWidth + ' × ' + window.innerHeight + ' px';
    }
  };

  /* Step 4: Fullscreen */
  const fullscreen = {
    type: jsPsychFullscreen,
    fullscreen_mode: true,
    message: `<div style="text-align:center;max-width:600px;margin:0 auto">
      <h3 style="color:#a8d8ea">Fullscreen Mode</h3>
      <p>The battery will now switch to fullscreen. This helps ensure consistent spatial measurements.</p>
      <p style="color:#8899aa;font-size:0.85rem">Press <strong>Escape</strong> at any time to exit fullscreen.</p>
    </div>`,
    button_label: 'Enter Fullscreen →',
    data: { battery_phase: 'fullscreen' }
  };

  return [welcome, participantId, deviceCheck, fullscreen];
}

/* ── Task menu ────────────────────────────────────────────── */
function makeTaskMenu(jsPsych) {
  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div style="max-width:680px;margin:0 auto;text-align:center">
        <h2 style="color:#a8d8ea;margin-bottom:0.4em">Task Menu</h2>
        <p style="color:#cdd9e5;margin-bottom:0.3em">
          Participant ID: <strong id="pid-display">—</strong>
        </p>
        <p style="color:#8899aa;font-size:0.85rem;margin-bottom:1.2em">
          Select which tasks to run. For the baseline session, choose <em>Run Full Battery</em>.
        </p>
        <div style="display:grid;gap:0.6em;max-width:420px;margin:0 auto">
          <button class="battery-btn primary" id="btn-full">&#9654; Run Full Battery (~15–25 min)</button>
          <button class="battery-btn" id="btn-vs">&#9654; Visual Sequencing &amp; Set-Shifting only</button>
          <button class="battery-btn" id="btn-olm">&#9654; Object-Location Memory only</button>
          <button class="battery-btn" id="btn-sp">&#9654; Spatial Pointing only</button>
        </div>
        <p style="color:#8899aa;font-size:0.8rem;margin-top:1.2em">
          &#9432; In pilot mode, timings are shortened.
          Set <code>window.PILOT_MODE = false</code> in utils.js for real data collection.
        </p>
      </div>`,
    choices: [],  /* no default choices — we use custom buttons below */
    response_ends_trial: false,
    data: { battery_phase: 'task_menu' },
    on_load() {
      const el = document.getElementById('pid-display');
      if (el) el.textContent = window.BatteryData.participantId || 'not set';

      const finish = (choice) => {
        window._batteryChoice = choice;
        jsPsych.finishTrial({ battery_choice: choice });
      };
      document.getElementById('btn-full')?.addEventListener('click', () => finish('full'));
      document.getElementById('btn-vs')?.addEventListener('click',   () => finish('vs'));
      document.getElementById('btn-olm')?.addEventListener('click',  () => finish('olm'));
      document.getElementById('btn-sp')?.addEventListener('click',   () => finish('sp'));
    }
  };
}

/* ── Completion / download screen ─────────────────────────── */
function makeCompletionScreen() {
  return {
    type: jsPsychCallFunction,
    async: true,
    func(done) {
      const summary = buildSummary();
      const pid     = window.BatteryData.participantId || 'unknown';

      /* Helper to format numbers */
      const fmt = (v, dec = 1) => (v == null || isNaN(v)) ? 'N/A' : Number(v).toFixed(dec);

      const html = `
        <div id="completion-screen">
          <h2 style="color:#a8d8ea">&#10003; Battery Complete</h2>
          <p style="color:#cdd9e5">Participant ID: <strong>${pid}</strong></p>
          <p style="color:#8899aa;font-size:0.85rem">Session duration: ${summary.total_battery_duration_ms != null ? (summary.total_battery_duration_ms/60000).toFixed(1) + ' min' : 'N/A'}</p>

          <h3 style="margin-top:1.2em;color:#b8c6db">Summary</h3>
          <table class="summary-table">
            <tr><th>Measure</th><th>Value</th></tr>
            <tr><td>Sequencing completion time</td><td>${fmt(summary.completion_time_sequencing_ms)} ms</td></tr>
            <tr><td>Set-shifting completion time</td><td>${fmt(summary.completion_time_set_shifting_ms)} ms</td></tr>
            <tr><td>Set-shifting cost</td><td>${fmt(summary.set_shifting_cost_ms)} ms</td></tr>
            <tr><td>Sequencing errors</td><td>${summary.errors_sequencing ?? 'N/A'}</td></tr>
            <tr><td>Set-shifting errors</td><td>${summary.errors_set_shifting ?? 'N/A'}</td></tr>
            <tr><td>OLM mean error</td><td>${fmt(summary.olm_mean_euclidean_error_px)} px</td></tr>
            <tr><td>OLM median error</td><td>${fmt(summary.olm_median_euclidean_error_px)} px</td></tr>
            <tr><td>Pointing mean abs. error</td><td>${fmt(summary.sp_mean_absolute_angular_error_deg)}&deg;</td></tr>
            <tr><td>Pointing signed bias</td><td>${fmt(summary.sp_signed_bias_deg)}&deg;</td></tr>
          </table>

          <h3 style="margin-top:1.2em;color:#b8c6db">Download Data</h3>
          <p style="color:#8899aa;font-size:0.85rem;margin-bottom:0.8em">
            Data is stored only in this browser session. Download now before closing the tab.
          </p>
          <div style="display:flex;flex-wrap:wrap;gap:0.6em;justify-content:center">
            <button class="battery-btn download" id="dl-csv">&#8595; Download Trials CSV</button>
            <button class="battery-btn download" id="dl-json">&#8595; Download Full JSON</button>
            <button class="battery-btn download" id="dl-summary">&#8595; Download Summary JSON</button>
          </div>

          <p style="margin-top:1.6em;color:#8899aa;font-size:0.8rem">
            &#9888; Close this tab only after downloading your data.<br>
            Data is NOT automatically saved or sent anywhere.
          </p>
        </div>`;

      const display = document.getElementById('jspsych-target');
      display.innerHTML = html;

      document.getElementById('dl-csv')?.addEventListener('click',     exportAllCSV);
      document.getElementById('dl-json')?.addEventListener('click',    exportAllJSON);
      document.getElementById('dl-summary')?.addEventListener('click', exportSummaryJSON);

      injectProgressBar();
      setProgress(100);
      /* do NOT call done() — we keep this screen open indefinitely */
    }
  };
}

/* ── Between-task break screen ────────────────────────────── */
function makeBreakScreen(nextTaskName) {
  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: `<div style="max-width:600px;margin:0 auto;text-align:center">
      <h3 style="color:#a8d8ea">Take a short break if needed</h3>
      <p>Next: <strong>${nextTaskName}</strong></p>
      <p style="color:#8899aa;font-size:0.85rem">Press the button when you are ready to continue.</p>
    </div>`,
    choices: ['Continue →'],
    data: { battery_phase: 'break' }
  };
}

/* ── Main battery launch ──────────────────────────────────── */
window.addEventListener('load', () => {
  /* Safety check: ensure all task builders are available */
  const required = ['buildVisualSequencingTimeline', 'buildObjectLocationTimeline', 'buildSpatialPointingTimeline'];
  for (const fn of required) {
    if (typeof window[fn] !== 'function') {
      document.getElementById('jspsych-target').innerHTML =
        '<div class="warning-box"><h3>Script Load Error</h3><p>Function <code>' + fn + '</code> is not defined. Check that all task JS files loaded correctly.</p></div>';
      return;
    }
  }

  injectProgressBar();

  /* Initialise jsPsych — targeting the #jspsych-target div */
  const jsPsych = initJsPsych({
    display_element: 'jspsych-target',
    on_finish() { /* timeline ends naturally at completion screen */ }
  });

  /* ── Build full timeline ── */
  const welcomeTrials = makeWelcomeTrials();
  const taskMenu      = makeTaskMenu(jsPsych);

  /* Conditional node that branches based on menu selection */
  const vsTimeline  = { timeline: [...buildVisualSequencingTimeline()],  conditional_function() { const c = window._batteryChoice; return c === 'full' || c === 'vs';  } };
  const olmTimeline = { timeline: [makeBreakScreen('Object-Location Memory Task'), ...buildObjectLocationTimeline()], conditional_function() { const c = window._batteryChoice; return c === 'full' || c === 'olm'; } };
  const spTimeline  = { timeline: [makeBreakScreen('Spatial Pointing Task'), ...buildSpatialPointingTimeline()],      conditional_function() { const c = window._batteryChoice; return c === 'full' || c === 'sp';  } };

  const completionScreen = makeCompletionScreen();

  /* Progress updates injected via call-function nodes */
  const setP33 = { type: jsPsychCallFunction, func() { setProgress(33); } };
  const setP66 = { type: jsPsychCallFunction, func() { setProgress(66); } };
  const setP90 = { type: jsPsychCallFunction, func() { setProgress(90); } };

  const timeline = [
    ...welcomeTrials,
    taskMenu,
    vsTimeline,
    setP33,
    olmTimeline,
    setP66,
    spTimeline,
    setP90,
    completionScreen
  ];

  jsPsych.run(timeline);
});
