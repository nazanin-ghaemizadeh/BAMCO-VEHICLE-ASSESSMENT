/* features.js */
(function(){
  const STORAGE_KEY="bamco-vehicle-assessment";
  const clone=value=>JSON.parse(JSON.stringify(value));
  const now=()=>new Date().toISOString();
  const labelForPath=path=>{
    if(path.startsWith("metadata.")){const k=path.split(".")[1],labels={evaluator:"نام ارزیاب",evaluatorExperience:"سابقه ارزیاب",evaluatorPhone:"شماره تماس ارزیاب",evaluatorEmail:"ایمیل ارزیاب",date:"تاریخ ارزیابی",brand:"برند خودرو",model:"مدل خودرو",vin:"شماره شاسی خودرو",odometer:"کارکرد خودرو"};return labels[k]||k}
    if(path.startsWith("scores."))return `امتیاز سؤال ${path.slice(7)}`;
    if(path.startsWith("notes."))return `یادداشت سؤال ${path.slice(6)}`;
    if(path.startsWith("attachments."))return `مستندات سؤال ${path.slice(12)}`;
    if(path.startsWith("vehiclePhotos."))return `تصویر نمای ${path.slice(14)}`;
    if(path.startsWith("weights."))return `وزن شاخص ${path.slice(8)}`;
    return path;
  };
  function ensureWorkflow(){
    state.workflow={locked:false,everFinalized:false,finalizedAt:null,finalizedBy:"",editSession:null,editAuthorization:null,...(state.workflow||{})};
    if(state.workflow.locked)state.workflow.everFinalized=true;
    state.auditTrail=Array.isArray(state.auditTrail)?state.auditTrail:[];
    state.finalComments={evaluator:"",expert:"",manager:"",...(state.finalComments||{})}
  }

  function activeAuthorization(){
    ensureWorkflow();
    const a=state.workflow.editAuthorization;
    return a&&a.status==="active"?a:null;
  }
  function canAuthorizedEdit(){
    const a=activeAuthorization();
    if(!a)return false;
    const user=String(window.BAMCO_AUTH_USER||"").trim().toLowerCase();
    return user&&user===String(a.targetUser||"").trim().toLowerCase()&&currentRole===a.targetRole;
  }
  window.BAMCO_CAN_EDIT_CASE=canAuthorizedEdit;
  function syncFinalCommentsFromDOM(){ensureWorkflow();document.querySelectorAll("[data-final-comment]").forEach(input=>{const role=input.dataset.finalComment;if(role&&Object.prototype.hasOwnProperty.call(state.finalComments,role))state.finalComments[role]=input.value||""})}
  ensureWorkflow();
  let snapshot=clone(state),restoring=false,lockedRollback=false;
  const basePersist=persist;
  function saveDirect(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));snapshot=clone(state);const status=document.querySelector("#autosaveStatus");if(status){status.textContent=locale==="fa"?"ذخیره شد":"Saved";setTimeout(()=>status.textContent=locale==="fa"?"آماده":"Ready",800)}}
  function changedPaths(before,after,prefix=""){
    const keys=new Set([...Object.keys(before||{}),...Object.keys(after||{})]),out=[];
    keys.forEach(k=>{if(k==="auditTrail"||k==="workflow")return;const p=prefix?`${prefix}.${k}`:k,a=before?.[k],b=after?.[k];if(JSON.stringify(a)===JSON.stringify(b))return;if(a&&b&&typeof a==="object"&&typeof b==="object"&&!Array.isArray(a)&&!Array.isArray(b))out.push(...changedPaths(a,b,p));else out.push(p)});return out;
  }
  persist=function(){
    ensureWorkflow();
    if(restoring||lockedRollback)return;
    if(state.workflow.locked&&snapshot.workflow?.locked&&currentRole==="evaluator"&&!canAuthorizedEdit()){
      lockedRollback=true;
      restoring=true;state=clone(snapshot);restoring=false;
      const shell=document.querySelector("#appShell");
      if(shell&&!shell.hidden)refreshAll();
      lockedRollback=false;
      return;
    }
    if(state.workflow.editSession&&(!activeAuthorization()||canAuthorizedEdit())){
      const session=state.workflow.editSession;
      const openedAt=session.openedAt||now();
      let sessionEntry=[...state.auditTrail].reverse().find(entry=>entry?.type==="edit"&&entry.sessionOpenedAt===openedAt);
      if(!sessionEntry){
        sessionEntry={type:"edit",at:openedAt,actor:session.actor,reason:session.reason,items:[],sessionOpenedAt:openedAt,pending:true};
        state.auditTrail.push(sessionEntry);
      }
      const paths=changedPaths(snapshot,state);
      if(paths.length){
        const items=paths.map(labelForPath);
        sessionEntry.at=now();
        sessionEntry.actor=session.actor;
        sessionEntry.reason=session.reason;
        sessionEntry.items=[...new Set([...(sessionEntry.items||[]),...items])];
        sessionEntry.pending=false;
      }
    }
    basePersist();snapshot=clone(state);renderWorkflow();
  };
  function totalAndAnswered(){let total=0,answered=0;window.ASSESSMENT_CRITERIA.forEach(m=>m.subgroups.forEach(s=>s.items.forEach(i=>{total++;if(state.scores[itemKey(m,s,i)])answered++})));return{total,answered}}
  function refreshAll(){renderMetadata();renderVehiclePhotos();renderTabs();renderCriteria();update();renderWorkflow()}
  function finalizeAssessment(){
    ensureWorkflow();syncFinalCommentsFromDOM();const {total,answered}=totalAndAnswered();
    if(answered<total){alert(locale==="fa"?`برای تأیید نهایی باید همه سؤال‌ها پاسخ داده شوند. ${localNumber(total-answered)} سؤال باقی مانده است.`:`Answer every question before final approval. ${total-answered} remain.`);return}
    const actor=(state.metadata.evaluator||"").trim();if(!actor){alert(locale==="fa"?"نام ارزیاب را در اطلاعات ارزیابی وارد کنید.":"Enter the evaluator name first.");return}
    if(!confirm(locale==="fa"?"با تأیید نهایی، پرونده قفل می‌شود و ویرایش فقط پس از بازگشایی توسط مدیریت ممکن است. ادامه می‌دهید؟":"Final approval locks the case. Continue?"))return;
    const completedAt=now();
    const authorization=activeAuthorization();
    if(authorization&&authorization.targetRole==="evaluator"&&canAuthorizedEdit()){
      state.workflow.editAuthorization={...authorization,status:"completed",completedAt};
    }
    state.workflow={...state.workflow,locked:true,everFinalized:true,finalizedAt:completedAt,finalizedBy:actor,editSession:null};state.auditTrail.push({type:"finalize",at:state.workflow.finalizedAt,actor,items:["تأیید نهایی و قفل پرونده"]});saveDirect();refreshAll();
  }
  function unlockAssessment(){
    ensureWorkflow();
    if(currentRole!=="manager"||!state.workflow.locked)return;
    const grantedBy=String(window.BAMCO_AUTH_USER||"").trim().toLowerCase();
    if(!grantedBy){alert(locale==="fa"?"برای صدور مجوز، ابتدا وارد حساب مدیریت شوید.":"Sign in to a management account before granting edit permission.");return}
    const roleRaw=prompt(locale==="fa"?"مجوز برای کدام نقش صادر شود؟\n1 = ارزیاب\n2 = خبره":"Which role should receive edit permission?\n1 = Evaluator\n2 = Expert","1");
    if(roleRaw===null)return;
    const normalized=String(roleRaw).trim().toLowerCase();
    const targetRole=(normalized==="1"||normalized==="evaluator"||normalized==="ارزیاب")?"evaluator":(normalized==="2"||normalized==="expert"||normalized==="خبره")?"expert":"";
    if(!targetRole){alert(locale==="fa"?"نقش انتخاب‌شده معتبر نیست.":"The selected role is not valid.");return}
    const roleUsers=Object.entries(window.BAMCO_USER_ROLES||{}).filter(([,roles])=>Array.isArray(roles)&&roles.includes(targetRole)).map(([user])=>user);
    const targetUser=String(prompt(locale==="fa"?`نام کاربری دریافت‌کننده مجوز را وارد کنید:\n${roleUsers.join("\n")}`:`Enter the username that should receive permission:\n${roleUsers.join("\n")}`,roleUsers[0]||"")||"").trim().toLowerCase();
    if(!targetUser)return;
    if(!roleUsers.includes(targetUser)){alert(locale==="fa"?"این کاربر به نقش انتخاب‌شده دسترسی ندارد.":"This user does not have access to the selected role.");return}
    const reason=prompt(locale==="fa"?"دلیل اصلاح و صدور مجوز را بنویسید:":"Enter the reason for the revision and permission:","");if(!reason?.trim())return;
    const grantedAt=now();
    const previous=activeAuthorization();
    if(previous)state.workflow.editAuthorization={...previous,status:"superseded",supersededAt:grantedAt};
    state.workflow.locked=true;
    state.workflow.everFinalized=true;
    state.workflow.editAuthorization={targetUser,targetRole,grantedBy,reason:reason.trim(),grantedAt,status:"active"};
    state.workflow.editSession={actor:targetUser,reason:reason.trim(),openedAt:grantedAt,grantedBy,targetRole};
    state.auditTrail.push({type:"edit_authorization",at:grantedAt,actor:grantedBy,targetUser,targetRole,reason:reason.trim(),items:["صدور مجوز ویرایش"]});
    state.auditTrail.push({type:"edit",at:grantedAt,actor:targetUser,grantedBy,targetRole,reason:reason.trim(),items:[],sessionOpenedAt:grantedAt,pending:true});
    saveDirect();refreshAll();
    alert(locale==="fa"?`مجوز ویرایش برای ${targetUser} در نقش ${targetRole==="evaluator"?"ارزیاب":"خبره"} صادر شد. برای استفاده از مجوز، کاربر دریافت‌کننده باید با حساب خودش وارد همان نقش شود.`:`Edit permission was granted to ${targetUser} for the ${targetRole} role. The recipient must sign in with that account and enter the authorized role.`);
  }
  function backup(){
    ensureWorkflow();
    syncFinalCommentsFromDOM();
    /* A full case may contain several base64 images and can exceed the browser's
       localStorage quota. Saving to localStorage must never block the JSON download. */
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(_){/* download still proceeds */}
    try{snapshot=clone(state)}catch(_){/* snapshot is not required for export */}
    const expertState=window.getExpertBackup?window.getExpertBackup():(()=>{try{return JSON.parse(localStorage.getItem("bamco-vehicle-expert-weights")||"null")}catch(_){return null}})();
    const managerWeightState=window.getManagerWeightBackup?window.getManagerWeightBackup():null;
    const payload={version:8,type:"BAMCO_FULL_CASE_BACKUP",savedAt:now(),state,finalComments:clone(state.finalComments),auditTrail:clone(state.auditTrail||[]),workflow:clone(state.workflow||{}),authenticatedUser:window.BAMCO_AUTH_USER||null,expertState,managerWeightState};
    try{
      const json=JSON.stringify(payload,null,2);
      const blob=new Blob([json],{type:"application/json;charset=utf-8"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;
      a.download=`full_case_backup_${window.englishFileToken?window.englishFileToken(state.metadata.model,"vehicle"):"vehicle"}_${new Date().toISOString().slice(0,10)}.json`;
      a.style.display="none";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),2000);
    }catch(err){
      console.error("Full-case backup failed",err);
      alert(locale==="fa"?"ساخت فایل پشتیبان JSON ناموفق بود. لطفاً دوباره تلاش کنید.":"The full-case JSON backup could not be created. Please try again.");
    }
  }
  function localizeAuditItem(value){
    const text=String(value||"");
    if(locale==="fa")return text;
    const exact={
      "تأیید نهایی و قفل پرونده":"Final approval and case lock",
      "بازگشایی پرونده برای ویرایش":"Case reopened for editing",
      "نام ارزیاب":"Evaluator name",
      "سابقه ارزیاب":"Evaluator work experience",
      "شماره تماس ارزیاب":"Evaluator phone number",
      "ایمیل ارزیاب":"Evaluator email address",
      "تاریخ ارزیابی":"Assessment date",
      "برند خودرو":"Vehicle make",
      "مدل خودرو":"Vehicle model",
      "شماره شاسی خودرو":"Vehicle identification number (VIN)",
      "کارکرد خودرو":"Odometer reading",
      "نظر نهایی ارزیاب":"Evaluator final comment",
      "نظر نهایی خبره":"Expert final comment",
      "نظر نهایی مدیریت":"Management final comment"
    };
    if(exact[text])return exact[text];
    let m=text.match(/^امتیاز سؤال\s*(.+)$/);if(m)return `Question ${m[1]} score`;
    m=text.match(/^یادداشت سؤال\s*(.+)$/);if(m)return `Question ${m[1]} note`;
    m=text.match(/^مستندات سؤال\s*(.+)$/);if(m)return `Question ${m[1]} attachments`;
    m=text.match(/^تصویر نمای\s*(.+)$/);if(m)return `Vehicle view image ${m[1]}`;
    m=text.match(/^وزن شاخص\s*(.+)$/);if(m)return `Criterion ${m[1]} weight`;
    if(text==="finalComments.evaluator")return "Evaluator final comment";
    if(text==="finalComments.expert")return "Expert final comment";
    if(text==="finalComments.manager")return "Management final comment";
    return text;
  }
  function renderManagerSectionTitles(){
    const fa=locale==="fa",set=(sel,text)=>{const el=document.querySelector(sel);if(el)el.textContent=text};
    set("#strengthWeaknessCard > .sectionTitle h2",fa?"جمع‌بندی نقاط قوت و ضعف":"Strengths and Weaknesses Summary");
    set("#strengthWeaknessCard > .sectionTitle p",fa?"خلاصه خودکار بر اساس میانگین شاخص‌های ارزیابی‌شده":"Automatic summary based on the assessed criteria and item scores");
    set("#strengthWeaknessCard .strengthPanel > h3",fa?"نقاط قوت اصلی":"Key Strengths");
    set("#strengthWeaknessCard .weaknessPanel > h3",fa?"نقاط ضعف و اولویت‌های بهبود":"Weaknesses and Improvement Priorities");
    set("#auditTrailCard > .sectionTitle h2",fa?"سوابق تأیید و تغییرات پرونده":"Approval and Case Revision History");
    set("#auditTrailCard > .sectionTitle p",fa?"ثبت شخص، زمان و شرح هر تغییر پس از تأیید نهایی":"Records the person, time, and description of each change after final approval");
  }
  function renderWorkflow(){
    ensureWorkflow();renderManagerSectionTitles();
    const authorized=canAuthorizedEdit(),authorization=activeAuthorization();
    document.body.classList.toggle("caseLocked",!!state.workflow.locked);
    document.body.classList.toggle("caseAuthorizedEdit",authorized);
    const btn=document.querySelector("#finalizeAssessmentButton"),unlock=document.querySelector("#unlockAssessmentButton");
    if(btn){
      btn.disabled=!!state.workflow.locked&&!authorized;
      btn.textContent=authorized&&currentRole==="evaluator"?(locale==="fa"?"تأیید اصلاحات و قفل پرونده":"Confirm revisions and lock case"):(state.workflow.locked?(locale==="fa"?"پرونده نهایی و قفل شده":"Assessment finalized and locked"):(locale==="fa"?"تأیید نهایی و قفل پرونده":"Finalize and lock assessment"));
    }
    if(unlock){
      unlock.hidden=!(currentRole==="manager"&&state.workflow.locked);
      unlock.textContent=authorization?(locale==="fa"?"تغییر مجوز ویرایش":"Change Edit Permission"):(locale==="fa"?"صدور مجوز ویرایش":"Grant Edit Permission");
    }
    const badge=document.querySelector("#caseLockBadge");if(badge){badge.className="caseLockBadge "+(authorized?"editing":state.workflow.locked?"locked":"");badge.textContent=authorized?(locale==="fa"?"مجاز برای اصلاح":"Authorized to revise"):state.workflow.locked?(locale==="fa"?"قفل‌شده":"Locked"):(locale==="fa"?"در حال ارزیابی":"In assessment")}
    const host=document.querySelector("#auditTrailList");if(host){host.innerHTML=state.auditTrail.length?[...state.auditTrail].reverse().map(e=>{const items=(e.items||[]).map(localizeAuditItem),sep=locale==="fa"?"، ":", ",reason=esc(e.reason||"—"),description=e.type==="finalize"?(locale==="fa"?"تأیید نهایی و قفل پرونده":"Final approval and case lock"):e.type==="edit_authorization"?(locale==="fa"?`صدور مجوز ویرایش برای ${esc(e.targetUser||"—")} (${e.targetRole==="expert"?"خبره":"ارزیاب"}) — دلیل: ${reason}`:`Edit permission granted to ${esc(e.targetUser||"—")} (${e.targetRole||"—"}) — Reason: ${reason}`):e.type==="unlock"?(locale==="fa"?`بازگشایی پرونده — دلیل: ${reason}`:`Case reopened — Reason: ${reason}`):(locale==="fa"?`ویرایش: ${items.map(esc).join(sep)}${e.reason?` — دلیل: ${esc(e.reason)}`:""}`:`Revision: ${items.map(esc).join(sep)}${e.reason?` — Reason: ${esc(e.reason)}`:""}`);return `<article class="auditEntry"><time>${new Date(e.at).toLocaleString(locale==="fa"?"fa-IR":"en-GB")}</time><strong>${esc(e.actor||"—")}</strong><p>${description}</p></article>`}).join(""):`<div class="auditEmpty">${locale==="fa"?"هنوز تأیید نهایی یا تغییری ثبت نشده است.":"No final approval or revision has been recorded."}</div>`}
  }
  function renderManagerReviewComments(){
    ensureWorkflow();
    const titleEl=document.querySelector("#managerReviewCommentsTitle"),hintEl=document.querySelector("#managerReviewCommentsHint"),evaluatorTitle=document.querySelector("#managerEvaluatorCommentTitle"),expertTitle=document.querySelector("#managerExpertCommentTitle"),evaluatorText=document.querySelector("#managerEvaluatorComment"),expertText=document.querySelector("#managerExpertComment");
    if(titleEl)titleEl.textContent=locale==="fa"?"نظر ارزیاب و خبره":"Evaluator and Expert Comments";
    if(hintEl)hintEl.textContent=locale==="fa"?"جمع‌بندی نهایی ثبت‌شده توسط ارزیاب و خبره":"Final comments recorded by the evaluator and expert";
    if(evaluatorTitle)evaluatorTitle.textContent=locale==="fa"?"نظر نهایی ارزیاب":"Evaluator Final Comment";
    if(expertTitle)expertTitle.textContent=locale==="fa"?"نظر نهایی خبره":"Expert Final Comment";
    const empty=locale==="fa"?"نظری ثبت نشده است.":"No comment has been recorded.";
    if(evaluatorText)evaluatorText.textContent=(state.finalComments.evaluator||"").trim()||empty;
    if(expertText)expertText.textContent=(state.finalComments.expert||"").trim()||empty;
  }
  function rowsForSummary(){return window.ASSESSMENT_CRITERIA.map(main=>{const vals=valuesForMain(main);return{main,avg:vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:NaN,count:vals.length}}).filter(r=>Number.isFinite(r.avg)).sort((a,b)=>b.avg-a.avg)}
  function renderStrengthsWeaknesses(){const fa=locale==="fa",rows=rowsForSummary(),strongGroup=rows.filter(r=>r.avg>=8),weakGroup=rows.filter(r=>r.avg<7).sort((a,b)=>a.avg-b.avg),strengths=strongGroup.length?strongGroup:rows.slice(0,3),weaknesses=weakGroup.length?weakGroup:[...rows].sort((a,b)=>a.avg-b.avg).slice(0,3),countLabel=n=>fa?`${localNumber(n)} شاخص`:`${localNumber(n)} ${n===1?"criterion":"criteria"}`,render=(items,weak)=>items.length?items.map(r=>`<div class="summaryPoint"><strong>${esc(title(r.main.titleFa,"main",r.main.id))}</strong><span>${fmt(r.avg*10)} ${fa?"از ۱۰۰":"out of 100"}</span><small>${fa?(weak?(r.avg<5?"عملکرد ضعیف و نیازمند اقدام اصلاحی":"اولویت بهبود و بررسی دقیق‌تر"):"عملکرد بسیار خوب در این دسته"):(weak?(r.avg<5?"Weak performance requiring corrective action":"Improvement priority requiring closer review"):"Very strong performance in this category")}</small></div>`).join(""):`<div class="auditEmpty">${fa?"شاخصی در این دسته قرار نگرفته است.":"No criterion falls into this category."}</div>`;const a=document.querySelector("#strengthList"),b=document.querySelector("#weaknessList");if(a)a.innerHTML=`<details class="performanceDetails"><summary><strong>${fa?"شاخص‌های دارای عملکرد بسیار خوب":"Criteria with Very Strong Performance"}</strong><span>${countLabel(strengths.length)}</span></summary><div>${render(strengths,false)}</div></details>`;if(b)b.innerHTML=`<details class="performanceDetails"><summary><strong>${fa?"شاخص‌های دارای امتیاز پایین":"Criteria with Lower Scores"}</strong><span>${countLabel(weaknesses.length)}</span></summary><div>${render(weaknesses,true)}</div></details>`}
  function renderMainCriterionDetails(){
    const mains=window.ASSESSMENT_CRITERIA.map(main=>({main,items:main.subgroups.flatMap(sub=>sub.items.map(item=>({sub,item,score:Number(state.scores[itemKey(main,sub,item)])})).filter(row=>Number.isFinite(row.score)))})).filter(group=>group.items.length);
    const pick=(items,levels)=>{const level=levels.find(n=>items.some(item=>item.score===n));return level===undefined?[]:items.filter(item=>item.score===level)};
    const strengths=mains.map(group=>({...group,items:pick(group.items,[10,9,8,7,6,5])})).filter(group=>group.items.length);
    const weaknesses=mains.map(group=>({...group,items:pick(group.items,[1,2,3,4,5])})).filter(group=>group.items.length);
    const render=(groups,weak)=>groups.length?groups.map(group=>{const fa=locale==="fa",level=group.items[0].score,scoreLevel=SCORE_LEVELS.find(x=>x.n===level),levelTitle=fa?(scoreLevel?.fa||""):(scoreLevel?.en||""),count=group.items.length,countText=fa?`${localNumber(count)} مورد`:`${localNumber(count)} ${count===1?"item":"items"}`;return `<details class="performanceDetails"><summary><strong>${esc(title(group.main.titleFa,"main",group.main.id))}</strong><span>${countText} — ${levelTitle}</span></summary><div>${group.items.map(row=>`<article class="summaryPoint"><strong>${esc(fa?(row.item.titleFa||itemTitle(row.item)):itemTitleEn(row.item))}</strong><span>${localNumber(row.score)} ${fa?"از ۱۰":"out of 10"}</span><small>${esc(title(row.sub.titleFa,"sub",row.sub.id))}</small></article>`).join("")}</div></details>`}).join(""):`<div class="auditEmpty">${locale==="fa"?(weak?"موردی با امتیاز ۵ یا پایین‌تر ثبت نشده است.":"موردی با امتیاز ۵ یا بالاتر ثبت نشده است."):(weak?"No item scored 5 or below.":"No item scored 5 or above.")}</div>`;
    const a=document.querySelector("#strengthList"),b=document.querySelector("#weaknessList");if(a)a.innerHTML=render(strengths,false);if(b)b.innerHTML=render(weaknesses,true);
  }
  const oldManagerRefresh=window.managerRefresh||managerRefresh;
  managerRefresh=function(...args){oldManagerRefresh(...args);renderManagerSectionTitles();renderMainCriterionDetails();renderManagerReviewComments();renderWorkflow()};window.managerRefresh=managerRefresh;
  renderQualityChart=function(){const values=Object.values(state.scores).map(Number).filter(Boolean),counts=[1,2,3,4,5,6,7,8,9,10].map(n=>values.filter(v=>v===n).length),max=Math.max(1,...counts),empty=locale==="fa"?"با ثبت امتیاز، توزیع کیفیت در این بخش نمایش داده می‌شود.":"The quality distribution will appear after scores are recorded.";document.querySelector("#qualityChart").innerHTML=values.length?counts.map((count,i)=>{const width=count/max*100,label=locale==="fa"?SCORE_LEVELS.find(x=>x.n===i+1).fa:SCORE_LEVELS.find(x=>x.n===i+1).en;return `<div class="qualityBar" dir="ltr"><span class="qualityLabel">${label}</span><div class="qualityTrack"><i style="--quality-width:${width}%;--quality-color:${scoreColor(i+1)}"></i><b class="qualityCount" style="--quality-count-position:${width}%">${localNumber(count)}</b></div></div>`}).join(""):`<p class="qualityEmpty">${empty}</p>`};
  renderChart=function(rows){const ranked=[...rows].filter(r=>Number.isFinite(r.avg)).sort((a,b)=>b.avg-a.avg),host=document.querySelector("#scoreChart"),empty=locale==="fa"?"پس از ثبت امتیازها، نمودار مقایسه‌ای در این بخش نمایش داده می‌شود.":"The comparative chart will appear after scores are recorded.";if(!ranked.length){host.innerHTML=`<p class="chartEmpty">${empty}</p>`;return}const min=Math.min(...ranked.map(r=>r.avg*10)),baseline=Math.max(0,Math.floor((min-10)/10)*10),range=100-baseline,colors=['#2463a5','#b54d66','#128778','#d58a24','#7454b8','#d9673a','#3e8c47','#ad5f99','#2c7d9a','#96733c','#5475b5','#b85c48','#4b9a91','#8f5c6b','#527e50'];host.innerHTML=ranked.map((r,i)=>{const v=r.avg*10,h=Math.max(3,(v-baseline)/range*100);return `<div class="barItem"><div class="barTrack" title="مقیاس نمایشی ${baseline} تا ۱۰۰"><b class="barEndValue" style="--bar-height:${h}%">${fmt(v)}</b><i style="height:${h}%;--bar:${colors[i%colors.length]}"></i></div><div class="barLabel"><span>${title(r.main.titleFa,"main",r.main.id)}</span></div></div>`}).join("");let note=host.nextElementSibling;if(!note||!note.classList.contains("chartZoomNote")){note=document.createElement("p");note.className="chartZoomNote";host.after(note)}note.textContent=locale==="fa"?`برای نمایش ملموس‌تر تفاوت‌ها، محور ارتفاع از ${localNumber(baseline)} تا ۱۰۰ نمایش داده شده است.`:`To highlight differences, the height axis is shown from ${baseline} to 100.`};
  function commentCard(role,roleClass){const titleFa={evaluator:"نظر نهایی ارزیاب",expert:"نظر نهایی خبره",manager:"نظر نهایی مدیریت"}[role],titleEn={evaluator:"Evaluator Final Comment",expert:"Expert Final Comment",manager:"Management Final Comment"}[role];return `<section class="card finalCommentCard ${roleClass} ${role}FinalCommentCard"><div class="sectionTitle"><div><h2>${locale==="fa"?titleFa:titleEn}</h2><p>${locale==="fa"?"در صورت نیاز، جمع‌بندی یا ملاحظه نهایی خود را ثبت کنید.":"Record an optional final conclusion or remark."}</p></div></div><textarea data-final-comment="${role}" placeholder="${locale==="fa"?"نظر نهایی را اینجا بنویسید…":"Write the final comment here…"}">${esc(state.finalComments[role]||"")}</textarea></section>`}
  function bindFinalComments(){document.querySelectorAll("[data-final-comment]").forEach(input=>{if(input.dataset.bound)return;input.dataset.bound="1";input.addEventListener("input",e=>{state.finalComments[e.target.dataset.finalComment]=e.target.value;persist()})})}
  function ensureFinalCommentPanels(){
    ensureWorkflow();
    if(!document.querySelector(".evaluatorFinalCommentCard")){const guide=document.querySelector(".scoreGuide");guide?.insertAdjacentHTML("beforebegin",commentCard("evaluator","evaluatorOnly"))}
    if(!document.querySelector(".managerFinalCommentCard")){const anchor=document.querySelector("#managerReviewComments");anchor?.insertAdjacentHTML("afterend",commentCard("manager","managerOnly"))}
    const expertPanel=document.querySelector("#expertPanel");if(expertPanel&&!expertPanel.querySelector(".expertFinalCommentCard"))expertPanel.insertAdjacentHTML("beforeend",commentCard("expert",""));
    const names=locale==="fa"?{evaluator:"نظر نهایی ارزیاب",expert:"نظر نهایی خبره",manager:"نظر نهایی مدیریت"}:{evaluator:"Evaluator Final Comment",expert:"Expert Final Comment",manager:"Management Final Comment"};document.querySelectorAll("[data-final-comment]").forEach(input=>{const role=input.dataset.finalComment,card=input.closest(".finalCommentCard");card.querySelector("h2").textContent=names[role];card.querySelector("p").textContent=locale==="fa"?"در صورت نیاز، جمع‌بندی یا ملاحظه نهایی خود را ثبت کنید.":"Record an optional final conclusion or remark.";input.placeholder=locale==="fa"?"نظر نهایی را اینجا بنویسید…":"Write the final comment here…";if(document.activeElement!==input)input.value=state.finalComments[role]||""});bindFinalComments();renderManagerReviewComments();
  }
  const oldRenderExpertPanel=window.renderExpertPanel;
  if(oldRenderExpertPanel){window.renderExpertPanel=function(){oldRenderExpertPanel();ensureFinalCommentPanels()};renderExpertPanel=window.renderExpertPanel}
  window.BAMCO_REFRESH_EDIT_PERMISSION_UI=renderWorkflow;
  window.BAMCO_COMPLETE_EDIT_AUTHORIZATION=function(role){
    ensureWorkflow();const a=activeAuthorization();
    if(!a||a.targetRole!==role||!canAuthorizedEdit())return;
    const completedAt=now();
    state.workflow.editAuthorization={...a,status:"completed",completedAt};
    const entry=[...state.auditTrail].reverse().find(e=>e?.type==="edit"&&e.sessionOpenedAt===a.grantedAt);
    if(entry){entry.at=completedAt;entry.pending=false;entry.items=[...new Set([...(entry.items||[]),role==="expert"?"اصلاح اطلاعات و وزن‌های خبره":"اصلاح ارزیابی ارزیاب"])]}
    state.workflow.editSession=null;
    saveDirect();renderWorkflow();
  };
  document.querySelector("#backupButton")?.addEventListener("click",backup);document.querySelector("#finalizeAssessmentButton")?.addEventListener("click",finalizeAssessment);document.querySelector("#unlockAssessmentButton")?.addEventListener("click",unlockAssessment);
  const baseSetLocale=setLocale;setLocale=function(next){baseSetLocale(next);const backupBtn=document.querySelector("#backupButton");if(backupBtn)backupBtn.textContent=locale==="fa"?"پشتیبان‌گیری کل پرونده":"Back up full case";ensureFinalCommentPanels();renderManagerSectionTitles();renderMainCriterionDetails();renderManagerReviewComments();renderWorkflow()};
  snapshot=clone(state);ensureFinalCommentPanels();renderManagerReviewComments();renderWorkflow();renderMainCriterionDetails();update();
})();

