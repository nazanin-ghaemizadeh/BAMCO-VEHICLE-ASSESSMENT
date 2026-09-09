(()=>{
  const C=()=>window.ASSESSMENT_CRITERIA||[];
  const N=m=>{if(!m)return'';try{if(typeof title==='function')return title(m.titleFa,'main',m.id)}catch(_){}return m.titleFa||m.id||''};
  const V=m=>{let a=[m?.titleFa,m?.titleEn,m?.id,N(m)];try{if(typeof criterionLabel==='function')a.push(criterionLabel(m))}catch(_){}return a.filter(Boolean).map(v=>String(v).trim()).filter(Boolean)};
  const F=t=>{t=String(t||'').trim();return t?C().find(m=>V(m).some(l=>t===l||t.includes(l)||l.includes(t)))||null:null};
  const RADAR_KEY='bamco-comparison-radar-mode';
  const SERIES_COLORS=['#195b8e','#12877e','#7454b8','#d58a24','#b54d66','#2c7d9a'];
  const setText=(el,text)=>{if(el&&el.textContent!==text)el.textContent=text};

  function labels(){
    const h=document.querySelector('#managerComparisonCard .v52DetailTitle h3');
    if(h){const m=F(h.textContent);if(m)setText(h,N(m))}
    document.querySelectorAll('#managerComparisonCard .multiVehicleComparisonRow .comparisonCriterion').forEach(e=>{const m=F(e.textContent);if(m)setText(e,N(m))});
  }

  function ensureHeaderNavigation(){
    const dock=document.querySelector('#appShell > .headerActions')||document.querySelector('.headerActions');
    const actions=dock?.querySelector(':scope > .actionCard')||dock?.querySelector('.actionCard');
    if(!dock||!actions)return null;
    let row=actions.querySelector(':scope > .v55ComparisonNavRow');
    if(row){row.remove();row=null}
    row=dock.querySelector(':scope > .v55ComparisonNavRow');
    if(!row){
      row=document.createElement('div');
      row.className='v55ComparisonNavRow managerOnly';
      row.innerHTML='<button class="secondary v55TopNavButton" id="v55BackDashboard" type="button"></button><button class="secondary v55TopNavButton" id="v55BackComparison" type="button"></button>';
      actions.insertAdjacentElement('afterend',row);
      row.querySelector('#v55BackDashboard')?.addEventListener('click',()=>{
        const close=document.querySelector('#managerComparisonCard #closeComparisonMode');
        if(close)close.click();
      });
      row.querySelector('#v55BackComparison')?.addEventListener('click',()=>{
        const barBack=document.querySelector('#managerComparisonCard #v52BackButton');
        if(barBack){barBack.click();return}
        const detailBack=document.querySelector('#managerComparisonCard #backToComparisonOverview');
        if(detailBack)detailBack.click();
      });
    }
    return row;
  }

  function nav(){
    const row=ensureHeaderNavigation();
    if(!row)return;
    const dashboard=row.querySelector('#v55BackDashboard');
    const comparison=row.querySelector('#v55BackComparison');
    const card=document.querySelector('#managerComparisonCard:not([hidden])');
    const inComparison=!!card&&(document.documentElement.classList.contains('managerComparisonMode')||document.body.classList.contains('managerMode'));
    const barBack=document.querySelector('#managerComparisonCard #v52BackButton');
    const detailBack=document.querySelector('#managerComparisonCard #backToComparisonOverview');
    const detailSection=detailBack?.closest('#comparisonCriterionDetail');
    const hasComparisonBack=!!barBack||!!(detailBack&&detailSection&&!detailSection.hidden);
    if(dashboard){setText(dashboard,document.body.classList.contains('english')?'Back to Management Dashboard':'بازگشت به داشبورد مدیریت');dashboard.hidden=!inComparison}
    if(comparison){setText(comparison,document.body.classList.contains('english')?'Back to Comparison':'بازگشت به مقایسه');comparison.hidden=!(inComparison&&hasComparisonBack)}
    row.hidden=!inComparison;
  }

  function radarMode(){try{return sessionStorage.getItem(RADAR_KEY)==='overlap'?'overlap':'separate'}catch(_){return'separate'}}
  function saveRadarMode(mode){try{sessionStorage.setItem(RADAR_KEY,mode==='overlap'?'overlap':'separate')}catch(_){}}
  function makeLegendItem(name,color){
    const item=document.createElement('span');item.className='v55RadarLegendItem';
    const swatch=document.createElement('i');swatch.className='v55RadarLegendSwatch';swatch.style.background=color;
    const label=document.createElement('b');label.textContent=name;item.append(swatch,label);return item;
  }
  function buildOverlayRadar(grid,sourcePanes){
    let overlay=grid.querySelector(':scope > .v55OverlayPane');if(overlay)return overlay;
    const sourceSvg=sourcePanes.find(p=>p.querySelector('svg'))?.querySelector('svg');if(!sourceSvg)return null;
    const svg=sourceSvg.cloneNode(true);
    svg.querySelectorAll('.radarData,.radarValue,circle,.radarDrillTarget').forEach(el=>el.remove());
    svg.querySelectorAll('[data-radar-bound]').forEach(el=>el.removeAttribute('data-radar-bound'));
    const insertBefore=svg.querySelector('line')||svg.querySelector('text')||null;let seriesCount=0;
    sourcePanes.forEach((pane,index)=>{
      const polygon=pane.querySelector('svg polygon.radarData');if(!polygon)return;
      const series=polygon.cloneNode(true),color=SERIES_COLORS[index%SERIES_COLORS.length];
      series.classList.add('v55RadarSeries');series.removeAttribute('style');series.style.fill=color;series.style.fillOpacity='.14';series.style.stroke=color;series.style.strokeWidth='3';series.style.pointerEvents='none';
      if(insertBefore)svg.insertBefore(series,insertBefore);else svg.appendChild(series);seriesCount++;
    });
    if(!seriesCount)return null;
    overlay=document.createElement('article');overlay.className='comparisonRadarPane v55OverlayPane';
    const titleEl=document.createElement('strong');titleEl.textContent=document.body.classList.contains('english')?'Overlaid Comparison':'مقایسه هم‌پوشانی';
    const legend=document.createElement('div');legend.className='v55RadarLegend';
    sourcePanes.forEach((pane,index)=>legend.appendChild(makeLegendItem((pane.querySelector(':scope > strong')?.textContent||`Vehicle ${index+1}`).trim(),SERIES_COLORS[index%SERIES_COLORS.length])));
    const chart=document.createElement('div');chart.className='comparisonManagerRadar radarChart v55OverlayChart';chart.appendChild(svg);overlay.append(titleEl,legend,chart);grid.appendChild(overlay);return overlay;
  }
  function ensureRadarModeControl(grid){
    const header=grid.closest('.comparisonChartCard')?.querySelector('.comparisonChartHeader');if(!header)return null;
    let control=header.querySelector('.v55RadarModeControl');
    if(!control){
      control=document.createElement('div');control.className='v55RadarModeControl';control.innerHTML='<button type="button" data-radar-mode="separate"></button><button type="button" data-radar-mode="overlap"></button>';
      control.addEventListener('click',event=>{const button=event.target.closest('[data-radar-mode]');if(!button)return;saveRadarMode(button.dataset.radarMode);applyRadarView()});header.appendChild(control);
    }
    const english=document.body.classList.contains('english'),separate=control.querySelector('[data-radar-mode="separate"]'),overlap=control.querySelector('[data-radar-mode="overlap"]');
    if(separate)setText(separate,english?'Separate':'جدا از هم');if(overlap)setText(overlap,english?'Overlaid':'هم‌پوشانی');return control;
  }
  function applyRadarView(){
    const grid=document.querySelector('#managerComparisonCard .multiRadarGrid');if(!grid)return;
    const panes=[...grid.children].filter(el=>el.classList?.contains('comparisonRadarPane')&&!el.classList.contains('v55OverlayPane'));if(panes.length<2)return;
    const control=ensureRadarModeControl(grid);if(!control)return;const mode=radarMode();
    control.querySelectorAll('[data-radar-mode]').forEach(button=>{const active=button.dataset.radarMode===mode;button.classList.toggle('active',active);button.setAttribute('aria-pressed',active?'true':'false')});
    if(mode==='overlap'){const overlay=buildOverlayRadar(grid,panes);if(overlay){overlay.hidden=false;grid.classList.add('v55OverlapMode')}else grid.classList.remove('v55OverlapMode')}
    else{grid.classList.remove('v55OverlapMode');const overlay=grid.querySelector(':scope > .v55OverlayPane');if(overlay)overlay.hidden=true}
  }

  function css(){
    let s=document.querySelector('#bamco-v53-styles');if(!s){s=document.createElement('style');s.id='bamco-v53-styles';document.head.appendChild(s)}
    const text=`#entryScreen[hidden],#appShell[hidden]{display:none!important}html{width:100%;max-width:100%;overflow-x:hidden;-webkit-text-size-adjust:100%;text-size-adjust:100%;-webkit-tap-highlight-color:transparent}body{width:100%;max-width:100%;overflow-x:hidden;min-width:0}body:not(.english),body:not(.english) button,body:not(.english) input,body:not(.english) select,body:not(.english) textarea,body:not(.english) label,body:not(.english) h1,body:not(.english) h2,body:not(.english) h3,body:not(.english) h4,body:not(.english) p,body:not(.english) span,body:not(.english) strong,body:not(.english) small,body:not(.english) table,body:not(.english) th,body:not(.english) td{font-family:"B Nazanin","B Zar","B Yas","Nazanin","B Nazanin Regular",Tahoma,Arial,sans-serif!important}img,svg,canvas,video{max-width:100%;height:auto}button,input,select,textarea{max-width:100%;min-width:0}main,.card,.mainCriterion,.entryCard,.comparisonWorkspace,.comparisonWorkspaceHeader,.comparisonDetailHeader{min-width:0;max-width:100%}
#appShell>.headerActions>.v55ComparisonNavRow{display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;align-items:center!important;justify-content:flex-start!important;gap:8px!important;width:max-content!important;min-width:100%!important;margin:8px 0 0!important;padding:0!important;direction:rtl}body.english #appShell>.headerActions>.v55ComparisonNavRow{direction:ltr}#appShell>.headerActions>.v55ComparisonNavRow[hidden]{display:none!important}#appShell>.headerActions>.v55ComparisonNavRow>.v55TopNavButton{flex:0 0 240px!important;width:240px!important;min-width:240px!important;max-width:240px!important;min-height:46px!important;height:46px!important;margin:0!important;padding:8px 10px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;border:1px solid #c7d5e4!important;border-radius:10px!important;background:#fff!important;color:#173b63!important;box-shadow:0 2px 7px #173b6310!important;font-size:14px!important;font-weight:700!important;line-height:1.25!important;white-space:nowrap!important;scroll-snap-align:start}#appShell>.headerActions>.v55ComparisonNavRow>.v55TopNavButton:hover{background:#eef5fc!important;color:#0d568e!important;border-color:#8eb4d5!important}
#managerComparisonCard .comparisonWorkspaceHeader>#closeComparisonMode,#managerComparisonCard #v52BackButton,#managerComparisonCard #backToComparisonOverview{display:none!important}#managerComparisonCard #comparisonStatus{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 auto!important;width:auto!important;min-width:0!important;max-width:max-content!important;margin:0!important;margin-inline-start:auto!important;padding:6px 12px!important;white-space:nowrap!important;justify-self:end!important;align-self:center!important}
.v55RadarModeControl{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-inline-start:auto}.v55RadarModeControl button{min-height:36px;padding:6px 12px;border:1px solid #c9dbe5;background:#f6f9fb;color:#36566e;border-radius:10px;font-size:12px;font-weight:850}.v55RadarModeControl button.active{background:linear-gradient(135deg,#164e79,#11857e);border-color:transparent;color:#fff}.multiRadarGrid.v55OverlapMode{grid-template-columns:1fr!important}.multiRadarGrid.v55OverlapMode>.comparisonRadarPane:not(.v55OverlayPane){display:none!important}.v55OverlayPane{width:100%!important;max-width:1000px!important;margin-inline:auto!important}.v55RadarLegend{display:flex;align-items:center;justify-content:center;gap:10px 18px;flex-wrap:wrap;margin:8px 0 4px}.v55RadarLegendItem{display:inline-flex;align-items:center;gap:7px;color:#405d74;font-size:12px;font-weight:800}.v55RadarLegendSwatch{width:12px;height:12px;border-radius:50%;flex:0 0 auto}.v55RadarSeries{vector-effect:non-scaling-stroke}
#managerComparisonCard .v52ChartScroller{width:100%!important;display:block!important}#managerComparisonCard .v52Chart{width:max-content!important;min-width:max-content!important;min-height:418px!important;margin-left:auto!important;margin-right:auto!important}#managerComparisonCard .v52YAxis{height:330px!important;margin-top:36px!important}#managerComparisonCard .v52PlotWrap{height:418px!important;padding:36px 12px 0!important}#managerComparisonCard .v52Grid{inset:36px 12px 52px 12px!important}#managerComparisonCard .v52QuestionGroup{grid-template-rows:330px 52px!important}#managerComparisonCard .v52Bars{height:330px!important}#managerComparisonCard .v52BarValue,#managerComparisonCard .v52Bar[style*="--h:100%"] .v52BarValue{top:-22px!important;color:#294d68!important;text-shadow:none!important;z-index:2!important}#managerComparisonCard .v52YAxis span:first-child{top:auto!important;bottom:100%!important;transform:translateY(50%)!important}#managerComparisonCard .v52DetailTitle h3{text-align:center!important}.scoreChart{border-bottom:0!important;box-shadow:none!important;scrollbar-width:none!important;-ms-overflow-style:none!important}.scoreChart::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}.scoreChart::before,.scoreChart::after{display:none!important;content:none!important}
@supports(padding:max(0px)){body{padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right)}.topbar{padding-left:max(14px,env(safe-area-inset-left));padding-right:max(14px,env(safe-area-inset-right))}main{padding-left:max(10px,env(safe-area-inset-left));padding-right:max(10px,env(safe-area-inset-right));padding-bottom:max(30px,env(safe-area-inset-bottom))}}
@media(max-width:900px){body{font-size:14px!important}.topbar{width:100%!important;max-width:100%!important}.brand{min-width:0!important}.brand>div{min-width:0!important}.brand strong,.brand small{white-space:normal!important}#appShell>.headerActions{min-width:0!important;overflow-x:auto!important;overflow-y:hidden!important}#appShell>.headerActions>.actionCard{display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;width:max-content!important;min-width:100%!important}#appShell>.headerActions>.actionCard>*{width:240px!important;min-width:240px!important;max-width:240px!important;flex:0 0 240px!important}#appShell>.headerActions>.v55ComparisonNavRow>.v55TopNavButton{flex-basis:240px!important;width:240px!important;min-width:240px!important;max-width:240px!important}main{width:100%!important;max-width:100%!important;padding:14px 10px 30px!important}.card{padding:18px 16px!important;width:100%!important;max-width:100%!important}.sectionTitle{align-items:flex-start!important;flex-wrap:wrap!important}.sectionTitle h2{font-size:20px!important;line-height:1.45!important}.sectionTitle p{font-size:13px!important;line-height:1.75!important}.managerWeightPanel{min-height:250px!important}.managerWeightPanel .sectionTitle{gap:10px!important;align-items:flex-start!important}.managerWeightPanel .sectionTitle p{white-space:normal!important;overflow:visible!important}.entryTabPanel[hidden]{display:none!important}.entryTabButton{font-size:14px!important}.fieldGrid,.dashboard,.summaryGrid,.strengthWeaknessGrid{grid-template-columns:1fr!important}main .actionCard{display:grid!important;grid-template-columns:1fr!important;width:100%!important}main .actionCard>*{width:100%!important;min-width:0!important}.tableWrap,.managementStyleComparisonTable,.multiVehicleComparisonTable{max-width:100%!important;overflow-x:auto!important;-webkit-overflow-scrolling:touch!important}.criteriaNav{position:static!important}.criteriaNav nav{display:block!important}.assessmentLayout{grid-template-columns:1fr!important}.item{grid-template-columns:1fr!important}.comparisonCountPrompt,.comparisonCountToolbar,.comparisonUploadSlot{grid-template-columns:1fr!important}.multiComparisonUploadGrid,.multiRadarGrid,.comparisonRadarPair{grid-template-columns:1fr!important}.comparisonRadarPane{min-height:0!important;overflow:hidden!important}.comparisonManagerRadar.radarChart svg{width:100%!important;max-width:100%!important;height:auto!important;min-height:320px!important}.v55RadarModeControl{width:100%!important;margin:8px 0 0!important;display:grid!important;grid-template-columns:1fr 1fr!important}.v55RadarModeControl button{width:100%!important}#managerComparisonCard .comparisonWorkspaceHeader,#managerComparisonCard .comparisonDetailHeader{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:10px!important;text-align:right!important}#managerComparisonCard .comparisonWorkspaceTitle,#managerComparisonCard .comparisonWorkspaceHeader>div,#managerComparisonCard .comparisonDetailHeader>div{width:100%!important;min-width:0!important;text-align:right!important}#managerComparisonCard .comparisonWorkspaceHeader h2,#managerComparisonCard .comparisonWorkspaceHeader h3,#managerComparisonCard .comparisonDetailHeader h3{width:100%!important;margin:0 0 6px!important;line-height:1.55!important;text-align:right!important}#managerComparisonCard .comparisonWorkspaceHeader p,#managerComparisonCard .comparisonDetailHeader p{width:100%!important;margin:0!important;text-align:right!important}#managerComparisonCard #comparisonStatus{display:inline-flex!important;align-self:flex-start!important;margin-inline-start:0!important;max-width:max-content!important}input,select,textarea{font-size:16px!important}input[type=date],input[data-meta*=date i],input[id*=date i]{font-size:16px!important;scroll-margin-block:30vh}input.mobileCalendarFocus{position:relative!important;z-index:5!important;transform:scale(1.03);transform-origin:center;box-shadow:0 0 0 4px #1b7fa52b,0 8px 22px #173f6330!important}}
@media(max-width:680px){#appShell>.headerActions>.actionCard>*{width:208px!important;min-width:208px!important;max-width:208px!important;flex-basis:208px!important}#appShell>.headerActions>.v55ComparisonNavRow>.v55TopNavButton{width:208px!important;min-width:208px!important;max-width:208px!important;flex-basis:208px!important;height:44px!important;min-height:44px!important;font-size:13px!important}}
@media(max-width:480px){body{font-size:13.5px!important}main{padding-inline:8px!important}.card{padding:15px 13px!important;border-radius:14px!important}.sectionTitle h2{font-size:18px!important}.sectionTitle p{font-size:12.5px!important}.brand strong{font-size:20px!important}.brand small{font-size:12px!important}.entryTabButton,button,.button{white-space:normal!important;line-height:1.55!important}.scoreChart{gap:4px!important}.barItem{min-width:56px!important}.barTrack{width:32px!important}}`;
    if(s.textContent!==text)s.textContent=text;
  }

  function dateField(e){return e instanceof HTMLInputElement&&(e.type==='date'||String(e.getAttribute('data-meta')||'').toLowerCase().includes('date')||String(e.id||'').toLowerCase().includes('date'))}
  function centerDate(e){if(!matchMedia('(max-width:900px)').matches||!dateField(e.target))return;e.target.classList.add('mobileCalendarFocus');requestAnimationFrame(()=>e.target.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'}));setTimeout(()=>{if(document.activeElement===e.target)e.target.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'})},180)}
  function blurDate(e){if(e.target instanceof HTMLInputElement)e.target.classList.remove('mobileCalendarFocus')}
  function top(e){if(matchMedia('(max-width:900px)').matches&&e.target.closest?.('.entryTabButton,.roleChoice'))requestAnimationFrame(()=>scrollTo({top:0,left:0}))}
  let q=false;function refresh(){css();labels();nav();applyRadarView()}function schedule(){if(q)return;q=true;requestAnimationFrame(()=>{q=false;refresh()})}
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true});document.addEventListener('click',top,true);document.addEventListener('focusin',centerDate,true);document.addEventListener('focusout',blurDate,true);document.addEventListener('click',schedule,true);document.addEventListener('keydown',schedule,true);addEventListener('resize',schedule);addEventListener('orientationchange',schedule);refresh();
})();