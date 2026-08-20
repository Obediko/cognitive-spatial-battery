/* ============================================================
   main.js - Battery orchestration (corrected)
   ============================================================
   All HTML is built with string concatenation (no template literals)
   to avoid any escaping/parsing issues.
   Requires: utils.js, tasks/*.js loaded before this file.
   ============================================================ */
'use strict';

function batteryText(key) {
  return window.BatteryLanguage ? window.BatteryLanguage.text(key) : key;
}

function makeLanguageSelectionTrial() {
  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: '<div class="osr-card" style="max-width:720px;margin:0 auto;text-align:center">'
      + '<span class="osr-kicker">Language / Sprache</span>'
      + '<h1>Choose the assessment language<br><span lang="de">Testsprache wählen</span></h1>'
      + '<p>The selection applies to the full session.<br><span lang="de">Die Auswahl gilt für die gesamte Sitzung.</span></p>'
      + '<div class="warning-box">The German parallel form is a pilot form. Cross-language psychometric equivalence has not yet been established.</div>'
      + '</div>',
    choices: ['English', 'Deutsch'],
    data: { battery_phase: 'language_selection' },
    on_finish: function(data) {
      var selected = data.response === 1 ? 'de' : 'en';
      window.BatteryLanguage.set(selected);
      window.BatteryData.language = selected;
      Object.assign(data, window.BatteryLanguage.metadata());
      sessionStorage.setItem('csb-language-confirmed', '1');
      window.location.reload();
    }
  };
}

