/* ============================================================
   main.js - Battery orchestration (corrected)
   ============================================================
   All HTML is built with string concatenation (no template literals)
   to avoid any escaping/parsing issues.
   Requires: utils.js, tasks/*.js loaded before this file.
   ============================================================ */
'use strict';

/* ---- Global error handler: show errors on screen ---- */
function escapeErrorText(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

window.addEventListener('error', function(ev) {
  var t = document.getElementById('jspsych-target');
  if (t) {
    t.innerHTML = '<div style="max-width:800px;padding:2rem;color:#ffcccc;font-family:monospace">'
      + '<h2 style="color:#ff6b6b">JavaScript Error</h2>'
      + '<p><strong>Message:</strong> ' + escapeErrorText(ev.message || 'unknown') + '</p>'
      + '<p><strong>File:</strong> ' + escapeErrorText(ev.filename || 'unknown') + '</p>'
      + '<p><strong>Line:</strong> ' + (ev.lineno || '?') + ':' + (ev.colno || '?') + '</p>'
      + '<p style="color:#aaa;font-size:0.85rem">Open the browser console (F12) for full details.</p>'
      + '</div>';
  }
});

window.addEventListener('unhandledrejection', function(ev) {
  var reason = ev.reason || {};
  var msg = reason.message || String(reason || 'unknown');
  var stack = reason.stack || '';
  var t = document.getElementById('jspsych-target');
  if (t) {
    t.innerHTML = '<div style="max-width:800px;padding:2rem;color:#ffcccc;font-family:monospace">'
      + '<h2 style="color:#ff6b6b">JavaScript Error</h2>'
      + '<p><strong>Message:</strong> ' + escapeErrorText(msg) + '</p>'
      + (stack ? '<pre style="white-space:pre-wrap;color:#aaa;font-size:0.78rem">' + escapeErrorText(stack) + '</pre>' : '')
      + '<p style="color:#aaa;font-size:0.85rem">Open the browser console (F12) for full details.</p>'
      + '</div>';
  }
});

/* ---- Progress bar ---- */
function injectProgressBar() {
  if (document.getElementById('battery-progress-bar-container')) return;
  var c = document.createElement('div');
  c.id = 'battery-progress-bar-container';
  var bar = document.createElement('div');
  bar.id = 'battery-progress-bar';
  bar.style.width = '0%';
  c.appendChild(bar);
  document.body.appendChild(c);
}

function setProgress(pct) {
  var bar = document.getElementById('battery-progress-bar');
  if (bar) bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
}

/* ---- Screen-size check ---- */
function checkScreenSize() {
  var warning = document.getElementById('small-screen-warning');
  var dims = document.getElementById('screen-dims');
  if (dims) dims.textContent = window.innerWidth + 'x' + window.innerHeight + 'px';
  if (warning) {
    warning.style.display = (window.innerWidth < 750 || window.innerHeight < 520) ? 'flex' : 'none';
  }
}
window.addEventListener('resize', checkScreenSize);

/* ---- Hide loading fallback ---- */
function hideLoadingFallback() {
  var fb = document.getElementById('loading-fallback');
  if (fb) fb.style.display = 'none';
}

/* ====================================================
   WELCOME TRIALS
   ==================================================== */
function makeWelcomeTrials() {

  var welcome = {
    type: jsPsychHtmlButtonResponse,
    stimulus: '<div style="max-width:700px;margin:0 auto;text-align:center;padding:1em">'
      + '<h1 style="color:#a8d8ea">Baseline Cognitive &amp; Spatial Battery</h1>'
      + '<div class="info-box" style="text-align:left">'
      + '<p><strong>What this is:</strong> A brief computerized baseline cognitive/spatial battery '
      + 'administered during the intake session to characterize individual differences relevant to '
      + 'spatial navigation performance.</p>'
      + '<p><strong>What this is NOT:</strong> This is not a stimulation-outcome task. '
      + 'Results will be used for participant characterization and may serve as covariates '
      + 'or exploratory moderators in analyses.</p>'
      + '<p><strong>Duration:</strong> Approximately 15-25 minutes for the full battery.</p>'
      + '<p><strong>Tasks included:</strong> Visual Sequencing &amp; Set-Shifting &bull; '
      + 'Object-Location Memory &bull; Spatial Pointing</p>'
      + '</div>'
      + '<p style="color:#8899aa;font-size:0.9rem;margin-top:1em">'
      + 'Please run this on a <strong>laptop or desktop computer</strong> in a quiet environment.<br>'
      + 'A mouse or trackpad is required.</p></div>',
    choices: ['Begin Setup'],
    data: { battery_phase: 'welcome' }
  };

  var participantId = {
    type: jsPsychSurveyText,
    questions: [{
      prompt: '<div style="text-align:center">'
        + '<h3 style="color:#a8d8ea">Participant ID</h3>'
        + '<p style="color:#cdd9e5;max-width:500px;margin:0 auto 1em">'
        + 'Please enter your <strong>pseudonymous participant ID</strong> (e.g. P001, CSB_042).<br>'
        + '<span style="color:#ef9a9a;font-size:0.85rem">'
        + 'Do NOT enter your name, email, student number, date of birth, or any identifying information.'
        + '</span></p></div>',
      name: 'participant_id',
      required: true,
      placeholder: 'e.g. P001'
    }],
    button_label: 'Confirm ID',
    data: { battery_phase: 'participant_id' },
    on_finish: function(data) {
      var pid = (data.response && data.response.participant_id)
        ? data.response.participant_id.trim() : 'UNKNOWN';
      window.BatteryData.participantId = pid;
      window.BatteryData.sessionStart = getTimestamp();
    }
  };

  var deviceCheck = {
    type: jsPsychHtmlButtonResponse,
    stimulus: '<div style="max-width:660px;margin:0 auto;text-align:center">'
      + '<h3 style="color:#a8d8ea;margin-bottom:0.6em">Before We Start</h3>'
      + '<div class="info-box" style="text-align:left">'
      + '<p>&#10003; Use a <strong>laptop or desktop</strong> - not a phone or tablet.</p>'
      + '<p>&#10003; Use <strong>Google Chrome</strong> for best compatibility.</p>'
      + '<p>&#10003; Ensure your screen is at least <strong>900 x 600 px</strong>.</p>'
      + '<p>&#10003; Close other applications to minimise distractions.</p>'
      + '<p>&#10003; You will be prompted to enter <strong>fullscreen mode</strong>.</p>'
      + '</div>'
      + '<p style="color:#8899aa;font-size:0.85rem;margin-top:0.5em">'
      + 'Current window: <strong id="curr-dims">checking...</strong></p></div>',
    choices: ['Continue'],
    data: { battery_phase: 'device_check' },
    on_load: function() {
      var el = document.getElementById('curr-dims');
      if (el) el.textContent = window.innerWidth + ' x ' + window.innerHeight + ' px';
    }
  };

  var fullscreen = {
    type: jsPsychFullscreen,
    fullscreen_mode: true,
    message: '<div style="text-align:center;max-width:600px;margin:0 auto">'
      + '<h3 style="color:#a8d8ea">Fullscreen Mode</h3>'
      + '<p>The battery will now switch to fullscreen for consistent spatial measurements.</p>'
      + '<p style="color:#8899aa;font-size:0.85rem">Press <strong>Escape</strong> to exit fullscreen.</p>'
      + '</div>',
    button_label: 'Enter Fullscreen',
    data: { battery_phase: 'fullscreen' }
  };

  return [welcome, participantId, deviceCheck, fullscreen];
}

/* ====================================================
   TASK MENU
   ==================================================== */
function makeTaskMenu(jsPsych) {
  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: '<div style="max-width:680px;margin:0 auto;text-align:center">'
      + '<h2 style="color:#a8d8ea;margin-bottom:0.4em">Task Menu</h2>'
      + '<p style="color:#cdd9e5;margin-bottom:0.3em">'
      + 'Participant ID: <strong id="pid-display">loading...</strong></p>'
      + '<p style="color:#8899aa;font-size:0.85rem;margin-bottom:1.2em">'
      + 'Select which tasks to run. For the baseline session choose <em>Run Full Battery</em>.</p>'
      + '<div style="display:grid;gap:0.6em;max-width:420px;margin:0 auto">'
      + '<button class="battery-btn primary" id="btn-full">Run Full Battery (~15-25 min)</button>'
      + '<button class="battery-btn" id="btn-vs">Visual Sequencing &amp; Set-Shifting only</button>'
      + '<button class="battery-btn" id="btn-olm">Object-Location Memory only</button>'
      + '<button class="battery-btn" id="btn-sp">Spatial Pointing only</button>'
      + '</div>'
      + '<p style="color:#8899aa;font-size:0.8rem;margin-top:1.2em">'
      + 'Pilot mode: set <code>window.PILOT_MODE = false</code> in utils.js for real sessions.'
      + '</p></div>',
    choices: [],
    response_ends_trial: false,
    data: { battery_phase: 'task_menu' },
    on_load: function() {
      var el = document.getElementById('pid-display');
      if (el) el.textContent = window.BatteryData.participantId || 'not set';

      function finish(choice) {
        window._batteryChoice = choice;
        jsPsych.finishTrial({ battery_choice: choice });
      }

      var btnFull = document.getElementById('btn-full');
      var btnVS   = document.getElementById('btn-vs');
      var btnOLM  = document.getElementById('btn-olm');
      var btnSP   = document.getElementById('btn-sp');

      if (btnFull) btnFull.addEventListener('click', function() { finish('full'); });
      if (btnVS)   btnVS.addEventListener('click',   function() { finish('vs'); });
      if (btnOLM)  btnOLM.addEventListener('click',  function() { finish('olm'); });
      if (btnSP)   btnSP.addEventListener('click',   function() { finish('sp'); });
    }
  };
}

