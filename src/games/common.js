/* 게임 공용 조각 — 차례 표시 · 큰 버튼 · 플레이 화면 스크롤 */
import { useRef, useEffect } from "react";
import { html } from "../shared/html.js";
import { styles } from "../shared/styles.js";
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
