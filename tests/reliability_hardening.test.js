'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

const main = read('js/main.js');
const utils = read('js/utils.js');
const asr = read('js/tasks/osr_transcription.js');
const osr = read('js/tasks/original_story_recall.js');
const asf = read('js/tasks/animal_semantic_fluency.js');
const ovn = read('js/tasks/original_visual_naming.js');
const ocf = read('js/tasks/original_complex_figure.js');
const olm = read('js/tasks/object_location_memory.js');
const sp = read('js/tasks/spatial_pointing.js');

assert.ok(utils.includes('function requestMicrophone(timeoutMs)'));
assert.ok(utils.includes('function stopRecorder(recorder, chunks, timeoutMs)'));
assert.ok(utils.includes('function decimateStroke(stroke, minimumDistance, maximumPoints)'));
assert.ok(utils.includes('function installGamepadPointer(canvas, onSelect, options)'));
assert.ok(utils.includes('battery-recovery-warning'));
assert.ok(utils.includes('ocfCopyCompletedAt'));

assert.ok(asr.includes('MODEL_TIMEOUT_MS = 120000'));
assert.ok(asr.includes('INFERENCE_TIMEOUT_MS = 90000'));
assert.ok(asr.includes('transcriptionQueue.then(run, run)'));
assert.ok(asr.includes('asrPipelinePromise = null'));

assert.ok(osr.includes('requestMicrophone(12000)'));
assert.ok(osr.includes('stopRecorder(recorder, chunks, 3000)'));
assert.ok(osr.includes("new Error('playback timed out')"));
assert.ok(asf.includes('requestMicrophone(12000)'));
assert.ok(asf.includes('stopRecorder(recorder, chunks, 3000)'));

assert.ok(ovn.includes('<img class="ovn-stimulus-image"'));
assert.ok(ovn.includes("typeof image.decode === 'function'"));
assert.ok(ovn.includes("'/.netlify/images?url='"));
assert.ok(ovn.includes('stimulus_load_ms'));
assert.ok(ovn.includes('response clock and recording start only after the stimulus is visible'));
assert.ok(ovn.includes('revokeObjectUrl(window.OVNState.itemAudioUrls[index])'));

assert.ok(ocf.includes('function suggestElements(strokes)'));
assert.ok(ocf.includes('ocf-rule-aid-0.1-unvalidated'));
assert.ok(ocf.includes('copy_timestamp_missing'));
assert.ok(ocf.includes('decimateStroke(stroke, 0.0025, 1200)'));

const timelineStart = main.indexOf('var timeline = welcomeTrials.concat');
const participantTimeline = main.slice(timelineStart);
assert.ok(participantTimeline.indexOf('ocfDelayedTimeline') < participantTimeline.indexOf('asfTimeline'));
assert.ok(main.includes('showRecoverableRuntimeError'));

assert.ok(olm.includes('installGamepadPointer'));
assert.ok(olm.includes('(e.clientX - rect.left) * cW / rect.width'));
assert.ok(sp.includes('installGamepadPointer'));
assert.ok(sp.includes('(event.clientX - rect.left) * canvas.width / rect.width'));

console.log('Reliability hardening checks passed.');
