/*
 * 사다리 타기 — 위에 이름, 아래 결과. 당첨 칸 개수를 정할 수 있고(1 ~ 인원-1), 나머지는 통과.
 *
 * 가로줄은 같은 높이에서 이웃끼리 붙지 않게 만든다 → 경로가 항상 1:1(서로 다른 도착점)로 대응한다.
 * 이웃한 세로줄 쌍마다 가로줄이 최소 1개는 있게 보정한다.
 * 이름을 누르면 경로를 따라 그리고, 도착 칸에 그 사람 이름을 적는다. 당첨 칸이 모두 밝혀지면 당첨자 목록으로 결과를 알린다.
 * 사다리를 타는(선이 그려지는) 동안만 실로폰 멜로디가 나오고, 도착하면 통과 "띵동" · 당첨 "빰빠밤".
 *
 * 공정성: 사다리는 본래 출발 위치 근처에 도착하기 쉽지만, 💸 칸의 위치를 가로줄과 따로 균등하게
 * 섞으므로(셔플) 누가 어느 이름을 골라도 당첨 확률은 정확히 (당첨 개수)/n 이다.
 */
import { useState, useRef, useEffect } from "react";
import { html } from "../shared/html.js";
import { styles } from "../shared/styles.js";
import { randomFloat, shuffle } from "./random.js";
import { vibrate, ladderRun, ladderPass, fanfare, prefersReducedMotion } from "./sfx.js";
import { colorOf, shortName } from "./palette.js";
import { BigButton, useScrollToStage } from "./common.js";

const COL_W = 60;
const LEVELS = 10;
// 사다리는 칸 너비에 맞춰 늘어나므로, 인원과 상관없이 화면에서 비슷한 크기(가로:세로 = 1:0.85)로 보이게
// 높이를 폭에 비례시킨다. 선 굵기·여백도 같은 비율(unit)로 맞춰 2명이든 10명이든 같은 굵기로 보인다.
const unit = (n) => (COL_W * n) / 330;
const heightFor = (n) => COL_W * n * 0.85;
const levelY = (l, h, n) => 18 * unit(n) + ((l + 0.5) * (h - 36 * unit(n))) / LEVELS;
const colX = (c) => COL_W * (c + 0.5);

export function makeRungs(n, levels = LEVELS, rand = randomFloat) {
  const rungs = Array.from({ length: levels }, () => Array(Math.max(0, n - 1)).fill(false));
  for (let l = 0; l < levels; l++)
    for (let c = 0; c < n - 1; c++)
      if (!(c > 0 && rungs[l][c - 1]) && rand() < 0.45) rungs[l][c] = true;

  // 가로줄이 하나도 없는 쌍 보정. 이웃 가로줄과 겹치지 않는 높이를 우선 고르고,
  // 없으면 한 높이를 골라 이웃 가로줄을 지운다 (지운 쌍은 다음 바퀴에서 다시 보정).
  for (let pass = 0; pass < 20; pass++) {
    let changed = false;
    for (let c = 0; c < n - 1; c++) {
      if (rungs.some((row) => row[c])) continue;
      const free = [];
      for (let l = 0; l < levels; l++) if (!rungs[l][c - 1] && !rungs[l][c + 1]) free.push(l);
      const l = free.length ? free[Math.floor(rand() * free.length)] : Math.floor(rand() * levels);
      if (c > 0) rungs[l][c - 1] = false;
      if (c < n - 2) rungs[l][c + 1] = false;
      rungs[l][c] = true;
      changed = true;
    }
    if (!changed) break;
  }
  return rungs;
}

export function tracePath(rungs, start) {
  const n = (rungs[0]?.length ?? 0) + 1;
  const H = heightFor(n);
  let c = start;
  const pts = [[colX(c), 0]];
  rungs.forEach((row, l) => {
    const y = levelY(l, H, n);
    if (c < n - 1 && row[c]) {
      pts.push([colX(c), y], [colX(c + 1), y]);
      c += 1;
    } else if (c > 0 && row[c - 1]) {
      pts.push([colX(c), y], [colX(c - 1), y]);
      c -= 1;
    }
  });
  pts.push([colX(c), H]);
  const length = pts.slice(1).reduce((s, [x, y], i) => s + Math.hypot(x - pts[i][0], y - pts[i][1]), 0);
  return { end: c, pts, length };
}

