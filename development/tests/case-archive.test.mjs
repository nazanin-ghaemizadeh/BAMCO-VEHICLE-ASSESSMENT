import {test} from 'node:test';
import assert from 'node:assert/strict';
import {archiveLegacyCase,readLegacyArchive,LEGACY_KEYS} from '../case-archive.mjs';
function storage(){const map=new Map(); return {getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v))};}
test('archive preserves original exact bytes, roles and weights',()=>{
 const s=storage();s.setItem(LEGACY_KEYS[0],'{"scores":{"1":7}}');s.setItem(LEGACY_KEYS[1],'{"1":0.2}');
 const k=archiveLegacyCase(s,'case1','2026-01-01');assert.equal(k,'bamco-case-archive:case1');
 const archive=readLegacyArchive(s,'case1');assert.equal(archive.entries[LEGACY_KEYS[0]],s.getItem(LEGACY_KEYS[0]));assert.equal(archive.entries[LEGACY_KEYS[1]],s.getItem(LEGACY_KEYS[1]));
 assert.throws(()=>archiveLegacyCase(s,'case1'));
});
test('quota error and empty case do not alter existing data',()=>{
 const s=storage();assert.equal(archiveLegacyCase(s,'empty'),null);s.setItem(LEGACY_KEYS[0],'existing');
 s.setItem=()=>{throw new Error('quota')};assert.throws(()=>archiveLegacyCase(s,'case2'));assert.equal(s.getItem(LEGACY_KEYS[0]),'existing');
});
