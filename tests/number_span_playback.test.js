'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'tasks', 'number_span.js'), 'utf8');
let audioInstances = 0;

class FakeAudio {
  constructor() {
    audioInstances += 1;
    this.listeners = {};
    this.src = '';
    this.currentTime = 0;
  }
  addEventListener(type, listener) { this.listeners[type] = listener; }
  removeEventListener(type, listener) {
    if (this.listeners[type] === listener) delete this.listeners[type];
  }
  pause() {}
  load() {}
  play() {
    setTimeout(() => {
      const playing = this.listeners.playing;
      if (playing) {
        delete this.listeners.playing;
        playing();
      }
      setTimeout(() => {
        const ended = this.listeners.ended;
        if (ended) {
          delete this.listeners.ended;
          ended();
        }
      }, 5);
    }, 5);
    return Promise.resolve();
  }
  removeAttribute(name) { if (name === 'src') this.src = ''; }
}

const window = { PILOT_MODE: false, BatteryLanguage: { get: () => 'en' } };
const context = { window, Audio: FakeAudio, performance, setTimeout, clearTimeout, URL };
vm.createContext(context);
vm.runInContext(source, context);

window.NSState.digitBlobUrls = { 1: 'blob:one', 2: 'blob:two' };

(async () => {
  await window.NSPlaybackDiagnostics.playSequence([1, 2]);
  assert.equal(audioInstances, 1, 'the whole sequence must reuse one media element');
  assert.equal(window.NSState.playbackOnsets.length, 2);
  assert.equal(window.NSState.playbackOnsets[0].onset_source, 'playing_event');
  assert.equal(window.NSState.playbackOnsets[1].onset_source, 'playing_event');
  assert.ok(window.NSState.playbackOnsets[1].observed_onset_ms - window.NSState.playbackOnsets[0].observed_onset_ms >= 900,
    'actual digit onsets must remain approximately one second apart');
  assert.equal(window.NSPlaybackDiagnostics.lastError(), null);
  console.log('number span sequential playback checks passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
