/* v66 — scoped login captcha + BAMCO Persian logo + localized comparison tooltip */
(()=>{
  const q=(s,r=document)=>r.querySelector(s);
  const isFa=()=>document.documentElement.lang!=='en'&&!document.body?.classList.contains('english')&&!document.documentElement.classList.contains('english');

  function injectStyles(){
    let el=q('#bamco-v66-styles');
    if(!el){el=document.createElement('style');el.id='bamco-v66-styles';document.head.appendChild(el)}
    /* Only interaction-specific tooltip rules remain dynamic. Entry geometry is
       in styles-ui.css so the first rendered frame is already final. */
    el.textContent=`
      @font-face{font-family:"BAMCO Tooltip Mixed";src:local("Times New Roman");unicode-range:U+0000-024F,U+1E00-1EFF}
      @font-face{font-family:"BAMCO Tooltip Mixed";src:local("B Nazanin"),local("BNazanin"),local("Nazanin"),local("Tahoma");unicode-range:U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF}

      #managerComparisonCard .v52QuestionTitle{cursor:help!important;text-decoration-line:underline!important;text-decoration-style:dotted!important;text-underline-offset:4px!important;text-decoration-color:#8ba4b7!important}
      #bamcoCriterionTooltip{position:fixed!important;z-index:2147483000!important;display:none;width:min(390px,calc(100vw - 28px))!important;max-height:min(340px,58vh)!important;overflow:auto!important;padding:16px 18px!important;border:1px solid #c8dbe6!important;border-radius:14px!important;background:#f8fbfd!important;color:#35566d!important;box-shadow:0 14px 34px rgba(22,63,99,.18)!important;font-family:"BAMCO Tooltip Mixed","B Nazanin",Tahoma,sans-serif!important;font-size:15px!important;font-weight:400!important;line-height:1.9!important;text-align:justify!important;text-align-last:right!important;direction:rtl!important;pointer-events:none!important}
      #bamcoCriterionTooltip b{display:block!important;margin-bottom:5px!important;color:#163f63!important;font-size:16px!important;font-weight:700!important;text-align:right!important}
      #bamcoCriterionTooltip .bamcoTipSub{display:block!important;margin-bottom:7px!important;color:#147b86!important;font-size:13px!important;font-weight:700!important;text-align:right!important}
      #bamcoCriterionTooltip .bamcoTipBody{display:block!important;text-align:justify!important}
      .english #bamcoCriterionTooltip{direction:ltr!important;text-align:justify!important;text-align-last:left!important;font-family:"Times New Roman",serif!important;font-size:14px!important}
      .english #bamcoCriterionTooltip b,.english #bamcoCriterionTooltip .bamcoTipSub{text-align:left!important}
    `;
  }

  function setLogo(){
    const img=q('#entryScreen .entryBrand img');
    if(!img)return;
    const src='./bamco-logo.png?v=70';
    if(img.getAttribute('src')!==src)img.src=src;
    img.removeAttribute('srcset');
    img.style.content=`url("${src}")`;
    img.style.visibility='visible';
    img.style.opacity='1';
  }

  const makeChallenge=()=>{
    const a=2+Math.floor(Math.random()*8),b=1+Math.floor(Math.random()*8),add=Math.random()>.35;
    return add?{text:`${a} + ${b} = ?`,answer:a+b}:{text:`${a+b} − ${b} = ?`,answer:a};
  };
  let challenge=null,passed=false;
  function syncLock(){const b=q('#authLoginButton');if(b){b.dataset.captchaLocked=passed?'0':'1';b.setAttribute('aria-disabled',passed?'false':'true')}}
  function refreshCaptcha(focus=false){
    challenge=makeChallenge();passed=false;
    const box=q('#bamcoEntryCaptcha'),question=q('#bamcoCaptchaQuestion'),input=q('#bamcoCaptchaInput'),msg=q('#bamcoCaptchaMessage');
    if(question)question.textContent=challenge.text;
    if(input){input.value='';if(focus)input.focus()}
    box?.classList.remove('ok','bad');
    if(msg)msg.textContent=isFa()?'پاسخ عبارت بالا را وارد کنید.':'Enter the answer above.';
    syncLock();
  }
  function validateCaptcha(){
    const box=q('#bamcoEntryCaptcha'),input=q('#bamcoCaptchaInput'),msg=q('#bamcoCaptchaMessage');
    if(!input||!challenge)return false;
    const value=String(input.value||'').replace(/[۰-۹]/g,d=>'0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]).trim();
    passed=value!==''&&Number(value)===challenge.answer;
    box?.classList.toggle('ok',passed);box?.classList.toggle('bad',!passed&&value!=='');
    if(msg)msg.textContent=passed?(isFa()?'تأیید شد.':'Verified.'):(value?(isFa()?'پاسخ کپچا صحیح نیست.':'Incorrect captcha answer.'):(isFa()?'پاسخ عبارت بالا را وارد کنید.':'Enter the answer above.'));
    syncLock();return passed;
  }
  function installCaptcha(){
    const form=q('#entryAuthForm'),login=q('#authLoginButton');
    if(!form||!login)return;
    let box=q('#bamcoEntryCaptcha');
    if(!box){
      box=document.createElement('div');box.className='bamcoCaptcha';box.id='bamcoEntryCaptcha';
      box.innerHTML=`<div class="bamcoCaptchaHead"><strong>${isFa()?'تأیید انسانی':'Human verification'}</strong></div><div class="bamcoCaptchaRow"><div class="bamcoCaptchaQuestion" id="bamcoCaptchaQuestion"></div><input class="bamcoCaptchaInput" id="bamcoCaptchaInput" inputmode="numeric" autocomplete="off" placeholder="${isFa()?'پاسخ کپچا':'Captcha answer'}"><button class="bamcoCaptchaRefresh" id="bamcoCaptchaRefresh" type="button" aria-label="${isFa()?'کپچای جدید':'New captcha'}">↻</button></div><small class="bamcoCaptchaMessage" id="bamcoCaptchaMessage"></small>`;
      form.insertBefore(box,login);
    }
    if(box.dataset.bound==='1')return;
    box.dataset.bound='1';
    q('#bamcoCaptchaRefresh')?.addEventListener('click',()=>refreshCaptcha(true));
    q('#bamcoCaptchaInput')?.addEventListener('input',validateCaptcha);
    form.addEventListener('submit',e=>{if(validateCaptcha())return;e.preventDefault();e.stopImmediatePropagation();q('#bamcoCaptchaInput')?.focus()},true);
    refreshCaptcha();
  }

  const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function findItem(text){
    const wanted=norm(text);
    for(const main of(window.ASSESSMENT_CRITERIA||[]))for(const sub of(main.subgroups||[]))for(const item of(sub.items||[])){
      const translated=typeof itemTitleEn==='function'?itemTitleEn(item):'';
      if([item.titleFa,item.titleEn,item.textFa,item.textEn,translated].map(norm).filter(Boolean).includes(wanted))return{sub,item};
    }
    return null;
  }
  function ensureTooltip(){let t=q('#bamcoCriterionTooltip');if(!t){t=document.createElement('div');t.id='bamcoCriterionTooltip';t.setAttribute('role','tooltip');document.body.appendChild(t)}return t}
  function showTooltip(label,e){
    const hit=findItem(label.textContent);if(!hit)return;
    const fa=isFa(),t=ensureTooltip();
    const heading=fa?(hit.item.titleFa||hit.item.textFa||'توضیح شاخص'):(typeof itemTitleEn==='function'?itemTitleEn(hit.item):(hit.item.titleEn||'Criterion'));
    const desc=fa?(hit.item.textFa||hit.item.exampleFa||''):(hit.item.textEn||hit.item.exampleEn||'Carry out this inspection or driving check under safe, representative conditions. Observe the vehicle response, record any abnormal behavior or deviation, and assign the appropriate score.');
    const sub=typeof title==='function'?title(hit.sub.titleFa,'sub',hit.sub.id):(fa?(hit.sub.titleFa||''):(hit.sub.titleEn||hit.sub.titleFa||''));
    t.innerHTML=`<b>${esc(heading)}</b>${sub?`<span class="bamcoTipSub">${esc(sub)}</span>`:''}<span class="bamcoTipBody">${esc(desc)}</span>`;
    t.style.display='block';moveTooltip(e);
  }
  function moveTooltip(e){
    const t=q('#bamcoCriterionTooltip');if(!t||t.style.display==='none')return;
    const gap=14,r=t.getBoundingClientRect();let left=e.clientX+gap,top=e.clientY+gap;
    if(left+r.width>innerWidth-8)left=e.clientX-r.width-gap;if(top+r.height>innerHeight-8)top=e.clientY-r.height-gap;
    t.style.left=Math.max(8,left)+'px';t.style.top=Math.max(8,top)+'px';
  }
  function hideTooltip(){const t=q('#bamcoCriterionTooltip');if(t)t.style.display='none'}
  document.addEventListener('mouseover',e=>{const l=e.target?.closest?.('#managerComparisonCard .v52QuestionTitle');if(l)showTooltip(l,e)},true);
  document.addEventListener('mousemove',e=>{if(e.target?.closest?.('#managerComparisonCard .v52QuestionTitle'))moveTooltip(e)},true);
  document.addEventListener('mouseout',e=>{const l=e.target?.closest?.('#managerComparisonCard .v52QuestionTitle');if(l&&!l.contains(e.relatedTarget))hideTooltip()},true);
  addEventListener('scroll',hideTooltip,true);

  function apply(){injectStyles();setLogo();installCaptcha()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
