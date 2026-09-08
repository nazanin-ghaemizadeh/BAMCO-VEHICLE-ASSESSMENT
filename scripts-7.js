/* scripts-7 loader — preserves the previous bundle and then applies v50 enhancements */
(()=>{
  const load=(src,done)=>{
    const script=document.createElement('script');
    script.src=src;
    script.onload=()=>done?.();
    script.onerror=()=>console.error('BAMCO script load failed:',src);
    document.head.appendChild(script);
  };
  load('./scripts-7-base.js?v=50',()=>load('./scripts-8.js?v=50'));
})();
