'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'tasks', 'original_visual_naming.js'),
  'utf8'
);
const context = { window: {} };
vm.createContext(context);
vm.runInContext(source, context);

const scoring = context.window.OVNScoring;
assert.ok(scoring, 'OVNScoring must be exported');
assert.equal(scoring.itemCount, 32, 'OVN must contain 32 original items');

const responses = [
  { outcome: 'uncued_correct', semantic_cue_given: false, phonemic_cue_given: false },
  { outcome: 'semantic_correct', semantic_cue_given: true, phonemic_cue_given: false },
  { outcome: 'phonemic_correct', semantic_cue_given: false, phonemic_cue_given: true },
  { outcome: 'incorrect', semantic_cue_given: true, phonemic_cue_given: true }
];

const complete = scoring.scoreSummary(responses, false);
assert.equal(complete.totalWithSemantic, 2);
assert.equal(complete.totalUncued, 1);
assert.equal(complete.semanticGiven, 2);
assert.equal(complete.semanticCorrect, 1);
assert.equal(complete.phonemicGiven, 2);
assert.equal(complete.phonemicCorrect, 1);
assert.equal(complete.itemsAdministered, 4);
assert.equal(complete.status, 'examiner_verified');

const incomplete = scoring.scoreSummary(responses, true);
assert.equal(incomplete.totalWithSemantic, null);
assert.equal(incomplete.totalUncued, null);
assert.equal(incomplete.rawTotalWithSemantic, 2);
assert.equal(incomplete.status, 'incomplete');

let failures = 5;
failures = scoring.nextFailureRun(failures, 'phonemic_correct');
assert.equal(failures, 6, 'phonemic-cue recovery remains a primary-score failure');
failures = scoring.nextFailureRun(failures, 'semantic_correct');
assert.equal(failures, 0, 'semantic-cue correct resets the failure run');
failures = scoring.nextFailureRun(5, 'uncued_correct');
assert.equal(failures, 0, 'uncued correct resets the failure run');
failures = scoring.nextFailureRun(5, 'incorrect');
assert.equal(failures, 6, 'incorrect increments the failure run');

console.log('Original Visual Naming scoring tests passed.');