/* v13 — detect Latin values in evaluator/expert fields and keep their typography Latin in Persian mode. */
(()=>{
  const selector='.metadata input:not(.jalaliDateInput), .metadata textarea, #expertPanel input[data-expert-info], #expertPanel textarea';
  const hasLatinValue=value=>/[A-Za-z@]/.test(String(value||''));
  function syncLatinField(el){
    if(!el?.matches?.(selector))return;
    const latin=el.type==='email'||hasLatinValue(el.value);
    el.classList.toggle('latinValue',latin);
    if(latin)el.setAttribute('dir','ltr');
    else if(el.type!=='email')el.removeAttribute('dir');
  }
  function syncLatinFields(){document.querySelectorAll(selector).forEach(syncLatinField)}
  document.addEventListener('input',event=>syncLatinField(event.target),true);
  document.addEventListener('change',event=>syncLatinField(event.target),true);
  const expertPanel=document.querySelector('#expertPanel');
  if(expertPanel)new MutationObserver(syncLatinFields).observe(expertPanel,{childList:true,subtree:true});
  if(typeof renderMetadata==='function'){
    const baseRenderMetadata=renderMetadata;
    renderMetadata=function(...args){const result=baseRenderMetadata(...args);syncLatinFields();return result};
  }
  if(window.renderExpertPanel){
    const baseRenderExpertPanel=window.renderExpertPanel;
    window.renderExpertPanel=function(...args){const result=baseRenderExpertPanel(...args);syncLatinFields();return result};
    try{renderExpertPanel=window.renderExpertPanel}catch(_){}
  }
  syncLatinFields();
})();


