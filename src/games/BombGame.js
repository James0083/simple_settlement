/*
 * 폭탄 돌리기 — 먼저 돌리는 순서를 보여주고(바꿀 수 있음), 1번이 폭탄을 들고 시작한다.
 * 폭발 시각(15~45초)은 시작할 때 정하고 숨긴다 — 범위도 화면에 알리지 않는다(처음이 안전한 걸 알면 재미없음).
 * "넘기기"(또는 폭탄)를 누르면 다음 사람에게 넘어가고 폰도 넘긴다. 똑딱 소리·흔들림이 갈수록 빨라지고,
 * 막판엔 불꽃이 커지고 폭탄이 빨갛게 깜빡인다. 터지는 순간 들고 있던 사람이 당첨.
 * 받자마자 되넘기는 연타를 막으려고 받은 뒤 0.8초는 못 넘긴다.
 */
import { useState, useRef, useEffect } from "react";
import { html } from "../shared/html.js";
import { styles, C_RED, C_DARK, C_WHITE, C_SUB } from "../shared/styles.js";
import { randInt, shuffle } from "./random.js";
import { beep, explosion, tick as tickSound, vibrate, unlockAudio, prefersReducedMotion } from "./sfx.js";
import { josa } from "./josa.js";
import { TurnBanner, useScrollToStage } from "./common.js";
import { TurnOrderSetup, TurnStrip } from "./TurnOrder.js";

export const FUSE_MIN_MS = 15000;
export const FUSE_MAX_MS = 45000;
const PASS_LOCK_MS = 800;

// 폭탄 모양 — 몸통 원 위, 도화선이 나오는 방향(수직에서 CAP_DEG 만큼)에 뚜껑을 몸통 표면에 맞춰 붙인다.
const C = [92, 122];
const R = 62;
const CAP_DEG = 28;
const U = [Math.sin((CAP_DEG * Math.PI) / 180), -Math.cos((CAP_DEG * Math.PI) / 180)];
const at = (d) => [C[0] + U[0] * d, C[1] + U[1] * d];
const CAP = at(R + 2); // 뚜껑 중심 (절반은 몸통에 묻힌다)
const F0 = at(R + 10); // 도화선 시작 = 뚜껑 윗면
const F1 = [F0[0] + 16, F0[1] - 32]; // 곡선 조절점
const F2 = [F0[0] + 46, F0[1] - 36]; // 다 남았을 때 끝

// 2차 베지어를 0~t 구간만 잘라 [조절점, 끝점] 을 돌려준다 — 도화선이 타들어가는 모양
function fuseTo(t) {
  const lerp = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  const q1 = lerp(F0, F1, t);
  const end = lerp(q1, lerp(F1, F2, t), t);
  return [q1, end];
}

function BombSvg({ progress, exploded }) {
  if (exploded) {
    return html`
      <svg viewBox="0 0 200 200" style=${styles.bombSvg} role="img" aria-label="폭발">
        <polygon
          points="100,8 118,62 172,34 142,86 194,104 140,120 164,176 110,142 92,196 78,140 22,168 56,116 6,92 60,80 36,28 88,60"
          fill=${C_RED}
          stroke=${C_DARK}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <text x="100" y="112" textAnchor="middle" style=${styles.bombBoomText}>펑!</text>
      </svg>
    `;
  }
  const [q1, end] = fuseTo(1 - 0.8 * progress);
  const shake = prefersReducedMotion() ? "none" : `bombShake ${Math.max(0.12, 0.6 - 0.48 * progress)}s linear infinite`;
  return html`
    <svg viewBox="0 0 200 200" style=${{ ...styles.bombSvg, animation: shake }} role="img" aria-label="폭탄">
      <path d=${`M ${F0[0]} ${F0[1]} Q ${q1[0]} ${q1[1]} ${end[0]} ${end[1]}`} fill="none" stroke="#8A6A45" strokeWidth="5" strokeLinecap="round" />
      <circle
        cx=${end[0]}
        cy=${end[1]}
        r=${8 + 7 * Math.max(0, progress - 0.6) / 0.4}
        fill="#F2B233"
        style=${{ transformBox: "fill-box", transformOrigin: "center", animation: "sparkle 0.25s ease-in-out infinite alternate" }}
      />
      <rect
        x=${CAP[0] - 15}
        y=${CAP[1] - 10}
        width="30"
        height="20"
        rx="3"
        fill=${C_SUB}
        stroke=${C_DARK}
        strokeWidth="2"
        transform=${`rotate(${CAP_DEG} ${CAP[0]} ${CAP[1]})`}
      />
      <circle cx=${C[0]} cy=${C[1]} r=${R} fill=${C_DARK} />
      ${progress > 0.75 &&
      html`<circle
        cx=${C[0]}
        cy=${C[1]}
        r=${R}
        fill=${C_RED}
        style=${{ animation: `bombFlash ${Math.max(0.18, 0.5 - 1.2 * (progress - 0.75))}s ease-in-out infinite` }}
      />`}
      <circle cx=${C[0] - 22} cy=${C[1] - 22} r="14" fill=${C_WHITE} opacity="0.25" />
      <circle cx=${C[0] - 34} cy=${C[1] - 2} r="5" fill=${C_WHITE} opacity="0.18" />
    </svg>
  `;
}

