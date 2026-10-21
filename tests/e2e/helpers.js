/*
 * 브라우저 테스트 공용 — Vite 개발 서버를 빈 포트로 띄우고, 설치된 Chrome 을 playwright-core 로 연다.
 * 브라우저를 따로 내려받지 않는다. Chrome 이 다른 곳에 있으면 CHROME_PATH 로 실행 파일 경로를 준다.
 */
import { createServer } from "vite";
import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));

export async function startApp() {
  const server = await createServer({ root, logLevel: "silent", server: { port: 0, strictPort: false } });
  await server.listen();
  const { port } = server.httpServer.address();
  const browser = await chromium.launch(
    process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" }
  );
  return {
    url: `http://localhost:${port}`,
    browser,
    async close() {
      await browser.close();
      await server.close();
    },
  };
}

// 콘솔 오류 · 페이지 예외를 모은다 — React 개발 모드 경고(key · DOM 속성 이름 등)도 오류로 센다.
export function collectErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return errors;
}

// 앱을 열기 전에 기기 저장소(명단 · 미리 열기 권한)를 채운다
export async function openWithStorage(page, url, items) {
  await page.goto(url);
  await page.evaluate((entries) => {
    localStorage.clear();
    for (const [k, v] of Object.entries(entries)) localStorage.setItem(`ddak:${k}`, JSON.stringify(v));
  }, items);
  await page.reload();
}
