'use strict';
const assert = require('assert');
const fs = require('fs');
const index = fs.readFileSync('index.html','utf8');
const main = fs.readFileSync('js/main.js','utf8');
const utils = fs.readFileSync('js/utils.js','utf8');
const contract = fs.readFileSync('docs/eti-core/eight_score_contract.md','utf8');
const scoreKeys = [
 'osr_immediate_verbatim','osr_delayed_verbatim','asf_total_valid_unique',
 'ovn_total_with_semantic','ocf_copy_score','ocf_delayed_score',
 'ons_forward_total_correct','ons_backward_total_correct'
];
scoreKeys.forEach(key=>{
 assert.ok(utils.includes(key),'summary export missing '+key);
 assert.ok(contract.includes(key),'score contract missing '+key);
});
[
 'original_story_recall.js','animal_semantic_fluency.js','original_visual_naming.js',
 'original_complex_figure.js','original_number_span.js'
].forEach(script=>assert.ok(index.includes(script),'index missing '+script));
[
 'buildOSRImmediateTimeline','buildOSRDelayedTimeline','buildAnimalFluencyTimeline',
 'buildOriginalVisualNamingTimeline','buildOCFImmediateTimeline',
 'buildOCFDelayedTimeline','buildOriginalNumberSpanTimeline'
].forEach(builder=>assert.ok(main.includes(builder),'main missing '+builder));
['osr','asf','ovn','ocf','ons'].forEach(route=>assert.ok(main.includes("finish('"+route+"')"),'menu missing '+route));
assert.strictEqual(new Set(scoreKeys).size,8);
console.log('ETI core eight-score contract checks passed.');
