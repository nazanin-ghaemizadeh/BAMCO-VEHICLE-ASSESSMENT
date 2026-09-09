/* v59 — deterministic comparison navigation state + centered comparison title */
(()=>{
  const q=(sel,root=document)=>root.querySelector(sel);

  function elementVisible(el){
    if(!el||!el.isConnected||el.hidden)return false;
    let node=el;
    while(node&&node!==document.documentElement){
      if(node.hidden)return false;
      node=node.parentElement;
    }
    const cs=getComputedStyle(el);
    return cs.display!=='none'&&cs.visibility!=='hidden';
  }

  function comparisonOpen(){
    const card=q('#managerComparisonCard');
    return elementVisible(card);
  }

  function drilldownOpen(){
    const card=q('#managerComparisonCard');
    if(!elementVisible(card))return false;
    /* The requested detail state is specifically the per-criterion vertical bar chart.
       scripts-9 replaces #vehicleComparisonBody with .v52DetailView only after a criterion is opened. */
    return !!q('#vehicleComparisonBody > .v52DetailView',card);
  }

  function forceDisplay(el,show,display='inline-flex'){
    if(!el)return;
    el.hidden=!show;
    el.style.setProperty('display',show?display:'none','important');
    el.setAttribute('aria-hidden',show?'false':'true');
    if('disabled' in el)el.disabled=!show;
  }

  function syncNavigation(){
    const open=comparisonOpen();
    const detail=open&&drilldownOpen();
    const row=q('#appShell > .headerActions > .v55ComparisonNavRow');
    const dashboard=q('#v55BackDashboard');
    const comparison=q('#v55BackComparison');

    forceDisplay(row,open,'flex');
    forceDisplay(dashboard,open,'inline-flex');
    forceDisplay(comparison,detail,'inline-flex');

    document.documentElement.classList.toggle('bamcoComparisonOpen',open);
    document.documentElement.classList.toggle('bamcoComparisonDetailOpen',detail);
  }

  function bindNavigation(){
    const dashboard=q('#v55BackDashboard');
    const comparison=q('#v55BackComparison');
    if(dashboard&&!dashboard.dataset.v59Bound){
      dashboard.dataset.v59Bound='1';
      dashboard.addEventListener('click',()=>{
        const close=q('#managerComparisonCard #closeComparisonMode');
        if(close)close.click();
      });
    }
    if(comparison&&!comparison.dataset.v59Bound){
      comparison.dataset.v59Bound='1';
      comparison.addEventListener('click',()=>{
        const back=q('#managerComparisonCard #v52BackButton');
        if(back)back.click();
      });
    }
  }

  function injectStyles(){
    let style=q('#bamco-v59-styles');
    if(!style){style=document.createElement('style');style.id='bamco-v59-styles';document.head.appendChild(style)}
    style.textContent=`
      #managerComparisonCard > .comparisonWorkspaceHeader{
        position:relative!important;
        display:grid!important;
        grid-template-columns:1fr!important;
        align-items:start!important;
        min-width:0!important;
      }
      #managerComparisonCard > .comparisonWorkspaceHeader > .comparisonWorkspaceTitle{
        width:100%!important;
        min-width:0!important;
        padding-inline:170px!important;
        text-align:center!important;
        justify-self:center!important;
      }
      #managerComparisonCard > .comparisonWorkspaceHeader > .comparisonWorkspaceTitle h2,
      #managerComparisonCard > .comparisonWorkspaceHeader > .comparisonWorkspaceTitle p{
        width:100%!important;
        text-align:center!important;
        margin-inline:auto!important;
      }
      #managerComparisonCard > .comparisonWorkspaceHeader > #comparisonStatus{
        position:absolute!important;
        left:0!important;
        top:0!important;
        right:auto!important;
        margin:0!important;
        width:auto!important;
        max-width:max-content!important;
      }
      html:not(.bamcoComparisonOpen) #appShell > .headerActions > .v55ComparisonNavRow{display:none!important}
      html.bamcoComparisonOpen:not(.bamcoComparisonDetailOpen) #v55BackComparison{display:none!important}
      @media(max-width:760px){
        #managerComparisonCard > .comparisonWorkspaceHeader > .comparisonWorkspaceTitle{
          padding-inline:0!important;
          padding-top:42px!important;
        }
        #managerComparisonCard > .comparisonWorkspaceHeader > #comparisonStatus{
          left:50%!important;
          transform:translateX(-50%)!important;
        }
      }
    `;
  }

  let queued=false;
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      injectStyles();
      bindNavigation();
      syncNavigation();
    });
  }

  new MutationObserver(schedule).observe(document.documentElement,{
    subtree:true,
    childList:true,
    attributes:true,
    attributeFilter:['hidden','class','style']
  });
  document.addEventListener('click',()=>setTimeout(schedule,0),true);
  document.addEventListener('keydown',()=>setTimeout(schedule,0),true);
  addEventListener('resize',schedule);
  addEventListener('pageshow',schedule);
  injectStyles();
  bindNavigation();
  syncNavigation();
})();
