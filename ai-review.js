(()=>{
  'use strict';
  if(!/\/manager\.html$/.test(location.pathname))return;
  const core=window.BamcoAIReview;
  const card=document.createElement('section');card.id='aiTechnicalReview';card.className='card managerOnly aiTechnicalReview';
  card.innerHTML=`<div class="aiReviewIntro"><picture><source media="(prefers-reduced-motion: reduce)" srcset="assets/ai-vehicle-still.png"><img src="assets/ai-vehicle-walk.gif" width="480" height="321" alt="" loading="lazy"></picture><div class="aiReviewCopy"><span class="aiEyebrow" lang="en">BAMCO · AI</span><h2 data-ai-copy="title"></h2><p data-ai-copy="intro"></p><div class="aiActions"><button id="aiReviewStart" type="button" data-ai-copy="start"></button><button id="aiReviewCancel" type="button" hidden data-ai-copy="cancel"></button></div></div></div><p id="aiReviewStatus" class="aiReviewStatus" role="status" aria-live="polite"></p><details class="aiConnection"><summary data-ai-copy="connection"></summary><form id="aiConnectionForm"><label><span data-ai-copy="endpoint"></span><input id="aiEndpoint" type="url" dir="ltr" lang="en" inputmode="url" placeholder="https://…/api/technical-review" autocomplete="off" required></label><label><span data-ai-copy="access"></span><input id="aiAccessToken" type="password" dir="ltr" lang="en" autocomplete="off" minlength="32" required></label><p data-ai-copy="connectionHint"></p><button type="submit" data-ai-copy="saveConnection"></button></form></details><p class="aiDataNotice" data-ai-copy="dataNotice"></p><div id="aiReviewResult" class="aiReviewResult" aria-live="polite"></div>`;
  document.querySelector('#managerReviewComments')?.insertAdjacentElement('afterend',card);
  const q=selector=>card.querySelector(selector);
  const copy={
    fa:{title:'بررسی فنی با هوش مصنوعی',intro:'از نتایج ارزیابی به برنامه آزمون و اصلاح برسید؛ با بررسی شواهد، علت‌های احتمالی و اولویت‌های پیگیری.',start:'دریافت بررسی فنی',cancel:'لغو بررسی',connection:'تنظیم اتصال هوش مصنوعی',endpoint:'آدرس سرویس تحلیل',access:'رمز دسترسی سرویس تحلیل',connectionHint:'آدرس سرویس روی این دستگاه ذخیره می‌شود. رمز دسترسی فقط تا بستن یا تازه‌سازی این صفحه نگه داشته می‌شود. کلید اصلی هوش مصنوعی باید روی سرور تنظیم شود.',saveConnection:'ثبت اتصال',dataNotice:'با زدن دکمه، امتیازها، شرح شاخص‌ها، یادداشت‌ها، نظر ارزیاب و خبره و مدل خودرو برای تحلیل ارسال می‌شوند. تصاویر، اطلاعات تماس و انتخاب‌های پنجره ورود ارسال نمی‌شوند. گزارش پیشنهادی است و نیاز به تأیید کارشناس دارد.',notConfigured:'اتصال هنوز تنظیم نشده است. آدرس و رمز سرویس تحلیل را در بخش تنظیم اتصال وارد کنید.',ready:'تنظیم اتصال ثبت شد. برای ارسال ارزیابی، «دریافت بررسی فنی» را بزنید.',empty:'ابتدا یک پرونده دارای امتیاز ارزیابی را باز کنید.',loading:'در حال بررسی فنی ارزیابی و تهیه برنامه آزمون…',done:'بررسی فنی آماده شد.',cancelled:'درخواست بررسی لغو شد.',stale:'پرونده تغییر کرده است؛ برای داده‌های فعلی دوباره بررسی بگیرید.',changed:'پرونده هنگام بررسی تغییر کرد. برای دریافت گزارش معتبر، دوباره بررسی بگیرید.',invalidEndpoint:'آدرس کامل سرویس را با HTTPS و بدون نام کاربری، رمز یا پارامتر وارد کنید.',invalidToken:'رمز دسترسی سرویس باید حداقل ۳۲ نویسه داشته باشد. کلید اصلی هوش مصنوعی را اینجا وارد نکنید.',network:'ارتباط با سرویس برقرار نشد. اینترنت و تنظیم اتصال را بررسی کنید.',timeout:'زمان پاسخ سرویس به پایان رسید. دوباره تلاش کنید.',unauthorized:'رمز دسترسی سرویس درست نیست یا منقضی شده است.',not_configured:'سرویس آماده نیست؛ کلید API، مدل و رمز دسترسی باید روی سرور تنظیم شوند.',rate_limited:'تعداد درخواست‌ها زیاد است. یک دقیقه بعد دوباره تلاش کنید.',provider_rate_limited:'اعتبار یا محدودیت درخواست سرویس هوش مصنوعی را بررسی کنید.',provider_error:'سرویس هوش مصنوعی پاسخ معتبر نداد. تنظیمات مدل و کلید سرور را بررسی کنید.',invalid_response:'پاسخ سرویس قابل تأیید نبود. دوباره تلاش کنید.',incomplete_response:'پاسخ هوش مصنوعی کامل نشد. دوباره تلاش کنید.',review_refused:'سرویس نتوانست برای این داده‌ها بررسی فنی ارائه کند.',invalid_payload:'داده‌های پرونده برای ارسال معتبر نیستند.',origin_denied:'این آدرس سایت در سرویس تحلیل مجاز نشده است.',summary:'جمع‌بندی فنی',limitations:'محدودیت‌ها و داده‌های موردنیاز',evidence:'شواهد ارزیابی',causes:'علت‌های احتمالی',tests:'آزمون‌های پیشنهادی',purpose:'هدف',method:'روش و شرایط آزمون',acceptance:'مبنای پذیرش',actions:'اقدامات اصلاحی',retest:'شرط ارزیابی مجدد',critical:'بحرانی',high:'زیاد',medium:'متوسط',low:'کم',source:'موارد ارزیابی',score:'امتیاز',unanswered:'بدون امتیاز',noFindings:'در پاسخ سرویس، مورد مشخصی برای پیگیری ارائه نشده است.'},
    en:{title:'AI Technical Review',intro:'Turn assessment evidence into a focused test and corrective-action plan, with possible causes and follow-up priorities.',start:'Get technical review',cancel:'Cancel review',connection:'AI connection settings',endpoint:'Review service URL',access:'Review service access token',connectionHint:'The service URL is saved on this device. The access token stays only until this page closes or reloads. Configure the AI provider key on the server.',saveConnection:'Save connection',dataNotice:'Clicking the button sends scores, criterion descriptions, notes, evaluator/expert comments and the vehicle model for analysis. Photos, contact details and entry-window choices are excluded. The report is advisory and requires an engineer’s approval.',notConfigured:'The connection is not configured. Enter the review service URL and access token in connection settings.',ready:'Connection settings saved. Click “Get technical review” to send the assessment.',empty:'First open an assessment with recorded scores.',loading:'Reviewing the assessment and preparing a technical test plan…',done:'Technical review is ready.',cancelled:'Review request cancelled.',stale:'The assessment has changed. Request a new review for the current data.',changed:'The assessment changed during the review. Request a new review.',invalidEndpoint:'Enter a full HTTPS service URL without credentials or query parameters.',invalidToken:'The service access token must contain at least 32 characters. Do not enter the AI provider key here.',network:'Could not reach the review service. Check your connection and settings.',timeout:'The service timed out. Please try again.',unauthorized:'The service access token is incorrect or expired.',not_configured:'The service is not ready. Configure the server API key, model and access token.',rate_limited:'Too many requests. Try again in one minute.',provider_rate_limited:'Check the AI provider credit or request limit.',provider_error:'The AI provider returned an error. Check the server model and API key.',invalid_response:'The service response could not be verified. Please try again.',incomplete_response:'The AI response was incomplete. Please try again.',review_refused:'The service could not provide a technical review for this data.',invalid_payload:'The assessment data is invalid.',origin_denied:'This site origin is not allowed by the review service.',summary:'Technical summary',limitations:'Limitations and missing evidence',evidence:'Assessment evidence',causes:'Possible causes',tests:'Recommended tests',purpose:'Purpose',method:'Method and test conditions',acceptance:'Acceptance basis',actions:'Corrective actions',retest:'Reassessment criteria',critical:'Critical',high:'High',medium:'Medium',low:'Low',source:'Assessment items',score:'Score',unanswered:'Unanswered',noFindings:'The service returned no specific follow-up findings.'}
  };
  const t=key=>copy[locale==='en'?'en':'fa'][key]||copy.en[key]||copy.en.invalid_response;
  let status='notConfigured',active=null,cancelReason='',report=null,reportPayload=null,reportMeta=null,lastFingerprint='',stale=false;
  const connection={endpoint:'',token:''};let summaryRows=[],summaryFinal=null;
  try{connection.endpoint=localStorage.getItem('bamco-ai-review-endpoint')||''}catch(_){}
  q('#aiEndpoint').value=connection.endpoint;
  const validEndpoint=value=>{try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash}catch(_){return false}};
  function payload(){
    const weights=new Map(summaryRows.map(row=>[String(row.main.id),row.weight]));
    const criteria=window.ASSESSMENT_CRITERIA.map(main=>({id:String(main.id),title:title(main.titleFa,'main',main.id),weight:weights.get(String(main.id))??0,items:main.subgroups.flatMap(sub=>sub.items.map(item=>{
      const id=itemKey(main,sub,item),raw=state.scores[id];
      return {id,title:locale==='en'?itemTitleEn(item):(item.titleFa||itemTitle(item)),instructions:locale==='en'?(item.textEn||item.textFa||''):(item.textFa||''),score:raw===undefined||raw===null||raw===''?null:Number(raw),note:state.notes[id]||''};
    }))}));
    return core.validatePayload({version:1,language:locale==='en'?'en':'fa',vehicle:Object.fromEntries(['brand','model','date','odometer'].map(key=>[key,String(state.metadata[key]||'')])),finalScore:summaryFinal,criteria,comments:{evaluator:state.finalComments?.evaluator||'',expert:state.finalComments?.expert||''}});
  }
  function fingerprint(){try{return JSON.stringify(payload())}catch(_){return ''}}
  function setStatus(key){status=key;q('#aiReviewStatus').textContent=t(key);q('#aiReviewStatus').dataset.state=key}
  function refresh(){
    card.querySelectorAll('[data-ai-copy]').forEach(el=>el.textContent=t(el.dataset.aiCopy));
    q('#aiReviewStart').disabled=!!active;q('#aiReviewCancel').hidden=!active;
    card.setAttribute('aria-busy',String(!!active));
    if(report&&!stale&&fingerprint()!==lastFingerprint){stale=true;q('#aiReviewResult').replaceChildren();status='stale'}
    setStatus(status);
  }
  function node(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el}
  function paragraph(parent,label,value){parent.append(node('h4',t(label)),node('p',value))}
  function list(parent,label,values){if(!values.length)return;parent.append(node('h4',t(label)));const ul=node('ul');values.forEach(value=>ul.append(node('li',value)));parent.append(ul)}
  function renderReport(){
    const out=q('#aiReviewResult');out.replaceChildren();if(!report||stale)return;
    out.lang=reportPayload.language;out.dir=reportPayload.language==='en'?'ltr':'rtl';
    out.append(node('h3',t('summary')),node('p',report.summary));
    const date=new Date(reportMeta.generatedAt);const meta=node('p',(reportMeta.model||'')+(Number.isNaN(date.valueOf())?'':' · '+date.toLocaleString(reportPayload.language==='fa'?'fa-IR':'en-GB')),'aiReportMeta');out.append(meta);
    list(out,'limitations',report.limitations);
    if(!report.findings.length)out.append(node('p',t('noFindings')));
    const order={critical:0,high:1,medium:2,low:3};
    [...report.findings].sort((a,b)=>order[a.priority]-order[b.priority]).forEach(finding=>{
      const group=reportPayload.criteria.find(group=>group.id===finding.criterionId);
      const section=node('article',undefined,'aiFinding');
      const head=node('header');head.append(node('h3',group.title),node('span',t(finding.priority),`aiPriority ${finding.priority}`));section.append(head);
      const references=finding.itemIds.map(id=>{const item=group.items.find(item=>item.id===id);return `${item.title} (${t('score')}: ${item.score===null?t('unanswered'):item.score+'/10'})`});
      list(section,'source',references);paragraph(section,'evidence',finding.evidence);list(section,'causes',finding.possibleCauses);
      if(finding.tests.length)section.append(node('h4',t('tests')));
      finding.tests.forEach(test=>{const block=node('div',undefined,'aiTest');block.append(node('strong',test.name));paragraph(block,'purpose',test.purpose);paragraph(block,'method',test.method);paragraph(block,'acceptance',test.acceptanceBasis);section.append(block)});
      list(section,'actions',finding.correctiveActions);paragraph(section,'retest',finding.retestCriteria);out.append(section);
    });
  }
  q('#aiConnectionForm').addEventListener('submit',event=>{
    event.preventDefault();const endpoint=q('#aiEndpoint').value.trim(),token=q('#aiAccessToken').value.trim();
    if(!validEndpoint(endpoint)){setStatus('invalidEndpoint');return}
    if(token.length<32||/^sk-/.test(token)){setStatus('invalidToken');return}
    connection.endpoint=endpoint;connection.token=token;q('#aiAccessToken').value='';
    try{localStorage.setItem('bamco-ai-review-endpoint',endpoint)}catch(_){}
    q('.aiConnection').open=false;setStatus('ready');
  });
  q('#aiReviewCancel').addEventListener('click',()=>{cancelReason='cancelled';active?.abort()});
  q('#aiReviewStart').addEventListener('click',async()=>{
    if(active)return;
    update();let current;
    try{current=payload()}catch(error){setStatus(error.message==='empty_assessment'?'empty':'invalid_payload');return}
    if(!validEndpoint(connection.endpoint)||!connection.token){setStatus('notConfigured');q('.aiConnection').open=true;q('#aiEndpoint').focus();return}
    const sentFingerprint=JSON.stringify(current);active=new AbortController();cancelReason='';
    const timer=setTimeout(()=>{cancelReason='timeout';active?.abort()},100000);
    report=null;stale=false;q('#aiReviewResult').replaceChildren();setStatus('loading');refresh();
    try{
      const response=await fetch(connection.endpoint,{method:'POST',mode:'cors',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',headers:{'Content-Type':'application/json',Authorization:`Bearer ${connection.token}`},body:sentFingerprint,signal:active.signal});
      const body=await response.text();if(body.length>512*1024)throw new Error('invalid_response');
      let data;try{data=JSON.parse(body)}catch(_){throw new Error('invalid_response')}
      if(!response.ok)throw new Error(copy.en[data.error]?data.error:'invalid_response');
      if(fingerprint()!==sentFingerprint){setStatus('changed');return}
      report=core.validateReport(data.report,current);reportPayload=current;reportMeta={generatedAt:data.generatedAt,model:data.model};lastFingerprint=sentFingerprint;
      renderReport();setStatus('done');
    }catch(error){setStatus(error.name==='AbortError'?(cancelReason||'cancelled'):(copy.en[error.message]?error.message:'network'))}
    finally{clearTimeout(timer);active=null;refresh()}
  });
  const previousRefresh=window.managerRefresh||managerRefresh;
  managerRefresh=function(rows,final10,...args){
    const result=previousRefresh(rows,final10,...args);summaryRows=rows||[];summaryFinal=Number.isFinite(final10)?final10*10:null;refresh();return result;
  };window.managerRefresh=managerRefresh;
  window.addEventListener('bamco:case-restored',()=>{if(active){cancelReason='changed';active.abort()}report=null;q('#aiReviewResult').replaceChildren();setStatus(connection.token?'ready':'notConfigured')});
  new MutationObserver(()=>{refresh();renderReport()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.addEventListener('pagehide',()=>{active?.abort();connection.token='';q('#aiAccessToken').value=''});
  update();refresh();
})();
