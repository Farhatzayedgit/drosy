/* ============================================================
   عامل التخزين — «دروسي»
   الصفحة نفسها (index.html) مش بتتخزّن خالص — بتتجاب من الشبكة
   دايمًا. ده بيمنع أهم مشكلة: نسخة HTML قديمة مع جافاسكريبت
   جديد (أو العكس) فالبرنامج يفتح والأزرار ماتستجيبش.
   الكاش للحالة الوحيدة اللي محتاجينه فيها: النت مقطوع تمامًا.
   ============================================================ */
var VER   = "v45";
var CACHE = "drosy-" + VER;
var PAGE  = "./index.html";
/* أدوات عمل الـPDF والـQR — بتتخزّن عشان تشتغل من غير نت */
var LIBS  = [
  "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js",
  "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js",
  "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js"
];

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return Promise.all([c.add(new Request(PAGE, { cache:"reload" })).catch(function(){})]
        .concat(LIBS.map(function(u){
          return fetch(new Request(u, { mode:"no-cors" })).then(function(r){ return c.put(u, r); })
            .catch(function(){});
        })));
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
  /* أدوات الـPDF والـQR: من الكاش لو موجودة (ثابتة بإصدارها)، وإلا من الشبكة */
  if(LIBS.indexOf(req.url) >= 0){
    e.respondWith(
      caches.match(req.url).then(function(m){
        return m || fetch(req).then(function(r){
          var cp = r.clone();
          caches.open(CACHE).then(function(c){ c.put(req.url, cp); }).catch(function(){});
          return r;
        });
      })
    );
    return;
  }
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
