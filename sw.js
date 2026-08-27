/* عامل التخزين — بيخلي «دروسي» يفتح من غير نت */
var CACHE = "drosy-v1";
self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    return c.addAll(["./","./index.html"]).catch(function(){});
  }));
});
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.map(function(k){ if(k!==CACHE) return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener("fetch", function(e){
  var u = e.request.url;
  /* فايربيز وجوجل: من الشبكة دايمًا — البيانات لازم تبقى حيّة */
  if(e.request.method!=="GET" || /firebase|googleapis|gstatic/.test(u)) return;
  e.respondWith(
    fetch(e.request).then(function(r){
      var cp = r.clone();
      caches.open(CACHE).then(function(c){ c.put(e.request, cp); }).catch(function(){});
      return r;
    }).catch(function(){ return caches.match(e.request).then(function(m){
      return m || caches.match("./index.html");
    }); })
  );
});
