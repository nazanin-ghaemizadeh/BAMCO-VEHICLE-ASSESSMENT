/* scripts-7 loader — preserves the previous bundle and then applies v53 comparison refinements */
(()=>{
  const load=(src,done)=>{
    const script=document.createElement('script');
    script.src=src;
    script.onload=()=>done?.();
    script.onerror=()=>console.error('BAMCO script load failed:',src);
    document.head.appendChild(script);
  };
  load('./scripts-7-base.js?v=53',()=>load('./scripts-8.js?v=53',()=>load('./scripts-9.js?v=53',()=>load('./scripts-10.js?v=53'))));
})();
