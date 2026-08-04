'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'tasks', 'osr_transcription.js'),
  'utf8'
);
// This file uses dynamic import() at module scope for the ASR pipeline,
// which only runs inside functions we don't call in this test - the pure
// scoring logic under test has no such dependency.
const context = { window: {} };
vm.createContext(context);
vm.runInContext(source, context);

const scoring = context.window.OSRTranscriptionScoring;
assert.ok(scoring, 'OSRTranscriptionScoring must be exported for deterministic testing');

// --- normalizeForMatching ------------------------------------------------
assert.equal(scoring.normalizeForMatching("Eleven o’clock!"), 'eleven oclock');
assert.equal(scoring.normalizeForMatching('  Multiple   spaces  '), 'multiple spaces');
assert.equal(scoring.normalizeForMatching(''), '');
assert.equal(scoring.normalizeForMatching(null), '');

// --- matchVerbatimUnits ---------------------------------------------------
const units = [
  ['Thursday', 'Thursday'],
  ['took', 'took / take / taking'],
  ['three', 'three / 3'],
  ['eleven o’clock', 'eleven o’clock / 11 o’clock'],
];

(() => {
  const transcript = 'On thursday she took the bus and returned 3 books before eleven oclock.';
  const matches = scoring.matchVerbatimUnits(transcript, units);
  assert.deepEqual(matches, [true, true, true, true], 'all four units should match via their alternate forms');
})();

(() => {
  const transcript = 'She gave the wallet to the librarian.';
  const matches = scoring.matchVerbatimUnits(transcript, units);
  assert.deepEqual(matches, [false, false, false, false], 'none of these units should match an unrelated transcript');
})();

(() => {
  // Only the digit-numeral alternate is present, not the word form.
  const transcript = 'She returned 3 books.';
  const matches = scoring.matchVerbatimUnits(transcript, units);
  assert.equal(matches[2], true, 'numeral alternate form ("3") must match the "three" unit');
})();

(() => {
  // Case-insensitivity and punctuation robustness.
  const transcript = "THURSDAY morning she TOOK the 11 O'CLOCK bus.";
  const matches = scoring.matchVerbatimUnits(transcript, units);
  assert.deepEqual(matches, [true, true, false, true]);
})();

console.log('osr_transcription.test.js: all assertions passed');
