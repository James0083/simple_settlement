/*
 * Vite 설정 — 앱(index.html → src/main.js)만 번들하고, 나머지 정적 파일은 그대로 dist/ 로 복사한다.
 *
 *   npm run dev        로컬 개발 서버 (서비스 워커는 등록하지 않는다)
 *   npm run build      dist/ 생성 — Cloudflare Pages 출력 폴더
 *   npm run dev:ait    앱인토스 모드 개발 서버 — SDK 는 devtools mock, 화면에 devtools 패널
 *   npm run build:ait  dist-ait/ 생성 → ait build 로 ddakjeongsan.ait 만들기
 *
 * 웹/앱인토스 분기: --mode ait 이면 "#platform" 이 src/platform/ait.js 로, 아니면 web.js 로 연결된다.
 * 그래서 웹 번들에는 토스 SDK 가, 앱인토스 번들에는 서비스 워커·SEO·애드센스·CDN 폰트가 들어가지 않는다.
 *
 * 정적 페이지(가이드·정책 등)는 JS 모듈을 쓰지 않으므로 번들하지 않고 원본 그대로 복사한다.
 * sw.js 는 빌드 결과물 목록(해시 파일명)을 주입해 만든다 — 손으로 CORE 목록·CACHE 버전을 관리하지 않는다.
 */
import { defineConfig } from "vite";
import { cpSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

// dist/ 로 그대로 복사할 파일·폴더 (admin/ 은 개발용이라 배포하지 않는다)
const STATIC = [
  "404.html",
  "contact.html",
  "guide.html",
  "privacy.html",
  "terms.html",
  "release-notes.html",
  "guide",
  "docs",
  "prototype",
  "icons",
  "screenshots",
  "src/shared/tokens.css", // 정적 페이지 공용 스타일
  "manifest.webmanifest",
  "favicon.svg",
  "favicon.ico", // /favicon.ico 를 직접 찾는 브라우저·검색 로봇용
  "apple-touch-icon.png",
  "_redirects",
  "_headers",
  "ads.txt",
  "robots.txt",
  "sitemap.xml",
  "naverdf72406ba633267c62d499fe36f1704e.html",
];

// 오프라인 캐시에서 뺄 파일 (크롤러·호스팅 설정·검증용)
const NO_PRECACHE = /^(_redirects|_headers|ads\.txt|robots\.txt|sitemap\.xml|rss\.xml|naver.*\.html|404\.html|docs\/|prototype\/|screenshots\/(og|guide-)[^/]*\.(png|webp))/;

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

// RSS 피드(rss.xml) — 네이버 서치어드바이저는 제출된 RSS 를 "콘텐츠 피드"로 보고 주기적으로 다시 방문한다.
// 가이드 · 버전정보 정적 페이지의 본문 전체를 담는다(네이버 권장). 날짜는 sitemap.xml 의 lastmod 를 쓴다.
const SITE = "https://ddakjeongsan.com";
const RSS_PAGES = [
  ["guide/cases.html", "/guide/cases"],
  ["guide/settle.html", "/guide/settle"],
  ["guide/food.html", "/guide/food"],
  ["guide/games.html", "/guide/games"],
  ["guide.html", "/guide"],
  ["release-notes.html", "/release-notes"],
];

const escapeXml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const rssDate = (ymd) => new Date(`${ymd}T09:00:00+09:00`).toUTCString();

function buildRss() {
  const sitemap = readFileSync("sitemap.xml", "utf8");
  const lastmod = (path) => sitemap.match(new RegExp(`<loc>${SITE}${path}</loc>\\s*<lastmod>([^<]+)`))?.[1];
  const items = RSS_PAGES.map(([file, path]) => {
    const html = readFileSync(file, "utf8");
    const url = SITE + path;
    const title = html.match(/<title>([^<]+)<\/title>/)[1].replace(/ - 딱정산$/, "");
    const description = html.match(/<meta name="description" content="([^"]+)"/)[1];
    // 본문: <main class="card"> 또는 <div class="card"> 안쪽. 상대 주소는 그 페이지 기준 절대 주소로 바꾼다.
    const start = html.search(/<(main|div) class="card">/);
    const end = html.lastIndexOf(html.includes('<main class="card">') ? "</main>" : "</div>", html.indexOf("<script", start));
    const body = html
      .slice(html.indexOf(">", start) + 1, end)
      .replace(/(href|src)="(?![a-z]+:|#)([^"]*)"/g, (_, attr, rel) => `${attr}="${new URL(rel, url).href}"`);
    const date = lastmod(path);
    if (!date) throw new Error(`sitemap.xml 에 ${path} lastmod 가 없다`);
    return { url, title, description, body, date };
  }).sort((a, b) => b.date.localeCompare(a.date));

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
  <title>딱정산</title>
  <link>${SITE}/</link>
  <description>더치페이·N빵 모임 정산 계산기 딱정산의 사용 가이드와 업데이트 소식</description>
  <language>ko</language>
  <lastBuildDate>${rssDate(items[0].date)}</lastBuildDate>
