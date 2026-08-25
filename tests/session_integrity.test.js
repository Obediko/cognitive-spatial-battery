'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function storage() {
  const values = new Map();
  return {
    get length() { return values.size; },
    key(index) { return Array.from(values.keys())[index] || null; },
    getItem(key) { return values.has(String(key)) ? values.get(String(key)) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    removeItem(key) { values.delete(String(key)); }
  };
}

const localStorage = storage();
const sessionStorage = storage();
const document = { documentElement: { lang: 'en' }, getElementById() { return null; }, body: null };
const window = {
  localStorage,
  sessionStorage,
  document,
  screen: { width: 1440, height: 900 },
  innerWidth: 1440,
  innerHeight: 900,
  devicePixelRatio: 1,
  alert() {},
  confirm() { return true; }
};
const context = { window, document, localStorage, sessionStorage, navigator: {}, console, Date, setTimeout, clearTimeout };
vm.createContext(context);
['js/language.js', 'js/utils.js', 'js/reporting.js'].forEach(file => {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context, { filename: file });
});

assert.equal(window.BatteryLanguage.metadata('de').administration_language, 'de');
assert.equal(window.BatteryLanguage.metadata('de').language_form_version, 'csb-de-1.0');
assert.equal(window.BatteryLanguage.get(), 'en', 'requesting metadata must not change the active session language');

const completedAt = '2026-08-20T10:30:00.000Z';
window.BatteryData.participantId = 'FROZEN_DURATION';
window.BatteryData.sessionStart = '2026-08-20T10:00:00.000Z';
window.BatteryData.participantCompletedAt = completedAt;
window.BatteryData.sessionStatus = 'examiner_review_complete';
let summary = context.buildSummary();
assert.equal(summary.session_end, completedAt);
assert.equal(summary.total_battery_duration_ms, 30 * 60 * 1000);
assert.equal(summary.session_status, 'examiner_review_complete');

const germanCheckpoint = {
  saved_at: '2026-08-20T11:00:00.000Z',
  participantId: 'GERMAN_RESTORE',
  sessionStart: '2026-08-20T10:00:00.000Z',
  participantCompletedAt: completedAt,
  language: 'de',
  sessionStatus: 'examiner_review_complete',
  trials: [{
    task_name: 'original_story_recall',
    phase: 'free_recall',
    condition: 'immediate',
    timestamp: '2026-08-20T10:03:00.000Z',
    story_audio_standardized: true
  }, {
    task_name: 'original_story_recall',
    phase: 'free_recall',
    condition: 'delayed',
    timestamp: '2026-08-20T10:16:00.000Z',
    response_duration_ms: 60000
  }],
  taskSummaries: { original_story_recall: { osr_immediate_verbatim: 14, osr_delayed_verbatim: 12 } },
  taskState: { osrImmediateEndMs: Date.parse('2026-08-20T10:03:00.000Z'), osrDelayedStartMs: Date.parse('2026-08-20T10:15:00.000Z') }
};
window.OSRState = { neutralPromptUsed: {}, protocolFlags: {}, immediateEndMs: null, delayedStartMs: null, storyAudioStandardized: false };
localStorage.setItem('csb-recovery-v1:GERMAN_RESTORE', JSON.stringify(germanCheckpoint));
assert.equal(context.loadBatteryCheckpoint('GERMAN_RESTORE', { confirm: false }), false,
  'ordinary participant restoration must still reject a different selected language');
assert.equal(context.loadBatteryCheckpoint('GERMAN_RESTORE', { confirm: false, adoptLanguage: true }), true,
  'examiner restoration must adopt the saved language');
assert.equal(window.BatteryLanguage.get(), 'de');
assert.equal(window.OSRState.delayedStartMs - window.OSRState.immediateEndMs, 12 * 60 * 1000);
assert.equal(window.OSRState.storyAudioStandardized, true);
assert.equal(context.buildSummary().session_end, completedAt);

window.BatteryLanguage.set('en');
const rows = window.BatteryReporting.collectiveRows([germanCheckpoint, {
  participantId: 'ENGLISH_SUBSET',
  language: 'en',
  sessionStart: '2026-08-20T09:00:00.000Z',
  participantCompletedAt: '2026-08-20T09:10:00.000Z',
  sessionStatus: 'participant_complete',
  trials: [{ task_name: 'number_span', timestamp: '2026-08-20T09:05:00.000Z' }],
  taskSummaries: { number_span: { ns_forward_correct_trials: 5, ns_backward_correct_trials: 4 } }
}]);
assert.equal(rows[0].language, 'de');
assert.equal(rows[0].administration_language, 'de');
assert.equal(rows[0].language_form_version, 'csb-de-1.0');
assert.equal(rows[0].language_equivalence_status, 'translated_unvalidated');
assert.equal(rows[0].session_status, 'examiner_review_complete');
assert.equal(rows[0].session_end, completedAt);
assert.equal(rows[1].language, 'en');
assert.equal(rows[1].language_form_version, 'csb-en-1.0');
assert.equal(rows[1].eti_input_status, 'selected_subset_only');
assert.equal(rows[1].session_status, 'participant_complete');
assert.equal(window.BatteryLanguage.get(), 'en', 'mixed-language reporting must not change the active page language');

console.log('Session recovery, stable timing and mixed-language reporting checks passed.');
