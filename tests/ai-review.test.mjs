import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {createHandler} from '../server/ai-review.mjs';
import core from '../ai-review-core.js';

const origin='https://nazanin-ghaemizadeh.github.io';
const env={OPENAI_API_KEY:'mock-provider-key',OPENAI_MODEL:'configured-model',BAMCO_AI_ACCESS_TOKEN:'test-access-token-with-at-least-32-characters',BAMCO_ALLOWED_ORIGINS:origin};
const payload={version:1,language:'fa',vehicle:{brand:'BAMCO',model:'TEST',date:'2026-09-10',odometer:'100'},finalScore:20,criteria:[{id:'1',title:'ایمنی',weight:1,items:[{id:'1/1.1/1.1.1',title:'ترمز',instructions:'ثبت مشاهده',score:2,note:'هشدار ثبت شده است'},{id:'1/1.1/1.1.2',title:'پایداری',score:null,note:''}]}],comments:{evaluator:'بررسی شود',expert:''}};
const report={summary:'بررسی پیشنهادی',limitations:['اندازه‌گیری موجود نیست'],findings:[{criterionId:'1',itemIds:['1/1.1/1.1.1'],priority:'high',evidence:'امتیاز ۲',possibleCauses:['نیاز به تشخیص'],tests:[{name:'بررسی تخصصی',purpose:'تشخیص',method:'مرکز آزمون مجاز',acceptanceBasis:'مشخصات تأییدشده سازنده'}],correctiveActions:['رفع علت پس از تأیید'],retestCriteria:'بازآزمون تخصصی'}]};
const provider=async()=>new Response(JSON.stringify({status:'completed',model:'configured-model',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(report)}]}]}),{status:200});
async function service(t,config=env,call=provider){
  const server=createServer(createHandler(config,call));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>{server.closeAllConnections();return new Promise(resolve=>server.close(resolve))});
  return (body=payload,headers={},method='POST')=>fetch(`http://127.0.0.1:${server.address().port}/api/technical-review`,{method,headers:{Origin:origin,'Content-Type':'application/json',Authorization:`Bearer ${env.BAMCO_AI_ACCESS_TOKEN}`,...headers},...(method==='POST'?{body:JSON.stringify(body)}:{})});
}
test('preserves scores and nulls while excluding choices, media, contacts and identity',()=>{
  const source=structuredClone(payload);source.entryChoices={referenceOne:'S5'};source.attachments=['photo'];source.vehicle.email='private@example.test';source.comments.manager='not sent';
  const before=JSON.stringify(source),clean=core.validatePayload(source);
  assert.equal(JSON.stringify(source),before);assert.equal(clean.completed,1);assert.equal(clean.total,2);assert.equal(clean.criteria[0].items[1].score,null);
  assert.ok(!JSON.stringify(clean).includes('private@example'));assert.ok(!JSON.stringify(clean).includes('referenceOne'));assert.ok(!('attachments'in clean));assert.ok(!('manager'in clean.comments));
});
test('rejects empty, out-of-range and duplicate assessment items',()=>{
  const empty=structuredClone(payload);empty.criteria[0].items[0].score=null;assert.throws(()=>core.validatePayload(empty),/empty_assessment/);
  const bad=structuredClone(payload);bad.criteria[0].items[0].score=11;assert.throws(()=>core.validatePayload(bad));
  bad.criteria[0].items[0].score=1;bad.criteria[0].items[1].id=bad.criteria[0].items[0].id;assert.throws(()=>core.validatePayload(bad));
});
test('accepts the full existing checklist including an unanswered item in each criterion',async()=>{
  const context={window:{}};vm.runInNewContext(await readFile(new URL('../scripts-1.js',import.meta.url),'utf8'),context);
  const criteria=context.window.ASSESSMENT_CRITERIA.map(main=>({id:main.id,title:main.titleFa,weight:1/15,items:main.subgroups.flatMap(sub=>sub.items.map((item,index)=>({id:`${main.id}/${sub.id}/${item.id}`,title:item.titleFa,instructions:item.textFa||'',note:'',score:index?7:null})))}));
  const clean=core.validatePayload({...payload,criteria});assert.equal(clean.criteria.length,15);assert.ok(clean.completed>0);assert.ok(clean.total>clean.completed);
});
test('authenticates before calling provider and blocks other origins',async t=>{
  let calls=0;const send=await service(t,env,async()=>{calls++;return provider()});
  assert.equal((await send(payload,{Authorization:'Bearer wrong'})).status,401);
  assert.equal((await send(payload,{Origin:'https://other.example'})).status,403);assert.equal(calls,0);
  assert.equal((await send(undefined,{},'OPTIONS')).status,204);
});
test('fails clearly when the real connection is not configured',async t=>{
  let calls=0;const send=await service(t,{},async()=>{calls++;return provider()});
  const response=await send();assert.equal(response.status,503);assert.equal((await response.json()).error,'not_configured');assert.equal(calls,0);
});
test('sends real contract to Responses and returns verified evidence-linked report',async t=>{
  let sent;const send=await service(t,env,async(url,options)=>{assert.equal(url,'https://api.openai.com/v1/responses');sent=JSON.parse(options.body);return provider()});
  const response=await send();assert.equal(response.status,200);const data=await response.json();assert.deepEqual(data.report,report);
  assert.equal(sent.store,false);assert.equal(sent.text.format.strict,true);assert.equal(sent.model,env.OPENAI_MODEL);assert.equal(JSON.parse(sent.input).completed,1);
  assert.ok(!JSON.stringify(data).includes(env.OPENAI_API_KEY));assert.equal(response.headers.get('access-control-allow-origin'),origin);
});
test('rejects invented evidence references and invalid output',()=>{
  const invalid=structuredClone(report);invalid.findings[0].itemIds=['invented'];assert.throws(()=>core.validateReport(invalid,payload));
  assert.throws(()=>core.validateReport({summary:'empty'},payload));
});
test('does not present provider failure, refusal or incomplete output as a report',async t=>{
  for(const [body,status,expected] of [[{error:{message:'private upstream detail'}},500,'provider_error'],[{status:'incomplete'},200,'incomplete_response'],[{status:'completed',output:[{content:[{type:'refusal',refusal:'no'}]}]},200,'review_refused']]){
    const send=await service(t,env,async()=>new Response(JSON.stringify(body),{status}));const response=await send();const data=await response.json();assert.equal(data.error,expected);assert.ok(!data.report);assert.ok(!JSON.stringify(data).includes('private upstream'));
  }
});
test('limits authenticated calls and rejects oversized payloads before provider calls',async t=>{
  let calls=0;const send=await service(t,env,async()=>{calls++;return provider()});
  assert.equal((await send({...payload,oversize:'x'.repeat(600000)})).status,413);assert.equal(calls,0);
  for(let i=0;i<6;i++)assert.equal((await send()).status,200);
  assert.equal((await send()).status,429);assert.equal(calls,6);
});
