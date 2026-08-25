'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const utils = read('js/utils.js');
const main = read('js/main.js');
const numberSpan = read('js/tasks/number_span.js');
const story = read('js/tasks/original_story_recall.js');
const animal = read('js/tasks/animal_semantic_fluency.js');
const naming = read('js/tasks/original_visual_naming.js');
const pointing = read('js/tasks/spatial_pointing.js');
const transcription = read('js/tasks/osr_transcription.js');
const playwright = read('playwright.config.js');

assert.ok(numberSpan.includes('player: null'));
assert.ok(numberSpan.includes('playDigit(index + 1)'));
assert.ok(numberSpan.includes('lastPlaybackError'));
assert.ok(!numberSpan.includes('var el = new Audio(url)'));

assert.ok(utils.indexOf("'audio/mp4'") < utils.indexOf("'audio/webm;codecs=opus'"));
assert.ok(utils.includes('createAudioRecorder'));
assert.ok(utils.includes("'application/octet-stream'"));
assert.ok(story.includes('createAudioRecorder(stream)'));
assert.ok(animal.includes('createAudioRecorder(stream)'));
assert.ok(naming.includes('createAudioRecorder(stream)'));
assert.ok(naming.includes('microphone_failure_reason'));

assert.ok(pointing.includes("canvas.addEventListener('pointerup'"));
assert.ok(pointing.includes("canvas.style.touchAction = 'none'"));
assert.ok(transcription.includes('window.webkitOfflineAudioContext'));
assert.ok(main.includes('window.visualViewport'));
assert.ok(main.includes("document.addEventListener('visibilitychange'"));
assert.ok(main.includes("window.addEventListener('pagehide'"));
assert.ok(main.includes("navigator.wakeLock.request('screen')"));
assert.ok(main.includes('navigator.storage.persist()'));
assert.ok(main.includes('document.webkitFullscreenElement'));

assert.ok(playwright.includes("name: 'Desktop Chrome'"));
assert.ok(playwright.includes("name: 'Desktop Safari'"));
assert.ok(playwright.includes("name: 'iPad Pro 11'"));

console.log('iPad and cross-browser compatibility checks passed.');
