(()=>{
  'use strict';
  if(!/\/manager\.html$/.test(location.pathname))return;

  const ENDPOINT='https://cwpfzvcwuiawjtvsnpkq.supabase.co/functions/v1/vehicle-technical-review';
  let lastReport=null;

  const card=document.createElement('section');
  card.id='aiTechnicalReview';
  card.className='card managerOnly aiTechnicalReview';
  card.innerHTML=`
    <div class="sectionTitle"><div><h2 id="aiDemoTitle"></h2><p id="aiDemoHint"></p></div></div>
    <div class="comparisonEntryCopy aiDemoEntry">
      <picture><source media="(prefers-reduced-motion: reduce)" srcset="assets/ai-vehicle-still.png"><img src="assets/ai-vehicle-walk.gif" width="480" height="321" alt="" loading="lazy"></picture>
      <button id="aiReviewStart" type="button"></button>
    </div>
    <p id="aiReviewStatus" class="aiReviewStatus" role="status" aria-live="polite"></p>
    <div id="aiReviewResult" class="aiReviewResult" hidden></div>`;
  document.querySelector('#managerReviewComments')?.insertAdjacentElement('afterend',card);

  const button=card.querySelector('#aiReviewStart');
  const status=card.querySelector('#aiReviewStatus');
  const result=card.querySelector('#aiReviewResult');
  const fa=()=>document.documentElement.lang!=='en';
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const compact=value=>String(value??'').replace(/\s+/g,' ').trim();

  function translate(){
    const isFa=fa();
    card.querySelector('#aiDemoTitle').textContent=isFa?'بررسی فنی با هوش مصنوعی':'AI Technical Review';
    card.querySelector('#aiDemoHint').textContent=isFa?'تحلیل فقط پاسخ‌های ثبت‌شده پنل ارزیاب؛ بدون وزن‌ها':'Analysis of answered Evaluator items only; weights are excluded';
    button.textContent=button.disabled?(isFa?'در حال تحلیل…':'Analyzing…'):(isFa?'بررسی فنی':'Technical Review');
    if(lastReport)renderReport(lastReport);
  }

  function buildAnsweredEvaluatorPayload(){
    if(typeof state==='undefined'||!state||!Array.isArray(window.ASSESSMENT_CRITERIA))throw new Error('assessment_unavailable');
    const criteria=[];
    window.ASSESSMENT_CRITERIA.forEach(main=>{
      const subgroups=[];
      (main.subgroups||[]).forEach(sub=>{
        const items=[];
        (sub.items||[]).forEach(item=>{
          const key=`${main.id}/${sub.id}/${item.id}`;
          const raw=state.scores?.[key];
          const score=raw===undefined||raw===null||raw===''?null:Number(raw);
          if(!Number.isInteger(score))return;
          items.push({
            id:String(item.id),
            title:compact(item.titleFa),
            instructions:compact(item.textFa||''),
            score,
            evaluatorNote:compact(state.notes?.[key]||'')
          });
        });
        if(items.length)subgroups.push({id:String(sub.id),title:compact(sub.titleFa),items});
      });
      if(subgroups.length)criteria.push({id:String(main.id),title:compact(main.titleFa),subgroups});
    });
    const evaluatorCommentInput=document.querySelector('[data-final-comment="evaluator"]');
    return {
      version:3,
      source:'BAMCO_EVALUATOR_PANEL_ANSWERED',
      vehicle:{brand:compact(state.metadata?.brand||''),model:compact(state.metadata?.model||''),odometer:compact(state.metadata?.odometer||'')},
      evaluatorFinalComment:compact(evaluatorCommentInput?.value??state.finalComments?.evaluator??''),
      criteria
    };
  }

  function hasScores(payload){return payload.criteria.some(main=>main.subgroups.some(sub=>sub.items.length));}
  function setStatus(message,kind='neutral'){status.textContent=message;status.className=`aiReviewStatus ${kind}`;}

  function renderReport(report){
    if(!report?.suggestions||report.suggestions.length!==5)return;
    const heads=fa()
      ?['ردیف','فرصت اصلی بهبود','ارتباط نتایج و استدلال مهندسی','علت‌های محتمل','آزمون تشخیصی پیشنهادی','اصلاح پیشنهادی در صورت تأیید']
      :['No.','Main improvement opportunity','Linked-results engineering reasoning','Probable causes','Recommended diagnostic test','Corrective action if confirmed'];
    result.innerHTML=`<div class="aiReviewTableWrap"><table class="aiReviewTable"><thead><tr>${heads.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${report.suggestions.map((item,index)=>`<tr><td>${index+1}</td><td>${esc(item.improvementOpportunity)}</td><td>${esc(item.linkedResultsReasoning)}</td><td><ul>${item.probableCauses.map(cause=>`<li>${esc(cause)}</li>`).join('')}</ul></td><td>${esc(item.diagnosticTest)}</td><td>${esc(item.correctiveActionIfConfirmed)}</td></tr>`).join('')}</tbody></table></div>`;
    result.hidden=false;
  }

  function messageForError(data,httpStatus){
    const isFa=fa(),code=String(data?.openaiCode||'');
    if(data?.error==='openai_key_missing')return isFa?'کلید OpenAI در Supabase پیدا نشد.':'OpenAI key was not found in Supabase.';
    if(data?.error==='empty_assessment')return isFa?'هنوز پاسخی برای تحلیل ثبت نشده است.':'No answered assessment items are available yet.';
    if(data?.error==='payload_too_large')return isFa?'حجم داده پاسخ‌داده‌شده بیش از حد مجاز است.':'The answered-item payload is too large.';
    if(data?.error==='openai_timeout')return isFa?'پاسخ هوش مصنوعی بیش از حد طول کشید؛ دوباره تلاش کنید.':'The AI request timed out. Please try again.';
    if(data?.error==='openai_request_failed'&&data?.status===401)return isFa?'کلید OpenAI معتبر نیست یا لغو شده است.':'The OpenAI key is invalid or revoked.';
    if(code==='insufficient_quota')return isFa?'اعتبار یا سهمیه API OpenAI کافی نیست. Billing و Limits را بررسی کنید.':'OpenAI API credit or quota is insufficient. Check Billing and Limits.';
    if(httpStatus===429||data?.status===429)return isFa?'OpenAI درخواست را با محدودیت 429 رد کرد. Billing و Limits را بررسی کنید.':'OpenAI rejected the request with 429. Check Billing and Limits.';
    return isFa?'تحلیل فنی انجام نشد. دوباره تلاش کنید.':'Technical review failed. Please try again.';
  }

  async function runReview(){
    if(button.disabled)return;
    let payload;
    try{payload=buildAnsweredEvaluatorPayload();if(!hasScores(payload))throw new Error('empty_assessment');}
    catch(err){setStatus(err?.message==='empty_assessment'?(fa()?'هنوز پاسخی برای تحلیل ثبت نشده است.':'No answered assessment items are available yet.'):(fa()?'داده پنل ارزیاب در دسترس نیست.':'Evaluator panel data is unavailable.'),'error');return;}

    button.disabled=true;lastReport=null;result.hidden=true;result.innerHTML='';
    setStatus(fa()?'در حال تحلیل پاسخ‌های ثبت‌شده و استخراج ۵ پیشنهاد فنی…':'Analyzing answered items and generating five technical recommendations…','loading');
    translate();
    try{
      const response=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      let data=null;try{data=await response.json()}catch(_){ }
      if(!response.ok||!data?.ok||!data?.report)throw Object.assign(new Error('request_failed'),{data,status:response.status});
      lastReport=data.report;renderReport(lastReport);setStatus(fa()?'تحلیل فنی تکمیل شد.':'Technical review completed.','success');
    }catch(err){setStatus(messageForError(err?.data,err?.status),'error');}
    finally{button.disabled=false;translate();}
  }

  button.addEventListener('click',runReview);
  new MutationObserver(translate).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  translate();
})();
