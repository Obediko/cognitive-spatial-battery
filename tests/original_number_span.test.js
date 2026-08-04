'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const source = fs.readFileSync('js/tasks/original_number_span.js','utf8');
const context = { window: { PILOT_MODE: false } };
vm.createContext(context);
vm.runInContext(source, context);
const scoring = context.window.ONSScoring;
assert.strictEqual(scoring.expectedResponse({digits:[4,9,2]},'forward'),'492');
assert.strictEqual(scoring.expectedResponse({digits:[4,9,2]},'backward'),'294');
const sample=[
 {span:3,correct:true,administered:true},{span:3,correct:false,administered:true},
 {span:4,correct:false,administered:true},{span:4,correct:false,administered:true}
];
const result=scoring.scoreCondition(sample);
assert.strictEqual(result.totalCorrect,1);
assert.strictEqual(result.longestSpan,3);
assert.strictEqual(result.discontinuedAtSpan,4);
for (const condition of ['forward','backward']) {
 const items=scoring.sequences[condition];
 const spans=[...new Set(items.map(x=>x.span))];
 spans.forEach(span=>assert.strictEqual(items.filter(x=>x.span===span).length,2));
 items.forEach(item=>{
   assert.strictEqual(item.digits.length,item.span);
   assert.strictEqual(new Set(item.digits).size,item.digits.length);
   for(let i=1;i<item.digits.length;i++) assert.notStrictEqual(item.digits[i],item.digits[i-1]);
 });
}
console.log('Original Number Span scoring and sequence checks passed.');
