const CACHE='life-os-plus-v3';
const ASSETS=['./','./index.html','./styles.css','./app.js','./manifest.json','./icon.svg','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET') return;
  if(url.origin!==location.origin) return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(res=>{const copy=res.clone(); caches.open(CACHE).then(cache=>cache.put(event.request,copy)); return res;}).catch(()=>caches.match('./index.html'))));
});