/* ---- Global error handler: show errors on screen ---- */
function escapeErrorText(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showRecoverableRuntimeError(title, message, detail) {
  var existing = document.getElementById('battery-runtime-error');
  if (existing) existing.remove();
  var panel = document.createElement('div');
  panel.id = 'battery-runtime-error';
  panel.style.cssText = 'position:fixed;left:1rem;right:1rem;bottom:1rem;z-index:10001;'
    + 'max-height:45vh;overflow:auto;background:#3f1720;color:#fff;border:2px solid #ef4444;'
    + 'border-radius:10px;padding:1rem;font-family:Segoe UI,Arial,sans-serif;box-shadow:0 8px 30px #0008;';
  panel.innerHTML = '<strong>' + escapeErrorText(title) + '</strong>'
    + '<p style="margin:.45rem 0">' + escapeErrorText(message) + '</p>'
    + (detail ? '<pre style="white-space:pre-wrap;font-size:.75rem;color:#fecaca">' + escapeErrorText(detail) + '</pre>' : '')
    + '<p style="font-size:.82rem">The current screen has been preserved. Export recovery data before reloading if the task cannot continue.</p>'
    + '<button class="battery-btn" id="runtime-export">Export recovery JSON</button>'
    + '<button class="battery-btn" id="runtime-dismiss">Dismiss</button>';
  document.body.appendChild(panel);
  document.getElementById('runtime-export').onclick = function() {
    try { exportAllJSON(); } catch (error) { console.error(error); }
  };
  document.getElementById('runtime-dismiss').onclick = function() { panel.remove(); };
}

window.addEventListener('error', function(ev) {
  showRecoverableRuntimeError(
    'JavaScript error',
    ev.message || 'unknown error',
    (ev.filename || 'unknown file') + ':' + (ev.lineno || '?') + ':' + (ev.colno || '?')
  );
});

window.addEventListener('unhandledrejection', function(ev) {
  var reason = ev.reason || {};
  showRecoverableRuntimeError(
    'Background operation failed',
    reason.message || String(reason || 'unknown error'),
    reason.stack || ''
  );
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
  var de = window.BatteryLanguage && window.BatteryLanguage.get() === 'de';

  var welcome = {
    type: jsPsychHtmlButtonResponse,
    stimulus: '<div style="max-width:700px;margin:0 auto;text-align:center;padding:1em">'
      + '<h1 style="color:#a8d8ea">' + batteryText('battery_title') + '</h1>'
      + '<div class="info-box" style="text-align:left">'
      + (de
        ? '<p><strong>Zweck:</strong> Diese computerisierte Testbatterie erfasst kognitive und räumliche Ausgangsleistungen.</p>'
          + '<p><strong>Kein Diagnosetest:</strong> Die Ergebnisse dienen der Forschungscharakterisierung und nicht einer klinischen Diagnose.</p>'
          + '<p><strong>Dauer:</strong> Etwa 28–38 Minuten für die vollständige Pilotbatterie.</p>'
          + '<p><strong>Aufgaben:</strong> Geschichte erinnern &bull; Tiere nennen &bull; Gegenstände benennen &bull; komplexe Figur &bull; Zahlenspanne &bull; zusätzliche räumliche Aufgaben &bull; Trail-Vergleichsaufgaben</p>'
        : '<p><strong>What this is:</strong> A brief computerized baseline cognitive/spatial battery administered during the intake session to characterize individual differences relevant to spatial navigation performance.</p>'
          + '<p><strong>What this is NOT:</strong> This is not a stimulation-outcome task. Results will be used for participant characterization and may serve as covariates or exploratory moderators in analyses.</p>'
          + '<p><strong>Duration:</strong> Approximately 28-38 minutes for the full pilot battery.</p>'
          + '<p><strong>Tasks included:</strong> Original Story Recall &bull; Animal Naming &bull; Original Visual Naming &bull; Original Complex Figure &bull; Number Span &bull; additional spatial tasks &bull; Trail comparators</p>')
      + '</div>'
      + '<p style="color:#8899aa;font-size:0.9rem;margin-top:1em">'
      + (de
        ? 'Bitte verwenden Sie in ruhiger Umgebung einen <strong>Laptop oder ein ausreichend großes Tablet</strong>.<br>Maus, Trackpad, Touchscreen und Standard-Gamepad werden unterstützt.'
        : 'Please run this on a <strong>laptop or sufficiently large tablet</strong> in a quiet environment.<br>Mouse, trackpad, touch and standard gamepad input are supported; the input modality is recorded.')
      + '</p></div>',
    choices: [batteryText('begin_setup')],
    data: { battery_phase: 'welcome' }
  };

  var participantId = {
    type: jsPsychSurveyText,
    questions: [{
      prompt: '<div style="text-align:center">'
        + '<h3 style="color:#a8d8ea">' + (de ? 'Teilnehmenden-ID' : 'Participant ID') + '</h3>'
        + '<p style="color:#cdd9e5;max-width:500px;margin:0 auto 1em">'
        + (de ? 'Geben Sie die <strong>pseudonyme Teilnehmenden-ID</strong> ein (z. B. P001, CSB_042).<br>' : 'Please enter your <strong>pseudonymous participant ID</strong> (e.g. P001, CSB_042).<br>')
        + '<span style="color:#ef9a9a;font-size:0.85rem">'
        + (de ? 'Geben Sie keinen Namen, keine E-Mail-Adresse, kein Geburtsdatum und keine anderen Identifikationsdaten ein.' : 'Do NOT enter your name, email, student number, date of birth, or any identifying information.')
        + '</span></p></div>',
      name: 'participant_id',
      required: true,
      placeholder: 'e.g. P001'
    }],
    button_label: de ? 'ID bestätigen' : 'Confirm ID',
    data: { battery_phase: 'participant_id' },
    on_finish: function(data) {
      var pid = (data.response && data.response.participant_id)
        ? data.response.participant_id.trim() : 'UNKNOWN';
      window.BatteryData.participantId = pid;
      if (!restoreBatteryCheckpoint(pid)) window.BatteryData.sessionStart = getTimestamp();
      window._artifactRestorePromise = restoreBatteryArtifacts(pid).catch(function(error) {
        console.warn('Audio artifact recovery failed:', error);
        return false;
      });
      checkpointBatterySession();
    }
  };

  var deviceCheck = {
    type: jsPsychHtmlButtonResponse,
    stimulus: '<div style="max-width:660px;margin:0 auto;text-align:center">'
      + '<h3 style="color:#a8d8ea;margin-bottom:0.6em">' + (de ? 'Vor dem Beginn' : 'Before We Start') + '</h3>'
      + '<div class="info-box" style="text-align:left">'
      + (de
        ? '<p>&#10003; Verwenden Sie einen <strong>Laptop oder ein ausreichend großes Tablet</strong>, kein Telefon.</p><p>&#10003; Verwenden Sie eine aktuelle Version von <strong>Chrome, Edge oder Safari</strong>.</p><p>&#10003; Die Fenstergröße muss mindestens <strong>900 × 600 px</strong> betragen.</p><p>&#10003; Schließen Sie andere Anwendungen.</p><p>&#10003; Der <strong>Vollbildmodus</strong> wird empfohlen.</p>'
        : '<p>&#10003; Use a <strong>laptop or sufficiently large tablet</strong> - not a phone.</p><p>&#10003; Use a current version of <strong>Chrome, Edge or Safari</strong>.</p><p>&#10003; Ensure your screen is at least <strong>900 x 600 px</strong>.</p><p>&#10003; Close other applications to minimise distractions.</p><p>&#10003; You will be prompted to enter <strong>fullscreen mode</strong>.</p>')
      + '</div>'
      + '<p style="color:#8899aa;font-size:0.85rem;margin-top:0.5em">'
      + (de ? 'Aktuelles Fenster: ' : 'Current window: ') + '<strong id="curr-dims">...</strong></p></div>',
    choices: [de ? 'Weiter' : 'Continue'],
    data: { battery_phase: 'device_check' },
    on_load: function() {
      var el = document.getElementById('curr-dims');
      if (el) el.textContent = window.innerWidth + ' x ' + window.innerHeight + ' px';
    }
  };

  var fullscreen = {
    type: jsPsychCallFunction,
    async: true,
    func: function(done) {
      var display = document.getElementById('jspsych-content') ||
        document.querySelector('.jspsych-content') ||
        document.getElementById('jspsych-target');
      display.innerHTML = '<div style="text-align:center;max-width:600px;margin:0 auto">'
        + '<h3 style="color:#a8d8ea">' + (de ? 'Vollbildmodus' : 'Fullscreen Mode') + '</h3>'
        + '<p>' + (de ? 'Der Vollbildmodus wird für einheitliche räumliche Messungen empfohlen.' : 'Fullscreen is recommended for consistent spatial measurements.') + '</p>'
        + '<button class="battery-btn primary" id="enter-fullscreen">' + (de ? 'Vollbild starten' : 'Enter Fullscreen') + '</button>'
        + '<button class="battery-btn" id="skip-fullscreen" style="margin-left:0.6rem">' + (de ? 'Ohne Vollbild fortfahren' : 'Continue without fullscreen') + '</button>'
        + '<p id="fullscreen-status" class="osr-status" aria-live="polite"></p></div>';

      function finish(granted, reason) {
        window.BatteryData.addTrials({
          battery_phase: 'fullscreen',
          fullscreen_granted: granted,
          fullscreen_failure_reason: reason || null
        });
        done();
      }

      document.getElementById('skip-fullscreen').addEventListener('click', function() {
        finish(false, 'participant_skipped');
      });
      document.getElementById('enter-fullscreen').addEventListener('click', function() {
        var request = document.documentElement.requestFullscreen ||
          document.documentElement.webkitRequestFullscreen;
        if (!request) {
          finish(false, 'unsupported');
          return;
        }
        try {
          var result = request.call(document.documentElement);
          if (result && typeof result.then === 'function') {
            result.then(function() { finish(true, null); })
              .catch(function(error) {
                finish(false, error && error.message ? error.message : 'not_granted');
              });
          } else {
            finish(!!document.fullscreenElement, document.fullscreenElement ? null : 'not_granted');
          }
        } catch (error) {
          finish(false, error && error.message ? error.message : 'not_granted');
        }
      });
    }
  };

  return [welcome, participantId, deviceCheck, fullscreen];
}

/* ====================================================
   TASK MENU
   ==================================================== */
function makeTaskMenu(jsPsych) {
  var de = window.BatteryLanguage && window.BatteryLanguage.get() === 'de';
  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: '<div style="max-width:680px;margin:0 auto;text-align:center">'
      + '<h2 style="color:#a8d8ea;margin-bottom:0.4em">' + batteryText('task_menu') + '</h2>'
      + '<p style="color:#cdd9e5;margin-bottom:0.3em">'
      + (de ? 'Teilnehmenden-ID: ' : 'Participant ID: ') + '<strong id="pid-display">...</strong></p>'
      + '<p style="color:#8899aa;font-size:0.85rem;margin-bottom:1.2em">'
      + (de ? 'Wählen Sie die Aufgaben aus. Für die Basissitzung verwenden Sie die vollständige Pilotbatterie.' : 'Select which tasks to run. For the baseline session choose <em>Run Full Battery</em>.') + '</p>'
      + '<div style="display:grid;gap:0.6em;max-width:420px;margin:0 auto">'
      + '<button class="battery-btn primary" id="btn-full">' + batteryText('full_battery') + ' (~28-38 min)</button>'
      + '<button class="battery-btn" id="btn-core">' + batteryText('core_only') + '</button>'
      + '<button class="battery-btn" id="btn-trail">' + batteryText('trail_only') + '</button>'
      + '<button class="battery-btn" id="btn-spatial">' + batteryText('spatial_only') + '</button>'
      + '<button class="battery-btn" id="btn-osr">' + (de ? 'Nur Geschichte erinnern' : 'Original Story Recall only') + '</button>'
      + '<button class="battery-btn" id="btn-asf">' + (de ? 'Nur Tiere nennen' : 'Animal Naming only') + '</button>'
      + '<button class="battery-btn" id="btn-ovn">' + (de ? 'Nur Gegenstände benennen' : 'Original Visual Naming only') + '</button>'
      + '<button class="battery-btn" id="btn-ocf">' + (de ? 'Nur komplexe Figur' : 'Original Complex Figure only') + '</button>'
      + '<button class="battery-btn" id="btn-vs">' + (de ? 'Nur Trail-Vergleichsaufgaben' : 'Visual Sequencing &amp; Set-Shifting only') + '</button>'
      + '<button class="battery-btn" id="btn-olm">' + (de ? 'Nur Objekt-Ort-Gedächtnis' : 'Object-Location Memory only') + '</button>'
      + '<button class="battery-btn" id="btn-sp">' + (de ? 'Nur räumliches Zeigen' : 'Spatial Pointing only') + '</button>'
      + '<button class="battery-btn" id="btn-ns">' + (de ? 'Nur Zahlenspanne' : 'Number Span only') + '</button>'
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
        window.BatteryData.batteryChoice = choice;
        window.BatteryData.sessionStatus = 'in_progress';
        checkpointBatterySession();
        jsPsych.finishTrial({ battery_choice: choice });
      }

      var btnFull = document.getElementById('btn-full');
      var btnCore = document.getElementById('btn-core');
      var btnTrail = document.getElementById('btn-trail');
      var btnSpatial = document.getElementById('btn-spatial');
      var btnOSR  = document.getElementById('btn-osr');
      var btnASF  = document.getElementById('btn-asf');
      var btnOVN  = document.getElementById('btn-ovn');
      var btnOCF  = document.getElementById('btn-ocf');
      var btnVS   = document.getElementById('btn-vs');
      var btnOLM  = document.getElementById('btn-olm');
      var btnSP   = document.getElementById('btn-sp');
      var btnNS   = document.getElementById('btn-ns');

      if (btnFull) btnFull.addEventListener('click', function() { finish('full'); });
      if (btnCore) btnCore.addEventListener('click', function() { finish('eti_core'); });
      if (btnTrail) btnTrail.addEventListener('click', function() { finish('trail'); });
      if (btnSpatial) btnSpatial.addEventListener('click', function() { finish('spatial'); });
      if (btnOSR)  btnOSR.addEventListener('click', function() { finish('osr'); });
      if (btnASF)  btnASF.addEventListener('click', function() { finish('asf'); });
      if (btnOVN)  btnOVN.addEventListener('click', function() { finish('ovn'); });
      if (btnOCF)  btnOCF.addEventListener('click', function() { finish('ocf'); });
      if (btnVS)   btnVS.addEventListener('click',   function() { finish('vs'); });
      if (btnOLM)  btnOLM.addEventListener('click',  function() { finish('olm'); });
      if (btnSP)   btnSP.addEventListener('click',   function() { finish('sp'); });
      if (btnNS)   btnNS.addEventListener('click',   function() { finish('ns'); });
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
      + '<h3 style="color:#a8d8ea">' + batteryText('break_title') + '</h3>'
      + '<p>' + batteryText('next_task') + ': <strong>' + nextTaskName + '</strong></p>'
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
    func: function() {
      var pid = window.BatteryData.participantId || 'unknown';
      window.BatteryData.batteryChoice = window._batteryChoice || window.BatteryData.batteryChoice;
      window.BatteryData.sessionStatus = 'participant_complete';
      checkpointBatterySession();
      sessionStorage.removeItem('csb-language-confirmed');

      var display = document.getElementById('jspsych-content') ||
        document.querySelector('.jspsych-content') || document.getElementById('jspsych-target');
      if (display) {
        display.innerHTML = '<div id="completion-screen" class="osr-card">'
          + '<span class="osr-kicker">' + batteryText('participant_complete') + '</span>'
          + '<h2>&#10003; ' + batteryText('thank_you') + '</h2>'
          + '<p>All participant tasks are finished.</p>'
          + '<div class="info-box"><p>Your responses have been saved locally under session <strong>'
          + String(pid).replace(/[&<>"']/g, '') + '</strong>.</p>'
          + '<p id="participant-sync-status">Secure cross-device synchronization is continuing in the background…</p>'
          + '<p>' + batteryText('scoring_separate') + '</p></div>'
          + '<p class="osr-fineprint">Research staff: use <strong>admin.html</strong> from an authorized device to open the examiner checkpoint.</p>'
          + '<button class="battery-btn download" id="participant-backup-json">Research staff: download backup JSON</button>'
          + '<p id="participant-backup-status" class="osr-status" aria-live="polite"></p></div>';
      }
      if (window.BatteryRemoteSync) {
        window.BatteryRemoteSync.flush().then(function() {
          var syncStatus = document.getElementById('participant-sync-status');
          if (!syncStatus) return;
          syncStatus.textContent = window.BatteryRemoteSync.getStatus() === 'synced'
            ? 'Secure cross-device synchronization finished.'
            : 'The local recovery copy is safe, but remote synchronization is pending. Keep this page open and contact research staff.';
        });
      }
      var backup = document.getElementById('participant-backup-json');
      if (backup) backup.addEventListener('click', function() {
        exportAllJSON();
        var status = document.getElementById('participant-backup-status');
        if (status) status.textContent = 'Backup download started.';
      });
      injectProgressBar();
      setProgress(100);
      /* Keep the completion screen open. Examiner review runs from admin.html. */
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
  var required = ['buildOSRImmediateTimeline', 'buildOSRDelayedTimeline', 'buildOSRReviewTimeline', 'buildAnimalFluencyTimeline', 'buildAnimalFluencyReviewTimeline', 'buildOriginalVisualNamingTimeline', 'buildOriginalVisualNamingReviewTimeline', 'buildOCFImmediateTimeline', 'buildOCFDelayedTimeline', 'buildOCFReviewTimeline', 'buildVisualSequencingTimeline', 'buildObjectLocationTimeline', 'buildSpatialPointingTimeline', 'buildNumberSpanTimeline'];
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

  var welcomeTrials = sessionStorage.getItem('csb-language-confirmed') === '1'
    ? makeWelcomeTrials()
    : [makeLanguageSelectionTrial()];
  var taskMenu = makeTaskMenu(jsPsych);

  /* Conditional timeline nodes */
  var osrImmediateTimeline = {
    timeline: buildOSRImmediateTimeline(),
    conditional_function: function() {
      var c = window._batteryChoice;
      return c === 'full' || c === 'eti_core' || c === 'osr';
    }
  };

  var osrDelayedTimeline = {
    timeline: buildOSRDelayedTimeline(),
    conditional_function: function() {
      var c = window._batteryChoice;
      return c === 'full' || c === 'eti_core' || c === 'osr';
    }
  };

  var vsTimeline = {
    timeline: buildVisualSequencingTimeline(),
    conditional_function: function() {
      var c = window._batteryChoice;
      return c === 'full' || c === 'trail' || c === 'vs';
    }
  };

  var asfTimeline = {
    timeline: [makeBreakScreen('Animal Naming Task')].concat(buildAnimalFluencyTimeline()),
    conditional_function: function() {
      var c = window._batteryChoice;
      return c === 'full' || c === 'eti_core' || c === 'asf';
    }
  };

  var ovnTimeline = {
    timeline: [makeBreakScreen('Original Visual Naming')].concat(buildOriginalVisualNamingTimeline()),
    conditional_function: function() {
      var c = window._batteryChoice;
      return c === 'full' || c === 'eti_core' || c === 'ovn';
    }
  };

  var ocfImmediateTimeline = {
    timeline: [makeBreakScreen('Original Complex Figure — copy')].concat(buildOCFImmediateTimeline()),
    conditional_function: function() {
      var c = window._batteryChoice;
      return c === 'full' || c === 'eti_core' || c === 'ocf';
    }
  };

  var ocfDelayedTimeline = {
    timeline: [makeBreakScreen('Original Complex Figure — delayed recall')].concat(buildOCFDelayedTimeline()),
    conditional_function: function() {
      var c = window._batteryChoice;
      return c === 'full' || c === 'eti_core' || c === 'ocf';
    }
  };

  var examinerHandoffTimeline = {
    timeline: [{
      type: jsPsychHtmlButtonResponse,
      stimulus: '<div class="osr-card"><span class="osr-kicker">Participant testing complete</span>'
        + '<h2>Hand the device to the examiner</h2>'
        + '<p>The remaining screens contain recordings, expected answers and scoring controls.</p>'
        + '<div class="warning-box">The participant should no longer view or operate the screen.</div></div>',
      choices: ['Examiner: begin final review'],
      data: { battery_phase: 'examiner_handoff' }
    }],
    conditional_function: function() {
      return ['full', 'osr', 'asf', 'ovn', 'ocf'].indexOf(window._batteryChoice) !== -1;
    }
  };

  var osrReviewTimeline = {
    timeline: buildOSRReviewTimeline(),
    conditional_function: function() {
      var c = window._batteryChoice;
      return c === 'full' || c === 'osr';
    }
  };

  var asfReviewTimeline = {
    timeline: buildAnimalFluencyReviewTimeline(),
    conditional_function: function() {
      var c = window._batteryChoice;
      return c === 'full' || c === 'asf';
    }
  };

  var ovnReviewTimeline = {
    timeline: buildOriginalVisualNamingReviewTimeline(),
    conditional_function: function() {
      var c = window._batteryChoice;
      return c === 'full' || c === 'ovn';
    }
  };

  var ocfReviewTimeline = {
    timeline: buildOCFReviewTimeline(),
    conditional_function: function() {
      var c = window._batteryChoice;
      return c === 'full' || c === 'ocf';
    }
  };

  var olmTimeline = {
    timeline: [makeBreakScreen('Object-Location Memory Task')].concat(buildObjectLocationTimeline()),
    conditional_function: function() {
      var c = window._batteryChoice;
      return c === 'full' || c === 'spatial' || c === 'olm';
    }
  };

  var spTimeline = {
    timeline: [makeBreakScreen('Spatial Pointing Task')].concat(buildSpatialPointingTimeline()),
    conditional_function: function() {
      var c = window._batteryChoice;
      return c === 'full' || c === 'spatial' || c === 'sp';
    }
  };

  var nsTimeline = {
    timeline: [makeBreakScreen('Number Span Task')].concat(buildNumberSpanTimeline()),
    conditional_function: function() {
      var c = window._batteryChoice;
      return c === 'full' || c === 'eti_core' || c === 'ns';
    }
  };

  var setP15 = { type: jsPsychCallFunction, func: function() { setProgress(15); } };
  var setP35 = { type: jsPsychCallFunction, func: function() { setProgress(35); } };
  var setP50 = { type: jsPsychCallFunction, func: function() { setProgress(50); } };
  var setP70 = { type: jsPsychCallFunction, func: function() { setProgress(70); } };
  var setP90 = { type: jsPsychCallFunction, func: function() { setProgress(90); } };

  var timeline = welcomeTrials.concat([
    taskMenu,
    osrImmediateTimeline,
    ocfImmediateTimeline,
    setP15,
    asfTimeline,
    ovnTimeline,
    nsTimeline,
    setP50,
    ocfDelayedTimeline,
    osrDelayedTimeline,
    setP70,
    olmTimeline,
    spTimeline,
    setP90,
    vsTimeline,
    makeCompletionScreen()
  ]);

  /* Hide loading fallback now that jsPsych is ready */
  hideLoadingFallback();

  jsPsych.run(timeline);
});
