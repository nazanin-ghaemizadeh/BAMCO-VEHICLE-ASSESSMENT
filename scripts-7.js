/* scripts-7 loader — v66: immediate entry polish, then feature chain */
(()=>{
  const BUILD='20260910-v66';
  window.BAMCO_FRONTEND_BUILD=BUILD;

  /* Replace the inline legacy logo immediately, before the feature chain loads. */
  const logo=document.querySelector('#entryScreen .entryBrand img');
  if(logo){
    const src=`./bamco-logo.svg?v=${BUILD}`;
    logo.src=src;
    logo.removeAttribute('srcset');
    logo.style.content=`url("${src}")`;
  }

  const load=(src,done)=>{
    const script=document.createElement('script');
    script.src=`${src}?v=${BUILD}`;
    script.onload=()=>done?.();
    script.onerror=()=>console.error('BAMCO script load failed:',script.src);
    document.head.appendChild(script);
  };

  /* Captcha/logo/tooltip are independent, so apply them immediately instead of after five bundles. */
  load('./scripts-12.js');
  load('./scripts-7-base.js',()=>load('./scripts-8.js',()=>load('./scripts-9.js',()=>load('./scripts-10.js',()=>load('./scripts-11.js')))));
})();