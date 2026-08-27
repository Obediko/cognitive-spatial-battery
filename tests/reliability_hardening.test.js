'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

const main = read('js/main.js');
const admin = read('js/admin.js');
const adminHtml = read('admin.html');
const utils = read('js/utils.js');
const asr = read('js/tasks/osr_transcription.js');
const asrWorker = read('js/tasks/osr_transcription_worker.js');
const osr = read('js/tasks/original_story_recall.js');
const asf = read('js/tasks/animal_semantic_fluency.js');
const ovn = read('js/tasks/original_visual_naming.js');
const ocf = read('js/tasks/original_complex_figure.js');
const olm = read('js/tasks/object_location_memory.js');
const sp = read('js/tasks/spatial_pointing.js');
const css = read('css/style.css');

assert.ok(utils.includes('function requestMicrophone(timeoutMs)'));
assert.ok(utils.includes('function stopRecorder(recorder, chunks, timeoutMs)'));
assert.ok(utils.includes('function decimateStroke(stroke, minimumDistance, maximumPoints)'));
assert.ok(utils.includes('function installGamepadPointer(canvas, onSelect, options)'));
assert.ok(utils.includes('battery-recovery-warning'));
assert.ok(utils.includes('ocfCopyCompletedAt'));
assert.ok(utils.includes('window.BatteryArtifactStore'));
assert.ok(utils.includes('deleteParticipant: deleteParticipant'));
assert.ok(utils.includes("['osr', 'immediate'], ['osr', 'delayed'], ['asf', 'main']"));
assert.ok(utils.includes("jobs.push(['ovn', String(i)])"));
assert.ok(utils.includes('function loadBatteryCheckpoint(participantId, options)'));
assert.ok(utils.includes('function listBatteryCheckpoints()'));
assert.ok(utils.includes("sessionStatus: window.BatteryData.sessionStatus || 'in_progress'"));

assert.ok(asr.includes('MODEL_TIMEOUT_MS = 120000'));
assert.ok(asr.includes('INFERENCE_TIMEOUT_MS = 90000'));
assert.ok(asr.includes('transcriptionQueue.then(run, run)'));
assert.ok(asr.includes("new Worker(transcriptionWorkerUrl())"));
assert.ok(asr.includes('transcriptionWorker.terminate()'));
assert.ok(asr.includes('worker.postMessage({'));
assert.ok(asrWorker.includes("pipeline('automatic-speech-recognition'"));
assert.ok(asrWorker.includes("self.postMessage({ type: 'progress'"));
assert.ok(asrWorker.includes('asr(audioData, generationOptions)'));
assert.ok(asrWorker.includes("if (message.language === 'de')"));

assert.ok(osr.includes('requestMicrophone(30000)'));
assert.ok(osr.includes('stopRecorder(recorder, chunks, 8000)'));
assert.ok(osr.includes("new Error('playback timed out')"));
assert.ok(asf.includes('requestMicrophone(30000)'));
assert.ok(asf.includes('stopRecorder(recorder, chunks, 8000)'));
assert.ok(asf.includes("batteryArtifactKey(window.BatteryData.participantId, 'asf', 'main')"));
assert.ok(asf.includes('Timer running; audio is not being recorded.'));
assert.ok(css.includes('[hidden] { display: none !important; }'));

assert.ok(ovn.includes('<img class="ovn-stimulus-image"'));
assert.ok(ovn.includes("typeof image.decode === 'function'"));
assert.ok(ovn.includes("'/.netlify/images?url='"));
assert.ok(ovn.includes('stimulus_load_ms'));
assert.ok(ovn.includes('response clock and recording start only after the stimulus is visible'));
assert.ok(ovn.includes('revokeObjectUrl(window.OVNState.itemAudioUrls[index])'));
assert.ok(ovn.includes("batteryArtifactKey(window.BatteryData.participantId, 'ovn', String(index))"));
assert.ok(ovn.includes('Transcribe this recording'));
assert.ok(ovn.includes('Whisper is optional and will not start automatically.'));
assert.ok(!ovn.includes("status.textContent = 'Transcribing locally with Whisper…';"));
assert.ok(ovn.includes('ovnPreloadStimulus(items[0])'));
assert.ok(ovn.includes("finish(showFallback('load_timeout')); }, 6000"));

assert.ok(ocf.includes('function suggestElements(strokes)'));
assert.ok(ocf.includes('ocf-rule-aid-0.1-unvalidated'));
assert.ok(ocf.includes('copy_timestamp_missing'));
assert.ok(ocf.includes('decimateStroke(stroke, 0.0025, 1200)'));

const timelineStart = main.indexOf('var timeline = welcomeTrials.concat');
const participantTimeline = main.slice(timelineStart);
assert.ok(main.includes('function delayedRecallShouldRun'));
assert.ok(main.includes("makeDelayedRecallNode('osr', 'ovn', false)"));
assert.ok(main.includes("makeDelayedRecallNode('ocf', 'ovn', false)"));
assert.ok(participantTimeline.indexOf('osrBeforeOvn') < participantTimeline.indexOf('ovnTimeline'));
assert.ok(participantTimeline.indexOf('ocfBeforeOvn') < participantTimeline.indexOf('ovnTimeline'));
assert.ok(participantTimeline.indexOf('osrDelayedFinal') < participantTimeline.indexOf('ocfDelayedFinal'));
assert.ok(osr.includes('window.OSRDelayPolicy'));
assert.ok(ocf.includes('window.OCFDelayPolicy'));
assert.ok(participantTimeline.indexOf('spTimeline') < participantTimeline.indexOf('vsTimeline'));
assert.ok(main.includes('showRecoverableRuntimeError'));
const participantArrayEnd = participantTimeline.indexOf(']);');
const participantArray = participantTimeline.slice(0, participantArrayEnd);
assert.ok(participantArray.includes('nsTimeline'));
assert.ok(participantArray.includes('makeCompletionScreen()'));
assert.ok(!participantArray.includes('examinerHandoffTimeline'));
assert.ok(!participantArray.includes('osrReviewTimeline'));
assert.ok(!participantArray.includes('asfReviewTimeline'));
assert.ok(!participantArray.includes('ovnReviewTimeline'));
assert.ok(!participantArray.includes('ocfReviewTimeline'));
assert.ok(main.includes("sessionStatus = 'participant_complete'"));
assert.ok(main.includes("input.setAttribute('pattern', '[A-Za-z0-9_-]{1,64}')"));
assert.ok(main.includes('input.maxLength = 64'));
assert.ok(adminHtml.includes('js/admin.js'));
assert.ok(admin.includes('buildOSRReviewTimeline()'));
assert.ok(admin.includes('buildAnimalFluencyReviewTimeline()'));
assert.ok(admin.includes('buildOriginalVisualNamingReviewTimeline()'));
assert.ok(admin.includes('buildOCFReviewTimeline()'));
assert.ok(admin.includes("sessionStatus = 'examiner_review_complete'"));
assert.ok(admin.includes('Delete remote'));
assert.ok(admin.includes('Delete local'));
assert.ok(admin.includes('BatteryArtifactStore.deleteParticipant(participantId)'));

assert.ok(olm.includes('installGamepadPointer'));
assert.ok(olm.includes('(e.clientX - rect.left) * cW / rect.width'));
assert.ok(sp.includes('installGamepadPointer'));
assert.ok(sp.includes('(event.clientX - rect.left) * canvas.width / rect.width'));

console.log('Reliability hardening checks passed.');
