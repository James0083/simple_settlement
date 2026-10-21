/*
 * 탑 쌓기 — 좌우로 오가는 블록을 눌러 떨어뜨린다. 아래 블록과 겹친 부분만 남고 나머지는 잘려 나가 탑이 좁아진다.
 * 한 사람이 BLOCKS_PER_TURN 개씩 쌓고 폰을 넘긴다. 같은 탑을 이어 쌓으며, 완전히 빗나가 블록을 놓친 사람이 당첨.
 * 거의 딱 맞으면(PERFECT_RATIO 이내) "퍼펙트" — 위치를 맞춰 주고 폭을 조금 돌려준다.
 * 층이 오를수록 빨라지고 탑은 좁아지기만 하므로 따로 끝 조건 없이 누군가는 놓친다.
 * 놓친 블록은 떨어뜨린 자리에 흐리게 남겨 얼마나 빗나갔는지 보여준다. 차례를 넘겨받으면 판을 눌러도 시작된다.
 */
import { useState, useRef, useEffect } from "react";
import { html } from "../shared/html.js";
import { styles, C_RED, C_GREEN } from "../shared/styles.js";
import { colorOf } from "./palette.js";
import { shuffle } from "./random.js";
import { unlockAudio, tapPop, chime, explosion, fanfare, vibrate, prefersReducedMotion } from "./sfx.js";
import { GAME_FINISH_MS, TurnBanner, BigButton, useScrollToStage, useTimers, onActivateKey } from "./common.js";
import { TurnOrderSetup, TurnStrip } from "./TurnOrder.js";

// 좌표는 SVG viewBox 단위
const W = 300;
const BLOCK_H = 22;
const VISIBLE = 8; // 화면에 보이는 층 수
const VIEW_H = BLOCK_H * (VISIBLE + 2);
export const BASE_W = 180;
export const PERFECT_RATIO = 0.04; // 위 블록 폭의 4% 이내로 어긋나면 퍼펙트
const PERFECT_BONUS = 6; // 퍼펙트면 폭을 이만큼 돌려준다 (BASE_W 까지)
const BLOCKS_PER_TURN = 2;
const START_SPEED = 130; // viewBox 단위 / 초
const SPEED_STEP = 9; // 층마다 빨라지는 정도
const MAX_SPEED = 380;
const SPAWN_MS = 250; // 놓은 뒤 다음 블록이 나오기까지 — 연타로 두 개를 한꺼번에 놓지 않게
const MISS_SHOW_MS = 900; // 놓친 블록을 보여준 뒤 끝낸다

const speedAt = (level) => Math.min(MAX_SPEED, START_SPEED + SPEED_STEP * level);

/*
 * 블록 놓기 판정. top: 맨 위 블록 { x, w }, x · w: 떨어뜨린 블록.
 * 돌려주는 값: { miss: true } 또는 { x, w, perfect, cut: 잘려 나간 조각 { x, w } | null }
 */
export function dropBlock(top, x, w) {
  if (Math.abs(x - top.x) <= top.w * PERFECT_RATIO) {
    return { x: top.x, w: Math.min(BASE_W, top.w + PERFECT_BONUS), perfect: true, cut: null };
  }
  const left = Math.max(x, top.x);
  const right = Math.min(x + w, top.x + top.w);
  if (right - left <= 0) return { miss: true };
  const cut = x < top.x ? { x, w: top.x - x } : { x: top.x + top.w, w: x + w - (top.x + top.w) };
  return { x: left, w: right - left, perfect: false, cut };
}

