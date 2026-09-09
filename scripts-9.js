/* v66 — vertical grouped bar drill-down with reliable current-language labels */
(()=>{
  const MULTI_KEY='bamco-multi-vehicle-comparisons';
  const COLORS=['#195b8e','#12877e','#7454b8','#d58a24','#b54d66','#2c7d9a'];

  const fa=()=>{
    if(typeof locale!=='undefined'&&locale==='en')return false;
    if(document.documentElement.lang==='en')return false;
    if(document.body?.classList.contains('english')||document.documentElement.classList.contains('english'))return false;
    return true;
  };
  const escHtml=value=>typeof esc==='function'?esc(String(value??'')):String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const shown=value=>fa()&&typeof localNumber==='function'?localNumber(value):String(value);
  const criteria=()=>window.ASSESSMENT_CRITERIA||[];
  const criterionTitle=main=>fa()?(main.titleFa||main.textFa||main.id):(main.titleEn||main.textEn||main.titleFa||main.textFa||main.id);
  const questionTitle=item=>fa()?(item.titleFa||item.textFa||item.id):(item.titleEn||item.textEn||item.titleFa||item.textFa||item.id);
  const scoreKey=(main,sub,item)=>typeof itemKey==='function'?itemKey(main,sub,item):`${main.id}::${sub.id}::${item.id}`;

  function injectStyles(){
    if(document.querySelector('#bamco-v52-styles'))return;
    const style=document.createElement('style');
    style.id='bamco-v52-styles';
    style.textContent=`
      #managerComparisonCard .v52DetailView{margin-top:16px;min-width:0}
      #managerComparisonCard .v52DetailHeader{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:16px;padding:0 0 16px;border-bottom:1px solid #e0e9ef}
      #managerComparisonCard .v52DetailTitle{text-align:center;min-width:0}
      #managerComparisonCard .v52DetailTitle h3{margin:0;color:#163f63;font-size:19px;font-weight:900}
      #managerComparisonCard .v52BackButton{min-height:42px;border-radius:10px;border:1px solid #c8d8e3;background:#fff;color:#224d6e;padding:8px 15px;font-weight:850;cursor:pointer}
      #managerComparisonCard .v52Legend{display:flex;align-items:center;justify-content:center;gap:14px 20px;flex-wrap:wrap;margin:16px 0 10px;padding:10px 14px;border:1px solid #dce7ee;border-radius:13px;background:#f9fbfc}
      #managerComparisonCard .v52LegendItem{display:inline-flex;align-items:center;gap:7px;color:#405d74;font-size:12px;font-weight:850;min-width:0}
      #managerComparisonCard .v52LegendSwatch{width:12px;height:12px;border-radius:3px;flex:0 0 auto}
      #managerComparisonCard .v52ChartCard{border:1px solid #dce7ee;border-radius:15px;background:#fff;padding:16px;min-width:0;overflow:hidden}
      #managerComparisonCard .v52ChartScroller{overflow-x:auto;overflow-y:hidden;padding:4px 2px 10px}
      #managerComparisonCard .v52Chart{display:grid;grid-template-columns:44px max-content;align-items:stretch;min-height:430px;min-width:max-content;direction:ltr}
      #managerComparisonCard .v52YAxis{position:relative;height:360px;margin-top:8px;border-inline-end:1px solid #cbd9e3;color:#6a7d8e;font:800 11px "Times New Roman",serif}
      #managerComparisonCard .v52YAxis span{position:absolute;right:8px;transform:translateY(50%);white-space:nowrap}
      #managerComparisonCard .v52PlotWrap{position:relative;height:420px;min-width:max-content;padding:8px 12px 0}
      #managerComparisonCard .v52Grid{position:absolute;inset:8px 12px 52px 12px;pointer-events:none}
      #managerComparisonCard .v52Grid i{position:absolute;left:0;right:0;border-top:1px solid #e4edf2}
      #managerComparisonCard .v52Groups{position:relative;z-index:1;height:100%;display:flex;align-items:flex-start;gap:18px;min-width:max-content}
      #managerComparisonCard .v52QuestionGroup{display:grid;grid-template-rows:360px 52px;align-items:end;min-width:126px;max-width:176px}
      #managerComparisonCard .v52Bars{height:360px;display:flex;align-items:flex-end;justify-content:center;gap:6px;padding:0 8px;border-bottom:1px solid #cbd9e3}
      #managerComparisonCard .v52BarSlot{width:22px;height:100%;display:flex;align-items:flex-end;justify-content:center;position:relative}
      #managerComparisonCard .v52Bar{width:100%;height:var(--h);min-height:0;border-radius:7px 7px 2px 2px;background:var(--c);position:relative;box-shadow:0 3px 9px color-mix(in srgb,var(--c) 20%,transparent);transition:.18s ease}
      #managerComparisonCard .v52Bar:hover{filter:brightness(.96);transform:translateY(-2px)}
      #managerComparisonCard .v52BarValue{position:absolute;left:50%;top:-22px;transform:translateX(-50%);font:900 11px "Times New Roman",serif;color:#294d68;white-space:nowrap}
      #managerComparisonCard .v52QuestionTitle{display:flex;align-items:flex-start;justify-content:center;padding:9px 5px 0;color:#294d68;font-size:11px;font-weight:850;line-height:1.45;text-align:center;direction:rtl;overflow:hidden}
      .english #managerComparisonCard .v52QuestionTitle{direction:ltr;font-family:"Times New Roman",serif}
      .english #managerComparisonCard .v52DetailTitle,.english #managerComparisonCard .v52Legend,.english #managerComparisonCard .v52BackButton,.english #managerComparisonCard .v52Empty{font-family:"Times New Roman",serif}
      #managerComparisonCard .v52Empty{padding:34px 16px;text-align:center;color:#6e8293;border:1px dashed #cbd9e3;border-radius:13px;background:#fbfcfd}
      @media(max-width:760px){#managerComparisonCard .v52DetailHeader{grid-template-columns:1fr}.v52DetailTitle{text-align:start!important}#managerComparisonCard .v52BackButton{justify-self:start}}
    `;
    document.head.appendChild(style);
  }

  function storedCases(){
    try{const parsed=JSON.parse(sessionStorage.getItem(MULTI_KEY)||'[]');return Array.isArray(parsed)?parsed.filter(Boolean):[]}catch(_){return []}
  }
  function allCases(){
    const current={metadata:{...((typeof state!=='undefined'&&state.metadata)||{})},scores:{...((typeof state!=='undefined'&&state.scores)||{})}};
    return [{state:current,current:true},...storedCases().map(item=>({state:item.state||item,current:false}))];
  }
  function vehicleName(record,index){
    const meta=record?.state?.metadata||{};
    const name=[meta.brand,meta.model].filter(Boolean).join(' ').trim()||meta.vehicleName||meta.name||'';
    if(name)return name;
    return index===0?(fa()?'خودروی فعلی':'Current Vehicle'):(fa()?`خودروی ${shown(index+1)}`:`Vehicle ${index+1}`);
  }
  function answeredQuestions(main,cases){
    const rows=[];
    (main.subgroups||[]).forEach(sub=>(sub.items||[]).forEach(item=>{
      const key=scoreKey(main,sub,item);
      const values=cases.map(record=>{const n=Number(record?.state?.scores?.[key]);return Number.isFinite(n)&&n>=1&&n<=10?n:NaN});
      if(values.some(Number.isFinite))rows.push({item,values});
    }));
    return rows;
  }
  function backToComparison(){
    try{if(typeof managerRefresh==='function'){managerRefresh();return}if(typeof window.managerRefresh==='function'){window.managerRefresh();return}}catch(_){ }
    location.reload();
  }
  function renderVerticalBars(criterionIndex){
    injectStyles();
    const main=criteria()[criterionIndex],body=document.querySelector('#managerComparisonCard #vehicleComparisonBody');
    if(!main||!body)return;
    const cases=allCases(),names=cases.map(vehicleName),questions=answeredQuestions(main,cases);
    const legend=names.map((name,i)=>`<span class="v52LegendItem"><i class="v52LegendSwatch" style="background:${COLORS[i%COLORS.length]}"></i><b>${escHtml(name)}</b></span>`).join('');
    if(!questions.length){
      body.innerHTML=`<section class="v52DetailView"><div class="v52DetailHeader"><button type="button" class="v52BackButton" id="v52BackButton">${fa()?'بازگشت به مقایسه':'Back to Comparison'}</button><div class="v52DetailTitle"><h3>${escHtml(criterionTitle(main))}</h3></div><span></span></div><div class="v52Empty">${fa()?'برای این شاخص هنوز هیچ سؤال پاسخ‌داده‌شده‌ای وجود ندارد.':'No answered questions are available for this criterion yet.'}</div></section>`;
      body.querySelector('#v52BackButton')?.addEventListener('click',backToComparison);return;
    }
    const yTicks=[10,8,6,4,2,0].map(v=>`<span style="bottom:${v*10}%">${shown(v)}</span>`).join('');
    const grid=[0,20,40,60,80,100].map(p=>`<i style="bottom:${p}%"></i>`).join('');
    const groups=questions.map(({item,values})=>{
      const slots=values.map((score,i)=>`<span class="v52BarSlot">${Number.isFinite(score)?`<i class="v52Bar" style="--h:${score*10}%;--c:${COLORS[i%COLORS.length]}" title="${escHtml(names[i])}: ${score}"><b class="v52BarValue">${shown(score)}</b></i>`:''}</span>`).join('');
      return `<article class="v52QuestionGroup"><div class="v52Bars">${slots}</div><strong class="v52QuestionTitle">${escHtml(questionTitle(item))}</strong></article>`;
    }).join('');
    body.innerHTML=`<section class="v52DetailView"><div class="v52DetailHeader"><button type="button" class="v52BackButton" id="v52BackButton">${fa()?'بازگشت به مقایسه':'Back to Comparison'}</button><div class="v52DetailTitle"><h3>${escHtml(criterionTitle(main))}</h3></div><span></span></div><div class="v52Legend">${legend}</div><div class="v52ChartCard"><div class="v52ChartScroller"><div class="v52Chart"><div class="v52YAxis">${yTicks}</div><div class="v52PlotWrap"><div class="v52Grid">${grid}</div><div class="v52Groups">${groups}</div></div></div></div></div></section>`;
    body.querySelector('#v52BackButton')?.addEventListener('click',backToComparison);
  }
  function criterionIndexFromEventTarget(target){
    const label=target?.closest?.('[data-radar-detail-index]');if(label){const n=Number(label.dataset.radarDetailIndex);return Number.isInteger(n)?n:null}
    const axis=target?.closest?.('.radarDrillTarget');if(axis){const n=Number(axis.dataset.index);return Number.isInteger(n)?n:null}
    return null;
  }
  document.addEventListener('click',event=>{if(!event.target?.closest?.('#managerComparisonCard'))return;const index=criterionIndexFromEventTarget(event.target);if(index===null)return;event.preventDefault();event.stopImmediatePropagation();renderVerticalBars(index)},true);
  document.addEventListener('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;if(!event.target?.closest?.('#managerComparisonCard'))return;const index=criterionIndexFromEventTarget(event.target);if(index===null)return;event.preventDefault();event.stopImmediatePropagation();renderVerticalBars(index)},true);
  injectStyles();
})();