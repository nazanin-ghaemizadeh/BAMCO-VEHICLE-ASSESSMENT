/* v46.js */
/* v46 — revision-role visibility + expert edit-permission status */
(()=>{
  function activeAuthorization(){
    const a=state?.workflow?.editAuthorization;
    return a&&a.status==='active'?a:null;
  }

  function signedInUser(){return String(window.BAMCO_AUTH_USER||'').trim().toLowerCase()}

  function expertPermissionState(){
    const locked=!!state?.workflow?.locked;
    const authorization=activeAuthorization();
    const exact=!!(locked&&authorization&&authorization.targetRole==='expert'&&signedInUser()&&signedInUser()===String(authorization.targetUser||'').trim().toLowerCase()&&currentRole==='expert');
    return {locked,authorization,exact};
  }

  function syncExpertEditPermissionUi(){
    const panel=document.querySelector('#expertPanel');
    if(!panel)return;
    let notice=panel.querySelector('#expertEditPermissionNotice');
    const {locked,authorization,exact}=expertPermissionState();

    if(!locked){
      notice?.remove();
    }else{
      if(!notice){
        notice=document.createElement('section');
        notice.id='expertEditPermissionNotice';
        notice.className='expertEditPermissionNotice';
        panel.prepend(notice);
      }
      const fa=locale==='fa';
      if(exact){
        notice.className='expertEditPermissionNotice active';
        notice.innerHTML=`<strong>${fa?'مجوز اصلاح خبره فعال است':'Expert revision permission is active'}</strong><span>${fa?'این مجوز توسط':'Granted by'} <b dir="ltr">${esc(authorization.grantedBy||'—')}</b>${fa?' صادر شده است. دلیل: ':' — Reason: '}${esc(authorization.reason||'—')}</span><small>${fa?'پس از پایان اصلاحات، «تأیید اصلاحات و پایان مجوز» را بزنید.':'After finishing the revision, use “Confirm revisions and close permission”.'}</small>`;
      }else if(authorization?.targetRole==='expert'){
        notice.className='expertEditPermissionNotice waiting';
        notice.innerHTML=`<strong>${fa?'مجوز اصلاح خبره صادر شده است':'Expert revision permission has been granted'}</strong><span>${fa?'این مجوز برای کاربر':'This permission belongs to'} <b dir="ltr">${esc(authorization.targetUser||'—')}</b>${fa?' صادر شده است.':' .'}</span><small>${fa?'برای اصلاح باید با همان حساب وارد نقش خبره شوید.':'Sign in with that account and enter the Expert role to edit.'}</small>`;
      }else{
        notice.className='expertEditPermissionNotice locked';
        notice.innerHTML=`<strong>${fa?'فرم خبره قفل است':'Expert form is locked'}</strong><span>${fa?'فقط مدیریت می‌تواند برای یک کاربر مشخص در نقش خبره مجوز اصلاح صادر کند.':'Only Management can grant revision permission to a specific user in the Expert role.'}</span>`;
      }
    }

    const canEdit=!locked||exact;
    panel.querySelectorAll('input,textarea,select').forEach(el=>{
      el.disabled=!canEdit;
      el.setAttribute('aria-disabled',canEdit?'false':'true');
    });

    const reset=document.querySelector('#expertResetButton');
    const confirm=document.querySelector('#expertConfirmButton');
    const excel=document.querySelector('#expertExcelButton');
    if(reset){reset.disabled=locked&&!exact;reset.setAttribute('aria-disabled',reset.disabled?'true':'false')}
    if(confirm){
      if(locked&&!exact)confirm.disabled=true;
      if(exact)confirm.textContent=locale==='fa'?'تأیید اصلاحات و پایان مجوز':'Confirm revisions and close permission';
      else if(!locked)confirm.textContent=locale==='fa'?'تأیید نهایی':'Final Confirmation';
    }
    /* Export remains available for read-only access when it is otherwise valid. */
    if(excel)excel.setAttribute('aria-disabled',excel.disabled?'true':'false');
  }

  if(typeof window.renderExpertPanel==='function'){
    const previousRenderExpertPanel=window.renderExpertPanel;
    window.renderExpertPanel=function(...args){const out=previousRenderExpertPanel(...args);syncExpertEditPermissionUi();return out};
    renderExpertPanel=window.renderExpertPanel;
  }
  if(typeof window.renderExpertStatus==='function'){
    const previousRenderExpertStatus=window.renderExpertStatus;
    window.renderExpertStatus=function(...args){const out=previousRenderExpertStatus(...args);syncExpertEditPermissionUi();return out};
    renderExpertStatus=window.renderExpertStatus;
  }

  const previousPermissionRefresh=window.BAMCO_REFRESH_EDIT_PERMISSION_UI;
  window.BAMCO_REFRESH_EDIT_PERMISSION_UI=function(...args){
    const out=previousPermissionRefresh?previousPermissionRefresh(...args):undefined;
    syncExpertEditPermissionUi();
    return out;
  };

  const previousSetLocale=setLocale;
  setLocale=function(next){const out=previousSetLocale(next);syncExpertEditPermissionUi();return out};

  document.querySelectorAll('[data-role]').forEach(btn=>btn.addEventListener('click',()=>requestAnimationFrame(syncExpertEditPermissionUi)));
  document.querySelector('#switchRoleButton')?.addEventListener('click',()=>requestAnimationFrame(syncExpertEditPermissionUi));
  window.addEventListener('bamco:case-restored',()=>requestAnimationFrame(syncExpertEditPermissionUi));
  syncExpertEditPermissionUi();
})();

