/* 딱정산 서비스 워커 — 오프라인 지원 + 앱 설치 */
// 자원(HTML·JS·아이콘)을 바꾸면 이 값을 올려야 사용자 기기에서 새로 받는다.
const CACHE = "ddakjeongsan-v2";

// 앱 셸 (같은 출처)
const CORE = [
  "./",
  "./index.html",
  "./contact.html",
  "./privacy.html",
  "./terms.html",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  // 앱 소스 (src/main.js 를 진입점으로 하는 ES 모듈 그래프)
  "./src/main.js",
  "./src/App.js",
  "./src/lib/html.js",
  "./src/lib/util.js",
  "./src/lib/settlement.js",
  "./src/lib/exportImage.js",
  "./src/ui/styles.js",
  "./src/components/BrandLogo.js",
  "./src/components/ParticipantsSection.js",
  "./src/components/RoundsSection.js",
  "./src/components/SummarySection.js",
  "./src/components/ResultReceipt.js",
  "./src/components/ImagePreviewOverlay.js",
  "./src/components/SiteFooter.js",
  "./src/hooks/useSettlement.js",
];

// 외부 CDN — 하나쯤 실패해도 설치는 계속. import map 이 가리키는 vendor ESM 과
// 그 내부 의존성(react-dom → react·scheduler)까지 포함한다. 폰트 CSS 도 함께.
const VENDOR = [
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css",
  "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap",
  "https://cdn.jsdelivr.net/npm/react@18.3.1/+esm",
  "https://cdn.jsdelivr.net/npm/react-dom@18.3.1/+esm",
  "https://cdn.jsdelivr.net/npm/react-dom@18.3.1/client/+esm",
  "https://cdn.jsdelivr.net/npm/scheduler@0.23.2/+esm",
  "https://cdn.jsdelivr.net/npm/htm@3.1.1/+esm",
  "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(CORE);
      await Promise.allSettled(VENDOR.map((url) => cache.add(url)));
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // 페이지 이동: 네트워크 우선 → 실패 시 캐시(오프라인)
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone());
          return fresh;
        } catch (e) {
          const cache = await caches.open(CACHE);
          return (
            (await cache.match(req)) ||
            (await cache.match("./index.html")) ||
            Response.error()
          );
        }
      })()
    );
    return;
  }

  // 그 외 자원: 캐시 우선 + 백그라운드 갱신 (stale-while-revalidate)
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);
      return cached || (await network) || Response.error();
    })()
  );
});
