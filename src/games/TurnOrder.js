/*
 * 차례 정하기 — 게임 전에 순서를 보여주고 위/아래로 바꾸거나 섞을 수 있다.
 * order 는 players 의 인덱스 배열. 처음 순서는 게임이 무작위로 섞어서 넘긴다.
 * TurnStrip 은 게임 중에 순서와 지금 차례를 한 줄로 보여준다.
 */
import { html } from "../shared/html.js";
import { styles } from "../shared/styles.js";
import { shuffle } from "./random.js";
import { colorOf } from "./palette.js";
import { BigButton } from "./common.js";

export function TurnOrderSetup({ players, order, onChange, onStart, note, startLabel = "이 순서로 시작" }) {
  const move = (pos, d) => {
    const next = [...order];
    [next[pos], next[pos + d]] = [next[pos + d], next[pos]];
    onChange(next);
  };
  return html`
    <div style=${styles.gameStage}>
      <div style=${styles.orderHead}>
        <span style=${styles.sectionLabelInline}>순서</span>
        <button type="button" className="settle-add-btn" style=${styles.shuffleBtn} onClick=${() => onChange(shuffle(order))}>
          섞기
        </button>
      </div>
      <ol style=${styles.orderList}>
        ${order.map((pi, pos) => {
          const [bg, fg] = colorOf(pi);
          return html`
            <li key=${pi} style=${styles.orderRow}>
              <span style=${{ ...styles.orderNo, background: bg, color: fg }}>${pos + 1}</span>
              <span style=${styles.orderName}>${players[pi].name}</span>
              <button
                type="button"
                className="settle-step-btn"
                style=${styles.orderMoveBtn}
                onClick=${() => move(pos, -1)}
                disabled=${pos === 0}
                aria-label=${`${players[pi].name} 앞으로`}
              >
                ↑
              </button>
              <button
                type="button"
                className="settle-step-btn"
                style=${styles.orderMoveBtn}
                onClick=${() => move(pos, 1)}
                disabled=${pos === order.length - 1}
                aria-label=${`${players[pi].name} 뒤로`}
              >
                ↓
              </button>
            </li>
          `;
        })}
      </ol>
      ${note && html`<p style=${styles.hint}>${note}</p>`}
      <${BigButton} onClick=${onStart}>${startLabel}<//>
    </div>
  `;
}

export function TurnStrip({ players, order, current }) {
  return html`
    <div style=${styles.turnStrip} aria-label="순서">
      ${order.map((pi, pos) => {
        const [bg, fg] = colorOf(pi);
        const on = pos === current;
        return html`
          <span key=${pi} style=${styles.turnChipWrap}>
            ${pos > 0 && html`<span style=${styles.turnArrow} aria-hidden="true">›</span>`}
            <span style=${{ ...styles.turnChip, ...(on ? { background: bg, color: fg, borderColor: bg } : null) }}>
              ${players[pi].name}
            </span>
          </span>
        `;
      })}
    </div>
  `;
}
