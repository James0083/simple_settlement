/* 10초 맞추기 — 10초라고 느끼는 순간 버튼을 누른다. 10초에서 가장 멀리 벗어난 사람이 당첨 */
import { useState, useRef, useEffect } from "react";
import { html } from "../shared/html.js";
import { styles, C_RED, C_GREEN } from "../shared/styles.js";
import { colorOf } from "./palette.js";
import { shuffle } from "./random.js";
import { unlockAudio, countBeep, tick as sfxTick, fanfare } from "./sfx.js";
import { GAME_FINISH_MS, TurnBanner, BigButton, useScrollToStage } from "./common.js";
import { TurnOrderSetup } from "./TurnOrder.js";

const TARGET_MS = 10000;
const PEEK_MS = 1500; // 멈춘 시간을 잠깐 보여주는 시간

const sec = (ms) => (ms / 1000).toFixed(2);
const errorColor = (err) => (err < 1000 ? C_GREEN : err < 2000 ? "#F9A825" : C_RED);

export function TenSecGame({ players, onFinish }) {
  const [phase, setPhase] = useState("order"); // order | prepare | timing | peek | results | done
  const [order, setOrder] = useState(() => shuffle(players.map((_, i) => i)));
  const [turnPos, setTurnPos] = useState(0);
  const [records, setRecords] = useState([]); // [{playerIdx, elapsed}]
  const [peekElapsed, setPeekElapsed] = useState(null);
  const startTimeRef = useRef(null);
  const timers = useRef([]);
  const stageRef = useScrollToStage(phase !== "order");
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const startGame = () => {
    unlockAudio();
    setTurnPos(0);
    setRecords([]);
    setPhase("prepare");
  };

  const currentPlayerIdx = order[turnPos];
  const currentPlayer = players[currentPlayerIdx];

  const handleStart = () => {
    startTimeRef.current = Date.now();
    countBeep(true); // GO!
    setPhase("timing");
  };

  const handleStop = () => {
    const elapsed = Date.now() - startTimeRef.current;
    sfxTick(false);
    setRecords([...records, { playerIdx: currentPlayerIdx, elapsed }]);
    setPeekElapsed(elapsed);
    setPhase("peek");

    const nextTurnPos = turnPos + 1;
    timers.current.push(
      setTimeout(() => {
        setPeekElapsed(null);
        if (nextTurnPos >= order.length) {
          setPhase("results");
        } else {
          setTurnPos(nextTurnPos);
          setPhase("prepare");
        }
      }, PEEK_MS)
    );
  };

  // 오차 큰 순 (첫 번째 = 당첨)
  const results = records
    .map((r) => ({
      ...r,
      player: players[r.playerIdx],
      error: Math.abs(r.elapsed - TARGET_MS),
      over: r.elapsed > TARGET_MS,
    }))
    .sort((a, b) => b.error - a.error);

  const handleFinish = () => {
    if (phase !== "results" || results.length === 0) return; // 한 번만
    setPhase("done");
    fanfare();
    const loserId = results[0].player.id;
    timers.current.push(setTimeout(() => onFinish(loserId), GAME_FINISH_MS));
  };

  // ── 순서 정하기 ─────────────────────────────────────────────
  if (phase === "order") {
    return html`
      <${TurnOrderSetup}
        players=${players}
        order=${order}
        onChange=${setOrder}
        onStart=${startGame}
        note="폰을 돌아가며 해요 · 10초에서 가장 멀리 벗어난 사람이 당첨"
        startLabel="게임 시작"
      />
    `;
  }

  // ── 준비 (다음 플레이어에게 넘기기) ────────────────────────
  if (phase === "prepare") {
    return html`
      <div ref=${stageRef} style=${styles.gameStage}>
        <${TurnBanner} player=${currentPlayer} index=${currentPlayerIdx} />
        <p style=${styles.gameMeta}>${turnPos + 1} / ${order.length}번째</p>
        <p style=${styles.privacyNote}>
          다른 분들은 화면을 보지 않도록 해주세요! 👋<br />
          <span style=${styles.privacyNoteSub}>시작 버튼을 누르고 10초라고 느끼면 멈추세요</span>
        </p>
        <${BigButton} onClick=${handleStart}>⏱ 시작!<//>
      </div>
    `;
  }

  // ── 타이머 진행 중 (시간은 숨김) ────────────────────────────
  if (phase === "timing") {
    return html`
      <div ref=${stageRef} style=${styles.gameStage}>
        <${TurnBanner} player=${currentPlayer} index=${currentPlayerIdx} />
        <div style=${styles.tensecDial} aria-hidden="true">⏱</div>
        <${BigButton} onClick=${handleStop}>지금이 10초!<//>
      </div>
    `;
  }

  // ── 멈춘 시간 잠깐 보기 ────────────────────────────────────
  if (phase === "peek" && peekElapsed != null) {
    const error = Math.abs(peekElapsed - TARGET_MS);
    return html`
      <div ref=${stageRef} style=${styles.gameStageCenter}>
        <${TurnBanner} player=${currentPlayer} index=${currentPlayerIdx} />
        <div style=${styles.tensecPeek}>
          <p style=${{ ...styles.gameMeta, margin: "0 0 4px" }}>멈춘 시간</p>
          <p style=${styles.tensecPeekTime}>${sec(peekElapsed)}초</p>
          <p style=${{ ...styles.tensecPeekError, color: errorColor(error) }}>
            ${peekElapsed > TARGET_MS ? "+" : "-"}${sec(error)}초 오차
          </p>
        </div>
        <p style=${styles.gameMeta}>다음 사람에게 넘겨주세요</p>
      </div>
    `;
  }

  // ── 결과 ───────────────────────────────────────────────────
  if (phase === "results" || phase === "done") {
    return html`
      <div ref=${stageRef} style=${styles.gameStage}>
        <p style=${styles.gameCaption}>결과</p>
        <div style=${styles.rankList}>
          ${results.map((r, rank) => {
            const [bg, fg] = colorOf(r.playerIdx);
            const isLoser = rank === 0;
            return html`
              <div key=${r.player.id} style=${{ ...styles.rankRow, ...(isLoser ? styles.rankRowHit : null) }}>
                <span style=${{ ...styles.rankNo, background: bg, color: fg }}>${rank + 1}</span>
                <span style=${styles.rankName}>${r.player.name}${isLoser ? " 💥" : ""}</span>
                <span style=${styles.tensecElapsed}>${sec(r.elapsed)}초</span>
                <span style=${{ ...styles.tensecError, ...(isLoser ? { color: C_RED } : null) }}>
                  ${r.over ? "+" : "-"}${sec(r.error)}초
                </span>
              </div>
            `;
          })}
        </div>
        <p style=${{ ...styles.hint, marginBottom: 4 }}>
          오차가 가장 큰 <strong>${results[0].player.name}</strong>님이 당첨!
        </p>
        <${BigButton} onClick=${handleFinish} disabled=${phase === "done"}>확인<//>
      </div>
    `;
  }

  return null;
}
