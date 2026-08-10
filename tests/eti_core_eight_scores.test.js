'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const main = fs.readFileSync(path.join(root, 'js', 'main.js'), 'utf8');
const utils = fs.readFileSync(path.join(root, 'js', 'utils.js'), 'utf8');

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

[
  'osr_immediate_verbatim',
  'asf_total_valid_unique',
  'ovn_total_with_semantic',
  'ocf_copy_score',
  'ns_forward_span',
  'completion_time_sequencing_ms',
  'olm_mean_euclidean_error_px',
  'sp_mean_absolute_angular_error_deg'
].forEach((score) => assert.ok(utils.includes(score), score + ' must be exported in the summary'));

assert.ok(main.includes('Original Visual Naming (with semantic cue)'));
assert.ok(main.includes('Number Span forward / backward'));
console.log('eti_core_eight_scores.test.js: all assertions passed');