;
/* v48.js */
/* v48 — evaluator locked view remains navigable but cannot mutate case data */
(()=>{
  function evaluatorAuthorized(){
    try{return currentRole==='evaluator' && !!window.BAMCO_CAN_EDIT_CASE?.()}catch(_){return false}
  }

  function setDisabled(el,disabled){
    if(!el)return;
    el.disabled=!!disabled;
    el.setAttribute('aria-disabled',disabled?'true':'false');
  }

  function enforceEvaluatorReadOnly(){
    if(typeof state==='undefined')return;
    const evaluator=currentRole==='evaluator';
    const locked=evaluator && !!state?.workflow?.locked && !evaluatorAuthorized();

    /* Navigation is deliberately left enabled in a locked case. */
    document.querySelectorAll('.criterionTab, #evaluatorVehiclePhotos .vehicleGalleryThumb').forEach(el=>{
      if(evaluator)setDisabled(el,false);
    });

    if(!evaluator)return;

    document.querySelectorAll('.metadata input, .metadata select, .metadata textarea').forEach(el=>{
      setDisabled(el,locked);
    });
    document.querySelectorAll('.assessmentLayout [data-score], .assessmentLayout [data-note], .assessmentLayout [data-attachment-input], .assessmentLayout [data-remove-attachment]').forEach(el=>{
      setDisabled(el,locked);
    });
    document.querySelectorAll('#evaluatorVehiclePhotos [data-vehicle-photo], #evaluatorVehiclePhotos [data-remove-vehicle-photo]').forEach(el=>{
      setDisabled(el,locked);
    });
    document.querySelectorAll('[data-final-comment="evaluator"]').forEach(el=>setDisabled(el,locked));

    /* Starting a new vehicle assessment is a case-level action, not an edit to
       the finalized case. It must stay available even while the current case is locked. */
    const reset=document.querySelector('#resetButton');
    if(reset)setDisabled(reset,false);

    /* Date remains readonly by design even when editing is authorized. */
    const date=document.querySelector('.metadata [data-meta="date"]');
    if(date)date.readOnly=true;
  }

  if(typeof renderTabs==='function'){
    const previousRenderTabs=renderTabs;
    renderTabs=function(...args){const out=previousRenderTabs.apply(this,args);enforceEvaluatorReadOnly();return out};
    window.renderTabs=renderTabs;
  }
  if(typeof renderCriteria==='function'){
    const previousRenderCriteria=renderCriteria;
    renderCriteria=function(...args){const out=previousRenderCriteria.apply(this,args);enforceEvaluatorReadOnly();return out};
    window.renderCriteria=renderCriteria;
  }
  if(typeof renderMetadata==='function'){
    const previousRenderMetadata=renderMetadata;
    renderMetadata=function(...args){const out=previousRenderMetadata.apply(this,args);enforceEvaluatorReadOnly();return out};
    window.renderMetadata=renderMetadata;
  }
  if(typeof renderVehiclePhotos==='function'){
    const previousRenderVehiclePhotos=renderVehiclePhotos;
    renderVehiclePhotos=function(...args){const out=previousRenderVehiclePhotos.apply(this,args);enforceEvaluatorReadOnly();return out};
    window.renderVehiclePhotos=renderVehiclePhotos;
  }

  const priorRefresh=window.BAMCO_REFRESH_EDIT_PERMISSION_UI;
  window.BAMCO_REFRESH_EDIT_PERMISSION_UI=function(...args){
    const out=priorRefresh?priorRefresh(...args):undefined;
    enforceEvaluatorReadOnly();
    return out;
  };

  const priorLocale=setLocale;
  setLocale=function(next){
    const out=priorLocale(next);
    enforceEvaluatorReadOnly();
    return out;
  };

  document.querySelectorAll('[data-role]').forEach(btn=>btn.addEventListener('click',()=>requestAnimationFrame(enforceEvaluatorReadOnly)));
  document.querySelector('#switchRoleButton')?.addEventListener('click',()=>requestAnimationFrame(enforceEvaluatorReadOnly));
  window.addEventListener('bamco:case-restored',()=>requestAnimationFrame(enforceEvaluatorReadOnly));

  /* Dynamic rerenders (criteria, comments, photos) should never reopen mutation controls. */
  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;enforceEvaluatorReadOnly()});
  });
  observer.observe(document.body,{subtree:true,childList:true});
  enforceEvaluatorReadOnly();
})();

