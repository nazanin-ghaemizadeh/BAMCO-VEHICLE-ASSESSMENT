/* v51 — in-app criterion comparison drill-down + visually integrated middle review band */
(()=>{
  const MULTI_KEY='bamco-multi-vehicle-comparisons';
  let detailCriterionIndex=null;
  const safeEsc=value=>typeof esc==='function'?esc(String(value??'')):String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const number=value=>typeof localNumber==='function'?localNumber(value):String(value);
  const criterionName=main=>typeof title==='function'?title(main.titleFa,'main',main.id):(main.titleFa||main.id);
  const subgroupName=sub=>typeof title==='function'?title(sub.titleFa,'sub',sub.id):(sub.titleFa||sub.id);
  const itemName=(item,fa)=>fa?(item.titleFa||item.textFa||item.id):(typeof itemTitleEn==='function'?itemTitleEn(item):(item.titleEn||item.titleFa||item.id));
  const scoreLevel=(n,fa)=>{const list=typeof SCORE_LEVELS!=='undefined'?SCORE_LEVELS:[];const level=list.find(x=>x.n===n);return fa?(level?.fa||''):(level?.en||'')};
  const signed=value=>{if(!Number.isFinite(value))return '—';const n=Number(value.toFixed(2));return number(`${n>0?'+':''}${n.toFixed(2)}`)};

  function injectV51Styles(){
    let style=document.querySelector('#bamco-v50-styles');
    if(!style){style=document.createElement('style');style.id='bamco-v50-styles';document.head.appendChild(style)}
    style.textContent=`
      #strengthWeaknessCard .strengthWeaknessGrid{grid-template-columns:repeat(3,minmax(0,1fr))!important;align-items:stretch}
      #strengthWeaknessCard .reviewPanel{padding:18px;border-radius:15px;background:#fff8e9;border:1px solid #efddb1;min-width:0}
      #strengthWeaknessCard .reviewPanel>h3{margin:0 0 12px;color:#8a6500;font-size:inherit}
      #strengthWeaknessCard .reviewPanel .performanceDetails{background:#fff;border-color:#ead9ad}
      .comparisonRadarPane svg .radarDrillTarget{stroke:transparent;stroke-width:22;pointer-events:stroke;cursor:pointer}
      .comparisonRadarPane svg text[data-radar-detail-index]{cursor:pointer}
      .comparisonRadarPane svg text[data-radar-detail-index]:hover{font-weight:900!important}
      .radarInteractionHint{display:flex;align-items:center;gap:8px;margin-top:7px;color:#496b82;font-weight:800;font-size:12px}
      .radarInteractionHint::before{content:'↙';display:inline-grid;place-items:center;width:22px;height:22px;border-radius:7px;background:#eaf4f8;color:#176d91;font-family:"Times New Roman",serif}
      .comparisonCriterionDetail{margin-top:16px;min-width:0}
      .comparisonDetailHeader{margin-bottom:16px}
      .comparisonDetailHeader .comparisonWorkspaceTitle h3{margin:0 0 5px;color:#163f63;font-size:19px}
      .comparisonDetailHeader .comparisonWorkspaceTitle p{margin:0;color:#63798b;line-height:1.65}
      .comparisonDetailSummary{margin-top:0!important}
      .comparisonDetailTable{margin-top:16px!important}
      .comparisonDetailHead .detailVehicleHead{display:grid;gap:2px;justify-items:center;min-width:0}
      .comparisonDetailHead .detailVehicleHead b{font-weight:900;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
      .comparisonDetailHead .detailVehicleHead small{font-size:10px;color:#d9eef2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
      .comparisonDetailRow{--row-accent:#16877e}
      .comparisonDetailRow .detailSubgroup{color:#4e697d;font-weight:800;line-height:1.55}
      .comparisonDetailItem{display:grid;gap:3px}
      .comparisonDetailItem>small{font-weight:400;color:#718493;line-height:1.55}
      .comparisonDetailRow .multiVehicleScore small:last-child{color:#6b7e8e!important;font-weight:700;font-family:inherit}
      .comparisonDetailEmpty{padding:30px 16px;text-align:center;color:#6e8293}
      .comparisonCriterionDetail[hidden]{display:none!important}
      @media(max-width:1050px){#strengthWeaknessCard .strengthWeaknessGrid{grid-template-columns:1fr!important}}
    `;
  }

  function activeCriteriaGroups(){
    const list=window.ASSESSMENT_CRITERIA||[];
    const raw=list.map(main=>Math.max(0,Number(state?.weights?.[main.id])||0));
    const total=raw.reduce((a,b)=>a+b,0);
    return list.map((main,index)=>({main,active:total>0?raw[index]>0:true})).filter(x=>x.active);
  }

  function ensureReviewPanel(){
    const grid=document.querySelector('#strengthWeaknessCard .strengthWeaknessGrid');if(!grid)return null;
    let panel=grid.querySelector('.reviewPanel');
    if(!panel){panel=document.createElement('div');panel.className='reviewPanel';panel.innerHTML='<h3 id="reviewBandTitle"></h3><div id="reviewBandList"></div>';const weakness=grid.querySelector('.weaknessPanel');weakness?grid.insertBefore(panel,weakness):grid.appendChild(panel)}
    return panel;
  }

  function renderReviewBand(){
    const panel=ensureReviewPanel();if(!panel)return;const fa=locale==='fa';
    panel.querySelector('#reviewBandTitle').textContent=fa?'موارد نیازمند بررسی و بهبود':'Items Requiring Review and Improvement';
    const host=panel.querySelector('#reviewBandList');
    const groups=activeCriteriaGroups().map(({main})=>{const items=[];main.subgroups.forEach(sub=>sub.items.forEach(item=>{const score=Number(state?.scores?.[itemKey(main,sub,item)]);if(Number.isFinite(score)&&score>=4&&score<=7)items.push({sub,item,score})}));items.sort((a,b)=>a.score-b.score);return items.length?{main,items}:null}).filter(Boolean);
    if(!groups.length){host.innerHTML=`<div class="auditEmpty">${fa?'موردی با امتیاز ۴ تا ۷ در شاخص‌های دارای وزن ثبت نشده است.':'No item scored from 4 to 7 in a criterion with active weight.'}</div>`;return}
    host.innerHTML=groups.map(group=>{const count=group.items.length,countText=fa?`${number(count)} مورد`:`${number(count)} ${count===1?'item':'items'}`;return `<details class="performanceDetails"><summary><strong>${safeEsc(criterionName(group.main))}</strong><span>${countText} — ${fa?'امتیازهای ۴ تا ۷':'scores 4–7'}</span></summary><div>${group.items.map(row=>`<article class="summaryPoint"><strong>${safeEsc(itemName(row.item,fa))}</strong><span>${number(row.score)} ${fa?'از ۱۰':'out of 10'}</span><small>${safeEsc(subgroupName(row.sub))} · ${safeEsc(scoreLevel(row.score,fa))}</small></article>`).join('')}</div></details>`}).join('');
  }

  function storedComparisonCases(){try{const data=JSON.parse(sessionStorage.getItem(MULTI_KEY)||'[]');return Array.isArray(data)?data.filter(Boolean):[]}catch(_){return []}}
  function allCases(){
    const fa=locale==='fa';
    const current={state:{metadata:{...(state?.metadata||{})},scores:{...(state?.scores||{})}},kind:'current'};
    return [current,...storedComparisonCases().map(item=>({state:item.state||{},kind:'comparison'}))].map((record,index)=>{
      const meta=record.state?.metadata||{};
      const vehicle=[meta.brand,meta.model].filter(Boolean).join(' ').trim()||(index===0?(fa?'خودروی فعلی':'Current Vehicle'):(fa?`خودروی مقایسه‌ای ${number(index)}`:`Comparison Vehicle ${index}`));
      return {...record,vehicle,evaluator:meta.evaluator||'—'};
    });
  }
  function criterionStats(caseState,main){
    const values=[];main.subgroups.forEach(sub=>sub.items.forEach(item=>{const n=Number(caseState?.scores?.[itemKey(main,sub,item)]);if(Number.isFinite(n)&&n>0)values.push(n)}));
    return {avg:values.length?values.reduce((a,b)=>a+b,0)/values.length:NaN,answered:values.length,total:main.subgroups.reduce((sum,sub)=>sum+sub.items.length,0)};
  }

  function ensureDetailView(){
    const card=document.querySelector('#managerComparisonCard');if(!card)return null;
    let detail=card.querySelector('#comparisonCriterionDetail');
    if(!detail){
      detail=document.createElement('section');detail.id='comparisonCriterionDetail';detail.className='comparisonCriterionDetail';detail.hidden=true;
      detail.innerHTML=`<div class="comparisonWorkspaceHeader comparisonDetailHeader"><button class="comparisonBackButton" id="backToComparisonOverview" type="button"></button><div class="comparisonWorkspaceTitle"><h3 id="comparisonDetailTitle"></h3><p id="comparisonDetailHint"></p></div><span></span></div><div id="comparisonDetailBody"></div>`;
      card.appendChild(detail);
      detail.querySelector('#backToComparisonOverview').addEventListener('click',closeCriterionDetails);
    }
    return detail;
  }

  function renderCriterionDetails(){
    if(detailCriterionIndex===null)return;
    const detail=ensureDetailView(),main=(window.ASSESSMENT_CRITERIA||[])[detailCriterionIndex];if(!detail||!main)return;
    const fa=locale==='fa',cases=allCases(),stats=cases.map(record=>criterionStats(record.state,main)),baseAvg=stats[0]?.avg;
    detail.querySelector('#backToComparisonOverview').textContent=fa?'بازگشت به مقایسه':'Back to Comparison';
    detail.querySelector('#comparisonDetailTitle').textContent=criterionName(main);
    detail.querySelector('#comparisonDetailHint').textContent=fa?'مقایسه امتیازهای ثبت‌شده توسط ارزیاب برای این شاخص در همه خودروها':'Side-by-side evaluator scores for this criterion across all vehicles';
    const body=detail.querySelector('#comparisonDetailBody');
    const scoreCards=cases.map((record,index)=>{const st=stats[index],diff=index&&Number.isFinite(st.avg)&&Number.isFinite(baseAvg)?st.avg-baseAvg:NaN;return `<article><small>${index===0?(fa?'خودروی فعلی':'Current Vehicle'):(fa?'خودروی مقایسه‌ای':'Comparison Vehicle')}</small><strong>${safeEsc(record.vehicle)}</strong><b>${Number.isFinite(st.avg)?fmt(st.avg):'—'} <em>/ ${number(10)}</em></b><span>${fa?'ارزیاب':'Evaluator'}: ${safeEsc(record.evaluator)}</span><span>${fa?'تکمیل این شاخص':'Criterion completion'}: ${number(st.answered)} / ${number(st.total)}</span>${index?`<span class="comparisonCardDiff ${Number.isFinite(diff)?(diff>0?'positive':diff<0?'negative':'equal'):''}" dir="ltr">Δ ${signed(diff)}</span>`:''}</article>`}).join('');
    const rows=[];main.subgroups.forEach(sub=>sub.items.forEach(item=>rows.push({sub,item,key:itemKey(main,sub,item)})));
    const grid=`58px minmax(175px,.78fr) minmax(300px,1.55fr) repeat(${cases.length},minmax(145px,.76fr))`,minWidth=535+cases.length*155;
    const head=`<div class="comparisonHead managementStyleComparisonHead comparisonDetailHead" style="grid-template-columns:${grid}!important;min-width:${minWidth}px!important"><span>${fa?'ردیف':'No.'}</span><span>${fa?'زیرشاخص':'Sub-criterion'}</span><strong>${fa?'مورد ارزیابی':'Assessment item'}</strong>${cases.map(record=>`<span class="detailVehicleHead"><b>${safeEsc(record.vehicle)}</b><small>${fa?'ارزیاب':'Evaluator'}: ${safeEsc(record.evaluator)}</small></span>`).join('')}</div>`;
    const tableRows=rows.map((row,rowIndex)=>{
      const baseScore=Number(cases[0]?.state?.scores?.[row.key]);
      const cells=cases.map((record,index)=>{const score=Number(record.state?.scores?.[row.key]),valid=Number.isFinite(score)&&score>0,diff=index&&valid&&Number.isFinite(baseScore)&&baseScore>0?score-baseScore:NaN;return `<span class="comparisonVehicleScore multiVehicleScore"><b>${valid?number(score):'—'}</b>${index?`<small class="${Number.isFinite(diff)?(diff>0?'positive':diff<0?'negative':'equal'):''}" dir="ltr">${Number.isFinite(diff)?`Δ ${signed(diff)}`:'—'}</small>`:''}<small>${valid?safeEsc(scoreLevel(score,fa)):'—'}</small></span>`}).join('');
      const description=row.item.textFa&&row.item.textFa!==row.item.titleFa?`<small>${safeEsc(row.item.textFa)}</small>`:'';
      return `<article class="comparisonRow managementStyleComparisonRow comparisonDetailRow" style="grid-template-columns:${grid}!important;min-width:${minWidth}px!important"><span class="comparisonRowNumber">${number(rowIndex+1)}</span><span class="detailSubgroup">${safeEsc(subgroupName(row.sub))}</span><strong class="comparisonCriterion comparisonDetailItem">${safeEsc(itemName(row.item,fa))}${description}</strong>${cells}</article>`;
    }).join('');
    body.innerHTML=`<div class="comparisonScoreGrid multiComparisonScoreGrid comparisonDetailSummary">${scoreCards}</div><div class="comparisonTable managementStyleComparisonTable multiVehicleComparisonTable comparisonDetailTable">${head}${tableRows||`<div class="comparisonDetailEmpty">${fa?'موردی برای نمایش وجود ندارد.':'There are no items to display.'}</div>`}</div>`;
  }

  function openCriterionDetails(criterionIndex){
    detailCriterionIndex=criterionIndex;const card=document.querySelector('#managerComparisonCard'),detail=ensureDetailView();if(!card||!detail)return;
    const config=card.querySelector('#comparisonConfigArea'),body=card.querySelector('#vehicleComparisonBody');if(config)config.hidden=true;if(body)body.hidden=true;detail.hidden=false;card.classList.add('criterionDetailMode');renderCriterionDetails();card.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function closeCriterionDetails(){
    detailCriterionIndex=null;const card=document.querySelector('#managerComparisonCard');if(!card)return;const detail=card.querySelector('#comparisonCriterionDetail'),config=card.querySelector('#comparisonConfigArea'),body=card.querySelector('#vehicleComparisonBody');if(detail)detail.hidden=true;if(config)config.hidden=false;if(body)body.hidden=false;card.classList.remove('criterionDetailMode');requestAnimationFrame(enhanceComparisonRadars);
  }

  function enhanceComparisonRadars(){
    const card=document.querySelector('#managerComparisonCard');if(!card)return;
    const panes=[...card.querySelectorAll('.comparisonRadarPane')];if(!panes.length)return;
    const header=card.querySelector('.comparisonChartHeader');
    if(header){let hint=header.querySelector('.radarInteractionHint');if(!hint){hint=document.createElement('div');hint.className='radarInteractionHint';header.appendChild(hint)}hint.textContent=locale==='fa'?'روی نام یا محور هر شاخص بزنید تا امتیاز همه خودروها کنار هم نمایش داده شود.':'Select a criterion name or axis to compare all vehicle scores side by side.'}
    panes.forEach(pane=>{
      const svg=pane.querySelector('svg');if(!svg)return;
      const labels=[...svg.querySelectorAll(':scope > text:not(.radarValue)')],axes=[...svg.querySelectorAll(':scope > line')].slice(0,(window.ASSESSMENT_CRITERIA||[]).length);
      labels.forEach((label,criterionIndex)=>{label.dataset.radarDetailIndex=String(criterionIndex);label.setAttribute('role','button');label.setAttribute('tabindex','0');if(!label.dataset.radarBound){label.dataset.radarBound='1';const open=()=>openCriterionDetails(criterionIndex);label.addEventListener('click',open);label.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}})}});
      axes.forEach((axis,criterionIndex)=>{if(svg.querySelector(`.radarDrillTarget[data-index="${criterionIndex}"]`))return;const overlay=document.createElementNS('http://www.w3.org/2000/svg','line');['x1','y1','x2','y2'].forEach(attr=>overlay.setAttribute(attr,axis.getAttribute(attr)||'0'));overlay.setAttribute('class','radarDrillTarget');overlay.dataset.index=String(criterionIndex);overlay.addEventListener('click',()=>openCriterionDetails(criterionIndex));svg.appendChild(overlay)});
    });
  }

  let scheduled=false;
  function refreshV51(){injectV51Styles();renderReviewBand();enhanceComparisonRadars();if(detailCriterionIndex!==null){const card=document.querySelector('#managerComparisonCard'),config=card?.querySelector('#comparisonConfigArea'),body=card?.querySelector('#vehicleComparisonBody'),detail=ensureDetailView();if(config)config.hidden=true;if(body)body.hidden=true;if(detail)detail.hidden=false;renderCriterionDetails()}}
  function scheduleRefresh(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;refreshV51()})}

  if(typeof window.managerRefresh==='function'||typeof managerRefresh==='function'){const previous=window.managerRefresh||managerRefresh;managerRefresh=function(...args){const out=previous(...args);scheduleRefresh();return out};window.managerRefresh=managerRefresh}
  const previousLocale=setLocale;setLocale=function(next){const out=previousLocale(next);scheduleRefresh();return out};
  const observer=new MutationObserver(mutations=>{if(mutations.some(m=>[...m.addedNodes].some(node=>node.nodeType===1&&(node.matches?.('#managerComparisonCard,.comparisonRadarPane,.strengthWeaknessGrid')||node.querySelector?.('.comparisonRadarPane,.strengthWeaknessGrid')))))scheduleRefresh()});
  observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',event=>{if(event.target?.id==='closeComparisonMode'||event.target?.id==='switchRoleButton')closeCriterionDetails()});
  window.addEventListener('bamco:case-restored',scheduleRefresh);document.querySelectorAll('#entryRoleChoices button[data-role]').forEach(btn=>btn.addEventListener('click',scheduleRefresh));
  injectV51Styles();scheduleRefresh();
})();