export function BombGame({ players: initialPlayers, onFinish }) {
  const [players] = useState(initialPlayers);
  const n = players.length;
  const [order, setOrder] = useState(() => shuffle(players.map((_, i) => i)));
  const [phase, setPhase] = useState("order"); // order | running | exploded
  const [pos, setPos] = useState(0); // order 안에서 지금 폭탄을 든 사람의 자리
  const [progress, setProgress] = useState(0);
  const [locked, setLocked] = useState(false);
  const game = useRef(null); // { fuse, startAt, pos, lockUntil }
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  const tick = () => {
    const g = game.current;
    const elapsed = performance.now() - g.startAt;
    const p = Math.min(1, elapsed / g.fuse);
    if (p >= 1) {
      setPhase("exploded");
      setProgress(1);
      explosion();
      vibrate([250, 80, 400]);
      later(() => onFinish(players[order[g.pos]].id), 900);
      return;
    }
    setProgress(p);
    tickSound(p > 0.75);
    // 남은 시간이 줄수록 째깍 간격이 짧아진다. 폭발 시각을 넘기지 않게 맞춘다.
    later(tick, Math.min(700 - 560 * p, g.fuse - elapsed));
  };

  const start = () => {
    unlockAudio();
    const now = performance.now();
    game.current = { fuse: FUSE_MIN_MS + randInt(FUSE_MAX_MS - FUSE_MIN_MS + 1), startAt: now, pos: 0, lockUntil: now + PASS_LOCK_MS };
    setPos(0);
    setPhase("running");
    setLocked(true);
    later(() => setLocked(false), PASS_LOCK_MS);
    later(tick, 300);
  };

  const pass = () => {
    const g = game.current;
    if (phase !== "running" || performance.now() < g.lockUntil) return;
    g.pos = (g.pos + 1) % n;
    g.lockUntil = performance.now() + PASS_LOCK_MS;
    setPos(g.pos);
    setLocked(true);
    later(() => setLocked(false), PASS_LOCK_MS);
    beep(440, 50, "triangle");
    vibrate(30);
  };

  const stageRef = useScrollToStage(phase !== "order");

  if (phase === "order") {
    return html`
      <${TurnOrderSetup}
        players=${players}
        order=${order}
        onChange=${setOrder}
        onStart=${start}
        startLabel="이 순서로 폭탄 시작"
        note=${`${players[order[0]].name}${josa(players[order[0]].name, "이/가")} 폭탄을 들고 시작해요. 언제 터질지 몰라요!`}
      />
    `;
  }

  const holder = order[pos];
  const next = players[order[(pos + 1) % n]];
  return html`
    <div ref=${stageRef} style=${styles.gameStage}>
      <${TurnBanner} label=${phase === "exploded" ? "터졌다!" : "지금 폭탄"} player=${players[holder]} index=${holder} />
      <${TurnStrip} players=${players} order=${order} current=${pos} />
      <div
        style=${{ ...styles.bombWrap, cursor: phase === "running" ? "pointer" : "default" }}
        onClick=${pass}
        aria-hidden="true"
      >
        <${BombSvg} progress=${progress} exploded=${phase === "exploded"} />
      </div>
      ${phase === "running" &&
      html`
        <button
          className="settle-calc-btn"
          style=${{ ...styles.passBtn, opacity: locked ? 0.5 : 1 }}
          onClick=${pass}
          disabled=${locked}
        >
          ${locked
            ? html`<span style=${styles.passBtnMain}>받았다!</span>`
            : html`<span style=${styles.passBtnMain}>넘기기</span><span style=${styles.passBtnSub}>→ ${next.name}</span>`}
        </button>
      `}
    </div>
  `;
}
