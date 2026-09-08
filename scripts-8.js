/* v50 — clickable comparison radar drill-down + middle review band in strengths/weaknesses */
(()=>{
  const MULTI_KEY='bamco-multi-vehicle-comparisons';
  const SCORE_LEVEL=(n,fa)=>{
    const level=(window.SCORE_LEVELS||SCORE_LEVELS||[]).find?.(x=>x.n===n);
    return fa?(level?.fa||''):(level?.en||'');
  };
  const safeEsc=value=>typeof esc==='function'?esc(String(value??'')):String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const number=value=>typeof localNumber==='function'?localNumber(value):String(value);
  const criterionName=main=>typeof title==='function'?title(main.titleFa,'main',main.id):(main.titleFa||main.id);
  const subgroupName=sub=>typeof title==='function'?title(sub.titleFa,'sub',sub.id):(sub.titleFa||sub.id);
  const itemName=(item,fa)=>fa?(item.titleFa||item.textFa||item.id):(typeof itemTitleEn==='function'?itemTitleEn(item):(item.titleEn||item.titleFa||item.id));

  function injectV50Styles(){
    if(document.querySelector('#bamco-v50-styles'))return;
    const style=document.createElement('style');
    style.id='bamco-v50-styles';
    style.textContent=`
      #strengthWeaknessCard .strengthWeaknessGrid{grid-template-columns:repeat(3,minmax(0,1fr))!important;align-items:stretch}
      #strengthWeaknessCard .reviewPanel{border:1px solid #e4dcf3;background:linear-gradient(180deg,#fbf9ff 0%,#f7f3fd 100%);border-radius:22px;padding:18px;min-width:0}
      #strengthWeaknessCard .reviewPanel>h3{margin:0 0 14px;color:#6949a8;font-size:1.02rem}
      #strengthWeaknessCard .reviewPanel .performanceDetails{border-color:#e8def6;background:#fff}
      #strengthWeaknessCard .reviewPanel .summaryPoint span{color:#6949a8;background:#f2ecfb}
      .comparisonRadarPane svg .radarDrillTarget{stroke:transparent;stroke-width:22;pointer-events:stroke;cursor:pointer}
      .comparisonRadarPane svg text[data-radar-detail-index]{cursor:pointer;text-decoration:none}
      .comparisonRadarPane svg text[data-radar-detail-index]:hover{font-weight:800;filter:drop-shadow(0 1px 0 rgba(255,255,255,.95))}
      .comparisonRadarPane.radarInteractive{position:relative}
      .radarInteractionHint{display:flex;align-items:center;gap:8px;margin-top:7px;color:#654a91;font-weight:700;font-size:.86rem}
      .radarInteractionHint::before{content:'↗';display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#f0e9fb;color:#6949a8}
      @media(max-width:1050px){#strengthWeaknessCard .strengthWeaknessGrid{grid-template-columns:1fr!important}}
    `;
    document.head.appendChild(style);
  }

  function activeCriteriaGroups(){
    const list=window.ASSESSMENT_CRITERIA||[];
    const raw=list.map(main=>Math.max(0,Number(state?.weights?.[main.id])||0));
    const total=raw.reduce((a,b)=>a+b,0);
    return list.map((main,index)=>({main,active:total>0?raw[index]>0:true})).filter(x=>x.active);
  }

  function ensureReviewPanel(){
    const grid=document.querySelector('#strengthWeaknessCard .strengthWeaknessGrid');
    if(!grid)return null;
    let panel=grid.querySelector('.reviewPanel');
    if(!panel){
      panel=document.createElement('div');
      panel.className='reviewPanel';
      panel.innerHTML='<h3 id="reviewBandTitle"></h3><div id="reviewBandList"></div>';
      const weakness=grid.querySelector('.weaknessPanel');
      weakness?grid.insertBefore(panel,weakness):grid.appendChild(panel);
    }
    return panel;
  }

  function renderReviewBand(){
    const panel=ensureReviewPanel();
    if(!panel)return;
    const fa=locale==='fa';
    const heading=panel.querySelector('#reviewBandTitle');
    if(heading)heading.textContent=fa?'موارد نیازمند بررسی و بهبود':'Items Requiring Review and Improvement';
    const host=panel.querySelector('#reviewBandList');
    if(!host)return;
    const groups=activeCriteriaGroups().map(({main})=>{
      const items=[];
      main.subgroups.forEach(sub=>sub.items.forEach(item=>{
        const score=Number(state?.scores?.[itemKey(main,sub,item)]);
        if(Number.isFinite(score)&&score>=4&&score<=7)items.push({sub,item,score});
      }));
      items.sort((a,b)=>a.score-b.score);
      return items.length?{main,items}:null;
    }).filter(Boolean);
    if(!groups.length){
      host.innerHTML=`<div class="auditEmpty">${fa?'موردی با امتیاز ۴ تا ۷ در شاخص‌های دارای وزن ثبت نشده است.':'No item scored from 4 to 7 in a criterion with active weight.'}</div>`;
      return;
    }
    host.innerHTML=groups.map(group=>{
      const count=group.items.length;
      const countText=fa?`${number(count)} مورد`:`${number(count)} ${count===1?'item':'items'}`;
      return `<details class="performanceDetails"><summary><strong>${safeEsc(criterionName(group.main))}</strong><span>${countText} — ${fa?'امتیازهای ۴ تا ۷':'scores 4–7'}</span></summary><div>${group.items.map(row=>`<article class="summaryPoint"><strong>${safeEsc(itemName(row.item,fa))}</strong><span>${number(row.score)} ${fa?'از ۱۰':'out of 10'}</span><small>${safeEsc(subgroupName(row.sub))} · ${safeEsc(SCORE_LEVEL(row.score,fa))}</small></article>`).join('')}</div></details>`;
    }).join('');
  }

  function storedComparisonCases(){
    try{const data=JSON.parse(sessionStorage.getItem(MULTI_KEY)||'[]');return Array.isArray(data)?data.filter(Boolean):[]}catch(_){return []}
  }

  function caseForPane(index){
    if(index===0)return {state:{metadata:{...(state?.metadata||{})},scores:{...(state?.scores||{})},notes:{...(state?.notes||{})}}};
    return storedComparisonCases()[index-1]||null;
  }

  function scoreBadgeClass(score){
    if(score>=8)return 'good';
    if(score<=3)return 'bad';
    return 'mid';
  }

  function openCriterionDetails(caseIndex,criterionIndex){
    const record=caseForPane(caseIndex),main=(window.ASSESSMENT_CRITERIA||[])[criterionIndex];
    if(!record?.state||!main)return;
    const fa=locale==='fa',caseState=record.state||{},meta=caseState.metadata||{},scores=caseState.scores||{},notes=caseState.notes||{};
    const vehicle=[meta.brand,meta.model].filter(Boolean).join(' ').trim()||(fa?`خودرو ${number(caseIndex+1)}`:`Vehicle ${caseIndex+1}`);
    const evaluator=meta.evaluator||'—';
    const rows=[];
    main.subgroups.forEach(sub=>sub.items.forEach(item=>{
      const key=itemKey(main,sub,item),raw=Number(scores?.[key]),score=Number.isFinite(raw)&&raw>0?raw:NaN;
      rows.push({sub,item,score,note:notes?.[key]||''});
    }));
    const answered=rows.filter(r=>Number.isFinite(r.score));
    const avg=answered.length?answered.reduce((sum,r)=>sum+r.score,0)/answered.length:NaN;
    const win=window.open('','_blank');
    if(!win){alert(fa?'مرورگر باز شدن تب جدید را مسدود کرده است. اجازه باز شدن تب را فعال کنید.':'The browser blocked the new tab. Please allow pop-ups for this site.');return}
    const rowsHtml=rows.map((row,index)=>`<tr><td>${number(index+1)}</td><td>${safeEsc(subgroupName(row.sub))}</td><td class="itemCell"><strong>${safeEsc(itemName(row.item,fa))}</strong>${row.item.textFa&&row.item.textFa!==row.item.titleFa?`<small>${safeEsc(row.item.textFa)}</small>`:''}</td><td>${Number.isFinite(row.score)?`<span class="scoreBadge ${scoreBadgeClass(row.score)}">${number(row.score)}</span>`:'<span class="emptyScore">—</span>'}</td><td>${Number.isFinite(row.score)?safeEsc(SCORE_LEVEL(row.score,fa)):'—'}</td><td class="noteCell">${row.note?safeEsc(row.note):'—'}</td></tr>`).join('');
    const direction=fa?'rtl':'ltr',lang=fa?'fa':'en';
    const html=`<!doctype html><html lang="${lang}" dir="${direction}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeEsc(vehicle)} | ${safeEsc(criterionName(main))}</title><style>
      *{box-sizing:border-box}body{margin:0;background:#f5f7fb;color:#26384c;font-family:${fa?'"B Nazanin",Tahoma,Arial':'Inter,Segoe UI,Arial'},sans-serif}.page{max-width:1380px;margin:0 auto;padding:28px}.hero{background:linear-gradient(135deg,#ffffff 0%,#f6f0ff 100%);border:1px solid #e5def1;border-radius:26px;padding:24px 26px;box-shadow:0 16px 46px rgba(42,59,82,.08)}.heroTop{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;flex-wrap:wrap}.eyebrow{color:#7653ac;font-weight:800;font-size:13px;margin-bottom:6px}.hero h1{margin:0;font-size:26px;color:#183b62}.hero p{margin:8px 0 0;color:#6b7b8e}.cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:20px}.card{background:#fff;border:1px solid #e6eaf0;border-radius:18px;padding:14px 16px}.card span{display:block;color:#78879a;font-size:12px}.card strong{display:block;margin-top:5px;color:#243a54;font-size:16px}.tableCard{margin-top:18px;background:#fff;border:1px solid #e3e8ef;border-radius:24px;overflow:hidden;box-shadow:0 14px 38px rgba(42,59,82,.06)}.tableWrap{overflow:auto;max-height:calc(100vh - 300px)}table{width:100%;border-collapse:separate;border-spacing:0;min-width:980px}thead th{position:sticky;top:0;background:#f2eef9;color:#543b7a;padding:14px 12px;font-size:13px;border-bottom:1px solid #ded4ed;z-index:2}tbody td{padding:13px 12px;border-bottom:1px solid #edf0f4;vertical-align:top;text-align:${fa?'right':'left'};line-height:1.65}tbody tr:hover{background:#faf8fd}.itemCell{min-width:330px}.itemCell strong{display:block;color:#203a56}.itemCell small{display:block;color:#7d8998;margin-top:4px}.noteCell{min-width:240px;color:#596a7c}.scoreBadge{display:inline-grid;place-items:center;min-width:42px;height:34px;border-radius:12px;font-weight:900}.scoreBadge.good{background:#eaf7f0;color:#21704a}.scoreBadge.mid{background:#f3ecfb;color:#6b49a6}.scoreBadge.bad{background:#fdeeee;color:#a43b46}.emptyScore{color:#9aa6b3}.closeHint{margin-top:12px;color:#8a96a5;font-size:12px}@media(max-width:850px){.page{padding:14px}.cards{grid-template-columns:1fr 1fr}.hero h1{font-size:21px}}@media(max-width:520px){.cards{grid-template-columns:1fr}}
    </style></head><body><main class="page"><section class="hero"><div class="heroTop"><div><div class="eyebrow">${fa?'جزئیات ارزیابی ارزیاب':'Evaluator Assessment Details'}</div><h1>${safeEsc(criterionName(main))}</h1><p>${safeEsc(vehicle)}</p></div></div><div class="cards"><div class="card"><span>${fa?'خودرو':'Vehicle'}</span><strong>${safeEsc(vehicle)}</strong></div><div class="card"><span>${fa?'ارزیاب':'Evaluator'}</span><strong>${safeEsc(evaluator)}</strong></div><div class="card"><span>${fa?'میانگین شاخص':'Criterion average'}</span><strong>${Number.isFinite(avg)?`${number(avg.toFixed(2))} / ${number(10)}`:'—'}</strong></div><div class="card"><span>${fa?'تعداد امتیاز ثبت‌شده':'Recorded scores'}</span><strong>${number(answered.length)} / ${number(rows.length)}</strong></div></div></section><section class="tableCard"><div class="tableWrap"><table><thead><tr><th>${fa?'ردیف':'No.'}</th><th>${fa?'زیرشاخص':'Sub-criterion'}</th><th>${fa?'مورد ارزیابی':'Assessment item'}</th><th>${fa?'امتیاز ارزیاب':'Evaluator score'}</th><th>${fa?'درجه کیفی':'Quality grade'}</th><th>${fa?'یادداشت ارزیاب':'Evaluator note'}</th></tr></thead><tbody>${rowsHtml}</tbody></table></div></section><div class="closeHint">${fa?'برای بازگشت، این تب را ببندید و به صفحه مقایسه برگردید.':'Close this tab to return to the comparison page.'}</div></main></body></html>`;
    win.document.open();win.document.write(html);win.document.close();
  }

  function enhanceComparisonRadars(){
    const panes=[...document.querySelectorAll('#managerComparisonCard .comparisonRadarPane')];
    if(!panes.length)return;
    const header=document.querySelector('#managerComparisonCard .comparisonChartHeader');
    if(header&&!header.querySelector('.radarInteractionHint')){
      const hint=document.createElement('div');hint.className='radarInteractionHint';hint.textContent=locale==='fa'?'برای مشاهده امتیازهای ارزیاب، روی نام یا محور هر شاخص کلیک کنید.':'Click a criterion name or axis to view the evaluator scores.';header.appendChild(hint);
    }else if(header?.querySelector('.radarInteractionHint'))header.querySelector('.radarInteractionHint').textContent=locale==='fa'?'برای مشاهده امتیازهای ارزیاب، روی نام یا محور هر شاخص کلیک کنید.':'Click a criterion name or axis to view the evaluator scores.';
    panes.forEach((pane,caseIndex)=>{
      pane.classList.add('radarInteractive');
      const svg=pane.querySelector('svg');if(!svg)return;
      const labels=[...svg.querySelectorAll(':scope > text:not(.radarValue)')];
      const axes=[...svg.querySelectorAll(':scope > line')].slice(0,(window.ASSESSMENT_CRITERIA||[]).length);
      labels.forEach((label,criterionIndex)=>{
        label.dataset.radarDetailIndex=String(criterionIndex);
        label.setAttribute('role','button');label.setAttribute('tabindex','0');
        if(!label.dataset.radarBound){
          label.dataset.radarBound='1';
          const open=()=>openCriterionDetails(caseIndex,criterionIndex);
          label.addEventListener('click',open);label.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}});
        }
      });
      axes.forEach((axis,criterionIndex)=>{
        if(svg.querySelector(`.radarDrillTarget[data-index="${criterionIndex}"]`))return;
        const overlay=document.createElementNS('http://www.w3.org/2000/svg','line');
        ['x1','y1','x2','y2'].forEach(attr=>overlay.setAttribute(attr,axis.getAttribute(attr)||'0'));
        overlay.setAttribute('class','radarDrillTarget');overlay.dataset.index=String(criterionIndex);overlay.setAttribute('aria-label',locale==='fa'?`نمایش جزئیات ${criterionName((window.ASSESSMENT_CRITERIA||[])[criterionIndex])}`:`View ${criterionName((window.ASSESSMENT_CRITERIA||[])[criterionIndex])} details`);
        overlay.addEventListener('click',()=>openCriterionDetails(caseIndex,criterionIndex));
        svg.appendChild(overlay);
      });
    });
  }

  let scheduled=false;
  function refreshV50(){injectV50Styles();renderReviewBand();enhanceComparisonRadars()}
  function scheduleRefresh(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;refreshV50()})}

  if(typeof window.managerRefresh==='function'||typeof managerRefresh==='function'){
    const previous=window.managerRefresh||managerRefresh;
    managerRefresh=function(...args){const out=previous(...args);scheduleRefresh();return out};
    window.managerRefresh=managerRefresh;
  }
  const previousLocale=setLocale;
  setLocale=function(next){const out=previousLocale(next);scheduleRefresh();return out};

  const observer=new MutationObserver(mutations=>{
    if(mutations.some(m=>[...m.addedNodes].some(node=>node.nodeType===1&&(node.matches?.('#managerComparisonCard,.comparisonRadarPane,.strengthWeaknessGrid')||node.querySelector?.('.comparisonRadarPane,.strengthWeaknessGrid')))))scheduleRefresh();
  });
  observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('bamco:case-restored',scheduleRefresh);
  document.querySelectorAll('[data-role]').forEach(btn=>btn.addEventListener('click',scheduleRefresh));
  injectV50Styles();scheduleRefresh();
})();
