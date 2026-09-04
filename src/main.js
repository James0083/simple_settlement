/* 진입점 — 마운트. (서비스 워커 등록은 index.html 하단에 있다.) */
import { createRoot } from "react-dom/client";
import { html } from "./lib/html.js";
import { App } from "./App.js";

createRoot(document.getElementById("root")).render(html`<${App} />`);
