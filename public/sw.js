/* عامل خدمة بسيط: يُبقي الأدوات تعمل بلا إنترنت */

const VERSION = "v2";
const SHELL = `shell-${VERSION}`;
const PAGES = `pages-${VERSION}`;

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(SHELL));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // تنظيف ذاكرات النسخ السابقة
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // ملفات البناء لا تتغيّر أبدًا تحت نفس الاسم — الذاكرة أولًا
  if (url.pathname.startsWith("/_next/static")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((res) => {
            const copy = res.clone();
            void caches.open(SHELL).then((c) => c.put(request, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // الصفحات: الشبكة أولًا، وعند انقطاعها آخر نسخة محفوظة
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          void caches.open(PAGES).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => offline(url, request)),
    );
  }
});

/**
 * بديل الانقطاع.
 *
 * كان الرجوع إلى "/" — أي إلى الصفحة الرئيسة للموقع الأساس. وأداة
 * مثبَّتة لا يجوز أن تهبط في الموقع الأساس بحال، فلو انقطع الاتصال
 * ولم تُحفظ صفحتها بعد خرجت من إطارها. فالبديل الآن من داخل الأداة:
 * صفحتها المحفوظة، ثم صفحة اعتذار بلا أي رابطٍ يخرج منها.
 */
async function offline(url, request) {
  const hit = await caches.match(request);
  if (hit) return hit;

  /** جذر الأداة: /lab/<المعرّف> — بلا تعبير نمطيّ، فالشرطة المائلة تكفي */
  const parts = url.pathname.split("/");
  if (parts[1] === "lab" && parts[2]) {
    const own = await caches.match("/lab/" + parts[2]);
    if (own) return own;
    return apology("هذه الأداة تحتاج اتصالًا أول مرة");
  }

  return (await caches.match("/")) ?? apology("لا اتصال");
}

function apology(text) {
  const html =
    "<!DOCTYPE html><html lang=ar dir=rtl><head><meta charset=utf-8>" +
    "<meta name=viewport content=\"width=device-width,initial-scale=1\">" +
    "<title>بلا اتصال</title><style>" +
    "html,body{height:100%;margin:0}body{display:grid;place-items:center;" +
    "background:#1a1a1a;color:#e8e8e8;font-family:system-ui,sans-serif;padding:24px}" +
    "p{font-size:14px;line-height:1.9;text-align:center;max-width:22rem}" +
    "</style></head><body><p>" + text + "</p></body></html>";
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

