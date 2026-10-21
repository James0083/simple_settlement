/*
 * 숨바꼭질 — 2명 전용(registry 의 exactPlayers: 2). 종이 놀이 "졸라맨 숨기기 대결"을 격자로 옮긴 배틀쉽 구조.
 *   1) 선공을 무작위로 정한다
 *   2) 한 명씩 화면을 가리고 자기 판(GRID_SIZE × GRID_SIZE)에 말 FIGURE_COUNT 개를 숨긴다
 *   3) 번갈아 상대 판의 한 칸을 고른다 — 상대 말이 있으면 명중, 없으면 빗나감
 *   4) 상대 말을 먼저 모두 찾은 사람이 이기고, 말을 모두 들킨 사람이 당첨
 * 폰 한 대로 하므로 배치·공격 화면은 "준비됐어요"로 가렸다가 연다(숫자 맞추기와 같은 방식).
 * 공격 화면에는 상대 판이 아니라 "내가 쏜 기록"만 보인다. 동점은 없다(한 번에 한 칸씩, 먼저 다 찾은 쪽이 끝냄).
 */
import { useState, useRef, useEffect } from "react";
import { html } from "../shared/html.js";
import { styles, C_RED, C_GREEN } from "../shared/styles.js";
import { colorOf } from "./palette.js";
import { shuffle } from "./random.js";
import { unlockAudio, beep, explosion, fanfare, vibrate } from "./sfx.js";
import { GAME_FINISH_MS, TurnBanner, BigButton, useScrollToStage } from "./common.js";

// 모바일 한 손 탭 기준: 6칸이면 390px 폭에서 한 칸 약 46px. 말 8개 = 36칸 중 22%.
export const GRID_SIZE = 6;
export const FIGURE_COUNT = 8;

const CELLS = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i);
const cellLabel = (i) => `${Math.floor(i / GRID_SIZE) + 1}행 ${(i % GRID_SIZE) + 1}열`;

// 격자 한 장. mark(i) → { style, content, label, locked } / onTap 이 없으면 누를 수 없는 판(결과 공개용)
function Board({ mark, onTap, caption, small = false }) {
  return html`
    <div>
      ${caption && html`<p style=${styles.bsCaption}>${caption}</p>`}
      <div
        style=${{ ...styles.bsBoard, ...(small ? styles.bsBoardSmall : null), gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
        role="grid"
      >
        ${CELLS.map((i) => {
          const m = mark(i);
          return html`
            <button
              key=${i}
              type="button"
              style=${{ ...styles.bsCell, ...(small ? styles.bsCellSmall : null), ...m.style, cursor: onTap && !m.locked ? "pointer" : "default" }}
              onClick=${onTap && !m.locked ? () => onTap(i) : undefined}
              disabled=${!onTap || m.locked}
              aria-label=${`${cellLabel(i)} ${m.label ?? ""}`.trim()}
            >
              ${m.content}
            </button>
          `;
        })}
      </div>
    </div>
  `;
}

