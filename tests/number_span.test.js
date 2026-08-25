'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'tasks', 'number_span.js'), 'utf8');
const stylesheet = fs.readFileSync(path.join(__dirname, '..', 'css', 'style.css'), 'utf8');
const context = { window: { PILOT_MODE: false } };
vm.createContext(context);
vm.runInContext(source, context);
const scoring = context.window.NSScoring;

assert.ok(scoring);
assert.ok(!source.includes("Examiner: enter participant\\'s response"));
assert.ok(source.includes('id="ns-digit-pad"'));
assert.ok(source.includes('Submit response'));
assert.ok(source.includes('aria-label="'));
assert.ok(source.includes('Delete last digit'));
assert.ok(source.includes('digits entered'));
assert.ok(source.includes('maxlength="'));
assert.ok(source.includes('player: null'), 'one persistent media element must be reused across the task');
assert.ok(source.includes('playDigit(index + 1)'), 'digits must play sequentially rather than from independent timers');
assert.ok(!source.includes('var el = new Audio(url)'), 'a new media element must not be created for each digit');
assert.ok(source.includes('Technical detail:'), 'playback failures must expose the browser error');
assert.ok(source.includes('The digit sequence was incomplete'), 'failed playback must not silently continue to scoring');
assert.ok(source.includes('Replay digit sequence'), 'an incomplete sequence must be repeatable without scoring it');
assert.ok(!source.includes('grid-template-columns:repeat(5'));
assert.ok(stylesheet.includes('grid-template-columns: repeat(3, minmax(0, 1fr));'));
assert.ok(stylesheet.includes('.ns-digit-pad .battery-btn'));
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