export function LadderGame({ players: initialPlayers, onFinish }) {
  const [players] = useState(initialPlayers);
  const n = players.length;
  const [winCount, setWinCount] = useState(1); // 당첨 칸 개수 (1 ~ n-1)
  const [game, setGame] = useState(null); // { rungs, win: 아래 칸마다 당첨 여부 }
  const [traced, setTraced] = useState({}); // playerIndex -> { end, pts, length, done }
  const winners = useRef(new Set()); // 당첨 칸에 도착한 플레이어
  const finished = useRef(false);
  const timers = useRef([]);
  const resultsRef = useRef(null);
  const stageRef = useScrollToStage(game !== null);
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    []
  );

  const start = () => {
    // 당첨 칸 위치를 가로줄과 따로 균등하게 섞는다 → 누구든 당첨 확률 winCount/n
    const win = shuffle(players.map((_, i) => i < winCount));
    setGame({ rungs: makeRungs(n), win });
  };

  const drawMs = prefersReducedMotion() ? 0 : 2600;

  const trace = (i) => {
    if (!game || traced[i]) return;
    const t = tracePath(game.rungs, i);
    setTraced((prev) => ({ ...prev, [i]: { ...t, done: false } }));
    ladderRun((drawMs || 400) / 1000);
    // 도착 칸이 화면 밖이면 보이게 내린다 (탭바에 가리지 않게 scrollMarginBottom)
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    timers.current.push(
      setTimeout(() => {
        setTraced((prev) => ({ ...prev, [i]: { ...prev[i], done: true } }));
        if (!game.win[t.end]) {
          ladderPass();
          return;
        }
        winners.current.add(i);
        vibrate(120);
        fanfare();
        // 당첨 칸이 모두 밝혀지면 결과 — 당첨자는 사다리 순서(왼쪽부터)대로
        if (winners.current.size === winCount && !finished.current) {
          finished.current = true;
          onFinish([...winners.current].sort((a, b) => a - b).map((k) => players[k].id));
        }
      }, drawMs + 50)
    );
  };

  const traceAll = () => players.forEach((_, i) => trace(i));

  if (!game) {
    return html`
      <div style=${styles.gameStage}>
        <div style=${styles.sectionLabel}>당첨 개수</div>
        <div style=${{ ...styles.stepper, justifyContent: "center" }}>
          <button
            type="button"
            className="settle-step-btn"
            style=${styles.stepBtn}
            onClick=${() => setWinCount(Math.max(1, winCount - 1))}
            disabled=${winCount <= 1}
            aria-label="당첨 줄이기"
          >
            −
          </button>
          <span style=${styles.stepValue} aria-live="polite">${winCount}<span style=${styles.wonSuffix}>개</span></span>
          <button
            type="button"
            className="settle-step-btn"
            style=${styles.stepBtn}
            onClick=${() => setWinCount(Math.min(n - 1, winCount + 1))}
            disabled=${winCount >= n - 1}
            aria-label="당첨 늘리기"
          >
            +
          </button>
        </div>
        <p style=${styles.hint}>
          ${n}칸 중 💸 당첨 ${winCount}칸 · 통과 ${n - winCount}칸. 당첨 칸 위치는 사다리를 만들 때 무작위로 섞여요.
        </p>
        <${BigButton} onClick=${start}>사다리 만들기<//>
      </div>
    `;
  }

  const width = COL_W * n;
  const H = heightFor(n);
  const k = unit(n);
  const endOwner = {}; // 아래 칸 → 도착한 플레이어 (그리기가 끝난 것만)
  Object.entries(traced).forEach(([i, t]) => {
    if (t.done) endOwner[t.end] = Number(i);
  });

  return html`
    <div ref=${stageRef} style=${styles.gameStage}>
      <div style=${{ ...styles.ladderNames, gridTemplateColumns: `repeat(${n}, 1fr)` }}>
        ${players.map((p, i) => {
          const [bg, fg] = colorOf(i);
          return html`
            <button
              key=${p.id}
              type="button"
              style=${{ ...styles.ladderName, background: traced[i] ? bg : "#FFFFFF", color: traced[i] ? fg : "#1A1D29", borderColor: bg }}
              onClick=${() => trace(i)}
              aria-label=${`${p.name} 사다리 타기`}
            >
              ${shortName(p.name, 3)}
            </button>
          `;
        })}
      </div>
      <svg viewBox="0 0 ${width} ${H}" style=${styles.gameSvg} role="img" aria-label="사다리">
        ${players.map((_, c) => html`<line key=${c} x1=${colX(c)} y1="0" x2=${colX(c)} y2=${H} stroke="#C7CCD8" strokeWidth=${3 * k} strokeLinecap="round" />`)}
        ${game.rungs.map((row, l) =>
          row.map((on, c) =>
            on
              ? html`<line key=${`${l}-${c}`} x1=${colX(c)} y1=${levelY(l, H, n)} x2=${colX(c + 1)} y2=${levelY(l, H, n)} stroke="#C7CCD8" strokeWidth=${3 * k} strokeLinecap="round" />`
              : null
          )
        )}
        ${Object.entries(traced).map(([i, t]) => html`
          <polyline
            key=${i}
            points=${t.pts.map((p) => p.join(",")).join(" ")}
            fill="none"
            stroke=${colorOf(Number(i))[0]}
            strokeWidth=${5 * k}
            strokeLinecap="round"
            strokeLinejoin="round"
            style=${{
              strokeDasharray: t.length,
              strokeDashoffset: drawMs ? t.length : 0,
              animation: drawMs ? `ladderDraw ${drawMs}ms ease-in-out forwards` : "none",
            }}
          />
        `)}
      </svg>
      <div ref=${resultsRef} style=${{ ...styles.ladderNames, gridTemplateColumns: `repeat(${n}, 1fr)`, scrollMarginBottom: 96 }}>
        ${game.win.map((isTarget, pos) => {
          const owner = endOwner[pos];
          const shown = owner !== undefined;
          return html`
            <div
              key=${pos}
              style=${{
                ...styles.ladderResult,
                ...(shown && isTarget ? styles.ladderResultTarget : null),
                ...(shown ? null : styles.ladderResultHidden),
              }}
            >
              ${shown
                ? html`<span style=${styles.ladderResultLabel}>${isTarget ? (n >= 8 ? "💸" : "💸 당첨") : "통과"}</span>
                    <span style=${{ ...styles.ladderResultName, background: colorOf(owner)[0], color: colorOf(owner)[1] }}>
                      ${shortName(players[owner].name, 3)}
                    </span>`
                : "?"}
            </div>
          `;
        })}
      </div>
      <p style=${styles.hint}>이름을 눌러 사다리를 타세요</p>
      <${BigButton} onClick=${traceAll} disabled=${Object.keys(traced).length === n}>전체 공개<//>
    </div>
  `;
}
