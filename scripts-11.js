/* v58 — center comparison workspace title and gate Back to Comparison to real drill-down only */
(()=>{
  function visible(el){
    if(!el||!el.isConnected||el.hidden)return false;
    let node=el;
    while(node&&node!==document.body){
      if(node.hidden)return false;
      node=node.parentElement;
    }
    return true;
  }

  function detailActive(card){
    if(!card)return false;
    const barDetail=card.querySelector('#vehicleComparisonBody > .v52DetailView');
    if(visible(barDetail))return true;
    const criterionDetail=card.querySelector('#comparisonCriterionDetail');
    if(visible(criterionDetail)&&card.classList.contains('criterionDetailMode'))return true;
    return false;
  }

  function syncNavigation(){
    const card=document.querySelector('#managerComparisonCard');
    const inComparison=!!card&&!card.hidden&&document.body.classList.contains('managerMode');
    const inDetail=inComparison&&detailActive(card);
    document.body.classList.toggle('v58ComparisonOpen',inComparison);
    document.body.classList.toggle('v58ComparisonDetail',inDetail);

    const dashboard=document.querySelector('#v55BackDashboard');
    const comparison=document.querySelector('#v55BackComparison');
    if(dashboard)dashboard.hidden=!inComparison;
    if(comparison)comparison.hidden=!inDetail;
    const row=document.querySelector('#appShell > .headerActions > .v55ComparisonNavRow');
    if(row)row.hidden=!inComparison;
  }

  function injectStyles(){
    let style=document.querySelector('#bamco-v58-styles');
    if(!style){style=document.createElement('style');style.id='bamco-v58-styles';document.head.appendChild(style)}
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
      body.v58ComparisonOpen:not(.v58ComparisonDetail) #v55BackComparison{display:none!important}
      body:not(.v58ComparisonOpen) #v55BackDashboard,
      body:not(.v58ComparisonOpen) #v55BackComparison{display:none!important}
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
    requestAnimationFrame(()=>{queued=false;injectStyles();syncNavigation()});
  }

  new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class']});
  document.addEventListener('click',schedule,true);
  document.addEventListener('keydown',schedule,true);
  addEventListener('resize',schedule);
  injectStyles();
  syncNavigation();
})();