export function StackGame({ players, onFinish }) {
  const [phase, setPhase] = useState("order"); // order | ready | play | missed | done
  const [order, setOrder] = useState(() => shuffle(players.map((_, i) => i)));
  const [turnPos, setTurnPos] = useState(0);
  const [placedThisTurn, setPlacedThisTurn] = useState(0);
  const [tower, setTower] = useState([{ x: (W - BASE_W) / 2, w: BASE_W, owner: null }]);
  const [pieces, setPieces] = useState([]); // 잘려 떨어지는 조각 { key, x, w, level, owner }
  const [missedBlock, setMissedBlock] = useState(null); // 놓친 블록 { x, w, owner } — 놓은 층에 흐리게 남긴다
  const [flash, setFlash] = useState(""); // "퍼펙트!" 같은 짧은 문구
  const [, setFrame] = useState(0);
  const mover = useRef({ x: 0, dir: 1, active: false }); // 움직이는 블록 — 매 프레임 바뀌므로 ref
  const raf = useRef(0);
  const lastT = useRef(0);
  const timers = useTimers();
  const stageRef = useScrollToStage(["ready", "play", "missed"].includes(phase), turnPos);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const level = tower.length; // 다음에 놓을 층 (0층 = 바닥)
  const top = tower[tower.length - 1];
  const playerIdx = order[turnPos % order.length];
  const reduced = prefersReducedMotion();

  // 새 블록을 왼쪽/오른쪽 끝에서 번갈아 출발시킨다
  const spawn = (lv, width) => {
    const fromLeft = lv % 2 === 1;
    mover.current = { x: fromLeft ? 0 : W - width, dir: fromLeft ? 1 : -1, active: true };
    lastT.current = performance.now();
  };

  // 움직이는 블록 — play 중에만 돈다
  useEffect(() => {
    if (phase !== "play") return undefined;
    const loop = (t) => {
      const m = mover.current;
      if (m.active) {
        const dt = Math.min(0.05, (t - lastT.current) / 1000);
        const width = top.w;
        m.x += m.dir * speedAt(level) * dt;
        if (m.x <= 0) {
          m.x = 0;
          m.dir = 1;
        } else if (m.x >= W - width) {
          m.x = W - width;
          m.dir = -1;
        }
      }
      lastT.current = t;
      setFrame((f) => f + 1);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [phase, level, top.w]);

  const startGame = () => {
    unlockAudio();
    setPhase("ready");
  };
  const go = () => {
    spawn(level, top.w);
    setPhase("play");
  };

  const drop = () => {
    if (phase === "ready") return go(); // 넘겨받은 사람은 판을 눌러도 시작
    const m = mover.current;
    if (phase !== "play" || !m.active) return;
    m.active = false;
    const res = dropBlock(top, m.x, top.w);
    if (res.miss) {
      explosion(0.5);
      vibrate(200);
      setMissedBlock({ x: m.x, w: top.w, owner: playerIdx });
      setPhase("missed");
      timers.later(() => {
        setPhase("done");
        fanfare();
        timers.later(() => onFinish(players[playerIdx].id), GAME_FINISH_MS);
      }, MISS_SHOW_MS);
      return;
    }
    if (res.perfect) {
      chime();
      vibrate(30);
    } else {
      tapPop(m.x < top.x ? -1 : 1);
    }
    setFlash(res.perfect ? "퍼펙트!" : "");
    setTower((prev) => [...prev, { x: res.x, w: res.w, owner: playerIdx }]);
    if (res.cut) setPieces((prev) => [...prev.slice(-6), { key: `cut-${level}`, ...res.cut, level, owner: playerIdx }]);

    const placed = placedThisTurn + 1;
    if (placed >= BLOCKS_PER_TURN) {
      setPlacedThisTurn(0);
      setTurnPos(turnPos + 1);
      setPhase("ready"); // 다음 사람에게 넘기기
    } else {
      setPlacedThisTurn(placed);
      timers.later(() => spawn(level + 1, res.w), SPAWN_MS);
    }
  };

  if (phase === "order") {
    return html`
      <${TurnOrderSetup}
        players=${players}
        order=${order}
        onChange=${setOrder}
        onStart=${startGame}
        note=${`폰을 돌아가며 한 사람이 ${BLOCKS_PER_TURN}개씩 쌓아요 · 블록을 놓친 사람이 당첨`}
        startLabel="게임 시작"
      />
    `;
  }

  // 위쪽 VISIBLE 층만 보이게 화면을 올린다. y 는 아래에서 위로 쌓이므로 뒤집어 계산한다.
  const scroll = Math.max(0, level - VISIBLE + 1) * BLOCK_H;
  const yOf = (lv) => VIEW_H - BLOCK_H * (lv + 1) + scroll;
  const blockRect = (b, lv, key, opacity = 1) => {
    const [bg] = b.owner == null ? ["#B9BFCC"] : colorOf(b.owner);
    return html`<rect key=${key} x=${b.x} y=${yOf(lv)} width=${b.w} height=${BLOCK_H - 2} rx="2" fill=${bg} opacity=${opacity} />`;
  };
  const moving = phase === "play" && mover.current.active;

  const board = html`
    <button
      type="button"
      style=${styles.stackPad}
      onPointerDown=${drop}
      onKeyDown=${onActivateKey(drop)}
      disabled=${phase !== "play" && phase !== "ready"}
      aria-label="블록 놓기"
    >
      <svg viewBox=${`0 0 ${W} ${VIEW_H}`} style=${{ ...styles.gameSvg, overflow: "hidden" }} aria-hidden="true">
        ${tower.map((b, lv) => (yOf(lv) < VIEW_H ? blockRect(b, lv, `b-${lv}`) : null))}
        ${moving && blockRect({ x: mover.current.x, w: top.w, owner: playerIdx }, level, "moving")}
        ${missedBlock && blockRect(missedBlock, level, "missed", 0.35)}
        ${pieces.map(
          (p) => html`
            <g key=${p.key}>
              ${blockRect(p, p.level, `${p.key}-r`, 0.85)}
              ${!reduced &&
              html`
                <animateTransform attributeName="transform" type="translate" from="0 0" to=${`0 ${VIEW_H}`} dur="0.8s" fill="freeze" />
              `}
            </g>
          `
        )}
      </svg>
    </button>
  `;

  const height = tower.length - 1;
  return html`
    <div ref=${stageRef} style=${styles.gameStage}>
      <${TurnStrip} players=${players} order=${order} current=${turnPos % order.length} />
      <${TurnBanner} player=${players[playerIdx]} index=${playerIdx} />
      <p style=${styles.gameMeta}>
        ${height}층${phase === "play" ? ` · ${placedThisTurn + 1} / ${BLOCKS_PER_TURN}번째 블록` : ""}
        ${flash && phase === "play" && html` · <strong style=${{ color: C_GREEN }}>${flash}</strong>`}
      </p>
      ${board}
      ${phase === "ready" &&
      html`<${BigButton} onClick=${go}>${height === 0 ? "시작" : `${players[playerIdx].name}님 준비됐어요`}<//>`}
      ${phase === "ready" && html`<p style=${styles.hint}>버튼이나 판을 누르면 블록이 나와요</p>`}
      ${phase === "play" && html`<p style=${styles.hint}>화면을 눌러 블록을 놓아요</p>`}
      ${(phase === "missed" || phase === "done") &&
      html`<p style=${{ ...styles.feedbackTitle, color: C_RED, marginTop: 14 }}>놓쳤어요! ${height}층에서 무너짐</p>`}
    </div>
  `;
}
