import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {contentLanguage,referenceFor,validate} from '../.cache/content-policy-tests/data.js';

const candidates=JSON.parse(readFileSync(new URL('../data/android-daily-1000/candidates.json',import.meta.url),'utf8'));
const original=JSON.stringify(candidates);
let fallbacks=0;
for(const draft of candidates){
  assert.equal(validate(draft),null);
  assert.equal(validate({...draft,status:'Published',reviewed:true}),null);
  assert.notEqual(validate({...draft,status:'Published',reviewed:false}),null);
  assert.notEqual(validate({...draft,texts:{...draft.texts,en:''}}),null);
  if(!draft.texts.ms){
    fallbacks++;
    assert.equal(contentLanguage(draft,'ms'),'en');
    assert.deepEqual(referenceFor(draft,'ms'),draft.references.en);
    assert.equal(draft.explanations[contentLanguage(draft,'ms')],draft.explanations.en);
  }else{
    assert.equal(contentLanguage(draft,'ms'),'ms');
    assert.deepEqual(referenceFor(draft,'ms'),draft.references.ms);
  }
}
assert.equal(candidates.length,1000);
assert.equal(fallbacks,853);
assert.equal(JSON.stringify(candidates),original,'Display fallback must never fill the missing source translations');
const sample=candidates[0];
assert.notEqual(validate({...sample,status:'Published',reviewed:true,url:'javascript:alert(1)'}),null);
assert.notEqual(validate({...sample,status:'Published',reviewed:true,source:''}),null);
const stale={...sample,texts:{...sample.texts,ms:' '},references:{...sample.references,ms:{label:'Old Malay link',url:'https://example.com/ms'}}};
assert.deepEqual(referenceFor(stale,'ms'),sample.references.en);
console.log('Content policy passed: 1,000 sourced records, 853 explicit English fallbacks, unchanged source fields, and publication gates.');
