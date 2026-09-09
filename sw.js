/* BAMCO freshness layer. The root page is now the complete application shell.
   Network-first navigation prevents an older shell from flashing before updates. */

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
    event.respondWith(fetch(freshRequest(request)).catch(()=>fetch(request)));
    return;
  }

  if(request.destination==='script'||request.destination==='style'||request.destination==='worker'){
    event.respondWith(fetch(freshRequest(request)).catch(()=>fetch(request)));
  }
});
