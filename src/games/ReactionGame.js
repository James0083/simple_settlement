/*
 * 반응속도 (신호등) — 폰을 돌려 가며 한 명씩. 빨간 화면이 무작위 시간 뒤 초록으로 바뀌면 바로 누른다.
 * 가장 느린 사람이 당첨. 초록 전에 누르면(또는 사람이 낼 수 없을 만큼 빠르면) 부정 출발 — 기록 없이 당첨 후보.
 * 부정 출발이 한 명이면 그 사람, 여럿이면 onTie(부정 출발자). 기록이 ms 까지 같으면 역시 onTie.
 * 누르는 순간은 click(손을 뗄 때)이 아니라 pointerdown 으로 잰다.
 */
import { Fragment, useState, useRef, useEffect } from "react";
import { html } from "../shared/html.js";
import { styles, C_RED } from "../shared/styles.js";
import { colorOf } from "./palette.js";
import { randInt, shuffle } from "./random.js";
import { unlockAudio, beep, tick as sfxTick, fanfare, vibrate } from "./sfx.js";
import { GAME_FINISH_MS, TurnBanner, BigButton, useScrollToStage } from "./common.js";
import { TurnOrderSetup } from "./TurnOrder.js";

export const WAIT_MIN_MS = 1500; // 초록까지 기다리는 시간 = 1.5초 ~ 5초 (사람마다 새로 뽑는다)
export const WAIT_RANGE_MS = 3500;
export const TOO_FAST_MS = 50; // 초록 뒤 이보다 빠른 입력은 미리 누르고 있던 것으로 본다
const PEEK_MS = 1400; // 내 기록을 잠깐 보여주는 시간

const sec = (ms) => (ms / 1000).toFixed(3);

// 당첨 판정 — records: [{ playerIdx, ms | null(부정 출발) }]
// 부정 출발이 있으면 그 사람(들), 없으면 가장 느린 사람(들). 돌려주는 값은 playerIdx 배열.
export function reactionLosers(records) {
  const fouls = records.filter((r) => r.ms == null).map((r) => r.playerIdx);
  if (fouls.length > 0) return fouls;
  const slowest = Math.max(...records.map((r) => r.ms));
  return records.filter((r) => r.ms === slowest).map((r) => r.playerIdx);
}

