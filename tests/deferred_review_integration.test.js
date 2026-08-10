'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

const main = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');
const osr = fs.readFileSync(path.join(root, 'js/tasks/original_story_recall.js'), 'utf8');
const asf = fs.readFileSync(path.join(root, 'js/tasks/animal_semantic_fluency.js'), 'utf8');
const ovn = fs.readFileSync(path.join(root, 'js/tasks/original_visual_naming.js'), 'utf8');
const ocf = fs.readFileSync(path.join(root, 'js/tasks/original_complex_figure.js'), 'utf8');
const sp = fs.readFileSync(path.join(root, 'js/tasks/spatial_pointing.js'), 'utf8');

[
  'buildOSRReviewTimeline',
  'buildAnimalFluencyReviewTimeline',
  'buildOriginalVisualNamingReviewTimeline',
  'buildOCFReviewTimeline'
].forEach((builder) => assert.ok(main.includes("'" + builder + "'"), builder + ' must be load-checked'));

const handoff = main.indexOf('examinerHandoffTimeline,');
assert.ok(handoff > 0);
['osrReviewTimeline,','asfReviewTimeline,','ovnReviewTimeline,','ocfReviewTimeline,'].forEach((node) => {
  assert.ok(main.indexOf(node, handoff) > handoff, node + ' must run after examiner handoff');
});

assert.ok(osr.includes('function buildOSRReviewTimeline()'));
assert.ok(asf.includes('function buildAnimalFluencyReviewTimeline()'));
assert.ok(asf.includes('OSRTranscription.transcribeBlob'));
assert.ok(ovn.includes("protocol_mode: 'deferred_uncued'"));
assert.ok(ovn.includes('OSRTranscription.transcribeBlob'));
assert.ok(ocf.includes('function buildOCFReviewTimeline()'));
assert.ok(ocf.includes("canvas.addEventListener('lostpointercapture'"));
assert.ok(sp.includes('const SP_ARENA_R    = 300;'));
assert.ok(sp.includes("ctx.font = '30px serif';"));

console.log('deferred_review_integration.test.js: all assertions passed');
