/* 딱정산 서비스 워커 — 오프라인 지원 + 앱 설치 */
// 자원(HTML·JS·아이콘)을 바꾸면 이 값을 올려야 사용자 기기에서 새로 받는다.
const CACHE = "ddakjeongsan-v20";

// 앱 셸 (같은 출처)
const CORE = [
  "./",
  "./index.html",
  "./contact.html",
  "./privacy.html",
  "./terms.html",
  "./release-notes.html",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png",
  "./screenshots/home.png",
  // 앱 소스 (src/main.js 를 진입점으로 하는 ES 모듈 그래프)
  "./src/main.js",
  "./src/App.js",
  "./src/lib/html.js",
  "./src/lib/util.js",
  "./src/lib/settlement.js",
  "./src/lib/exportImage.js",
  "./src/lib/storage.js",
  "./src/lib/router.js",
  "./src/lib/food.js",
  "./src/lib/foodData.js",
  "./src/lib/coupang.js",
  "./src/lib/random.js",
  "./src/lib/sfx.js",
  "./src/lib/josa.js",
  "./src/lib/wheel.js",
  "./src/lib/entitlements.js",
  "./src/ui/styles.js",
  "./src/components/BrandLogo.js",
  "./src/components/ParticipantsSection.js",
  "./src/components/RoundsSection.js",
  "./src/components/SummarySection.js",
  "./src/components/ResultReceipt.js",
  "./src/components/ImagePreviewOverlay.js",
  "./src/components/SiteFooter.js",
  "./src/components/icons.js",
  "./src/components/ReceiptCard.js",
  "./src/components/TabBar.js",
  "./src/components/ChipGroup.js",
  "./src/components/food/FoodForm.js",
  "./src/components/food/FoodResult.js",
  "./src/components/AdSlot.js",
  "./src/components/games/registry.js",
  "./src/components/games/palette.js",
  "./src/components/games/common.js",
  "./src/components/games/GameResult.js",
  "./src/components/games/RouletteGame.js",
  "./src/components/games/LadderGame.js",
  "./src/components/games/BombGame.js",
  "./src/components/games/PirateGame.js",
  "./src/components/games/CrocodileGame.js",
  "./src/components/games/TapBattleGame.js",
  "./src/components/games/TurnOrder.js",
  "./src/components/games/three/stage.js",
  "./src/components/games/three/ThreeView.js",
  "./src/components/games/three/pirateScene.js",
  "./src/components/games/three/crocScene.js",
  "./src/screens/SettleScreen.js",
  "./src/screens/FoodScreen.js",
  "./src/screens/GamesScreen.js",
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
  "https://cdn.jsdelivr.net/npm/three@0.186.1/+esm",
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

  // 외부 CDN(버전이 URL 에 박혀 있어 바뀌지 않음): 캐시 우선 + 백그라운드 갱신 (stale-while-revalidate)
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
