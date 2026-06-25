/* ============================================================
   utils.js - Shared utilities for the cognitive/spatial battery
   ============================================================
   Exports (globals):
     BatteryData        - in-session data store
     exportAllCSV()     - download all trials as CSV
     exportAllJSON()    - download trials + summary as JSON
     exportTaskCSV()    - download one task's trials as CSV
     buildSummary()     - compute derived summary statistics
     getTimestamp()     - ISO timestamp
     getWindowSize()    - display geometry object
     euclideanDistance()
     angleBetween()
     signedAngularError()
     shuffle()
     mean() / median()
   ============================================================ */
'use strict';

/* ── PILOT MODE ─────────────────────────────────────────────
   Set PILOT_MODE = true to use shortened timings for development.
   Set to false for real data collection.
   ─────────────────────────────────────────────────────────── */
window.PILOT_MODE = false;

/* Timing constants - adjusted by pilot mode */
window.TIMING = {
  olm_encoding_ms:  window.PILOT_MODE ?  5000 : 25000,
  olm_delay_ms:     window.PILOT_MODE ?  3000 : 15000,
  sp_study_ms:      window.PILOT_MODE ?  4000 : 10000,
};

/* ── Global in-session data store ─────────────────────────── */
window.BatteryData = {
  participantId: '',
  sessionStart: null,
  trials: [],
  taskSummaries: {},

  /* Push one or more row objects. Auto-stamps participant_id, timestamp, window. */
  addTrials(rows) {
    const stamp = getTimestamp();
    const win   = getWindowSize();
    const arr   = Array.isArray(rows) ? rows : [rows];
    arr.forEach(r => {
      r.participant_id      = this.participantId;
      r.timestamp           = r.timestamp || stamp;
      r.window_width_px     = win.width;
      r.window_height_px    = win.height;
      r.screen_width_px     = win.screenWidth;
      r.screen_height_px    = win.screenHeight;
      r.device_pixel_ratio  = win.devicePixelRatio;
      this.trials.push(r);
    });
  },

  setTaskSummary(taskName, obj) {
    this.taskSummaries[taskName] = obj;
  }
};

/* ── Helpers ──────────────────────────────────────────────── */
function getTimestamp() { return new Date().toISOString(); }

function getWindowSize() {
  return {
    width:  window.innerWidth,
    height: window.innerHeight,
    screenWidth:  window.screen.width,
    screenHeight: window.screen.height,
    devicePixelRatio: window.devicePixelRatio || 1
  };
}

function euclideanDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/* Returns angle in degrees [0, 360), clockwise from east (right) */
function angleBetween(fromX, fromY, toX, toY) {
  let deg = Math.atan2(toY - fromY, toX - fromX) * (180 / Math.PI);
  return (deg + 360) % 360;
}

/* Signed angular error [-180, +180]. Positive = clockwise overshoot. */
function signedAngularError(chosen, correct) {
  let diff = chosen - correct;
  while (diff >  180) diff -= 360;
  while (diff < -180) diff += 360;
  return diff;
}

/* Fisher-Yates shuffle (returns new array) */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mean(arr) {
  const v = arr.filter(x => x !== null && x !== undefined && !isNaN(x));
  if (!v.length) return null;
  return v.reduce((s, x) => s + x, 0) / v.length;
}