;
/* v49.js */
/* v49 — evaluator lock notice + expert Excel read-only export availability */
(()=>{
  const user=()=>String(window.BAMCO_AUTH_USER||'').trim().toLowerCase();
  const authorization=()=>{
    try{
      const a=state?.workflow?.editAuthorization;
      return a&&a.status==='active'?a:null;
    }catch(_){return null}
  };
  const evaluatorExact=()=>{
    const a=authorization();
    return !!(state?.workflow?.locked&&a&&a.targetRole==='evaluator'&&currentRole==='evaluator'&&user()&&user()===String(a.targetUser||'').trim().toLowerCase());
  };

  function syncEvaluatorLockNotice(){
    const formTop=document.querySelector('.metadata');
    if(!formTop)return;
    let notice=document.querySelector('#evaluatorEditPermissionNotice');
    const evaluator=currentRole==='evaluator';
    const locked=!!state?.workflow?.locked;
    if(!evaluator||!locked){notice?.remove();return}
    if(!notice){
      notice=document.createElement('section');
      notice.id='evaluatorEditPermissionNotice';
      notice.className='evaluatorEditPermissionNotice evaluatorOnly';
      formTop.before(notice);
    }
    const fa=locale==='fa',a=authorization();
    if(evaluatorExact()){
      notice.className='evaluatorEditPermissionNotice evaluatorOnly active';
      notice.innerHTML=`<strong>${fa?'مجوز اصلاح ارزیاب فعال است':'Evaluator revision permission is active'}</strong><span>${fa?'این مجوز توسط':'Granted by'} <b dir="ltr">${esc(a?.grantedBy||'—')}</b>${fa?' صادر شده است. دلیل: ':' — Reason: '}${esc(a?.reason||'—')}</span><small>${fa?'پس از پایان اصلاحات، پرونده را دوباره تأیید و قفل کنید.':'After completing the revision, finalize and lock the case again.'}</small>`;
    }else if(a?.targetRole==='evaluator'){
      notice.className='evaluatorEditPermissionNotice evaluatorOnly waiting';
      notice.innerHTML=`<strong>${fa?'فرم ارزیابی قفل است':'The assessment form is locked'}</strong><span>${fa?'مجوز اصلاح برای کاربر':'Revision permission belongs to'} <b dir="ltr">${esc(a.targetUser||'—')}</b>${fa?' صادر شده است.':' .'}</span><small>${fa?'برای ویرایش باید با همان حساب وارد نقش ارزیاب شوید.':'Sign in with that account and enter the Evaluator role to edit.'}</small>`;
    }else{
      notice.className='evaluatorEditPermissionNotice evaluatorOnly locked';
      notice.innerHTML=`<strong>${fa?'فرم ارزیابی قفل است':'The assessment form is locked'}</strong><span>${fa?'فقط مدیریت می‌تواند برای یک کاربر مشخص در نقش ارزیاب مجوز اصلاح صادر کند.':'Only Management can grant revision permission to a specific user in the Evaluator role.'}</span>`;
    }
  }

  function syncExpertExcelAvailability(){
    const button=document.querySelector('#expertExcelButton');
    if(!button)return;
    let ready=false;
    try{ready=Math.abs(expertTotal()-1)<1e-9&&expertWeightsComplete()}catch(_){ready=false}
    button.disabled=!ready;
    button.setAttribute('aria-disabled',ready?'false':'true');
    button.title=ready?'':(locale==='fa'?'برای دریافت خروجی، وزن همه شاخص‌ها باید تکمیل و مجموع آن‌ها دقیقاً برابر ۱ باشد.':'To export, all criterion weights must be complete and their total must equal exactly 1.');
  }

  if(typeof window.renderExpertStatus==='function'){
    const prior=window.renderExpertStatus;
    window.renderExpertStatus=function(...args){const out=prior(...args);syncExpertExcelAvailability();return out};
    renderExpertStatus=window.renderExpertStatus;
  }
  if(typeof window.renderExpertPanel==='function'){
    const prior=window.renderExpertPanel;
    window.renderExpertPanel=function(...args){const out=prior(...args);syncExpertExcelAvailability();return out};
    renderExpertPanel=window.renderExpertPanel;
  }
  if(typeof renderWorkflow==='function'){
    const prior=renderWorkflow;
    renderWorkflow=function(...args){const out=prior.apply(this,args);syncEvaluatorLockNotice();syncExpertExcelAvailability();return out};
    window.renderWorkflow=renderWorkflow;
  }

  const priorPermissionRefresh=window.BAMCO_REFRESH_EDIT_PERMISSION_UI;
  window.BAMCO_REFRESH_EDIT_PERMISSION_UI=function(...args){
    const out=priorPermissionRefresh?priorPermissionRefresh(...args):undefined;
    syncEvaluatorLockNotice();
    syncExpertExcelAvailability();
    return out;
  };

  const priorLocale=setLocale;
  setLocale=function(next){const out=priorLocale(next);syncEvaluatorLockNotice();syncExpertExcelAvailability();return out};

  document.querySelectorAll('[data-role]').forEach(btn=>btn.addEventListener('click',()=>requestAnimationFrame(()=>{syncEvaluatorLockNotice();syncExpertExcelAvailability()})));
  document.querySelector('#switchRoleButton')?.addEventListener('click',()=>requestAnimationFrame(()=>{syncEvaluatorLockNotice();syncExpertExcelAvailability()}));
  window.addEventListener('bamco:case-restored',()=>requestAnimationFrame(()=>{syncEvaluatorLockNotice();syncExpertExcelAvailability()}));

  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{queued=false;syncEvaluatorLockNotice();syncExpertExcelAvailability()});
  });
  observer.observe(document.body,{subtree:true,childList:true});
  syncEvaluatorLockNotice();
  syncExpertExcelAvailability();
})();
