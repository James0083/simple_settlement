/*
 * 앱인토스 설정 — `ait build` 가 읽는다 (npm run build:ait).
 * webBundleDir 은 vite.config.js 의 앱인토스 출력 폴더와 같아야 한다.
 */
import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "ddakjeongsan",
  brand: {
    primaryColor: "#E8503A", // styles.js 의 C_RED (브랜드 색)
  },
  permissions: [{ name: "clipboard", access: "write" }],
  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
    theme: "light",
  },
  webView: {
    bounces: false,
    pullToRefreshEnabled: false,
    overScrollMode: "never",
  },
  webBundleDir: "dist-ait",
});
