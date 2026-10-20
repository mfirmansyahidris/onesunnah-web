import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';

writeFileSync(new URL('../.cache/workspace-language-tests/package.json',import.meta.url),'{"type":"commonjs"}\n');
const require=createRequire(import.meta.url);
const {workspaceTranslations,workspaceLanguage,workspaceLanguageKey,workspaceText}=require('../.cache/workspace-language-tests/workspace-copy.js');
const {languages,isRtl}=require('../.cache/workspace-language-tests/data.js');
const placeholders=text=>[...text.matchAll(/\{(\w+)\}/g)].map(match=>match[1]).sort();

for(const [english,translations] of Object.entries(workspaceTranslations)){
  assert.equal(translations.length,4,`Missing language: ${english}`);
  for(const translated of translations){
    assert.ok(translated.trim(),`Empty translation: ${english}`);
    assert.deepEqual(placeholders(translated),placeholders(english),`Changed placeholders: ${english}`);
  }
}
assert.equal(workspaceLanguageKey,'one-sunnah-workspace-language');
for(const {code} of languages){
  assert.equal(workspaceLanguage(code),code,'Valid saved preferences must survive a reload');
  assert.ok(workspaceText(code,'Overview'));
  assert.equal(workspaceText(code,'{shown} of {total} records',{shown:100,total:1000}).includes('{'),false);
  assert.ok(workspaceText(code,'{email} now has editor access.',{email:'editor@example.com'}).includes('editor@example.com'));
  const source='Sahih al-Bukhari 13';
  assert.equal(workspaceText(code,source),source,'Source references must never be rewritten');
}
for(const invalid of [null,'','fr','constructor','EN'])assert.equal(workspaceLanguage(invalid),'en');
assert.equal(workspaceText('en','Published'),'Published');
assert.equal(workspaceText('id','Published'),'Terbit');
assert.equal(workspaceText('ms','Published'),'Diterbitkan');
assert.equal(workspaceText('ar','Published'),'منشور');
assert.equal(workspaceText('ur','Published'),'شائع شدہ');
assert.equal(isRtl('ar'),true);assert.equal(isRtl('ur'),true);
assert.equal(isRtl('id'),false);
assert.equal(workspaceText('id','Unknown source label'),'Unknown source label');
assert.equal(workspaceText('id','{shown} of {total} records',{shown:100}),'100 dari {total} rekaman');
console.log(`Workspace language passed: ${Object.keys(workspaceTranslations).length} messages in five languages, saved preferences, interpolation, English fallback, and unchanged source labels.`);
