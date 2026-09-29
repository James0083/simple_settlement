/* 게임 공용 조각 — 차례 표시 · 큰 버튼 · 플레이 화면 스크롤 */
export const GAME_FINISH_MS = 500;
import { useRef, useEffect } from "react";
import { html } from "../shared/html.js";
import { styles } from "../shared/styles.js";
import { colorOf } from "./palette.js";

// "지금 차례: 민수" — 폰을 넘겨받은 사람이 바로 알아보도록 크게
export function TurnBanner({ label = "지금 차례", player, index }) {
  const [bg, fg] = colorOf(index);
  return html`
    <div style=${styles.turnBanner} aria-live="polite">
      <span style=${styles.turnLabel}>${label}</span>
      <span style=${{ ...styles.turnName, background: bg, color: fg }}>${player.name}</span>
    </div>
  `;
}

export function BigButton({ onClick, disabled, children }) {
  return html`
    <button
      className="settle-calc-btn"
      style=${{ ...styles.calcBtn, marginTop: 18, opacity: disabled ? 0.45 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
      onClick=${onClick}
      disabled=${disabled}
    >
      ${children}
    </button>
  `;
}

// 게임 화면이 시작되면(순서 정하기 → 플레이) 차례 표시부터 화면 위에 오게 스크롤한다.
// 위의 제목 영역 때문에 3D 무대·버튼·안내 문구가 하단 탭바에 가리지 않도록.
// active 가 true 가 되는 순간(플레이 시작) 한 번 스크롤한다. 훅은 순서 화면에서도 불러야 하므로 조건을 인자로 받는다.
export function useScrollToStage(active = true) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!active || !el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 12;
    if (top > window.scrollY) window.scrollTo({ top, behavior: "smooth" });
  }, [active]);
  return ref;
}
