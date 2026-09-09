/* v64 — supplied Persian BAMCO logo + compact inline captcha; no mutation loop */
(()=>{
  function apply(){
    let style=document.querySelector('#bamco-v63-styles');
    if(!style){
      style=document.createElement('style');
      style.id='bamco-v63-styles';
      style.textContent=`
        #entryScreen .entryBrand img{content:url('./bamco-logo.webp?v=64')!important;width:min(390px,68vw)!important;max-width:390px!important;height:150px!important;object-fit:contain!important;border-radius:0!important}
        #entryScreen .bamcoCaptcha{padding:8px 10px!important;margin-top:0!important}
        #entryScreen .bamcoCaptchaHead{display:none!important}
        #entryScreen .bamcoCaptchaRow{display:grid!important;grid-template-columns:36px 108px minmax(145px,1fr)!important;gap:7px!important;align-items:center!important}
        #entryScreen .bamcoCaptchaRefresh{display:flex!important;align-items:center!important;justify-content:center!important;width:36px!important;height:36px!important;grid-column:1!important;grid-row:1!important;padding:0!important}
        #entryScreen .bamcoCaptchaQuestion{grid-column:2!important;grid-row:1!important;min-height:36px!important;font-size:14px!important}
        #entryScreen .bamcoCaptchaInput{grid-column:3!important;grid-row:1!important;min-height:36px!important;padding-block:6px!important}
        #entryScreen .bamcoCaptchaMessage{min-height:14px!important;margin-top:4px!important;font-size:10px!important}
        @media(max-width:520px){#entryScreen .entryBrand img{width:min(330px,82vw)!important;height:130px!important}#entryScreen .bamcoCaptchaRow{grid-template-columns:34px 98px minmax(100px,1fr)!important}}
      `;
      document.head.appendChild(style);
    }
    const img=document.querySelector('#entryScreen .entryBrand img');
    if(img){
      img.src='./bamco-logo.webp?v=64';
      img.style.content="url('./bamco-logo.webp?v=64')";
    }
    const row=document.querySelector('#bamcoEntryCaptcha .bamcoCaptchaRow');
    const refresh=document.querySelector('#bamcoCaptchaRefresh');
    if(row&&refresh&&refresh.parentElement!==row)row.insertBefore(refresh,row.firstChild);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
  else apply();
  setTimeout(apply,250);
})();