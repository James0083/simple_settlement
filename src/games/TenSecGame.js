/* 10초 맞추기 — 10초라고 느끼는 순간 버튼을 누른다. 가장 차이나는 사람이 당첨 */
import { useState, useRef } from "react";
import { html } from "../shared/html.js";
import { styles, C_DARK, C_MUTED, C_RED, C_GREEN } from "../shared/styles.js"; // C_GREEN used in peek
import { colorOf } from "./palette.js";
import { shuffle } from "./random.js";
import { unlockAudio, countBeep, tick as sfxTick, fanfare } from "./sfx.js";
import { GAME_FINISH_MS, TurnBanner, BigButton, useScrollToStage } from "./common.js";
import { TurnOrderSetup } from "./TurnOrder.js";

const TARGET_MS = 10000;

export function TenSecGame({ players, onFinish }) {
  const [phase, setPhase] = useState("order"); // order | prepare | timing | peek | results | done
  const [order, setOrder] = useState(() => shuffle(players.map((_, i) => i)));
  const [turnPos, setTurnPos] = useState(0);
  const [records, setRecords] = useState([]); // [{playerIdx, elapsed}]
  const [peekElapsed, setPeekElapsed] = useState(null);
  const startTimeRef = useRef(null);
  const stageRef = useScrollToStage(phase !== "order");

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
    const newRecords = [...records, { playerIdx: currentPlayerIdx, elapsed }];
    setRecords(newRecords);
    setPeekElapsed(elapsed);
    setPhase("peek");

    const nextTurnPos = turnPos + 1;
    setTimeout(() => {
      setPeekElapsed(null);
      if (nextTurnPos >= order.length) {
        setPhase("results");
      } else {
        setTurnPos(nextTurnPos);
        setPhase("prepare");
      }
    }, 1500);
  };

  // 결과 계산
  const results = records
    .map((r) => ({
      ...r,
      player: players[r.playerIdx],
      colorIdx: r.playerIdx,
      error: Math.abs(r.elapsed - TARGET_MS),
      over: r.elapsed > TARGET_MS,
    }))
    .sort((a, b) => b.error - a.error); // 오차 큰 순 (첫 번째 = 패배자)

  const handleFinish = () => {
    if (results.length === 0) return;
    fanfare();
    const loserId = results[0].player.id;
    setTimeout(() => onFinish(loserId), GAME_FINISH_MS);
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
      <div ref=${stageRef} style=${{ ...styles.gameStage, gap: 0 }}>
        <${TurnBanner} player=${currentPlayer} index=${currentPlayerIdx} />
        <p style=${{ textAlign: "center", fontSize: 13, color: C_MUTED, margin: "0 0 20px" }}>
          ${turnPos + 1} / ${order.length}번째
        </p>
        <p style=${{
          textAlign: "center",
          fontSize: 14,
          fontWeight: 700,
          color: "#7B5800",
          padding: "12px 16px",
          background: "#FFF8E1",
          borderRadius: 8,
          border: "1px solid #FFE082",
          lineHeight: 1.6,
          margin: "0 0 20px",
        }}>
          다른 분들은 화면을 보지 않도록 해주세요! 👋<br />
          <span style=${{ fontSize: 12, fontWeight: 500, color: "#A07800" }}>
            시작 버튼을 누르고 10초라고 느끼면 멈추세요
          </span>
        </p>
        <${BigButton} onClick=${handleStart}>⏱ 시작!<//>
      </div>
    `;
  }

  // ── 타이머 진행 중 ──────────────────────────────────────────
  if (phase === "timing") {
    return html`
      <div
        ref=${stageRef}
        style=${{ ...styles.gameStage, alignItems: "center", paddingTop: 16, gap: 0 }}
      >
        <${TurnBanner} player=${currentPlayer} index=${currentPlayerIdx} />

        <!-- 진행 중 (시간 숨김) -->
        <div style=${{
          width: 160, height: 160,
          borderRadius: "50%",
          border: `6px solid #E3E6EC`,
          margin: "20px auto 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F6F8FB",
        }}>
          <span style=${{ fontSize: 64 }}>⏱</span>
        </div>

        <${BigButton} onClick=${handleStop}>지금이 10초!<//>
      </div>
    `;
  }

  // ── 잠깐 결과 보기 (1.5초) ────────────────────────────────
  if (phase === "peek" && peekElapsed != null) {
    const elapsedSec = (peekElapsed / 1000).toFixed(2);
    const error = Math.abs(peekElapsed - TARGET_MS);
    const errSec = (error / 1000).toFixed(2);
    const over = peekElapsed > TARGET_MS;
    return html`
      <div ref=${stageRef} style=${{ ...styles.gameStage, alignItems: "center", gap: 0 }}>
        <${TurnBanner} player=${currentPlayer} index=${currentPlayerIdx} />
        <div style=${{
          margin: "20px auto",
          textAlign: "center",
          padding: "20px 28px",
          background: "#F6F8FB",
          borderRadius: 10,
          border: "1.5px solid #E3E6EC",
        }}>
          <p style=${{ fontSize: 13, color: C_MUTED, margin: "0 0 4px" }}>멈춘 시간</p>
          <p style=${{
            fontSize: 44, fontWeight: 900, color: C_DARK,
            fontVariantNumeric: "tabular-nums", letterSpacing: "-1px", margin: 0,
          }}>
            ${elapsedSec}초
          </p>
          <p style=${{
            fontSize: 16, fontWeight: 800, margin: "6px 0 0",
            color: error < 1000 ? C_GREEN : error < 2000 ? "#F9A825" : C_RED,
            fontVariantNumeric: "tabular-nums",
          }}>
            ${over ? "+" : "-"}${errSec}초 오차
          </p>
        </div>
        <p style=${{ fontSize: 13, color: C_MUTED, textAlign: "center" }}>다음 사람에게 넘겨주세요</p>
      </div>
    `;
  }

  // ── 결과 화면 ──────────────────────────────────────────────
  if (phase === "results") {
    const loser = results[0];
    return html`
      <div ref=${stageRef} style=${{ ...styles.gameStage, gap: 0 }}>
        <p style=${{
          textAlign: "center",
          fontSize: 13,
          fontWeight: 700,
          color: "#8A8FA3",
          letterSpacing: "1px",
          margin: "0 0 14px",
        }}>
          결과
        </p>

        <!-- 순위 리스트 -->
        <div style=${{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
          ${results.map((r, rank) => {
            const [bg, fg] = colorOf(r.colorIdx);
            const isLoser = rank === 0;
            const sign = r.over ? "+" : "-";
            const errSec = (r.error / 1000).toFixed(2);
            const elapsedSec = (r.elapsed / 1000).toFixed(2);
            return html`
              <div key=${r.player.id} style=${{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                background: isLoser ? "#FDF0EC" : "#F6F8FB",
                border: `1px solid ${isLoser ? "#F4C4B7" : "#E3E6EC"}`,
                borderRadius: 6,
              }}>
                <span style=${{
                  minWidth: 28, height: 28, flexShrink: 0,
                  borderRadius: 4, background: bg, color: fg,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700,
                }}>
                  ${rank + 1}
                </span>
                <span style=${{ flex: 1, fontSize: 14, fontWeight: 700, color: C_DARK }}>
                  ${r.player.name}
                  ${isLoser ? " 💥" : ""}
                </span>
                <span style=${{ fontSize: 13, color: C_MUTED, fontVariantNumeric: "tabular-nums" }}>
                  ${elapsedSec}초
                </span>
                <span style=${{
                  fontSize: 12,
                  fontWeight: 700,
                  color: isLoser ? C_RED : C_MUTED,
                  fontVariantNumeric: "tabular-nums",
                  minWidth: 60,
                  textAlign: "right",
                }}>
                  ${sign}${errSec}초
                </span>
              </div>
            `;
          })}
        </div>

        <p style=${{ ...styles.hint, marginBottom: 4 }}>
          오차가 가장 큰 <strong>${loser.player.name}</strong>님이 당첨!
        </p>
        <${BigButton} onClick=${handleFinish}>확인<//>
      </div>
    `;
  }

  return null;
}