/* ====================================================
   BREAK SCREEN
   ==================================================== */
function makeBreakScreen(nextTaskName) {
  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: '<div style="max-width:600px;margin:0 auto;text-align:center">'
      + '<h3 style="color:#a8d8ea">Take a short break if needed</h3>'
      + '<p>Next task: <strong>' + nextTaskName + '</strong></p>'
      + '<p style="color:#8899aa;font-size:0.85rem">Press Continue when ready.</p>'
      + '</div>',
    choices: ['Continue'],
    data: { battery_phase: 'break' }
  };
}

/* ====================================================
   COMPLETION SCREEN
   ==================================================== */
function makeCompletionScreen() {
  return {
    type: jsPsychCallFunction,
    async: true,
    func: function(done) {
      var summary = buildSummary();
      var pid = window.BatteryData.participantId || 'unknown';

      function fmt(v, dec) {
        dec = dec === undefined ? 1 : dec;
        if (v === null || v === undefined || (typeof v === 'number' && isNaN(v))) return 'N/A';
        return Number(v).toFixed(dec);
      }

      var durMin = summary.total_battery_duration_ms != null
        ? (summary.total_battery_duration_ms / 60000).toFixed(1) + ' min' : 'N/A';

      var html = '<div id="completion-screen">'
        + '<h2 style="color:#a8d8ea">&#10003; Battery Complete</h2>'
        + '<p style="color:#cdd9e5">Participant ID: <strong>' + pid + '</strong></p>'
        + '<p style="color:#8899aa;font-size:0.85rem">Session duration: ' + durMin + '</p>'
        + '<h3 style="margin-top:1.2em;color:#b8c6db">Summary</h3>'
        + '<table class="summary-table">'
        + '<tr><th>Measure</th><th>Value</th></tr>'
        + '<tr><td>Sequencing completion time</td><td>' + fmt(summary.completion_time_sequencing_ms) + ' ms</td></tr>'
        + '<tr><td>Set-shifting completion time</td><td>' + fmt(summary.completion_time_set_shifting_ms) + ' ms</td></tr>'
        + '<tr><td>Set-shifting cost</td><td>' + fmt(summary.set_shifting_cost_ms) + ' ms</td></tr>'
        + '<tr><td>Sequencing errors</td><td>' + (summary.errors_sequencing !== null && summary.errors_sequencing !== undefined ? summary.errors_sequencing : 'N/A') + '</td></tr>'
        + '<tr><td>Set-shifting errors</td><td>' + (summary.errors_set_shifting !== null && summary.errors_set_shifting !== undefined ? summary.errors_set_shifting : 'N/A') + '</td></tr>'
        + '<tr><td>OLM mean error</td><td>' + fmt(summary.olm_mean_euclidean_error_px) + ' px</td></tr>'
        + '<tr><td>OLM median error</td><td>' + fmt(summary.olm_median_euclidean_error_px) + ' px</td></tr>'
        + '<tr><td>Pointing mean abs. error</td><td>' + fmt(summary.sp_mean_absolute_angular_error_deg) + '&deg;</td></tr>'
        + '<tr><td>Pointing signed bias</td><td>' + fmt(summary.sp_signed_bias_deg) + '&deg;</td></tr>'
        + '</table>'
        + '<h3 style="margin-top:1.2em;color:#b8c6db">Download Data</h3>'
        + '<p style="color:#8899aa;font-size:0.85rem;margin-bottom:0.8em">'
        + 'Data is stored only in this browser session. Download now before closing the tab.</p>'
        + '<div style="display:flex;flex-wrap:wrap;gap:0.6em;justify-content:center">'
        + '<button class="battery-btn download" id="dl-csv">&#8595; Download Trials CSV</button>'
        + '<button class="battery-btn download" id="dl-json">&#8595; Download Full JSON</button>'
        + '<button class="battery-btn download" id="dl-summary">&#8595; Download Summary JSON</button>'
        + '</div>'
        + '<p style="margin-top:1.6em;color:#8899aa;font-size:0.8rem">'
        + '&#9888; Close this tab only after downloading your data.<br>'
        + 'Data is NOT automatically saved or sent anywhere.</p>'
        + '</div>';

      var display = document.getElementById('jspsych-content') || document.querySelector('.jspsych-content') || document.getElementById('jspsych-target');
      if (display) display.innerHTML = html;

      var dlCSV = document.getElementById('dl-csv');
      var dlJSON = document.getElementById('dl-json');
      var dlSum  = document.getElementById('dl-summary');
      if (dlCSV)  dlCSV.addEventListener('click',  exportAllCSV);
      if (dlJSON) dlJSON.addEventListener('click', exportAllJSON);
      if (dlSum)  dlSum.addEventListener('click',  exportSummaryJSON);

      injectProgressBar();
      setProgress(100);
      /* do NOT call done() - keep this screen open */
    }
  };
}

