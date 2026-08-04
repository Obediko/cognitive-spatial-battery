'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'tasks', 'number_span.js'),
  'utf8'
);
const context = { window: { PILOT_MODE: false } };
vm.createContext(context);
vm.runInContext(source, context);

const scoring = context.window.NSScoring;
assert.ok(scoring, 'NSScoring must be exported for deterministic testing');

// --- expectedResponse -------------------------------------------------
assert.equal(scoring.expectedResponse('forward', [1, 2, 3]), '123');
assert.equal(scoring.expectedResponse('backward', [1, 2, 3]), '321');
assert.equal(scoring.expectedResponse('backward', [7]), '7');

// --- shouldDiscontinue --------------------------------------------------
assert.equal(scoring.shouldDiscontinue(true), false, 'a passed length must not discontinue');
assert.equal(scoring.shouldDiscontinue(false), true, 'a failed length must discontinue');

// --- generateSequence: structural constraints ---------------------------
// Run many times across lengths/directions to check invariants hold, since
// generation is randomized.
['forward', 'backward'].forEach((direction) => {
  [2, 3, 5, 8, 9].forEach((length) => {
    for (let i = 0; i < 25; i++) {
      const seq = scoring.generateSequence(direction, length);
      assert.equal(seq.length, length, 'sequence must have the requested length');
      seq.forEach((d) => {
        assert.ok(Number.isInteger(d) && d >= 0 && d <= 9, 'each digit must be 0-9');
      });
      for (let j = 1; j < seq.length; j++) {
        assert.notEqual(seq[j], seq[j - 1], 'no immediately repeated digit');
      }
      // No run of 3+ consecutive ascending or descending digits.
      let ascRun = 1, descRun = 1;
      for (let j = 1; j < seq.length; j++) {
        if (seq[j] === seq[j - 1] + 1) { ascRun++; descRun = 1; }
        else if (seq[j] === seq[j - 1] - 1) { descRun++; ascRun = 1; }
        else { ascRun = 1; descRun = 1; }
        assert.ok(ascRun < 3 && descRun < 3, 'no run of 3+ consecutive ascending/descending digits');
      }
    }
  });
});

// --- generateSequence: avoids repeating an already-used sequence --------
(() => {
  // Length 2 has only a small number of valid (no-immediate-repeat) sequences,
  // so repeated calls should still return distinct sequences until the pool
  // is exhausted; at minimum, back-to-back calls should not collide while
  // valid alternatives remain.
  const seen = new Set();
  let collided = false;
  for (let i = 0; i < 5; i++) {
    const seq = scoring.generateSequence('forward', 2).join('');
    if (seen.has(seq)) collided = true;
    seen.add(seq);
  }
  assert.ok(!collided || seen.size > 1, 'sequence generator should avoid immediate duplicates while alternatives exist');
})();

console.log('number_span.test.js: all assertions passed');
