/* ============================================================
   عامل التخزين — «دروسي»
   غيّر رقم الإصدار مع كل نسخة جديدة عشان المتصفح ياخدها فورًا.
   الاستراتيجية: الشبكة أولًا للملفات الأساسية، والكاش احتياطي
   لو النت مقطوع — عشان المستخدم ما يفضلش شايف نسخة قديمة.
   ============================================================ */
var VER   = "v5";
var CACHE = "drosy-" + VER;

self.addEventListener("install", function(e){
  self.skipWaiting();                       /* النسخة الجديدة تشتغل فورًا */
  e.waitUntil(caches.open(CACHE).then(function(c){
    return c.addAll(["./","./index.html"]).catch(function(){});
  }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.map(function(k){ if(k!==CACHE) return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("message", function(e){
  if(e.data==="skipWaiting") self.skipWaiting();
});

self.addEventListener("fetch", function(e){
  var u = e.request.url;
  if(e.request.method!=="GET") return;
  /* فايربيز وجوجل: من الشبكة دايمًا */
  if(/firebase|googleapis|gstatic|wa\.me/.test(u)) return;

  /* الصفحة نفسها: الشبكة أولًا — عشان التحديثات توصل */
  var isPage = e.request.mode==="navigate" || /\.html($|\?)/.test(u) || u.endsWith("/");
  if(isPage){
    e.respondWith(
      fetch(e.request).then(function(r){
        var cp = r.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, cp); }).catch(function(){});
        return r;
      }).catch(function(){
        return caches.match(e.request).then(function(m){ return m || caches.match("./index.html"); });
      })
    );
    return;
  }
  /* باقي الملفات: الكاش أولًا للسرعة */
  e.respondWith(
    caches.match(e.request).then(function(m){
      return m || fetch(e.request).then(function(r){
        var cp = r.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, cp); }).catch(function(){});
        return r;
      });
    })
  );
});