/* ====================================================
   MAIN BATTERY LAUNCH
   ==================================================== */
window.addEventListener('load', function() {

  /* Run screen size check */
  checkScreenSize();

  /* Safety check: ensure all task builders are available */
  var required = ['buildVisualSequencingTimeline', 'buildObjectLocationTimeline', 'buildSpatialPointingTimeline'];
  for (var ri = 0; ri < required.length; ri++) {
    if (typeof window[required[ri]] !== 'function') {
      var target = document.getElementById('jspsych-target');
      if (target) {
        target.innerHTML = '<div class="warning-box">'
          + '<h3>Script Load Error</h3>'
          + '<p>Function <code>' + required[ri] + '</code> is not defined. '
          + 'Check that all task JS files loaded correctly in index.html.</p>'
          + '</div>';
      }
      hideLoadingFallback();
      return;
    }
  }

  injectProgressBar();

  /* Initialise jsPsych */
  var jsPsych = initJsPsych({
    display_element: 'jspsych-target',
    on_finish: function() { /* completion screen handles its own display */ }
  });

  var welcomeTrials = makeWelcomeTrials();
  var taskMenu = makeTaskMenu(jsPsych);

  /* Conditional timeline nodes */
  var vsTimeline = {
    timeline: buildVisualSequencingTimeline(),
    conditional_function: function() {
      var c = window._batteryChoice;
      return c === 'full' || c === 'vs';
    }
  };

  var olmTimeline = {
    timeline: [makeBreakScreen('Object-Location Memory Task')].concat(buildObjectLocationTimeline()),
    conditional_function: function() {
      var c = window._batteryChoice;
      return c === 'full' || c === 'olm';
    }
  };

  var spTimeline = {
    timeline: [makeBreakScreen('Spatial Pointing Task')].concat(buildSpatialPointingTimeline()),
    conditional_function: function() {
      var c = window._batteryChoice;
      return c === 'full' || c === 'sp';
    }
  };

  var setP33 = { type: jsPsychCallFunction, func: function() { setProgress(33); } };
  var setP66 = { type: jsPsychCallFunction, func: function() { setProgress(66); } };
  var setP90 = { type: jsPsychCallFunction, func: function() { setProgress(90); } };

  var timeline = welcomeTrials.concat([
    taskMenu,
    vsTimeline,
    setP33,
    olmTimeline,
    setP66,
    spTimeline,
    setP90,
    makeCompletionScreen()
  ]);

  /* Hide loading fallback now that jsPsych is ready */
  hideLoadingFallback();

  jsPsych.run(timeline);
});
