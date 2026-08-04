'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'tasks', 'animal_semantic_fluency.js'),
  'utf8'
);
const context = { window: { PILOT_MODE: false } };
vm.createContext(context);
vm.runInContext(source, context);

const scoring = context.window.ASFScoring;
assert.ok(scoring, 'ASFScoring must be exported for deterministic testing');

const rows = [
  { canonical: 'Lion', decision: 'valid' },
  { canonical: ' lion. ', decision: 'valid' },
  { canonical: 'tiger', decision: 'valid' },
  { canonical: 'lion', decision: 'repetition' },
  { canonical: 'tree', decision: 'rule_violation' },
  { canonical: 'regional-name', decision: 'uncertain' },
  { canonical: 'otter', decision: 'unreviewed' }
];

const summary = scoring.summariseRows(rows);
assert.equal(summary.valid, 2, 'duplicate valid canonical labels must count once');
assert.equal(summary.repetitions, 1);
assert.equal(summary.violations, 1);
assert.equal(summary.uncertain, 1);
assert.equal(summary.unreviewed, 1);

assert.deepEqual(
  JSON.parse(JSON.stringify(scoring.finaliseScore(
    { valid: 7, unreviewed: 0, uncertain: 0 },
    false
  ))),
  { status: 'examiner_verified', total: 7 }
);
assert.deepEqual(
  JSON.parse(JSON.stringify(scoring.finaliseScore(
    { valid: 7, unreviewed: 0, uncertain: 1 },
    false
  ))),
  { status: 'provisional', total: null }
);
assert.deepEqual(
  JSON.parse(JSON.stringify(scoring.finaliseScore(
    { valid: 7, unreviewed: 0, uncertain: 0 },
    true
  ))),
  { status: 'incomplete', total: null }
);
assert.deepEqual(
  JSON.parse(JSON.stringify(scoring.finaliseScore(
    { valid: 7, unreviewed: 1, uncertain: 0 },
    false
  ))),
  { status: 'unreviewed', total: null }
);

console.log('Animal Semantic Fluency scoring tests passed.');

const mainSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'main.js'), 'utf8');
assert.match(mainSource, /Continue without fullscreen/);
assert.match(mainSource, /\.catch\(function\(error\)/);
assert.match(mainSource, /fullscreen_granted:/);

console.log('Fullscreen fallback guards passed.');
