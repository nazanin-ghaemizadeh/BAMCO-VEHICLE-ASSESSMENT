/* Shared, dependency-free request/response contract for the technical AI review. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BamcoAIReview=api})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  const string={type:'string'};
  const schema={
    type:'object',
    properties:{
      suggestions:{
        type:'array',minItems:5,maxItems:5,
        items:{
          type:'object',additionalProperties:false,
          properties:{
            improvementOpportunity:string,
            linkedResultsReasoning:string,
            probableCauses:{type:'array',minItems:1,maxItems:2,items:string},
            diagnosticTest:string,
            correctiveActionIfConfirmed:string
          },
          required:['improvementOpportunity','linkedResultsReasoning','probableCauses','diagnosticTest','correctiveActionIfConfirmed']
        }
      }
    },
    required:['suggestions'],
    additionalProperties:false
  };

  function cleanText(value,max=5000){
    if(value==null)return'';
    if(typeof value!=='string'||value.length>max)throw new Error('invalid_payload');
    return value.trim();
  }
  function validatePayload(input){
    if(!input||input.version!==1||input.source!=='BAMCO_EVALUATOR_EXCEL_DETAILS'||!Array.isArray(input.rows)||!input.rows.length||input.rows.length>500)throw new Error('invalid_payload');
    const vehicle={};for(const key of ['brand','model','date','odometer'])vehicle[key]=cleanText(input.vehicle?.[key]||'',200);
    let answered=0;
    const rows=input.rows.map(row=>{
      const score=row.score==null||row.score===''?null:Number(row.score);
      if(score!==null&&(!Number.isInteger(score)||score<1||score>10))throw new Error('invalid_payload');
      if(score!==null)answered++;
      return {
        criterionCode:cleanText(row.criterionCode||'',40),
        criterion:cleanText(row.criterion||'',300),
        subcriterionCode:cleanText(row.subcriterionCode||'',40),
        subcriterion:cleanText(row.subcriterion||'',500),
        itemCode:cleanText(row.itemCode||'',60),
        item:cleanText(row.item||'',700),
        score,
        evaluatorNote:cleanText(row.evaluatorNote||'',5000),
        evidenceCount:Math.max(0,Math.min(50,Number(row.evidenceCount)||0))
      };
    });
    if(!answered)throw new Error('empty_assessment');
    return {version:1,source:input.source,vehicle,evaluatorFinalComment:cleanText(input.evaluatorFinalComment||'',12000),rows,answeredRows:answered,totalRows:rows.length};
  }
  function validateReport(report){
    if(!report||!Array.isArray(report.suggestions)||report.suggestions.length!==5)throw new Error('invalid_response');
    report.suggestions.forEach(item=>{
      for(const key of ['improvementOpportunity','linkedResultsReasoning','diagnosticTest','correctiveActionIfConfirmed'])if(!cleanText(item?.[key],12000))throw new Error('invalid_response');
      if(!Array.isArray(item.probableCauses)||item.probableCauses.length<1||item.probableCauses.length>2)item.probableCauses&&(()=>{throw new Error('invalid_response')})();
      item.probableCauses.forEach(v=>{if(!cleanText(v,8000))throw new Error('invalid_response')});
    });
    return report;
  }
  return {schema,validatePayload,validateReport};
});