export function HideSeekGame({ players, onFinish }) {
  // order[0] 이 선공. 플레이어는 players 의 인덱스(0·1)로 다룬다.
  const [order] = useState(() => shuffle([0, 1]));
  const [phase, setPhase] = useState("intro"); // intro | gate · place (숨기기) | attackGate · attack · feedback | done
  const [placeIdx, setPlaceIdx] = useState(0); // 숨기는 사람 순번 (order 의 0·1번째)
  const [turn, setTurn] = useState(0); // 지금까지 쏜 총 횟수 — 짝수면 선공 차례
  const [boards, setBoards] = useState({ 0: new Set(), 1: new Set() }); // 플레이어별 자기 말 위치
  const [shots, setShots] = useState({ 0: new Map(), 1: new Map() }); // 플레이어별 "내가 상대에게 쏜" 칸 → "hit" | "miss"
  const [lastShot, setLastShot] = useState(null); // { cell, hit }
  const [loser, setLoser] = useState(null);
  const stageRef = useScrollToStage(phase !== "intro");
  const finishTimer = useRef(null);
  useEffect(() => () => clearTimeout(finishTimer.current), []);

  const placing = phase === "gate" || phase === "place";
  const current = placing ? order[placeIdx] : order[turn % 2]; // 지금 차례인 플레이어

  const opponent = 1 - current;
  const hitsOn = (p) => [...shots[1 - p].values()].filter((v) => v === "hit").length; // p 의 말이 들킨 수
  const found = (p) => hitsOn(1 - p); // p 가 찾은 상대 말 수

  const start = () => {
    unlockAudio();
    setPhase("gate");
  };

  // ── 배치 ────────────────────────────────────────────────
  const togglePlace = (i) => {
    setBoards((prev) => {
      const mine = new Set(prev[current]);
      if (mine.has(i)) mine.delete(i);
      else if (mine.size < FIGURE_COUNT) mine.add(i);
      else return prev; // 다 숨겼으면 먼저 하나를 빼야 한다
      beep(mine.has(i) ? 660 : 440, 40, "sine", 0.03);
      return { ...prev, [current]: mine };
    });
  };
  const finishPlace = () => {
    if (placeIdx === 0) {
      setPlaceIdx(1);
      setPhase("gate");
    } else {
      setPhase("attackGate"); // 둘 다 숨겼으면 선공부터 공격
    }
  };

  // ── 공격 ────────────────────────────────────────────────
  const fire = (i) => {
    if (shots[current].has(i)) return; // 이미 쏜 칸은 무시
    const hit = boards[opponent].has(i);
    const mine = new Map(shots[current]).set(i, hit ? "hit" : "miss");
    setShots((prev) => ({ ...prev, [current]: mine }));
    setLastShot({ cell: i, hit });
    if (hit) {
      explosion(0.35);
      vibrate(80);
    } else {
      beep(330, 90, "sine", 0.04);
    }
    const foundNow = [...mine.values()].filter((v) => v === "hit").length;
    if (foundNow >= FIGURE_COUNT) {
      fanfare();
      setLoser(opponent);
      setPhase("done");
      finishTimer.current = setTimeout(() => onFinish(players[opponent].id), GAME_FINISH_MS);
      return;
    }
    setPhase("feedback");
  };
  const nextTurn = () => {
    setTurn(turn + 1);
    setPhase("attackGate");
  };

  const player = players[current];
  const statusLine = (p) =>
    `상대 말 ${FIGURE_COUNT}개 중 ${found(p)}개 찾음 · 내 말 ${FIGURE_COUNT}개 중 ${hitsOn(p)}개 들킴`;

  // ── 시작 안내 · 선공 ─────────────────────────────────────
  if (phase === "intro") {
    const first = players[order[0]];
    return html`
      <div style=${styles.gameStageCenter}>
        <p style=${styles.bsRules}>
          각자 ${GRID_SIZE}×${GRID_SIZE} 판에 말 ${FIGURE_COUNT}개를 몰래 숨기고,<br />
          번갈아 상대 판의 한 칸을 골라 찾아요.<br />
          상대 말을 먼저 다 찾으면 승리 · <strong>다 들킨 사람이 당첨</strong>
        </p>
        <div style=${styles.turnBanner}>
          <span style=${styles.turnLabel}>선공</span>
          <span style=${{ ...styles.turnName, background: colorOf(order[0])[0], color: colorOf(order[0])[1] }}>${first.name}</span>
        </div>
        <p style=${styles.gameMeta}>숨기기도 ${first.name}님부터 · 폰 한 대를 번갈아 써요</p>
        <${BigButton} onClick=${start}>숨기기 시작<//>
      </div>
    `;
  }

  // ── 가림막 (배치 · 공격 공용) ─────────────────────────────
  if (phase === "gate" || phase === "attackGate") {
    const attacking = phase === "attackGate";
    const who = current;
    return html`
      <div ref=${stageRef} style=${styles.gameStage}>
        <${TurnBanner} player=${players[who]} index=${who} />
        <p style=${styles.gameMeta}>
          ${attacking ? `${Math.floor(turn / 2) + 1}번째 공격 · ${statusLine(who)}` : `말 숨기기 ${placeIdx + 1}/2`}
        </p>
        <p style=${styles.privacyNote}>
          ${players[1 - who].name}님은 화면을 보지 않도록 해주세요! 👋
          <br /><span style=${styles.privacyNoteSub}>${attacking ? "상대 말을 찾을 칸을 골라요" : `내 판에 말 ${FIGURE_COUNT}개를 숨겨요`}</span>
        </p>
        <${BigButton} onClick=${() => setPhase(attacking ? "attack" : "place")}>준비됐어요<//>
      </div>
    `;
  }

  // ── 배치 화면 ────────────────────────────────────────────
  if (phase === "place") {
    const mine = boards[current];
    const full = mine.size === FIGURE_COUNT;
    return html`
      <div ref=${stageRef} style=${styles.gameStage}>
        <${TurnBanner} player=${player} index=${current} />
        <p style=${styles.gameMeta}>
          칸을 눌러 말을 숨겨요 (다시 누르면 빼요) · <strong style=${{ color: full ? C_GREEN : C_RED }}>${mine.size}/${FIGURE_COUNT}</strong>
        </p>
        <${Board}
          mark=${(i) => (mine.has(i) ? { style: styles.bsCellPlaced, content: "🧍", label: "말 있음" } : { style: styles.bsCellEmpty })}
          onTap=${togglePlace}
        />
        <${BigButton} onClick=${finishPlace} disabled=${!full}>
          ${full ? (placeIdx === 0 ? `숨기기 완료 · ${players[order[1]].name}님께 넘기기` : "숨기기 완료 · 공격 시작") : `말 ${FIGURE_COUNT - mine.size}개 더 숨겨요`}
        <//>
      </div>
    `;
  }

  // ── 공격 화면 — 내가 쏜 기록만 보인다 ─────────────────────
  if (phase === "attack") {
    const mine = shots[current];
    return html`
      <div ref=${stageRef} style=${styles.gameStage}>
        <${TurnBanner} player=${player} index=${current} />
        <p style=${styles.gameMeta}>${statusLine(current)}</p>
        <${Board}
          caption=${`${players[opponent].name}님의 판 — 찾을 칸을 하나 눌러요`}
          mark=${(i) =>
            mine.get(i) === "hit"
              ? { style: styles.bsCellHit, content: "💥", label: "명중", locked: true }
              : mine.get(i) === "miss"
                ? { style: styles.bsCellMiss, content: "·", label: "빗나감", locked: true }
                : { style: styles.bsCellEmpty }}
          onTap=${fire}
        />
      </div>
    `;
  }

  // ── 명중 / 빗나감 ────────────────────────────────────────
  if (phase === "feedback" && lastShot) {
    return html`
      <div ref=${stageRef} style=${styles.gameStageCenter}>
        <div style=${styles.feedbackEmoji} aria-hidden="true">${lastShot.hit ? "💥" : "💨"}</div>
        <p style=${{ ...styles.feedbackTitle, ...(lastShot.hit ? { color: C_RED } : null) }}>
          ${lastShot.hit ? "명중!" : "빗나감"}
        </p>
        <p style=${styles.gameMeta}>${cellLabel(lastShot.cell)} · ${statusLine(current)}</p>
        <${BigButton} onClick=${nextTurn}>${players[opponent].name}님 차례로<//>
      </div>
    `;
  }

  // ── 결과 — 양쪽 판을 모두 공개 ────────────────────────────
  if (phase === "done" && loser != null) {
    const winner = 1 - loser;
    const reveal = (owner) => (i) => {
      const hidden = boards[owner].has(i);
      const shot = shots[1 - owner].get(i);
      if (shot === "hit") return { style: styles.bsCellHit, content: "💥", label: "말 · 명중" };
      if (hidden) return { style: styles.bsCellPlaced, content: "🧍", label: "말 · 안 들킴" };
      if (shot === "miss") return { style: styles.bsCellMiss, content: "·", label: "빗나감" };
      return { style: styles.bsCellEmpty };
    };
    return html`
      <div ref=${stageRef} style=${styles.gameStage}>
        <p style=${{ ...styles.feedbackTitle, marginTop: 4 }}>
          ${players[winner].name}님이 ${shots[winner].size}번 만에 모두 찾았어요!
        </p>
        <div style=${styles.bsRevealRow}>
          ${[order[0], order[1]].map(
            (owner) => html`
              <${Board}
                key=${owner}
                small
                caption=${`${players[owner].name}님의 판 · ${hitsOn(owner)}/${FIGURE_COUNT} 들킴`}
                mark=${reveal(owner)}
              />
            `
          )}
        </div>
        <p style=${{ ...styles.hint, marginBottom: 0 }}>🧍 숨긴 말 · 💥 찾은 말 · · 빗나간 칸</p>
      </div>
    `;
  }

  return null;
}
