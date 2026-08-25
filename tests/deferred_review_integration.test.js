'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

const main = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');
const admin = fs.readFileSync(path.join(root, 'js/admin.js'), 'utf8');
const osr = fs.readFileSync(path.join(root, 'js/tasks/original_story_recall.js'), 'utf8');
const asf = fs.readFileSync(path.join(root, 'js/tasks/animal_semantic_fluency.js'), 'utf8');
const ovn = fs.readFileSync(path.join(root, 'js/tasks/original_visual_naming.js'), 'utf8');
const ocf = fs.readFileSync(path.join(root, 'js/tasks/original_complex_figure.js'), 'utf8');
const sp = fs.readFileSync(path.join(root, 'js/tasks/spatial_pointing.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');

[
  'buildOSRReviewTimeline',
  'buildAnimalFluencyReviewTimeline',
  'buildOriginalVisualNamingReviewTimeline',
  'buildOCFReviewTimeline'
].forEach((builder) => {
  assert.ok(admin.includes(builder + '()'), builder + ' must be owned by the examiner portal');
  assert.ok(!main.includes('timeline: ' + builder + '()'), builder + ' must not be constructed in the participant timeline');
});

const participantStart = main.indexOf('var timeline = welcomeTrials.concat');
const participantEnd = main.indexOf(']);', participantStart);
const participantTimeline = main.slice(participantStart, participantEnd);
assert.ok(!participantTimeline.includes('examinerHandoffTimeline'));
assert.ok(!participantTimeline.includes('osrReviewTimeline'));
assert.ok(!participantTimeline.includes('asfReviewTimeline'));
assert.ok(!participantTimeline.includes('ovnReviewTimeline'));
assert.ok(!participantTimeline.includes('ocfReviewTimeline'));
[
  'buildOSRReviewTimeline()',
  'buildAnimalFluencyReviewTimeline()',
  'buildOriginalVisualNamingReviewTimeline()',
  'buildOCFReviewTimeline()'
].forEach((builder) => assert.ok(admin.includes(builder), builder + ' must run only from admin.js'));

assert.ok(osr.includes('function buildOSRReviewTimeline()'));
assert.ok(asf.includes('function buildAnimalFluencyReviewTimeline()'));
assert.ok(asf.includes('OSRTranscription.transcribeBlob'));
assert.ok(ovn.includes("protocol_mode: 'deferred_uncued'"));
assert.ok(ovn.includes('OSRTranscription.transcribeBlob'));
assert.ok(admin.includes('Review and rescore session'));
assert.ok(admin.includes('ensureReviewLanguage'));
assert.ok(admin.includes('renderAdminResults(false)'));
assert.ok(admin.includes('admin-sync-status'));
assert.ok(admin.includes('outstandingReviews'));
assert.ok(admin.includes('Review incomplete'));
assert.ok(admin.includes("BatteryData.sessionStatus = 'examiner_review_in_progress'"));
assert.ok(asf.includes('Saved scoring decisions loaded'));
assert.ok(osr.includes('Saved scoring decisions loaded'));
assert.ok(osr.includes('priorVerbatim'));
assert.ok(osr.includes('priorParaphrase'));
assert.ok(ocf.includes('priorElements'));
assert.ok(ocf.includes('drawing_started_at'));
assert.ok(ovn.includes('priorByItem'));
assert.ok(ovn.includes('window.BatteryData.addTrials(Object.assign({}, decision))'));
assert.ok(admin.includes('Number Span forward analogue: number of correct trials'));
assert.ok(admin.includes('Print individual result'));
assert.ok(admin.includes('printCollective'));
assert.ok(admin.includes('Download collective results CSV') || fs.readFileSync(path.join(root, 'admin.html'), 'utf8').includes('Download collective results CSV'));
assert.ok(admin.includes("hasTask('object_location_memory')"));
assert.ok(ovn.includes('priorByItem'));
assert.ok(fs.readFileSync(path.join(root, 'js', 'reporting.js'), 'utf8').includes('Not administered'));
assert.ok(ocf.includes('function buildOCFReviewTimeline()'));
assert.ok(ocf.includes("canvas.addEventListener('lostpointercapture'"));
assert.ok(sp.includes('const SP_ARENA_R    = 250;'));
assert.ok(sp.includes("ctx.fillStyle = '#ffffff';"));
assert.ok(sp.includes("lm.id === 'fountain' ? '#dbeafe' : '#ffffff'"));
assert.ok(sp.includes("ctx.arc(lm.x, lm.y, 24"));
assert.ok(sp.includes("ctx.font = '22px serif';"));
assert.ok(css.includes('--sp-arena-size: min(500px, 88vw, 68vh);'));
assert.ok(css.includes('aspect-ratio: 1 / 1;'));

console.log('deferred_review_integration.test.js: all assertions passed');
