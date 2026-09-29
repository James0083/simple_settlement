/*
 * 미니게임 결과 — 당첨자 + 한 판 더 · 다른 게임.
 * 당첨자가 한 명일 때만 "정산에 추가"(당첨자를 결제자로)를 보여준다 — onAddToSettle 이 null 이면 숨김.
 */
import { useRef, useEffect } from "react";
import { html } from "../shared/html.js";
import { styles } from "../shared/styles.js";
import { AdSlot } from "../shared/AdSlot.js";

export function GameResult({ game, losers, players, onAgain, onAddToSettle }) {
  const names = losers.map((p) => p.name);
  const single = losers.length === 1;
  const wrapRef = useRef(null);
  const date = new Date().toLocaleDateString("ko-KR");

  // 결과 카드가 화면 아래쪽(위에서 55%)에서 시작하게만 내린다 — 위에 게임의 마지막 장면
  // (룰렛 바늘 · 착지한 해적 · 문 악어 · 사다리 도착 칸)이 남아 보이고, 당첨자 이름도 바로 보인다.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.55;
    if (top > window.scrollY) window.scrollTo({ top, behavior: "smooth" });
  }, []);

  return html`
    <div ref=${wrapRef}>
      <div style=${styles.dashedDivider} aria-hidden="true"></div>
      <div style=${styles.captureWrap}>
        <div style=${styles.captureTitleRow}>
          <span style=${styles.captureTitleText}>${game.emoji} 미니게임 결과</span>
          <span className="settle-stamp" style=${{ ...styles.stamp, color: "#E8503A", borderColor: "#E8503A" }}>당첨</span>
        </div>
        <div style=${styles.captureDate}>${date} · ${game.name}</div>
        <div style=${styles.loserBlock}>
          <div style=${styles.loserEmoji} aria-hidden="true">💸</div>
          <div style=${{ ...styles.loserName, ...(single ? null : styles.loserNameMany) }}>${names.join(" · ")}</div>
          <div style=${styles.loserText}>
            ${single ? `오늘 계산은 ${names[0]}님!` : `당첨 ${losers.length}명!`}
          </div>
        </div>
        <div style=${styles.loserPlayers}>참가 ${players.map((p) => p.name).join(" · ")}</div>
      </div>

      ${onAddToSettle &&
      html`
        <div style=${styles.actionRow}>
          <button className="settle-copy-btn" style=${styles.copyBtn} onClick=${onAddToSettle}>정산에 추가</button>
        </div>
        <p style=${styles.hint}>${names[0]}님을 결제한 사람으로 넣은 회차가 생겨요. 금액만 넣으면 돼요</p>
      `}
      <div style=${styles.actionRow}>
        <button className="settle-add-btn" style=${styles.rerollBtn} onClick=${onAgain}>한 판 더</button>
        <a className="settle-add-btn" style=${{ ...styles.rerollBtn, ...styles.linkBtn }} href="#/games">다른 게임</a>
      </div>
      <${AdSlot} placement="game-result" />
    </div>
  `;
}
