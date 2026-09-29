/*
 * 딱정산 — 앱 셸. 해시 라우트(#/settle · #/food · #/games)에 따라 화면을 고르고 하단 탭바를 그린다.
 * useSettlement 는 셸에서 호출한다 — 탭을 옮겨 정산 화면이 unmount 돼도 입력이 남고,
 * 다른 탭(뭐먹지·미니게임)이 명단을 읽거나 회차를 넘길 수 있다.
 */
import { useEffect } from "react";
import { html } from "./lib/html.js";
import { styles } from "./ui/styles.js";
import { useHashRoute } from "./lib/router.js";
import { useSettlement } from "./hooks/useSettlement.js";
import { SettleScreen } from "./screens/SettleScreen.js";
import { FoodScreen } from "./screens/FoodScreen.js";
import { GamesScreen } from "./screens/GamesScreen.js";
import { TabBar } from "./components/TabBar.js";
import { ImagePreviewOverlay } from "./components/ImagePreviewOverlay.js";
import { SiteFooter } from "./components/SiteFooter.js";

export function App() {
  const s = useSettlement();
  const { route, sub } = useHashRoute();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route, sub]);

  return html`
    <div style=${styles.page}>
      ${route === "settle" && html`<${SettleScreen} s=${s} />`}
      ${route === "food" && html`<${FoodScreen} s=${s} />`}
      ${route === "games" && html`<${GamesScreen} s=${s} sub=${sub} />`}

      <${SiteFooter} />

      <${TabBar} route=${route} />

      <${ImagePreviewOverlay} preview=${s.imagePreview} onClose=${() => s.setImagePreview(null)} />
    </div>
  `;
}
