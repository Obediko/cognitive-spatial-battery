'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const languageContext = {
  window: {},
  sessionStorage: {
    value: 'de',
    getItem() { return this.value; },
    setItem(key, value) { this.value = value; }
  },
  document: { documentElement: {} },
  Set
};
vm.createContext(languageContext);
vm.runInContext(read('js/language.js'), languageContext);
vm.runInContext(read('js/task_language_data.js'), languageContext);

const naming = languageContext.window.BatteryLexicons.naming;
const cup = naming.forItem('cup', 'cup', ['mug']);
const key = naming.forItem('key', 'key', []);
assert.equal(cup.target, 'Tasse');
assert.match(cup.semanticCue, /Gefäß zum Trinken/);
assert.equal(cup.phonemicCue, 'Ta');
assert.equal(key.target, 'Schlüssel');
assert.equal(key.phonemicCue, 'Schlü');
assert.ok(!cup.semanticCue.includes('container used for drinking'));

const visualNaming = read('js/tasks/original_visual_naming.js');
const trails = read('js/tasks/visual_sequencing_set_shifting.js');
assert.ok(visualNaming.includes('Bild wird vorbereitet…'));
assert.ok(visualNaming.includes('Antworten zum visuellen Benennen wurden gespeichert'));
assert.ok(visualNaming.includes('Aufnahme transkribieren'));
assert.ok(visualNaming.includes('languageNames.semanticCue || row[3]'));
assert.ok(visualNaming.includes('languageNames.phonemicCue || row[4]'));
assert.ok(trails.includes('Während der Übung wird eine Rückmeldung angezeigt.'));
assert.ok(trails.includes('Falsches Ziel – fahren Sie bei'));

const manifest = JSON.parse(read('assets/audio/german_audio_manifest.json'));
assert.equal(manifest.status, 'v2_full_set_native_speaker_review_completed');
assert.match(manifest.researcher_listening_review, /full German native-speaker listening evaluation/);

console.log('German parity checks passed.');
