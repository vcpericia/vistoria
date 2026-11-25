// Service worker: guarda o app no celular para abrir mesmo sem sinal.
const CACHE='vcp-vistoria-v5';
const ARQ=['./','index.html','config.js','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ARQ)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin===location.origin){
    // rede primeiro (pega atualizações), cache se estiver sem sinal
    e.respondWith(fetch(req).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(req,cp));return r;}).catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match('index.html'))));
  } else if(url.host.includes('fonts.g')){
    e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp));return res;})));
  }
});

// Avisos (push): mostra a notificação e abre o app ao tocar.
self.addEventListener('push',e=>{
  let j={}; try{ j=e.data?e.data.json():{}; }catch(_){ j={data:{title:'Frota VCP',body:e.data?e.data.text():''}}; }
  const d=Object.assign({},j.notification||{},j.data||{});
  e.waitUntil(self.registration.showNotification(d.title||'Frota VCP',{body:d.body||'',icon:'icon-192.png',badge:'icon-192.png',tag:d.tag||undefined,data:{url:d.url||'./',rota:d.rota||''},actions:d.rota?[{action:'rota',title:'🗺️ Abrir rota'},{action:'abrir',title:'📋 Ver reserva'}]:[]}));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close(); const dd=e.notification.data||{};
  if(e.action==='rota'&&dd.rota){ e.waitUntil(clients.openWindow(dd.rota)); return; }
  const url=dd.url||'./';
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(ws=>{
    const w=ws.find(x=>x.url.split('?')[0].startsWith(self.registration.scope));
    if(w){ return w.focus().then(()=>w.navigate?w.navigate(url):null).catch(()=>clients.openWindow(url)); }
    return clients.openWindow(url);
  }));
});
