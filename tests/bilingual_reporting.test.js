'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const main = read('js/main.js');
assert.ok(main.includes("languageFlagSvg('us')"));
assert.ok(main.includes("languageFlagSvg('de')"));
assert.ok(main.includes('class="language-flag"'));
assert.ok(main.includes('showLanguageReloadMask(selected)'));
assert.ok(main.includes('Loading assessment…'));
assert.ok(main.includes('Test wird geladen…'));
const language = read('js/language.js');
const story = read('js/tasks/original_story_recall.js');
const span = read('js/tasks/number_span.js');
const worker = read('js/tasks/osr_transcription_worker.js');
const trails = read('js/tasks/visual_sequencing_set_shifting.js');

assert.ok(html.indexOf('js/language.js') < html.indexOf('js/utils.js'));
assert.ok(html.indexOf('js/reporting.js') > html.indexOf('js/utils.js'));
assert.ok(language.includes("SUPPORTED = ['en', 'de']"));
assert.ok(language.includes('translated_unvalidated'));
assert.ok(language.includes('story_form_version'));
assert.ok(story.includes('osr44-library-wallet-a-de-1.0'));
assert.ok(story.includes('OSR_IS_GERMAN'));
assert.ok(story.includes('osr44_library_wallet_a_de_v2.wav'));
assert.ok(span.includes("'ons_forward_instruction_de_v2.wav'"));
assert.ok(span.includes("'_de_v2.wav'"));
assert.ok(!story.includes('SpeechSynthesisUtterance'));
assert.ok(!span.includes('SpeechSynthesisUtterance'));
assert.ok(!span.includes('if (NS_IS_GERMAN) return Promise.resolve()'));
assert.ok(worker.includes("ASR_ENGLISH_MODEL_ID = 'Xenova/whisper-small.en'"));
assert.ok(worker.includes("ASR_MULTILINGUAL_MODEL_ID = 'Xenova/whisper-small'"));
assert.ok(worker.includes("if (message.language === 'de')"));
assert.ok(worker.includes("generationOptions.language = 'german'"));
assert.ok(!worker.includes("language: message.language === 'de' ? 'german' : 'english'"));

assert.ok(trails.includes("'ABCDEFGHIJKL'.split('')"), 'Trail B must use letters A-L');
assert.ok(trails.includes("out.push('13')"), 'Trail B must end at 13');
assert.ok(trails.includes('trailaLimitMs: 150000'));
assert.ok(trails.includes('trailbLimitMs: 300000'));

const timelineStart = main.indexOf('var timeline = welcomeTrials.concat([');
const timeline = main.slice(timelineStart, main.indexOf(']);', timelineStart));
assert.ok(timeline.lastIndexOf('vsTimeline') > timeline.lastIndexOf('spTimeline'), 'Trail A/B must be last');
assert.ok(timeline.indexOf('osrBeforeOvn') < timeline.indexOf('ovnTimeline'));
assert.ok(timeline.indexOf('ocfBeforeOvn') < timeline.indexOf('ovnTimeline'));
assert.ok(timeline.indexOf('osrDelayedFinal') < timeline.indexOf('ocfDelayedFinal'));
assert.ok(main.includes("eti_core: ['osr', 'asf', 'ovn', 'ocf', 'ns']"));
assert.ok(main.includes("additional: ['olm', 'sp', 'vs']"));
assert.ok(main.includes("finish('custom', tasks)"));

console.log('bilingual_reporting.test.js: all assertions passed');
