'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const main = fs.readFileSync(path.join(root, 'js', 'main.js'), 'utf8');
const admin = fs.readFileSync(path.join(root, 'js', 'admin.js'), 'utf8');
const utils = fs.readFileSync(path.join(root, 'js', 'utils.js'), 'utf8');
const reporting = fs.readFileSync(path.join(root, 'js', 'reporting.js'), 'utf8');

const modules = [
  'original_story_recall.js',
  'animal_semantic_fluency.js',
  'original_visual_naming.js',
  'original_complex_figure.js',
  'number_span.js',
  'visual_sequencing_set_shifting.js',
  'object_location_memory.js',
  'spatial_pointing.js'
];
modules.forEach((file) => {
  assert.ok(html.includes('js/tasks/' + file), file + ' must be loaded by index.html');
  assert.ok(fs.existsSync(path.join(root, 'js', 'tasks', file)), file + ' must exist');
});

[
  'buildOSRImmediateTimeline',
  'buildAnimalFluencyTimeline',
  'buildOriginalVisualNamingTimeline',
  'buildOCFImmediateTimeline',
  'buildOCFDelayedTimeline',
  'buildNumberSpanTimeline',
  'buildVisualSequencingTimeline',
  'buildObjectLocationTimeline',
  'buildSpatialPointingTimeline'
].forEach((builder) => assert.ok(main.includes("'" + builder + "'"), builder + ' must be load-checked'));

const eightInputs = [
  'CRAFTVRS_ANALOGUE', 'CRAFTDVR_ANALOGUE', 'ANIMALS_ANALOGUE', 'MINTTOTS_ANALOGUE',
  'UDSBENTC_ANALOGUE', 'UDSBENTD_ANALOGUE', 'DIGFORCT_ANALOGUE', 'DIGBACCT_ANALOGUE'
];
eightInputs.forEach((score) => assert.ok(reporting.includes(score), score + ' must be exported'));
assert.equal(new Set(eightInputs).size, 8);
assert.ok(reporting.includes("eti_value_status: 'not_computed_normative_parameters_required'"));
assert.ok(reporting.includes('TRAILB_TIME_SEC_ANALOGUE'));
assert.ok(reporting.includes('Digital Trail B analogue; manuscript comparator, not an ETI input'));
assert.ok(reporting.includes('OLM_MEAN_ERROR_PX'));
assert.ok(reporting.includes('no NACC counterpart'));

assert.ok(!main.includes('Original Visual Naming (with semantic cue)'), 'participant completion must not display examiner scoring');
assert.ok(admin.includes('Visual Naming analogue: total correct without a cue'));
assert.ok(admin.includes('Number Span forward analogue: number of correct trials'));
assert.ok(admin.includes('Number Span backward analogue: number of correct trials'));
assert.ok(admin.includes('Trail comparators (not ETI inputs)'));
assert.ok(admin.includes('Additional spatial outcomes (not ETI inputs)'));
assert.ok(admin.includes('Object-Location Memory mean error'));
assert.ok(admin.includes('Spatial Pointing mean absolute error'));
console.log('eti_core_eight_scores.test.js: all assertions passed');
