/*
 * Vite 설정 — 앱(index.html → src/main.js)만 번들하고, 나머지 정적 파일은 그대로 dist/ 로 복사한다.
 *
 *   npm run dev      로컬 개발 서버 (서비스 워커는 등록하지 않는다)
 *   npm run build    dist/ 생성 — Cloudflare Pages 출력 폴더
 *
 * 정적 페이지(가이드·정책 등)는 JS 모듈을 쓰지 않으므로 번들하지 않고 원본 그대로 복사한다.
 * sw.js 는 빌드 결과물 목록(해시 파일명)을 주입해 만든다 — 손으로 CORE 목록·CACHE 버전을 관리하지 않는다.
 */
import { defineConfig } from "vite";
import { cpSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative, sep } from "node:path";

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
  "apple-touch-icon.png",
  "_redirects",
  "_headers",
  "ads.txt",
  "robots.txt",
  "sitemap.xml",
  "naverdf72406ba633267c62d499fe36f1704e.html",
];

// 오프라인 캐시에서 뺄 파일 (크롤러·호스팅 설정·검증용)
const NO_PRECACHE = /^(_redirects|_headers|ads\.txt|robots\.txt|sitemap\.xml|naver.*\.html|404\.html|docs\/|prototype\/|screenshots\/og\.png)/;

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

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

export default defineConfig({
  base: "./", // 상대 경로 — 하위 경로 배포·앱인토스 번들에서도 그대로 동작
  build: {
    outDir: "dist",
    emptyOutDir: true,
    chunkSizeWarningLimit: 800, // three(약 740kB)는 3D 게임을 열 때만 불러오는 별도 청크
  },
  plugins: [staticAndServiceWorker()],
});
