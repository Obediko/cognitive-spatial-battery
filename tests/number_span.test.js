'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'tasks', 'number_span.js'), 'utf8');
const context = { window: { PILOT_MODE: false } };
vm.createContext(context);
vm.runInContext(source, context);
const scoring = context.window.NSScoring;

assert.ok(scoring);
assert.ok(!source.includes("Examiner: enter participant\\'s response"));
assert.ok(source.includes('id="ns-digit-pad"'));
assert.ok(source.includes('Submit response'));
assert.equal(scoring.sequenceVersion, 'ons-controlled-form-a-1.0');
assert.equal(scoring.expectedResponse('forward', [1,2,3]), '123');
assert.equal(scoring.expectedResponse('backward', [1,2,3]), '321');
assert.equal(scoring.shouldDiscontinue(true), false);
assert.equal(scoring.shouldDiscontinue(false), true);

const first = scoring.controlledSequence('forward', 3, 1);
assert.deepEqual(Array.from(first), [4,9,2]);
first[0] = 0;
assert.deepEqual(Array.from(scoring.controlledSequence('forward', 3, 1)), [4,9,2], 'items must be returned defensively');
assert.deepEqual(Array.from(scoring.controlledSequence('backward', 8, 2)), [3,8,5,1,9,2,7,4]);
assert.throws(() => scoring.controlledSequence('forward', 2, 1), /No controlled Number Span item/);

['forward','backward'].forEach((direction) => {
  const lengths = direction === 'forward' ? [3,4,5,6,7,8,9] : [2,3,4,5,6,7,8];
  lengths.forEach((length) => {
    [1,2].forEach((trial) => {
      const seq = scoring.controlledSequence(direction, length, trial);
      assert.equal(seq.length, length);
      assert.equal(new Set(seq).size, seq.length, 'controlled items must not repeat digits');
    });
  });
});

console.log('number_span.test.js: all assertions passed');
