/* v61 — entry captcha + company-brand polish + comparison criterion explanations */
(()=>{
  const q=(sel,root=document)=>root.querySelector(sel);
  const qa=(sel,root=document)=>[...root.querySelectorAll(sel)];
  const isFa=()=>document.documentElement.lang!=='en' && !document.documentElement.classList.contains('english');

  function injectStyles(){
    if(q('#bamco-v61-styles'))return;
    const style=document.createElement('style');
    style.id='bamco-v61-styles';
    style.textContent=`
      #entryScreen .entryBrand img{display:block!important;max-width:min(390px,82vw)!important;width:auto!important;height:auto!important;margin:0 auto!important;object-fit:contain!important}
      #entryScreen .entryBrand{display:flex!important;align-items:center!important;justify-content:center!important;min-height:120px!important;padding:8px 12px 4px!important}
      #entryScreen .bamcoCaptcha{margin:14px 0 4px;padding:14px;border:1px solid #d6e3eb;border-radius:14px;background:#f8fbfd;box-shadow:0 7px 22px rgba(22,63,99,.06)}
      #entryScreen .bamcoCaptchaHead{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}
      #entryScreen .bamcoCaptchaHead strong{color:#173f63;font-size:13px;font-weight:900}
      #entryScreen .bamcoCaptchaRefresh{border:1px solid #c7d9e4;background:#fff;color:#1d587d;border-radius:9px;min-width:38px;height:36px;cursor:pointer;font-weight:900}
      #entryScreen .bamcoCaptchaRow{display:grid;grid-template-columns:minmax(96px,.65fr) minmax(120px,1fr);gap:10px;align-items:center}
      #entryScreen .bamcoCaptchaQuestion{display:flex;align-items:center;justify-content:center;min-height:44px;border-radius:10px;background:#163f63;color:#fff;font:900 18px/1.2 Tahoma,Arial,sans-serif;direction:ltr;letter-spacing:.5px}
      #entryScreen .bamcoCaptchaInput{width:100%;box-sizing:border-box;min-height:44px;border:1px solid #c7d9e4;border-radius:10px;background:#fff;padding:8px 12px;text-align:center;font-weight:800;outline:none}
      #entryScreen .bamcoCaptchaInput:focus{border-color:#147b86;box-shadow:0 0 0 3px rgba(20,123,134,.12)}
      #entryScreen .bamcoCaptchaMessage{display:block;min-height:20px;margin-top:8px;color:#687f90;font-size:11px;font-weight:700}
      #entryScreen .bamcoCaptcha.ok{border-color:#9fd2bd;background:#f4fbf7}
      #entryScreen .bamcoCaptcha.ok .bamcoCaptchaMessage{color:#187a54}
      #entryScreen .bamcoCaptcha.bad{border-color:#e3aab0;background:#fff7f8}
      #entryScreen .bamcoCaptcha.bad .bamcoCaptchaMessage{color:#a83042}
      #entryScreen #authLoginButton[data-captcha-locked="1"]{opacity:.55;cursor:not-allowed;filter:saturate(.45)}
      .v52QuestionTitle{cursor:help!important;text-decoration-line:underline;text-decoration-style:dotted;text-underline-offset:4px;text-decoration-color:#8ba4b7}
      #bamcoCriterionTooltip{position:fixed;z-index:2147483000;display:none;width:min(360px,calc(100vw - 28px));max-height:min(330px,55vh);overflow:auto;padding:13px 15px;border:1px solid #c9d8e2;border-radius:13px;background:rgba(18,49,73,.97);color:#fff;box-shadow:0 16px 42px rgba(9,32,49,.28);font:700 12px/1.8 Tahoma,Arial,sans-serif;text-align:start;direction:rtl;pointer-events:none;backdrop-filter:blur(8px)}
      #bamcoCriterionTooltip b{display:block;margin-bottom:5px;color:#cdebf1;font-size:12px;font-weight:900}
      .english #bamcoCriterionTooltip{direction:ltr;font-family:"Times New Roman",serif}
      @media(max-width:560px){#entryScreen .bamcoCaptchaRow{grid-template-columns:1fr}#entryScreen .entryBrand{min-height:94px!important}}
    `;
    document.head.appendChild(style);
  }

  function makeChallenge(){
    const a=2+Math.floor(Math.random()*8);
    const b=1+Math.floor(Math.random()*8);
    const add=Math.random()>.35;
    return add?{text:`${a} + ${b} = ?`,answer:a+b}:{text:`${a+b} − ${b} = ?`,answer:a};
  }

  let captcha={challenge:null,passed:false};
  function syncLoginLock(){
    const button=q('#authLoginButton');
    if(!button)return;
    button.dataset.captchaLocked=captcha.passed?'0':'1';
    button.setAttribute('aria-disabled',captcha.passed?'false':'true');
  }
  function refreshCaptcha(focus=false){
    captcha.challenge=makeChallenge();
    captcha.passed=false;
    const box=q('#bamcoEntryCaptcha');
    const question=q('#bamcoCaptchaQuestion');
    const input=q('#bamcoCaptchaInput');
    const msg=q('#bamcoCaptchaMessage');
    if(question)question.textContent=captcha.challenge.text;
    if(input){input.value='';if(focus)input.focus()}
    if(box)box.classList.remove('ok','bad');
    if(msg)msg.textContent=isFa()?'پاسخ عبارت بالا را وارد کنید.':'Enter the answer to the expression above.';
    syncLoginLock();
  }
  function validateCaptcha(){
    const box=q('#bamcoEntryCaptcha');
    const input=q('#bamcoCaptchaInput');
    const msg=q('#bamcoCaptchaMessage');
    if(!input||!captcha.challenge)return false;
    const normalized=String(input.value||'').replace(/[۰-۹]/g,d=>'0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]).trim();
    const ok=Number(normalized)===captcha.challenge.answer;
    captcha.passed=ok;
    box?.classList.toggle('ok',ok);
    box?.classList.toggle('bad',!ok&&normalized!=='');
    if(msg)msg.textContent=ok?(isFa()?'تأیید شد؛ می‌توانید وارد شوید.':'Verified. You can sign in.'):(normalized?(isFa()?'پاسخ کپچا صحیح نیست.':'The captcha answer is incorrect.'):(isFa()?'پاسخ عبارت بالا را وارد کنید.':'Enter the answer to the expression above.'));
    syncLoginLock();
    return ok;
  }
  function installCaptcha(){
    const form=q('#entryAuthForm');
    const login=q('#authLoginButton');
    if(!form||!login||q('#bamcoEntryCaptcha'))return;
    const box=document.createElement('div');
    box.className='bamcoCaptcha';
    box.id='bamcoEntryCaptcha';
    box.innerHTML=`<div class="bamcoCaptchaHead"><strong>${isFa()?'تأیید انسانی':'Human verification'}</strong><button class="bamcoCaptchaRefresh" id="bamcoCaptchaRefresh" type="button" aria-label="${isFa()?'ساخت کپچای جدید':'New captcha'}">↻</button></div><div class="bamcoCaptchaRow"><div class="bamcoCaptchaQuestion" id="bamcoCaptchaQuestion"></div><input class="bamcoCaptchaInput" id="bamcoCaptchaInput" inputmode="numeric" autocomplete="off" placeholder="${isFa()?'پاسخ':'Answer'}" aria-label="${isFa()?'پاسخ کپچا':'Captcha answer'}"></div><small class="bamcoCaptchaMessage" id="bamcoCaptchaMessage"></small>`;
    form.insertBefore(box,login);
    q('#bamcoCaptchaRefresh')?.addEventListener('click',()=>refreshCaptcha(true));
    q('#bamcoCaptchaInput')?.addEventListener('input',validateCaptcha);
    form.addEventListener('submit',event=>{
      if(validateCaptcha())return;
      event.preventDefault();
      event.stopImmediatePropagation();
      q('#bamcoCaptchaInput')?.focus();
    },true);
    refreshCaptcha(false);
  }

  function normalize(value){return String(value||'').replace(/\s+/g,' ').trim()}
  function findItemByVisibleTitle(titleText){
    const wanted=normalize(titleText);
    for(const main of (window.ASSESSMENT_CRITERIA||[])){
      for(const sub of (main.subgroups||[])){
        for(const item of (sub.items||[])){
          const candidates=[item.titleFa,item.titleEn,item.textFa,item.textEn].map(normalize).filter(Boolean);
          if(candidates.includes(wanted))return {main,sub,item};
        }
      }
    }
    return null;
  }
  function ensureTooltip(){
    let tip=q('#bamcoCriterionTooltip');
    if(tip)return tip;
    tip=document.createElement('div');
    tip.id='bamcoCriterionTooltip';
    tip.setAttribute('role','tooltip');
    document.body.appendChild(tip);
    return tip;
  }
  function tooltipContent(label){
    const hit=findItemByVisibleTitle(label.textContent);
    if(!hit)return null;
    const {sub,item}=hit;
    const faMode=isFa();
    const heading=faMode?(item.titleFa||'توضیح شاخص'):(item.titleEn||item.titleFa||'Criterion');
    const description=faMode?(item.textFa||item.exampleFa||''):(item.textEn||item.textFa||item.exampleEn||item.exampleFa||'');
    const subgroup=faMode?(sub.titleFa||''):(sub.titleEn||sub.titleFa||'');
    return {heading,description,subgroup};
  }
  function showTooltip(label,event){
    const data=tooltipContent(label);if(!data)return;
    const tip=ensureTooltip();
    tip.innerHTML=`<b>${escapeHtml(data.heading)}</b>${data.subgroup?`<span>${escapeHtml(data.subgroup)}</span><br>`:''}<span>${escapeHtml(data.description)}</span>`;
    tip.style.display='block';
    moveTooltip(event);
  }
  function moveTooltip(event){
    const tip=q('#bamcoCriterionTooltip');if(!tip||tip.style.display==='none')return;
    const gap=14;
    const rect=tip.getBoundingClientRect();
    let left=event.clientX+gap,top=event.clientY+gap;
    if(left+rect.width>innerWidth-8)left=event.clientX-rect.width-gap;
    if(top+rect.height>innerHeight-8)top=event.clientY-rect.height-gap;
    tip.style.left=Math.max(8,left)+'px';tip.style.top=Math.max(8,top)+'px';
  }
  function hideTooltip(){const tip=q('#bamcoCriterionTooltip');if(tip)tip.style.display='none'}
  function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}

  document.addEventListener('mouseover',event=>{const label=event.target?.closest?.('#managerComparisonCard .v52QuestionTitle');if(label)showTooltip(label,event)},true);
  document.addEventListener('mousemove',event=>{if(event.target?.closest?.('#managerComparisonCard .v52QuestionTitle'))moveTooltip(event)},true);
  document.addEventListener('mouseout',event=>{const label=event.target?.closest?.('#managerComparisonCard .v52QuestionTitle');if(label&&!label.contains(event.relatedTarget))hideTooltip()},true);
  document.addEventListener('focusin',event=>{const label=event.target?.closest?.('#managerComparisonCard .v52QuestionTitle');if(label){const r=label.getBoundingClientRect();showTooltip(label,{clientX:r.left+r.width/2,clientY:r.top})}},true);
  document.addEventListener('focusout',event=>{if(event.target?.closest?.('#managerComparisonCard .v52QuestionTitle'))hideTooltip()},true);
  addEventListener('scroll',hideTooltip,true);

  function keepBrandVisible(){
    const img=q('#entryScreen .entryBrand img');
    if(img){img.removeAttribute('hidden');img.style.visibility='visible';img.style.opacity='1'}
  }
  function boot(){injectStyles();installCaptcha();keepBrandVisible()}
  const observer=new MutationObserver(()=>{installCaptcha();keepBrandVisible()});
  observer.observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
