'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const main = read('js/main.js');
const language = read('js/language.js');
const story = read('js/tasks/original_story_recall.js');
const span = read('js/tasks/number_span.js');
const worker = read('js/tasks/osr_transcription_worker.js');
const trails = read('js/tasks/visual_sequencing_set_shifting.js');

assert.ok(html.indexOf('js/language.js') < html.indexOf('js/utils.js'));
assert.ok(html.indexOf('js/reporting.js') > html.indexOf('js/utils.js'));
assert.ok(language.includes("SUPPORTED = ['en', 'de']"));
assert.ok(language.includes('pilot_unvalidated'));
assert.ok(language.includes('story_form_version'));
assert.ok(story.includes('osr44-library-wallet-a-de-0.1-pilot'));
assert.ok(story.includes('OSR_IS_GERMAN'));
assert.ok(span.includes('German recordings are not yet validated or bundled'));
assert.ok(worker.includes("message.language === 'de' ? 'german' : 'english'"));

assert.ok(trails.includes("'ABCDEFGHIJKL'.split('')"), 'Trail B must use letters A-L');
assert.ok(trails.includes("out.push('13')"), 'Trail B must end at 13');
assert.ok(trails.includes('trailaLimitMs: 150000'));
assert.ok(trails.includes('trailbLimitMs: 300000'));

const timelineStart = main.indexOf('var timeline = welcomeTrials.concat([');
const timeline = main.slice(timelineStart, main.indexOf(']);', timelineStart));
assert.ok(timeline.lastIndexOf('vsTimeline') > timeline.lastIndexOf('spTimeline'), 'Trail A/B must be last');
assert.ok(timeline.indexOf('ocfDelayedTimeline') < timeline.indexOf('osrDelayedTimeline'));

console.log('bilingual_reporting.test.js: all assertions passed');
