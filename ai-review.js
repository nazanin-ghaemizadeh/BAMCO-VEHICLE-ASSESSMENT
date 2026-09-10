/* Management preview only. The button intentionally performs no request or navigation. */
(()=>{
  'use strict';
  if(!/\/manager\.html$/.test(location.pathname))return;
  const card=document.createElement('section');
  card.id='aiTechnicalReview';card.className='card managerOnly aiTechnicalReview';
  card.innerHTML='<div class="comparisonEntryCopy aiDemoEntry"><h2 id="aiDemoTitle"></h2><div class="aiDemoVisual"><picture><source media="(prefers-reduced-motion: reduce)" srcset="assets/ai-vehicle-still.png"><img src="assets/ai-vehicle-walk.gif" width="480" height="321" alt="" loading="lazy"></picture><button id="aiReviewStart" type="button" aria-disabled="true"></button></div></div>';
  document.querySelector('#managerReviewComments')?.insertAdjacentElement('afterend',card);
  function translate(){
    const fa=document.documentElement.lang!=='en';
    card.querySelector('#aiDemoTitle').textContent=fa?'بررسی فنی با هوش مصنوعی':'AI Technical Review';
    card.querySelector('#aiReviewStart').textContent=fa?'بررسی فنی':'Technical Review';
  }
  new MutationObserver(translate).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  translate();
})();
