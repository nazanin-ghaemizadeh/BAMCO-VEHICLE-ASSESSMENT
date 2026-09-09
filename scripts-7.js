/* scripts-7 loader — preserves the previous bundle and then applies latest comparison/mobile refinements */
(()=>{
  const BUILD='20260909-v57';
  window.BAMCO_FRONTEND_BUILD=BUILD;
  const load=(src,done)=>{
    const script=document.createElement('script');
    script.src=`${src}?v=${BUILD}`;
    script.onload=()=>done?.();
    script.onerror=()=>console.error('BAMCO script load failed:',script.src);
    document.head.appendChild(script);
  };
  load('./scripts-7-base.js',()=>load('./scripts-8.js',()=>load('./scripts-9.js',()=>load('./scripts-10.js'))));
})();