${items
  .map(
    (i) => `  <item>
    <title>${escapeXml(i.title)}</title>
    <link>${i.url}</link>
    <guid isPermaLink="true">${i.url}</guid>
    <pubDate>${rssDate(i.date)}</pubDate>
    <description>${escapeXml(i.description)}</description>
    <content:encoded><![CDATA[${i.body}]]></content:encoded>
  </item>`
  )
  .join("\n")}
</channel>
</rss>
`;
}

function staticAndServiceWorker() {
  let outDir;
  return {
    name: "ddak-static-sw",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      for (const p of STATIC) cpSync(p, join(outDir, p), { recursive: true });
      writeFileSync(join(outDir, "rss.xml"), buildRss());

      const files = walk(outDir)
        .map((f) => relative(outDir, f).split(sep).join("/"))
        .filter((f) => f !== "sw.js" && !NO_PRECACHE.test(f))
        .sort();
      // 결과물 내용이 바뀌면 캐시 이름도 바뀐다 → 사용자 기기에서 새 버전을 받는다
      const hash = createHash("sha256");
      for (const f of files) hash.update(f).update(readFileSync(join(outDir, f)));
      const version = hash.digest("hex").slice(0, 10);

      const core = ["./", ...files.map((f) => `./${f}`)];
      const sw = readFileSync("sw.js", "utf8")
        .replace("__CACHE_VERSION__", version)
        .replace("/*__CORE__*/[]", JSON.stringify(core, null, 2));
      writeFileSync(join(outDir, "sw.js"), sw);
    },
  };
}

// 앱인토스 빌드: index.html 의 <!-- web-only --> ~ <!-- /web-only --> 구간을 뺀다
function stripWebOnly() {
  return {
    name: "ddak-strip-web-only",
    transformIndexHtml: (html) => html.replace(/<!-- web-only[\s\S]*?<!-- \/web-only -->\n?/g, ""),
  };
}

export default defineConfig(async ({ mode }) => {
  const ait = mode === "ait";
  // devtools(SDK mock + 패널)는 Node 24+ 필요 — 웹 빌드(Cloudflare, Node 22)에서는 불러오지 않는다
  const aitPlugins = ait ? [stripWebOnly(), (await import("@apps-in-toss/devtools/unplugin")).default.vite()] : [];
  return {
    // 웹: 상대 경로(하위 경로 배포도 동작). 앱인토스: /food 같은 경로로 들어와도 자원을 찾도록 절대 경로
    base: ait ? "/" : "./",
    resolve: {
      alias: { "#platform": fileURLToPath(new URL(`./src/platform/${ait ? "ait" : "web"}.js`, import.meta.url)) },
    },
    build: {
      outDir: ait ? "dist-ait" : "dist",
      emptyOutDir: true,
      chunkSizeWarningLimit: 800, // three(약 740kB)는 3D 게임을 열 때만 불러오는 별도 청크
    },
    plugins: ait ? aitPlugins : [staticAndServiceWorker()],
  };
});
