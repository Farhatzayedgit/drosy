/* ============================================================
   عامل التخزين — «دروسي»
   الصفحة نفسها (index.html) مش بتتخزّن خالص — بتتجاب من الشبكة
   دايمًا. ده بيمنع أهم مشكلة: نسخة HTML قديمة مع جافاسكريبت
   جديد (أو العكس) فالبرنامج يفتح والأزرار ماتستجيبش.
   الكاش للحالة الوحيدة اللي محتاجينه فيها: النت مقطوع تمامًا.
   ============================================================ */
var VER   = "v20";
var CACHE = "drosy-" + VER;
var PAGE  = "./index.html";

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return c.add(new Request(PAGE, { cache:"reload" })).catch(function(){});
    })
  );
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
  var req = e.request;
  if(req.method!=="GET") return;
  /* فايربيز وجوجل والواتساب: من الشبكة دايمًا، من غير أي تدخّل */
  if(/firebase|googleapis|gstatic|wa\.me|jsdelivr/.test(req.url)) return;

  var isPage = req.mode==="navigate" ||
               /\.html($|\?)/.test(req.url) ||
               req.url.endsWith("/");

  if(isPage){
    /* الشبكة أولًا وبالإجبار — والكاش احتياطي لو مفيش نت */
    e.respondWith(
      fetch(new Request(req.url, { cache:"reload" })).then(function(r){
        var cp = r.clone();
        caches.open(CACHE).then(function(c){ c.put(PAGE, cp); }).catch(function(){});
        return r;
      }).catch(function(){
        return caches.match(PAGE).then(function(m){
          return m || new Response("مفيش اتصال", { headers:{ "Content-Type":"text/plain; charset=utf-8" } });
        });
      })
    );
    return;
  }
  /* باقي الملفات: الشبكة أولًا كمان — الملفات قليلة والفرق مش محسوس */
  e.respondWith(
    fetch(req).then(function(r){
      var cp = r.clone();
      caches.open(CACHE).then(function(c){ c.put(req, cp); }).catch(function(){});
      return r;
    }).catch(function(){ return caches.match(req); })
  );
});
