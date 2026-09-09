/* BAMCO deployment freshness layer.
   index.html is a tiny bootstrap; app.html is the real application shell.
   This worker always bypasses the browser HTTP cache for the application shell,
   scripts and styles so GitHub Pages changes become visible without Ctrl+F5. */
const BUILD='20260909-infra-v1';
const scopeUrl=new URL(self.registration.scope);
const scopePath=scopeUrl.pathname.endsWith('/')?scopeUrl.pathname:`${scopeUrl.pathname}/`;
const rootIndex=`${scopePath}index.html`;

self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));

function freshRequest(request){
  return new Request(request,{cache:'no-store'});
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  if(request.mode==='navigate'){
    const isRoot=url.pathname===scopePath||url.pathname===rootIndex;
    if(isRoot){
      const appUrl=new URL('./app.html',self.registration.scope);
      appUrl.searchParams.set('build',BUILD);
      appUrl.searchParams.set('_fresh',String(Date.now()));
      event.respondWith(
        fetch(appUrl.href,{cache:'no-store',credentials:'same-origin'})
          .catch(()=>fetch(request))
      );
      return;
    }
    event.respondWith(fetch(freshRequest(request)).catch(()=>fetch(request)));
    return;
  }

  if(request.destination==='script'||request.destination==='style'||request.destination==='worker'){
    event.respondWith(fetch(freshRequest(request)).catch(()=>fetch(request)));
  }
});
