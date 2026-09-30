/*
 * 룰렛 — 이름 수만큼 조각 난 원판. 당첨 칸을 먼저 정하고(randInt), 그 칸이 위쪽 바늘에
 * 오도록 여러 바퀴 돌린다. 애니메이션은 이미 정해진 결과를 보여주기만 한다.
 * 조각 구분선이 바늘을 지날 때마다 "딱" — 원판이 느려지는 만큼 소리 간격도 벌어지고, 멈추면 "띵!".
 */
import { useState, useRef, useEffect } from "react";
import { html } from "../shared/html.js";
import { styles, C_DARK, C_WHITE } from "../shared/styles.js";
import { randInt, randomFloat } from "./random.js";
import { wheelClicks, chime, vibrate, prefersReducedMotion } from "./sfx.js";
import { WHEEL_EASE, clickTimes } from "./wheel.js";
import { colorOf, shortName } from "./palette.js";
import { BigButton } from "./common.js";

const SIZE = 300;
const C = SIZE / 2;
const R = 140;

// 위(12시)에서 시계 방향 각도 → 좌표
const point = (deg, r = R) => {
  const rad = (deg * Math.PI) / 180;
  return [C + r * Math.sin(rad), C - r * Math.cos(rad)];
};

function slicePath(a0, a1) {
  const [x0, y0] = point(a0);
  const [x1, y1] = point(a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${C} ${C} L ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} Z`;
}

export function RouletteGame({ players: initialPlayers, onFinish }) {
  const [players] = useState(initialPlayers);
  const [rotation, setRotation] = useState(0);
  const [duration, setDuration] = useState(0);
  const [phase, setPhase] = useState("ready"); // ready | spinning | done
  const timer = useRef(null);
  const stopClicks = useRef(() => {});
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      stopClicks.current(); // 도는 중에 나가면 딱딱 소리도 멈춘다
    },
    []
  );

  const n = players.length;
  const seg = 360 / n;
  const radial = n > 8; // 조각이 좁으면 이름을 반지름 방향으로 세워 겹치지 않게

  const spin = () => {
    if (phase !== "ready") return;
    const loser = randInt(n);
    // 칸 안에서 바늘이 멈추는 위치도 살짝 흔든다 (칸 경계는 피함)
    const stopAt = (loser + 0.5) * seg + (randomFloat() - 0.5) * seg * 0.7;
    const ms = prefersReducedMotion() ? 700 : 7000;
    setDuration(ms);
    const total = 360 * 8 + (360 - stopAt);
    setRotation(total);
    setPhase("spinning");
    stopClicks.current = wheelClicks(clickTimes(total, seg, ms));
    timer.current = setTimeout(() => {
      setPhase("done");
      chime();
      vibrate(120);
      onFinish(players[loser].id);
    }, ms + 80);
  };

  return html`
    <div style=${styles.gameStage}>
      <div style=${styles.rouletteWrap}>
        <svg viewBox="0 0 ${SIZE} ${SIZE}" style=${styles.gameSvg} role="img" aria-label="룰렛 원판">
          <g
            style=${{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: "50% 50%",
              transformBox: "view-box",
              transition: duration ? `transform ${duration}ms cubic-bezier(${WHEEL_EASE.join(", ")})` : "none",
            }}
          >
            ${players.map((p, i) => {
              const [bg, fg] = colorOf(i);
              const mid = (i + 0.5) * seg;
              return html`
                <g key=${p.id}>
                  ${n === 1
                    ? html`<circle cx=${C} cy=${C} r=${R} fill=${bg} />`
                    : html`<path d=${slicePath(i * seg, (i + 1) * seg)} fill=${bg} stroke=${C_WHITE} strokeWidth="2" />`}
                  <text
                    x=${C}
                    y=${C - R * 0.62}
                    transform=${radial
                      ? `rotate(${mid} ${C} ${C}) rotate(${mid < 180 ? -90 : 90} ${C} ${C - R * 0.62})`
                      : `rotate(${mid} ${C} ${C})`}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill=${fg}
                    style=${radial ? { ...styles.rouletteLabel, fontSize: 13 } : styles.rouletteLabel}
                  >
                    ${shortName(p.name)}
                  </text>
                </g>
              `;
            })}
          </g>
          <circle cx=${C} cy=${C} r="18" fill=${C_WHITE} stroke=${C_DARK} strokeWidth="3" />
          <path d="M ${C - 13} 2 L ${C + 13} 2 L ${C} 30 Z" fill=${C_DARK} stroke=${C_WHITE} strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </div>
      <${BigButton} onClick=${spin} disabled=${phase !== "ready"}>
        ${phase === "ready" ? "돌리기" : phase === "spinning" ? "돌아가는 중..." : "결과 나왔어요"}
      <//>
    </div>
  `;
}
