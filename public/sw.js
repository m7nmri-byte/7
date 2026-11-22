/* عامل خدمة بسيط: يُبقي الأدوات تعمل بلا إنترنت */

const VERSION = "v1";
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
        .catch(async () => (await caches.match(request)) ?? caches.match("/")),
    );
  }
});
