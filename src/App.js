/*
 * 딱정산 — 앱 셸. 해시 라우트(#/settle · #/food · #/games)에 따라 화면을 고르고 하단 탭바를 그린다.
 * useSettlement 는 셸에서 호출한다 — 탭을 옮겨 정산 화면이 unmount 돼도 입력이 남고,
 * 다른 탭(뭐먹지·미니게임)이 명단을 읽거나 회차를 넘길 수 있다.
 * 뭐먹지·미니게임 화면은 따로 불러온다(lazy) — 첫 화면(정산)을 띄우는 데 필요한 코드를 줄이려고.
 * 앱이 뜬 뒤 쉬는 틈에 미리 받아 두므로, 탭을 누를 때는 보통 바로 열린다.
 */
import { lazy, Suspense, useEffect } from "react";
import { html } from "./shared/html.js";
import { styles } from "./shared/styles.js";
import { useHashRoute } from "./shared/router.js";
import { useSettlement } from "./settlement/useSettlement.js";
import { SettleScreen } from "./settlement/SettleScreen.js";
import { ReceiptCard } from "./shared/ReceiptCard.js";
import { TabBar } from "./shared/TabBar.js";
import { ImagePreviewOverlay } from "./settlement/ImagePreviewOverlay.js";
import { SiteFooter } from "./shared/SiteFooter.js";
import { trackScreen } from "#platform";

const loadFood = () => import("./food/FoodScreen.js");
const loadGames = () => import("./games/GamesScreen.js");

// 새 버전이 배포돼 예전 파일이 사라졌으면 불러오기가 실패한다 → 새로고침해서 새 버전을 받는다
const screen = (load, name) =>
  lazy(() =>
    load().then(
      (m) => ({ default: m[name] }),
      () => {
        location.reload();
        return new Promise(() => {});
      }
    )
  );
const FoodScreen = screen(loadFood, "FoodScreen");
const GamesScreen = screen(loadGames, "GamesScreen");

export function App() {
  const s = useSettlement();
  const { route, sub } = useHashRoute();

  useEffect(() => {
    window.scrollTo(0, 0);
    trackScreen(sub ? `${route}/${sub}` : route);
  }, [route, sub]);

  // 미리 받기 — 실패해도 그냥 둔다(탭을 열 때 다시 받는다)
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1500));
    idle(() => {
      loadFood().catch(() => {});
      loadGames().catch(() => {});
    });
  }, []);

  return html`
    <div style=${styles.page}>
      ${route === "settle" && html`<${SettleScreen} s=${s} />`}
      <${Suspense} fallback=${html`<${ReceiptCard} />`}>
        ${route === "food" && html`<${FoodScreen} s=${s} />`}
        ${route === "games" && html`<${GamesScreen} s=${s} sub=${sub} />`}
      <//>

      <${SiteFooter} route=${route} />

      <${TabBar} route=${route} />

      <${ImagePreviewOverlay} preview=${s.imagePreview} onClose=${() => s.setImagePreview(null)} />
    </div>
  `;
}