function median(arr) {
  const v = arr.filter(x => x !== null && x !== undefined && !isNaN(x));
  if (!v.length) return null;
  const s = v.slice().sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/* ── Build battery-level summary ──────────────────────────── */
function buildSummary() {
  const bd = window.BatteryData;
  const vs = bd.taskSummaries['visual_sequencing_set_shifting'] || {};

  /* Object-Location Memory - main trials only */
  const olmTrials  = bd.trials.filter(r => r.task_name === 'object_location_memory' && r.trial_type === 'main');
  const olmErrors  = olmTrials.map(r => r.euclidean_error_px).filter(v => v != null && !isNaN(v));
  const olmNorm    = olmTrials.map(r => r.normalized_error).filter(v => v != null && !isNaN(v));
  const olmRT      = olmTrials.map(r => r.response_time_ms).filter(v => v != null && !isNaN(v));
  const olmMissing = olmTrials.filter(r => r.response_x == null).length;

  /* Block-wise mean errors */
  const olmBlockMeans = {};
  [1, 2, 3].forEach(b => {
    const bVals = olmTrials.filter(r => r.block_number === b)
                           .map(r => r.euclidean_error_px).filter(v => v != null && !isNaN(v));
    olmBlockMeans['olm_block_' + b + '_mean_error_px'] = mean(bVals);
  });

  /* Spatial Pointing - main trials only */
  const spTrials = bd.trials.filter(r => r.task_name === 'spatial_pointing' && r.practice_or_main === 'main');
  const spAbs    = spTrials.map(r => r.absolute_angular_error_degrees).filter(v => v != null && !isNaN(v));
  const spSigned = spTrials.map(r => r.signed_angular_error_degrees).filter(v => v != null && !isNaN(v));
  const spRT     = spTrials.map(r => r.response_time_ms).filter(v => v != null && !isNaN(v));

  const sessionEnd = new Date();
  const totalDur   = bd.sessionStart ? (sessionEnd - new Date(bd.sessionStart)) : null;

  return {
    participant_id: bd.participantId,
    session_start:  bd.sessionStart,
    session_end:    sessionEnd.toISOString(),
    total_battery_duration_ms: totalDur,
    pilot_mode: window.PILOT_MODE,

    /* Visual Sequencing / Set-Shifting */
    completion_time_sequencing_ms:   vs.completion_time_sequencing_ms  ?? null,
    completion_time_set_shifting_ms: vs.completion_time_set_shifting_ms ?? null,
    set_shifting_cost_ms:            vs.set_shifting_cost_ms            ?? null,
    set_shifting_ratio:              vs.set_shifting_ratio              ?? null,
    errors_sequencing:               vs.errors_sequencing               ?? null,
    errors_set_shifting:             vs.errors_set_shifting             ?? null,

    /* Object-Location Memory */
    olm_mean_euclidean_error_px:    mean(olmErrors),
    olm_median_euclidean_error_px:  median(olmErrors),
    olm_mean_normalized_error:      mean(olmNorm),
    olm_response_time_mean_ms:      mean(olmRT),
    olm_missing_responses:          olmMissing,
    ...olmBlockMeans,

    /* Spatial Pointing */
    sp_mean_absolute_angular_error_deg:   mean(spAbs),
    sp_median_absolute_angular_error_deg: median(spAbs),
    sp_signed_bias_deg:                   mean(spSigned),
    sp_response_time_mean_ms:             mean(spRT),

    /* Browser/display info */
    window_width_px:    window.innerWidth,
    window_height_px:   window.innerHeight,
    screen_width_px:    window.screen.width,
    screen_height_px:   window.screen.height,
    device_pixel_ratio: window.devicePixelRatio || 1,
    user_agent:         navigator.userAgent
  };
}

/* ── CSV serialiser ───────────────────────────────────────── */
function toCSV(rows) {
  if (!rows || !rows.length) return '';
  /* Collect all unique keys across all rows for a stable header */
  const keySet = new Set();
  rows.forEach(r => Object.keys(r).forEach(k => keySet.add(k)));
  const keys = Array.from(keySet);
  const escape = v => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return keys.join(',') + '\n' + rows.map(r => keys.map(k => escape(r[k])).join(',')).join('\n');
}

/* ── Download helper ──────────────────────────────────────── */
function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 600);
}

/* ── Public export functions ──────────────────────────────── */
function exportAllCSV() {
  const pid  = window.BatteryData.participantId || 'unknown';
  const date = new Date().toISOString().slice(0, 10);
  triggerDownload(toCSV(window.BatteryData.trials), pid + '_' + date + '_trials.csv', 'text/csv');
}

function exportAllJSON() {
  const pid  = window.BatteryData.participantId || 'unknown';
  const date = new Date().toISOString().slice(0, 10);
  const payload = { summary: buildSummary(), trials: window.BatteryData.trials, taskSummaries: window.BatteryData.taskSummaries };
  triggerDownload(JSON.stringify(payload, null, 2), pid + '_' + date + '_battery.json', 'application/json');
}

function exportTaskCSV(taskName) {
  const pid  = window.BatteryData.participantId || 'unknown';
  const date = new Date().toISOString().slice(0, 10);
  const rows = window.BatteryData.trials.filter(r => r.task_name === taskName);
  triggerDownload(toCSV(rows), pid + '_' + date + '_' + taskName + '.csv', 'text/csv');
}

function exportSummaryJSON() {
  const pid  = window.BatteryData.participantId || 'unknown';
  const date = new Date().toISOString().slice(0, 10);
  triggerDownload(JSON.stringify(buildSummary(), null, 2), pid + '_' + date + '_summary.json', 'application/json');
}