export function ReactionGame({ players, onFinish, onTie }) {
  const [phase, setPhase] = useState("order"); // order | ready | wait | go | peek | results | done
  const [order, setOrder] = useState(() => shuffle(players.map((_, i) => i)));
  const [turnPos, setTurnPos] = useState(0);
  const [records, setRecords] = useState([]);
  const [last, setLast] = useState(null); // 방금 사람의 기록 { ms | null, early }
  const goAt = useRef(0);
  const timers = useRef([]);
  const stageRef = useScrollToStage(["ready", "wait", "go", "peek"].includes(phase), `${phase}-${turnPos}`);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const playerIdx = order[turnPos];
  const player = players[playerIdx];

  const startGame = () => {
    unlockAudio();
    setPhase("ready");
  };

  const arm = () => {
    setPhase("wait");
    timers.current.push(
      setTimeout(() => {
        goAt.current = performance.now();
        beep(1040, 120, "square", 0.05);
        setPhase("go");
      }, WAIT_MIN_MS + randInt(WAIT_RANGE_MS + 1))
    );
  };

  const record = (ms) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const early = ms == null;
    if (early) vibrate(120);
    else sfxTick(false);
    setRecords((prev) => [...prev, { playerIdx, ms }]);
    setLast({ ms, early });
    setPhase("peek");
    timers.current.push(
      setTimeout(() => {
        setLast(null);
        if (turnPos + 1 >= order.length) {
          setPhase("results");
        } else {
          setTurnPos(turnPos + 1);
          setPhase("ready");
        }
      }, PEEK_MS)
    );
  };

  const press = () => {
    if (phase === "wait") return record(null);
    if (phase !== "go") return;
    const ms = Math.round(performance.now() - goAt.current);
    record(ms < TOO_FAST_MS ? null : ms);
  };
  const pressKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      press();
    }
  };

  // 기록 빠른 순 · 부정 출발은 맨 아래
  const ranked = [...records].sort((a, b) => (a.ms ?? Infinity) - (b.ms ?? Infinity));
  const loserIdxs = phase === "results" || phase === "done" ? reactionLosers(records) : [];

  const finish = () => {
    if (phase !== "results") return; // 한 번만
    setPhase("done");
    fanfare();
    const ids = loserIdxs.map((i) => players[i].id);
    timers.current.push(
      setTimeout(() => {
        if (ids.length === 1) onFinish(ids[0]);
        else if (onTie) onTie(ids);
        else onFinish(ids);
      }, GAME_FINISH_MS)
    );
  };

  // ── 순서 정하기 ─────────────────────────────────────────────
  if (phase === "order") {
    return html`
      <${TurnOrderSetup}
        players=${players}
        order=${order}
        onChange=${setOrder}
        onStart=${startGame}
        note="폰을 돌아가며 해요 · 초록으로 바뀌면 바로 누르기 · 가장 느린 사람이 당첨"
        startLabel="게임 시작"
      />
    `;
  }

  // ── 준비 (폰 넘겨받기) ──────────────────────────────────────
  if (phase === "ready") {
    return html`
      <div ref=${stageRef} style=${styles.gameStage}>
        <${TurnBanner} player=${player} index=${playerIdx} />
        <p style=${styles.gameMeta}>${turnPos + 1} / ${order.length}번째</p>
        <p style=${styles.bsRules}>
          화면이 <strong style=${{ color: C_RED }}>빨강</strong>일 때는 기다리고,<br />
          <strong style=${{ color: "#0F9D64" }}>초록</strong>으로 바뀌는 순간 화면을 누르세요.<br />
          먼저 누르면 부정 출발이에요!
        </p>
        <${BigButton} onClick=${arm}>준비됐어요<//>
      </div>
    `;
  }

  // ── 신호 (빨강 → 초록) ──────────────────────────────────────
  if (phase === "wait" || phase === "go") {
    const go = phase === "go";
    return html`
      <div ref=${stageRef} style=${styles.gameStage}>
        <${TurnBanner} player=${player} index=${playerIdx} />
        <button
          type="button"
          style=${{ ...styles.reactionPad, ...(go ? styles.reactionPadGo : null) }}
          onPointerDown=${press}
          onKeyDown=${pressKey}
          aria-live="assertive"
        >
          <span style=${styles.reactionPadEmoji} aria-hidden="true">${go ? "🟢" : "🔴"}</span>
          <span>${go ? "지금!" : "기다려요…"}</span>
        </button>
      </div>
    `;
  }

  // ── 내 기록 잠깐 보기 ──────────────────────────────────────
  if (phase === "peek" && last) {
    return html`
      <div ref=${stageRef} style=${styles.gameStageCenter}>
        <${TurnBanner} player=${player} index=${playerIdx} />
        <div style=${styles.tensecPeek}>
          ${last.early
            ? html`
                <${Fragment}>
                  <p style=${{ ...styles.tensecPeekTime, color: C_RED, fontSize: 32 }}>부정 출발!</p>
                  <p style=${{ ...styles.gameMeta, margin: "6px 0 0" }}>초록이 되기 전에 눌렀어요</p>
                <//>
              `
            : html`
                <${Fragment}>
                  <p style=${{ ...styles.gameMeta, margin: "0 0 4px" }}>반응 시간</p>
                  <p style=${styles.tensecPeekTime}>${sec(last.ms)}초</p>
                <//>
              `}
        </div>
        <p style=${styles.gameMeta}>다음 사람에게 넘겨주세요</p>
      </div>
    `;
  }

  // ── 결과 ───────────────────────────────────────────────────
  if (phase === "results" || phase === "done") {
    const losersText = loserIdxs.map((i) => players[i].name).join(", ");
    const foul = records.some((r) => r.ms == null);
    return html`
      <div ref=${stageRef} style=${styles.gameStage}>
        <p style=${styles.gameCaption}>결과</p>
        <div style=${styles.rankList}>
          ${ranked.map((r, rank) => {
            const [bg, fg] = colorOf(r.playerIdx);
            const isLoser = loserIdxs.includes(r.playerIdx);
            return html`
              <div key=${r.playerIdx} style=${{ ...styles.rankRow, ...(isLoser ? styles.rankRowHit : null) }}>
                <span style=${{ ...styles.rankNo, background: bg, color: fg }}>${rank + 1}</span>
                <span style=${styles.rankName}>${players[r.playerIdx].name}${isLoser ? " 💥" : ""}</span>
                <span style=${{ ...styles.rankValue, ...(isLoser ? { color: C_RED } : null) }}>
                  ${r.ms == null ? "부정 출발" : `${sec(r.ms)}초`}
                </span>
              </div>
            `;
          })}
        </div>
        <p style=${{ ...styles.hint, marginBottom: 4 }}>
          ${loserIdxs.length > 1
            ? `${losersText}님이 ${foul ? "모두 부정 출발" : "똑같이 느렸어요"} — 한 번 더!`
            : html`<${Fragment}>${foul ? "부정 출발한" : "가장 느린"} <strong>${losersText}</strong>님이 당첨!<//>`}
        </p>
        <${BigButton} onClick=${finish} disabled=${phase === "done"}>확인<//>
      </div>
    `;
  }

  return null;
}
