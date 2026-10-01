/* 진입점 — 마운트 + 서비스 워커 등록. */
import { createRoot } from "react-dom/client";
import { html } from "./shared/html.js";
import { App } from "./App.js";
import { IS_AIT, initPlatform } from "#platform";

initPlatform();

createRoot(document.getElementById("root")).render(html`<${App} />`);

// PWA: 서비스 워커 등록 (오프라인 지원 · 홈 화면 설치). sw.js 는 웹 빌드가 만들므로 개발 서버·앱인토스에서는 등록하지 않는다.
if (import.meta.env.PROD && !IS_AIT && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
