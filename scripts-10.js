/* v54 — exact radar labels, centered comparison chart, and consolidated comparison navigation */
(()=>{
  const criteria=()=>window.ASSESSMENT_CRITERIA||[];

  function radarCriterionName(main){
    if(!main)return '';
    try{
      if(typeof title==='function')return title(main.titleFa,'main',main.id);
    }catch(_){ }
    return main.titleFa||main.id||'';
  }

  function labelVariants(main){
    const out=[main?.titleFa,main?.titleEn,main?.id,radarCriterionName(main)];
    try{if(typeof criterionLabel==='function')out.push(criterionLabel(main))}catch(_){ }
    return out.filter(Boolean).map(v=>String(v).trim()).filter(Boolean);
  }

  function findCriterionFromText(text){
    const value=String(text||'').trim();
    if(!value)return null;
    return criteria().find(main=>labelVariants(main).some(label=>value===label||value.includes(label)||label.includes(value)))||null;
  }

  function patchCriterionLabels(){
    const detailTitle=document.querySelector('#managerComparisonCard .v52DetailTitle h3');
    if(detailTitle){
      const main=findCriterionFromText(detailTitle.textContent);
      if(main)detailTitle.textContent=radarCriterionName(main);
    }
    document.querySelectorAll('#managerComparisonCard .multiVehicleComparisonRow .comparisonCriterion').forEach(label=>{
      const main=findCriterionFromText(label.textContent);
      if(main)label.textContent=radarCriterionName(main);
    });
  }

  function placeBackButton(){
    const card=document.querySelector('#managerComparisonCard');
    if(!card)return;
    const back=card.querySelector('#v52BackButton');
    const dashboard=card.querySelector('#closeComparisonMode');
    const header=dashboard?.closest('.comparisonWorkspaceHeader');
    if(!back||!dashboard||!header)return;
    let actions=header.querySelector('.v54NavActions');
    if(!actions){
      actions=document.createElement('div');
      actions.className='v54NavActions';
      header.insertBefore(actions,dashboard);
      actions.appendChild(dashboard);
    }
    if(back.parentElement!==actions)actions.appendChild(back);
    header.classList.add('v54HasDetailBack');
  }

  function normalizeNavigation(){
    const card=document.querySelector('#managerComparisonCard');
    if(!card)return;
    const header=card.querySelector('.comparisonWorkspaceHeader');
    const actions=header?.querySelector('.v54NavActions');
    const back=card.querySelector('#v52BackButton');
    if(back){placeBackButton();return}
    header?.classList.remove('v54HasDetailBack');
    if(actions&&!actions.querySelector('#v52BackButton'))actions.classList.add('v54DashboardOnly');
  }

  function injectStyles(){
    let style=document.querySelector('#bamco-v53-styles');
    if(!style){style=document.createElement('style');style.id='bamco-v53-styles';document.head.appendChild(style)}
    style.textContent=`
      #managerComparisonCard .v52ChartScroller{width:100%!important;display:block!important}
      #managerComparisonCard .v52Chart{width:max-content!important;min-width:max-content!important;margin-left:auto!important;margin-right:auto!important}
      #managerComparisonCard .v52DetailTitle h3{text-align:center!important}
      #managerComparisonCard .v54NavActions{display:flex!important;align-items:center!important;gap:8px!important;flex-wrap:wrap!important;justify-content:flex-start!important;min-width:max-content}
      #managerComparisonCard .v54NavActions .v52BackButton,
      #managerComparisonCard .v54NavActions #closeComparisonMode{margin:0!important;min-height:42px!important}
      #managerComparisonCard .v54NavActions .v52BackButton{background:#f4f8fb!important;border-color:#bfd0dd!important;color:#173f63!important}
      #managerComparisonCard .v54NavActions .v52BackButton:hover{background:#eaf3f8!important;border-color:#a9c2d2!important}
      #managerComparisonCard .v52DetailHeader{grid-template-columns:1fr!important;padding-top:2px!important}
      #managerComparisonCard .v52DetailHeader>span:last-child{display:none!important}
      #managerComparisonCard .v52DetailHeader .v52DetailTitle{grid-column:1!important;text-align:center!important;width:100%!important}
      @media(max-width:760px){
        body:not(.english),body:not(.english) button,body:not(.english) input,body:not(.english) select,body:not(.english) textarea,body:not(.english) label,body:not(.english) h1,body:not(.english) h2,body:not(.english) h3,body:not(.english) p,body:not(.english) span,body:not(.english) strong,body:not(.english) small{font-family:"B Nazanin","B Nazanin Regular",Tahoma,serif!important}
        body{font-size:14px!important}
        main{padding:14px 10px 30px!important}
        .card{padding:18px 16px!important}
        .sectionTitle h2{font-size:20px!important;line-height:1.45!important}
        .sectionTitle p{font-size:13px!important;line-height:1.75!important}
        .managerWeightPanel{min-height:250px!important}
        .managerWeightPanel .sectionTitle{gap:10px!important;align-items:flex-start!important}
        .managerWeightPanel .sectionTitle p{white-space:normal!important;overflow:visible!important}
        .entryTabPanel[hidden]{display:none!important}
        .entryTabButton{font-size:14px!important}
        #managerComparisonCard .v54NavActions{width:100%!important;min-width:0!important;justify-content:stretch!important}
        #managerComparisonCard .v54NavActions>*{flex:1 1 auto!important}
      }
    `;
  }

  function mobileTopReset(event){
    if(!window.matchMedia('(max-width:760px)').matches)return;
    if(event.target.closest?.('.entryTabButton,.roleChoice'))requestAnimationFrame(()=>window.scrollTo({top:0,left:0}));
  }

  let queued=false;
  function refresh(){
    injectStyles();
    patchCriterionLabels();
    normalizeNavigation();
  }
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;refresh()});
  }

  const observer=new MutationObserver(schedule);
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  document.addEventListener('click',mobileTopReset,true);
  document.addEventListener('click',schedule,true);
  document.addEventListener('keydown',schedule,true);
  window.addEventListener('resize',schedule);
  refresh();
})();
