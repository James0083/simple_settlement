/* 게임 공용 조각 — 차례 표시 · 큰 버튼 · 플레이 화면 스크롤 */
import { useRef, useEffect } from "react";
import { html } from "../shared/html.js";
import { styles, TAB_BAR_HEIGHT } from "../shared/styles.js";
import { colorOf } from "./palette.js";

// 결과 연출이 끝난 뒤 onFinish 까지 잠깐 쉬는 시간
export const GAME_FINISH_MS = 500;

// 차례대로 하나씩 고르는 게임(해적 구멍·악어 이빨)의 칸 수 — 인원의 배수로 맞춰 모두 같은 횟수를 고르게 한다.
// 함정은 몇 번째 고르기에서 나올 확률이 모두 같으므로, 고르는 횟수가 같아야 순서와 상관없이 당첨 확률이 1/인원이 된다.
// base 에 가장 가까운 배수를 쓰되 cap 을 넘지 않게(칸이 너무 촘촘해지지 않게 — 해적 30, 악어 20: 이빨은 20개를 넘으면
// 서로 붙어 누르기 어렵다), 적어도 한 바퀴.
export const equalTurnCount = (players, base, cap) =>
  players * Math.max(1, Math.min(Math.round(base / players), Math.floor(cap / players)));

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

const STAGE_TOP_GAP = 12;
// 플레이 화면이 하단 탭바 위의 화면 높이를 다 쓰게 하는 최소 높이 — 페이지가 짧아도 무대를 화면 맨 위까지 올릴 수 있다
const STAGE_FILL = `calc(100svh - ${TAB_BAR_HEIGHT + STAGE_TOP_GAP * 2}px - env(safe-area-inset-bottom))`;

// 플레이 중에는 차례가 바뀔 때마다(turnKey 가 바뀔 때마다) 무대를 화면 맨 위로 올리고 화면 높이만큼 늘린다.
// 위의 제목 영역 때문에 버튼·판이 하단 탭바에 가리지 않고, 폰을 넘겨받은 사람이 바로 자기 화면을 본다.
// active: 플레이 중인지 (순서 정하기 · 결과 화면에서는 false — 결과는 GameResult 가 따로 스크롤한다).
// 단계마다 다른 요소를 그리는 게임이 많아 최소 높이는 요소에 직접 넣는다(스타일 객체에 없는 속성이라 렌더가 덮어쓰지 않는다).
export function useScrollToStage(active = true, turnKey = null) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // 결과 화면은 React 가 같은 div 를 다시 쓸 수 있으므로 늘린 높이를 되돌린다
    el.style.minHeight = active ? STAGE_FILL : "";
    if (!active) return;
    const top = el.getBoundingClientRect().top + window.scrollY - STAGE_TOP_GAP;
    if (Math.abs(top - window.scrollY) > 2) window.scrollTo({ top, behavior: "smooth" });
  }, [active, turnKey]);
  return ref;
}
