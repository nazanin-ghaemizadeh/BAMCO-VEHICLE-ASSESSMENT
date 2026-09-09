/* v63 — supplied Persian BAMCO logo + compact inline captcha */
(()=>{
  function apply(){
    let style=document.querySelector('#bamco-v63-styles');
    if(!style){style=document.createElement('style');style.id='bamco-v63-styles';document.head.appendChild(style)}
    style.textContent=`
      #entryScreen .entryBrand img{content:url('./bamco-logo.webp?v=63')!important;width:min(390px,68vw)!important;max-width:390px!important;height:150px!important;object-fit:contain!important;border-radius:0!important}
      #entryScreen .bamcoCaptcha{padding:10px 12px!important;margin-top:0!important}
      #entryScreen .bamcoCaptchaHead{display:none!important}
      #entryScreen .bamcoCaptchaRow{display:grid!important;grid-template-columns:42px 118px minmax(150px,1fr)!important;gap:8px!important;align-items:center!important}
      #entryScreen .bamcoCaptchaRefresh{display:flex!important;align-items:center!important;justify-content:center!important;width:42px!important;height:42px!important;grid-column:1!important;grid-row:1!important}
      #entryScreen .bamcoCaptchaQuestion{grid-column:2!important;grid-row:1!important;min-height:42px!important;font-size:15px!important}
      #entryScreen .bamcoCaptchaInput{grid-column:3!important;grid-row:1!important;min-height:42px!important}
      #entryScreen .bamcoCaptchaMessage{min-height:15px!important;margin-top:5px!important;font-size:10px!important}
      @media(max-width:520px){#entryScreen .entryBrand img{width:min(330px,82vw)!important;height:130px!important}#entryScreen .bamcoCaptchaRow{grid-template-columns:40px 105px minmax(100px,1fr)!important}}
    `;
    const img=document.querySelector('#entryScreen .entryBrand img');if(img){img.src='./bamco-logo.webp?v=63';img.style.content="url('./bamco-logo.webp?v=63')"}
    const row=document.querySelector('#bamcoEntryCaptcha .bamcoCaptchaRow');const refresh=document.querySelector('#bamcoCaptchaRefresh');if(row&&refresh&&refresh.parentElement!==row)row.insertBefore(refresh,row.firstChild);
  }
  new MutationObserver(apply).observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();