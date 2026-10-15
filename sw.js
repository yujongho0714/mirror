const CACHE='coaching2-v21';   /* 앱 파일 */
const LIB='coaching2-lib';    /* 외부 파일 (버전이 바뀌어도 지우지 않음) */
const FILES=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n.startsWith('coaching2-v')&&n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const rq=e.request; if(rq.method!=='GET') return;
  const same=new URL(rq.url).origin===self.location.origin;
  /* 화면(index.html)은 인터넷이 되면 항상 새로 받아요 → 올린 새 버전이 바로 적용. 인터넷이 없을 때만 저장본 */
  if(same&&(rq.mode==='navigate'||/\/$|\.html$/.test(new URL(rq.url).pathname))){
    e.respondWith(fetch(rq,{cache:'no-store'}).then(r=>{ if(r&&r.ok){ const cp=r.clone(); caches.open(CACHE).then(c=>c.put(rq,cp)); } return r; })
      .catch(()=>caches.match(rq,{ignoreSearch:true}).then(h=>h||caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(rq,{ignoreSearch:same}).then(hit=>{
    /* 외부 파일(해골 모델 등)은 한 번 받으면 계속 캐시에서만 사용 */
    if(hit&&!same) return hit;
    const net=fetch(rq).then(r=>{ if(r&&(r.ok||r.type==='opaque')){ const cp=r.clone(); caches.open(same?CACHE:LIB).then(c=>c.put(rq,cp)); } return r; }).catch(()=>hit);
    return hit||net;
  }));
});