/* v19 — management charts reflect active criterion weights, including zero weights */
(()=>{
  const weightedRows=rows=>{const list=(rows||[]).map(r=>({...r,weight:Math.max(0,Number(r.weight)||0)})),maxWeight=Math.max(0,...list.map(r=>r.weight));return list.map(r=>{const raw=Number.isFinite(r.avg100)?r.avg100:(Number.isFinite(r.avg)?r.avg*10:NaN),weighted=Number.isFinite(raw)&&maxWeight>0?raw*(r.weight/maxWeight):NaN;return{...r,raw100:raw,weightedVisual:Number.isFinite(weighted)?Math.max(0,Math.min(100,weighted)):NaN}})};
  const qualityShares=()=>{const buckets=Array(10).fill(0);let mass=0;(window.ASSESSMENT_CRITERIA||[]).forEach(main=>{const w=Math.max(0,Number(state.weights?.[main.id]??(1/(window.ASSESSMENT_CRITERIA?.length||15)))||0);if(w<=0)return;const vals=[];main.subgroups.forEach(sub=>sub.items.forEach(item=>{const n=Number(state.scores?.[itemKey(main,sub,item)]);if(n>=1&&n<=10)vals.push(n)}));if(!vals.length)return;mass+=w;const unit=w/vals.length;vals.forEach(n=>buckets[n-1]+=unit)});return mass>0?buckets.map(v=>v/mass*100):buckets};
  renderChart=function(rows){const data=weightedRows(rows).filter(r=>Number.isFinite(r.weightedVisual)).sort((a,b)=>b.weightedVisual-a.weightedVisual),host=document.querySelector('#scoreChart');if(!host)return;if(!data.length){host.innerHTML=`<p class="chartEmpty">${locale==='fa'?'پس از ثبت امتیازها، نمودار وزن‌دار در این بخش نمایش داده می‌شود.':'The weighted comparison chart will appear after scores are recorded.'}</p>`;return}const colors=['#2463a5','#b54d66','#128778','#d58a24','#7454b8','#d9673a','#3e8c47','#ad5f99','#2c7d9a','#96733c','#5475b5','#b85c48','#4b9a91','#8f5c6b','#527e50'];host.innerHTML=data.map((r,i)=>{const v=r.weightedVisual,h=v<=0?0:Math.max(3,v);return `<div class="barItem" title="${locale==='fa'?'امتیاز خام':'Raw score'}: ${fmt(r.raw100)} | ${locale==='fa'?'وزن':'Weight'}: ${localNumber(r.weight.toFixed(3))}"><div class="barTrack"><b class="barEndValue" style="--bar-height:${h}%">${fmt(v)}</b><i style="height:${h}%;--bar:${colors[i%colors.length]}"></i></div><div class="barLabel"><span>${title(r.main.titleFa,'main',r.main.id)}</span><small>${locale==='fa'?'وزن':'Weight'}: ${localNumber(r.weight.toFixed(3))}</small></div></div>`}).join('');let note=host.nextElementSibling;if(!note||!note.classList.contains('chartZoomNote')){note=document.createElement('p');note.className='chartZoomNote';host.after(note)}note.textContent=locale==='fa'?'ارتفاع هر ستون اثر نسبی امتیاز شاخص پس از اعمال وزن فعال را نشان می‌دهد؛ وزن صفر، ستون را به صفر می‌رساند.':'Bar height shows the relative criterion impact after applying the active weight; a zero weight produces zero impact.'};
  renderQualityChart=function(){const shares=qualityShares(),host=document.querySelector('#qualityChart'),max=Math.max(0,...shares);if(!host)return;if(max<=0){host.innerHTML=`<p class="qualityEmpty">${locale==='fa'?'با ثبت امتیاز، توزیع وزن‌دار کیفیت در این بخش نمایش داده می‌شود.':'The weighted quality distribution will appear after scores are recorded.'}</p>`;return}host.innerHTML=shares.map((share,i)=>{const width=share/max*100,label=locale==='fa'?SCORE_LEVELS.find(x=>x.n===i+1).fa:SCORE_LEVELS.find(x=>x.n===i+1).en;return `<div class="qualityBar" dir="ltr"><span class="qualityLabel">${label}</span><div class="qualityTrack"><i style="--quality-width:${width}%;--quality-color:${scoreColor(i+1)}"></i><b class="qualityCount" style="--quality-count-position:${width}%">${localNumber(share.toFixed(1))}%</b></div></div>`}).join('')};
  renderRadar=function(rows){const host=document.querySelector('#radarChart');if(!host)return;const data=weightedRows(rows),valid=data.filter(r=>Number.isFinite(r.weightedVisual));if(!valid.length){host.innerHTML=`<p class="chartEmpty">${locale==='fa'?'پس از ثبت امتیازها، نمودار عنکبوتی وزن‌دار نمایش داده می‌شود.':'The weighted radar chart will appear after scores are recorded.'}</p>`;return}const colors=['#2463a5','#b54d66','#128778','#d58a24','#7454b8','#d9673a','#3e8c47','#ad5f99','#2c7d9a','#96733c','#5475b5','#b85c48','#4b9a91','#8f5c6b','#527e50'],n=data.length,cx=380,cy=300,R=190,angle=i=>-Math.PI/2+i*2*Math.PI/n,point=(i,r)=>{const a=angle(i);return[cx+Math.cos(a)*r,cy+Math.sin(a)*r]},pts=r=>data.map((_,i)=>point(i,r).join(',')).join(' '),points=data.map((r,i)=>point(i,(Number.isFinite(r.weightedVisual)?r.weightedVisual:0)/100*R)),wedges=data.map((r,i)=>{const p1=point(i,R),p2=point((i+1)%n,R);return `<polygon points="${cx},${cy} ${p1.join(',')} ${p2.join(',')}" fill="${colors[i]}" opacity=".075"/>`}).join(''),axes=data.map((r,i)=>{const a=angle(i),ux=Math.cos(a),uy=Math.sin(a),[x,y]=point(i,R),[lx,ly]=point(i,R+72),[vx,vy]=points[i],name=title(r.main.titleFa,'main',r.main.id),words=name.split(/\s+/),cut=Math.ceil(words.length/2),lines=words.length>3?[words.slice(0,cut).join(' '),words.slice(cut).join(' ')]:[name],value=Number.isFinite(r.weightedVisual)?fmt(r.weightedVisual):'—',sx=vx+ux*18,sy=vy+uy*18,anchor=ux>.28?'start':ux<-.28?'end':'middle',baseline=uy>.55?'hanging':uy<-.55?'auto':'middle';return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" style="stroke:${colors[i]}88"/><circle cx="${vx}" cy="${vy}" r="5.5" fill="${colors[i]}" stroke="#fff" stroke-width="2"/><text x="${sx}" y="${sy}" text-anchor="${anchor}" dominant-baseline="${baseline}" class="radarValue" fill="${colors[i]}">${value}</text><text x="${lx}" y="${ly}" fill="${colors[i]}">${lines.map((line,j)=>`<tspan x="${lx}" dy="${j?15:0}">${esc(line)}</tspan>`).join('')}</text>`}).join('');host.innerHTML=`<svg viewBox="0 0 760 600" role="img" aria-label="${locale==='fa'?'نمودار عنکبوتی وزن‌دار شاخص‌ها':'Weighted criteria radar chart'}">${wedges}${[.2,.4,.6,.8,1].map(x=>`<polygon points="${pts(R*x)}" class="radarGrid"/>`).join('')}${axes}<polygon points="${points.map(p=>p.join(',')).join(' ')}" class="radarData"/></svg>`};
})();

;
/* guide.js */
(function(){
  const entry=document.querySelector('#entryScreen');
  const loginPanel=document.querySelector('#entryLoginPanel');
  const guidePanel=document.querySelector('#entryGuidePanel');
  const buttons=[...document.querySelectorAll('[data-entry-tab]')];
  if(!entry||!loginPanel||!guidePanel||!buttons.length)return;

  function selectTab(name){
    const guide=name==='guide';
    loginPanel.hidden=guide;
    guidePanel.hidden=!guide;
    entry.classList.toggle('guideMode',guide);
    buttons.forEach(button=>{
      const active=button.dataset.entryTab===name;
      button.classList.toggle('active',active);
      button.setAttribute('aria-selected',String(active));
      button.tabIndex=active?0:-1;
    });
    if(guide)window.scrollTo({top:0,behavior:'instant'});
  }

  buttons.forEach(button=>button.addEventListener('click',()=>selectTab(button.dataset.entryTab)));
  document.querySelectorAll('[data-guide-login]').forEach(button=>button.addEventListener('click',()=>selectTab('login')));
  document.querySelectorAll('[data-guide-role]').forEach(button=>button.addEventListener('click',()=>{
    selectTab('login');
    document.querySelector(`.roleChoice[data-role="${button.dataset.guideRole}"]`)?.focus();
  }));
  document.querySelector('#switchRoleButton')?.addEventListener('click',()=>selectTab('login'));
  selectTab('login');
})();

;
/* v20.js */
/* v20 — experience dropdowns, typography harmonization hooks, and calculation safeguards */
(()=>{
  const EXPERIENCE_OPTIONS=[
    {code:"lt1",fa:"کمتر از ۱ سال",en:"Less than 1 year"},
    {code:"1to3",fa:"۱ تا ۳ سال",en:"1–3 years"},
    {code:"3to5",fa:"۳ تا ۵ سال",en:"3–5 years"},
    {code:"5to10",fa:"۵ تا ۱۰ سال",en:"5–10 years"},
    {code:"10to15",fa:"۱۰ تا ۱۵ سال",en:"10–15 years"},
    {code:"gt15",fa:"بیش از ۱۵ سال",en:"More than 15 years"},
    {code:"other",fa:"سایر",en:"Other"}
  ];
  const byCode=code=>EXPERIENCE_OPTIONS.find(x=>x.code===code);
  const optionLabel=(code,lang=locale)=>byCode(code)?.[lang]||"";
  const placeholder=lang=>lang==="fa"?"انتخاب کنید":"Select";
  const otherPlaceholder=lang=>lang==="fa"?"سابقه کاری را وارد کنید":"Enter work experience";
  const optionMarkup=(selected,lang=locale)=>`<option value="">${placeholder(lang)}</option>${EXPERIENCE_OPTIONS.map(x=>`<option value="${x.code}" ${x.code===selected?"selected":""}>${x[lang]}</option>`).join("")}`;

  function migrateExperience(holder,legacyKey="experience"){
    if(!holder)return;
    if(holder.experienceCode===undefined){
      const legacy=String(holder[legacyKey]??"").trim();
      const match=EXPERIENCE_OPTIONS.find(x=>legacy===x.fa||legacy===x.en||legacy===x.code);
      if(match){holder.experienceCode=match.code;holder.experienceOther=holder.experienceOther||""}
      else if(legacy){holder.experienceCode="other";holder.experienceOther=holder.experienceOther||legacy}
      else {holder.experienceCode="";holder.experienceOther=holder.experienceOther||""}
    }
  }

  function experienceDisplay(holder,lang=locale){
    migrateExperience(holder);
    const code=holder?.experienceCode||"";
    if(code==="other")return String(holder?.experienceOther||"").trim();
    return optionLabel(code,lang);
  }

  window.getEvaluatorExperienceDisplay=(lang=locale)=>{
    const holder={
      experienceCode:state.metadata.evaluatorExperienceCode,
      experienceOther:state.metadata.evaluatorExperienceOther,
      experience:state.metadata.evaluatorExperience
    };
    migrateExperience(holder);
    return experienceDisplay(holder,lang);
  };
  window.getExpertExperienceDisplay=(lang=locale)=>experienceDisplay(expertState?.info||{},lang);

  function ensureEvaluatorExperienceState(){
    const holder={
      experienceCode:state.metadata.evaluatorExperienceCode,
      experienceOther:state.metadata.evaluatorExperienceOther,
      experience:state.metadata.evaluatorExperience
    };
    migrateExperience(holder);
    state.metadata.evaluatorExperienceCode=holder.experienceCode;
    state.metadata.evaluatorExperienceOther=holder.experienceOther;
    /* Keep a language-neutral legacy value for backward compatibility. */
    state.metadata.evaluatorExperience=holder.experienceCode==="other"?holder.experienceOther:holder.experienceCode;
  }

  function renderEvaluatorExperience(){
    ensureEvaluatorExperienceState();
    const select=document.querySelector('[data-experience-select="evaluator"]');
    const other=document.querySelector('[data-experience-other="evaluator"]');
    if(!select||!other)return;
    select.innerHTML=optionMarkup(state.metadata.evaluatorExperienceCode||"");
    select.value=state.metadata.evaluatorExperienceCode||"";
    select.setAttribute("aria-label",locale==="fa"?"سابقه کاری ارزیاب":"Evaluator work experience");
    other.hidden=select.value!=="other";
    other.placeholder=otherPlaceholder(locale);
    if(document.activeElement!==other)other.value=state.metadata.evaluatorExperienceOther||"";
    if(!select.dataset.boundV20){
      select.dataset.boundV20="1";
      select.addEventListener("change",()=>{
        state.metadata.evaluatorExperienceCode=select.value;
        if(select.value!=="other")state.metadata.evaluatorExperience=select.value;
        else state.metadata.evaluatorExperience=state.metadata.evaluatorExperienceOther||"";
        other.hidden=select.value!=="other";
        if(!other.hidden){other.focus();}
        persist();
      });
    }
    if(!other.dataset.boundV20){
      other.dataset.boundV20="1";
      other.addEventListener("input",()=>{
        state.metadata.evaluatorExperienceOther=other.value;
        state.metadata.evaluatorExperience=other.value;
        persist();
      });
    }
  }

  /* Expert work-experience field uses the same controlled list. */
  expertText.fa.incomplete="اطلاعات ضروری خبره را تکمیل کنید و حداقل شماره تماس یا ایمیل را وارد کنید.";
  const baseExpertField=expertField;
  expertField=function(key,type="text"){
    if(key!=="experience")return baseExpertField(key,type);
    migrateExperience(expertState.info);
    const code=expertState.info.experienceCode||"";
    const other=String(expertState.info.experienceOther||"");
    return `<label class="expertExperienceField"><span>${et("experience")}</span><select class="expertExperienceSelect" data-expert-experience-select aria-label="${esc(et("experience"))}">${optionMarkup(code)}</select><input class="expertExperienceOther" data-expert-experience-other type="text" value="${esc(other)}" placeholder="${esc(otherPlaceholder(locale))}" ${code==="other"?"":"hidden"}></label>`;
  };

  function expertInfoComplete(){
    migrateExperience(expertState.info);
    const required=["name","specialty","position","organization","completionDate"];
    const base=required.every(k=>String(expertState.info?.[k]||"").trim());
    const exp=expertState.info.experienceCode==="other"?String(expertState.info.experienceOther||"").trim():String(expertState.info.experienceCode||"").trim();
    const contact=String(expertState.info.phone||"").trim()||String(expertState.info.email||"").trim();
    return !!(base&&exp&&contact);
  }
  window.expertInfoComplete=expertInfoComplete;

  renderExpertStatus=function(){
    const total=expertTotal(),validTotal=Math.abs(total-1)<1e-9,weightsComplete=expertWeightsComplete(),infoComplete=expertInfoComplete();
    const status=document.querySelector("#expertWeightStatus");if(!status)return;
    const kind=validTotal?(infoComplete?"valid":"low"):(total<1?"low":"high");
    const remaining=1-total;
    const totalValue=document.querySelector("#expertTotalValue"),remainingValue=document.querySelector("#expertRemainingValue");
    if(totalValue)totalValue.textContent=shownWeight(total.toFixed(3));
    if(remainingValue)remainingValue.textContent=shownWeight((Math.abs(remaining)<1e-9?0:remaining).toFixed(3));
    status.className=`expertWeightStatus ${kind}`;
    status.textContent=validTotal&&!infoComplete?et("incomplete"):et(validTotal?"valid":(total<1?"low":"high"));
    const confirmButton=document.querySelector("#expertConfirmButton"),excelButton=document.querySelector("#expertExcelButton");
    const ready=validTotal&&weightsComplete&&infoComplete;
    if(confirmButton)confirmButton.disabled=!ready;
    if(excelButton)excelButton.disabled=!(ready&&expertState.confirmed);
  };

  function bindExpertExperience(){
    migrateExperience(expertState.info);
    const select=document.querySelector("[data-expert-experience-select]");
    const other=document.querySelector("[data-expert-experience-other]");
    if(!select||!other)return;
    select.value=expertState.info.experienceCode||"";
    other.hidden=select.value!=="other";
    other.placeholder=otherPlaceholder(locale);
    if(!select.dataset.boundV20){
      select.dataset.boundV20="1";
      select.addEventListener("change",()=>{
        expertState.info.experienceCode=select.value;
        expertState.info.experience=select.value==="other"?(expertState.info.experienceOther||""):select.value;
        other.hidden=select.value!=="other";
        expertState.confirmed=false;persistExpert();renderExpertStatus();
        if(!other.hidden)other.focus();
      });
    }
    if(!other.dataset.boundV20){
      other.dataset.boundV20="1";
      other.addEventListener("input",()=>{
        expertState.info.experienceOther=other.value;
        expertState.info.experience=other.value;
        expertState.confirmed=false;persistExpert();renderExpertStatus();
      });
    }
    renderExpertStatus();
  }

  const previousExpertRender=window.renderExpertPanel;
  window.renderExpertPanel=function(...args){
    const out=previousExpertRender?.(...args);
    bindExpertExperience();
    return out;
  };
  try{renderExpertPanel=window.renderExpertPanel}catch(_){}

  /* Use the mathematically proportional item mass for the weighted quality chart.
     Each answered item receives criterionWeight / totalItemsInCriterion, so a
     partially completed criterion cannot temporarily carry its full criterion mass. */
  renderQualityChart=function(){
    const buckets=Array(10).fill(0);let answeredMass=0;
    const criteria=window.ASSESSMENT_CRITERIA||[];
    criteria.forEach(main=>{
      const weight=Math.max(0,Number(state.weights?.[main.id]??(1/(criteria.length||15)))||0);
      if(weight<=0)return;
      const allItems=main.subgroups.flatMap(sub=>sub.items.map(item=>({sub,item})));
      const unit=allItems.length?weight/allItems.length:0;
      allItems.forEach(({sub,item})=>{
        const n=Number(state.scores?.[itemKey(main,sub,item)]);
        if(n>=1&&n<=10){buckets[n-1]+=unit;answeredMass+=unit;}
      });
    });
    const shares=answeredMass>0?buckets.map(v=>v/answeredMass*100):buckets;
    const host=document.querySelector("#qualityChart"),max=Math.max(0,...shares);if(!host)return;
    if(max<=0){host.innerHTML=`<p class="qualityEmpty">${locale==="fa"?"با ثبت امتیاز، توزیع وزن‌دار کیفیت در این بخش نمایش داده می‌شود.":"The weighted quality distribution will appear after scores are recorded."}</p>`;return}
    host.innerHTML=shares.map((share,i)=>{const width=share/max*100,label=locale==="fa"?SCORE_LEVELS.find(x=>x.n===i+1).fa:SCORE_LEVELS.find(x=>x.n===i+1).en;return `<div class="qualityBar" dir="ltr"><span class="qualityLabel">${label}</span><div class="qualityTrack"><i style="--quality-width:${width}%;--quality-color:${scoreColor(i+1)}"></i><b class="qualityCount" style="--quality-count-position:${width}%">${localNumber(share.toFixed(1))}%</b></div></div>`}).join("");
  };

  /* Small internal calculation audit used during development and retained for diagnostics. */
  function calculationAudit(){
    const criteria=window.ASSESSMENT_CRITERIA||[];
    const defaultWeight=criteria.length?1/criteria.length:0;
    const defaultTotal=criteria.reduce(s=>s+defaultWeight,0);
    const active=criteria.map(main=>Math.max(0,Number(state.weights?.[main.id]??defaultWeight)||0));
    const activeTotal=active.reduce((a,b)=>a+b,0);
    const zeroWeights=active.filter(x=>x===0).length;
    return {
      criteriaCount:criteria.length,
      defaultWeightsSumToOne:Math.abs(defaultTotal-1)<1e-12,
      activeWeightTotal:Number(activeTotal.toFixed(12)),
      activeWeightsValid:Math.abs(activeTotal-1)<1e-9,
      zeroWeights,
      expertConfirmed:!!expertState?.confirmed,
      expertInfoComplete:expertInfoComplete(),
      managerSource:typeof managerWeightState!=="undefined"?managerWeightState.activeSource:"default"
    };
  }
  window.BAMCOCalculationAudit=calculationAudit;

  const previousSetLocale=setLocale;
  setLocale=function(next){
    previousSetLocale(next);
    renderEvaluatorExperience();
    if(currentRole==="expert")window.renderExpertPanel?.();
  };

  const previousRenderMetadata=renderMetadata;
  renderMetadata=function(...args){const out=previousRenderMetadata(...args);renderEvaluatorExperience();return out};

  ensureEvaluatorExperienceState();
  migrateExperience(expertState.info);
  if(expertState.confirmed&&!expertState.confirmedSnapshot){expertState.confirmedSnapshot={weights:{...expertState.weights},info:{...expertState.info},confirmedAt:null};}
  persistExpert();
  renderEvaluatorExperience();
})();

;
/* v21.js */
/* v21 — weighted-count distribution, zero-weight filtering, compact chart labels, and scoring-guide layout */
(()=>{
  const criteria=()=>window.ASSESSMENT_CRITERIA||[];
  const activeNormalizedWeights=()=>{
    const list=criteria();
    const raw=list.map(main=>Math.max(0,Number(state.weights?.[main.id])||0));
    const total=raw.reduce((a,b)=>a+b,0);
    if(total>0)return raw.map(v=>v/total);
    return list.map(()=>list.length?1/list.length:0);
  };
  const shownWeightedCount=v=>{
    const rounded=Math.round(v);
    return localNumber(Math.abs(v-rounded)<0.05?String(rounded):v.toFixed(1));
  };

  /* Keep the distribution weight-sensitive, but display a numeric weighted frequency rather than percentages. */
  renderQualityChart=function(){
    const list=criteria(),weights=activeNormalizedWeights(),buckets=Array(10).fill(0);
    let answeredMass=0,answeredCount=0;
    list.forEach((main,index)=>{
      const weight=weights[index]||0;
      if(weight<=0)return;
      const allItems=main.subgroups.flatMap(sub=>sub.items.map(item=>({sub,item})));
      const unit=allItems.length?weight/allItems.length:0;
      allItems.forEach(({sub,item})=>{
        const n=Number(state.scores?.[itemKey(main,sub,item)]);
        if(n>=1&&n<=10){buckets[n-1]+=unit;answeredMass+=unit;answeredCount++;}
      });
    });
    const counts=answeredMass>0?buckets.map(v=>v/answeredMass*answeredCount):buckets;
    const host=document.querySelector('#qualityChart');if(!host)return;
    const max=Math.max(0,...counts);
    if(max<=0){
      host.innerHTML=`<p class="qualityEmpty" dir="${locale==='fa'?'rtl':'ltr'}">${locale==='fa'?'با ثبت امتیاز، توزیع وزن‌دار کیفیت در این بخش نمایش داده می‌شود.':'The weighted quality distribution will appear after scores are recorded.'}</p>`;
      return;
    }
    host.innerHTML=counts.map((count,i)=>{
      const width=count/max*100;
      const level=SCORE_LEVELS.find(x=>x.n===i+1);
      const label=locale==='fa'?level.fa:level.en;
      return `<div class="qualityBar" dir="ltr"><span class="qualityLabel">${label}</span><div class="qualityTrack"><i style="--quality-width:${width}%;--quality-color:${scoreColor(i+1)}"></i><b class="qualityCount" style="--quality-count-position:${width}%">${shownWeightedCount(count)}</b></div></div>`;
    }).join('');
  };

  /* Same weighted bar logic as v19, without weight text in the column label or the explanatory note below the chart. */
  const weightedRows=rows=>{
    const list=(rows||[]).map(r=>({...r,weight:Math.max(0,Number(r.weight)||0)}));
    const maxWeight=Math.max(0,...list.map(r=>r.weight));
    return list.map(r=>{
      const raw=Number.isFinite(r.avg100)?r.avg100:(Number.isFinite(r.avg)?r.avg*10:NaN);
      const weighted=Number.isFinite(raw)&&maxWeight>0?raw*(r.weight/maxWeight):NaN;
      return {...r,raw100:raw,weightedVisual:Number.isFinite(weighted)?Math.max(0,Math.min(100,weighted)):NaN};
    });
  };
  renderChart=function(rows){
    const data=weightedRows(rows).filter(r=>Number.isFinite(r.weightedVisual)).sort((a,b)=>b.weightedVisual-a.weightedVisual);
    const host=document.querySelector('#scoreChart');if(!host)return;
    host.parentElement?.querySelector('.chartZoomNote')?.remove();
    if(!data.length){host.innerHTML=`<p class="chartEmpty" dir="${locale==='fa'?'rtl':'ltr'}">${locale==='fa'?'پس از ثبت امتیازها، نمودار وزن‌دار در این بخش نمایش داده می‌شود.':'The weighted comparison chart will appear after scores are recorded.'}</p>`;return;}
    const colors=['#2463a5','#b54d66','#128778','#d58a24','#7454b8','#d9673a','#3e8c47','#ad5f99','#2c7d9a','#96733c','#5475b5','#b85c48','#4b9a91','#8f5c6b','#527e50'];
    host.innerHTML=data.map((r,i)=>{
      const v=r.weightedVisual,h=v<=0?0:Math.max(3,v);
      return `<div class="barItem" title="${locale==='fa'?'امتیاز خام':'Raw score'}: ${fmt(r.raw100)}"><div class="barTrack"><b class="barEndValue" style="--bar-height:${h}%">${fmt(v)}</b><i style="height:${h}%;--bar:${colors[i%colors.length]}"></i></div><div class="barLabel"><span>${title(r.main.titleFa,'main',r.main.id)}</span></div></div>`;
    }).join('');
  };

  /* Exclude criteria with zero active weight from strengths and weaknesses. */
  function renderWeightedStrengthWeakness(){
    const fa=locale==='fa',weights=activeNormalizedWeights();
    const groups=criteria().map((main,index)=>{
      if((weights[index]||0)<=0)return null;
      const items=main.subgroups.flatMap(sub=>sub.items.map(item=>({sub,item,score:Number(state.scores?.[itemKey(main,sub,item)])})).filter(row=>Number.isFinite(row.score)));
      return items.length?{main,items}:null;
    }).filter(Boolean);
    const pick=(items,levels)=>{const level=levels.find(n=>items.some(item=>item.score===n));return level===undefined?[]:items.filter(item=>item.score===level)};
    const strengths=groups.map(group=>({...group,items:pick(group.items,[10,9,8,7,6])})).filter(group=>group.items.length);
    const weaknesses=groups.map(group=>({...group,items:pick(group.items,[1,2,3,4,5])})).filter(group=>group.items.length);
    const render=(items,weak)=>items.length?items.map(group=>{
      const level=group.items[0].score,scoreLevel=SCORE_LEVELS.find(x=>x.n===level),levelTitle=fa?(scoreLevel?.fa||''):(scoreLevel?.en||''),count=group.items.length,countText=fa?`${localNumber(count)} مورد`:`${localNumber(count)} ${count===1?'item':'items'}`;
      return `<details class="performanceDetails"><summary><strong>${esc(title(group.main.titleFa,'main',group.main.id))}</strong><span>${countText} — ${levelTitle}</span></summary><div>${group.items.map(row=>`<article class="summaryPoint"><strong>${esc(fa?(row.item.titleFa||itemTitle(row.item)):itemTitleEn(row.item))}</strong><span>${localNumber(row.score)} ${fa?'از ۱۰':'out of 10'}</span><small>${esc(title(row.sub.titleFa,'sub',row.sub.id))}</small></article>`).join('')}</div></details>`;
    }).join(''):`<div class="auditEmpty">${fa?(weak?'موردی با امتیاز ۵ یا پایین‌تر در شاخص‌های دارای وزن ثبت نشده است.':'موردی با امتیاز ۶ یا بالاتر در شاخص‌های دارای وزن ثبت نشده است.'):(weak?'No item scored 5 or below in a criterion with active weight.':'No item scored 6 or above in a criterion with active weight.')}</div>`;
    const a=document.querySelector('#strengthList'),b=document.querySelector('#weaknessList');
    if(a)a.innerHTML=render(strengths,false);
    if(b)b.innerHTML=render(weaknesses,true);
  }
  const previousManagerRefresh=window.managerRefresh||managerRefresh;
  managerRefresh=function(...args){const out=previousManagerRefresh(...args);renderWeightedStrengthWeakness();document.querySelector('.chartZoomNote')?.remove();return out};
  window.managerRefresh=managerRefresh;

  /* Two true columns: right 10→6, left 5→1. */
  renderScoreGuide=function(){
    const guide=document.querySelector('#scoreGuideGrid');if(!guide)return;
    const card=level=>`<article class="guideLevel score-${level.n}"><div><strong style="background:${scoreColor(level.n)}">${localNumber(level.n)}</strong><b>${locale==='fa'?level.fa:level.en}</b></div><p>${locale==='fa'?level.desc:SCORE_DESCRIPTIONS_EN[level.n-1]}</p></article>`;
    const right=[10,9,8,7,6].map(n=>SCORE_LEVELS.find(x=>x.n===n));
    const left=[5,4,3,2,1].map(n=>SCORE_LEVELS.find(x=>x.n===n));
    guide.innerHTML=`<div class="scoreGuideColumn scoreGuideHigh">${right.map(card).join('')}</div><div class="scoreGuideColumn scoreGuideLow">${left.map(card).join('')}</div>`;
  };

  try{
    T.fa.qualityDistributionHint='فراوانی وزن‌دار امتیازهای ۱ تا ۱۰ بر اساس وزن فعال شاخص‌ها';
    T.en.qualityDistributionHint='Weighted numeric frequency of scores from 1 to 10 based on the active criterion weights';
  }catch(_){}

  /* Remove the old v19 note if it already exists, then render the revised guide immediately. */
  document.querySelectorAll('.chartZoomNote').forEach(el=>el.remove());
  renderScoreGuide();
  if(typeof update==='function')update();
})();
