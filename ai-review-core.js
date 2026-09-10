/* Shared, dependency-free request/response contract. Never includes login choices or media. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BamcoAIReview=api})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  const object=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
  const string={type:'string'},strings={type:'array',items:string};
  const schema=object({
    summary:string,limitations:strings,
    findings:{type:'array',items:object({
      criterionId:string,itemIds:strings,priority:{type:'string',enum:['critical','high','medium','low']},
      evidence:string,possibleCauses:strings,
      tests:{type:'array',items:object({name:string,purpose:string,method:string,acceptanceBasis:string})},
      correctiveActions:strings,retestCriteria:string
    })}
  });
  function cleanText(value,max=4000){if(typeof value!=='string'||value.length>max)throw new Error('invalid_payload');return value}
  function number(value,min,max){if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw new Error('invalid_payload');return value}
  function validatePayload(input){
    if(!input||input.version!==1||!['fa','en'].includes(input.language)||!Array.isArray(input.criteria)||!input.criteria.length||input.criteria.length>30)throw new Error('invalid_payload');
    const vehicle={};for(const key of ['brand','model','date','odometer'])vehicle[key]=cleanText(input.vehicle?.[key]||'',200);
    const seen=new Set();let total=0,completed=0;
    const criteria=input.criteria.map(group=>{
      const id=cleanText(group.id,60);if(seen.has(id)||!Array.isArray(group.items)||group.items.length>100)throw new Error('invalid_payload');seen.add(id);
      const items=group.items.map(item=>{
        const itemId=cleanText(item.id,100);if(seen.has(itemId)||++total>500)throw new Error('invalid_payload');seen.add(itemId);
        const score=item.score===null?null:number(item.score,1,10);if(score!==null){if(!Number.isInteger(score))throw new Error('invalid_payload');completed++}
        return {id:itemId,title:cleanText(item.title,500),instructions:cleanText(item.instructions||'',5000),score,note:cleanText(item.note||'',5000)};
      });
      return {id,title:cleanText(group.title,500),weight:number(group.weight,0,1),items};
    });
    if(!completed)throw new Error('empty_assessment');
    return {version:1,language:input.language,vehicle,finalScore:input.finalScore===null?null:number(input.finalScore,0,100),completed,total,criteria,comments:{evaluator:cleanText(input.comments?.evaluator||'',12000),expert:cleanText(input.comments?.expert||'',12000)}};
  }
  function validateReport(report,payload){
    cleanText(report?.summary,16000);
    const list=(value,max=40)=>{if(!Array.isArray(value)||value.length>max)throw new Error('invalid_response');return value};
    list(report.limitations).forEach(v=>cleanText(v,8000));
    list(report.findings,60).forEach(finding=>{
      const group=payload.criteria.find(group=>group.id===finding.criterionId);
      if(!group||!['critical','high','medium','low'].includes(finding.priority))throw new Error('invalid_response');
      if(!list(finding.itemIds,100).length||finding.itemIds.some(id=>!group.items.some(item=>item.id===id)))throw new Error('invalid_response');
      cleanText(finding.evidence,8000);cleanText(finding.retestCriteria,8000);
      for(const key of ['possibleCauses','correctiveActions'])list(finding[key]).forEach(v=>cleanText(v,8000));
      list(finding.tests,20).forEach(test=>{for(const key of ['name','purpose','method','acceptanceBasis'])cleanText(test[key],8000)});
    });
    return report;
  }
  return {schema,validatePayload,validateReport};
});
