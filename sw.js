/* 딱정산 서비스 워커 — 오프라인 지원 + 앱 설치 */
// 빌드(vite.config.js)가 결과물 내용으로 버전을 만들어 넣는다 — 손으로 올리지 않는다.
const CACHE = "ddakjeongsan-__CACHE_VERSION__";

// 앱 셸 (같은 출처) — 빌드가 dist/ 의 파일 목록(해시 파일명 포함)을 넣는다.
const CORE = /*__CORE__*/[];

// 외부 CDN(폰트 CSS) — 하나쯤 실패해도 설치는 계속.
const VENDOR = [
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.min.css",
  "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap",
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

// 광고·제휴 도메인 — 캐시하면 광고가 안 나오거나 트래킹이 깨짐
const AD_HOSTS = [
  "link.coupang.com",
  "partners.coupangcdn.com",
  "image6.coupangcdn.com",
  "t1.daumcdn.net",
  "adfit.kakao.com",
  "googleads.g.doubleclick.net",
  "pagead2.googlesyndication.com",
  "tpc.googlesyndication.com",
];

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // http(s): 이외 스킴(chrome-extension:// 등)은 Cache API가 지원하지 않으므로 그냥 통과
  const { protocol } = new URL(req.url);
  if (protocol !== "https:" && protocol !== "http:") return;

  // 광고·제휴 도메인은 서비스워커를 통하지 않고 직접 네트워크로
  if (AD_HOSTS.some((h) => new URL(req.url).hostname.endsWith(h))) return;

  // 페이지 이동: 네트워크 우선 → 실패 시 캐시(오프라인)
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req, { cache: "no-cache" }); // 브라우저 HTTP 캐시를 믿지 않고 서버에 늘 확인(바뀌지 않았으면 304 로 가볍게)
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone());
          return fresh;
        } catch (e) {
          // 링크는 .html 없는 주소(/guide/settle)인데 설치 때 캐시는 파일 이름(guide/settle.html)으로 들어 있으니 둘 다 찾는다
          const cache = await caches.open(CACHE);
          return (
            (await cache.match(req)) ||
            (await cache.match(`${new URL(req.url).pathname}.html`)) ||
            (await cache.match("./index.html")) ||
            Response.error()
          );
        }
      })()
    );
    return;
  }

  // 빌드 결과물(assets/ 아래 해시 파일명): 내용이 바뀌면 이름도 바뀌므로 캐시 우선
  const url = new URL(req.url);
  if (url.origin === self.location.origin && url.pathname.includes("/assets/")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;
        const fresh = await fetch(req);
        if (fresh.ok) cache.put(req, fresh.clone());
        return fresh;
      })()
    );
    return;
  }

  // 우리 앱 파일(같은 주소의 JS·CSS·아이콘): 네트워크 우선 → 실패 시 캐시(오프라인).
  // 서버가 Cache-Control 을 안 보내면(예: 로컬 python 서버) 브라우저가 옛 파일을 "아직 신선하다"고 추정해
  // 재사용할 수 있으므로, cache: "no-cache" 로 매번 서버에 바뀌었는지 확인한다.
  // 캐시를 먼저 주면 파일을 고친 뒤 첫 실행이 늘 옛 코드라, 새 파일과 옛 파일이 섞여 모듈이 깨질 수 있다.
  if (new URL(req.url).origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          const fresh = await fetch(req, { cache: "no-cache" }); // 브라우저 HTTP 캐시를 믿지 않고 서버에 늘 확인(바뀌지 않았으면 304 로 가볍게)
          if (fresh.ok) cache.put(req, fresh.clone());
          return fresh;
        } catch (e) {
          return (await cache.match(req)) || Response.error();
        }
      })()
    );
    return;
  }

  // 외부 CDN(폰트 — 버전이 URL 에 박혀 있어 바뀌지 않음): 캐시 우선 + 백그라운드 갱신 (stale-while-revalidate)
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
