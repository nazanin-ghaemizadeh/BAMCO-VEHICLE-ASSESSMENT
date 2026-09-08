/* v53 — use the exact radar criterion labels and center the vertical comparison chart */
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

  function injectStyles(){
    if(document.querySelector('#bamco-v53-styles'))return;
    const style=document.createElement('style');
    style.id='bamco-v53-styles';
    style.textContent=`
      #managerComparisonCard .v52ChartScroller{width:100%!important;display:block!important}
      #managerComparisonCard .v52Chart{width:max-content!important;min-width:max-content!important;margin-left:auto!important;margin-right:auto!important}
      #managerComparisonCard .v52DetailTitle h3{text-align:center!important}
    `;
    document.head.appendChild(style);
  }

  let queued=false;
  function refresh(){
    injectStyles();
    patchCriterionLabels();
  }
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;refresh()});
  }

  const observer=new MutationObserver(schedule);
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  document.addEventListener('click',schedule,true);
  document.addEventListener('keydown',schedule,true);
  window.addEventListener('resize',schedule);
  refresh();
})();
