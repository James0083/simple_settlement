/*
 * 숫자 맞추기 — 모두 같은 비밀 숫자를 각자 자기 범위로 좁혀가며 맞힌다. 맞히면 탈출.
 * 전원이 탈출하면 시도 횟수가 가장 많은 사람이 당첨. 최다 횟수가 여러 명이면 onTie(동점자 id 목록).
 */
import { useState } from "react";
import { html } from "../shared/html.js";
import { styles, C_DARK, C_MUTED, C_GREEN } from "../shared/styles.js";
import { colorOf } from "./palette.js";
import { shuffle } from "./random.js";
import { unlockAudio, beep, chime, fanfare } from "./sfx.js";
import { GAME_FINISH_MS, TurnBanner, BigButton, useScrollToStage } from "./common.js";
import { TurnOrderSetup } from "./TurnOrder.js";

const FULL_RANGE = [1, 100];

export function UpDownGame({ players, onFinish, onTie }) {
  const [phase, setPhase] = useState("order"); // order | prepare | input | feedback | done
  const [order, setOrder] = useState(() => shuffle(players.map((_, i) => i)));

  // survivors: 생존 중인 플레이어 인덱스 배열(order 순서)
  // survivors[0] = 현재 차례 플레이어 인덱스
  const [survivors, setSurvivors] = useState(null);
  const [secret, setSecret] = useState(null);
  // 플레이어마다 자기 추측으로 좁힌 범위를 따로 가진다 (playerIdx → [lo, hi])
  const [ranges, setRanges] = useState({});
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState(null); // "low" | "high" | "escaped"
  const [escapedNames, setEscapedNames] = useState([]);
  const [tries, setTries] = useState({}); // playerIdx → 시도 횟수
  const [losers, setLosers] = useState([]); // 결과: 최다 시도자 인덱스 (여러 명이면 동점)
  const stageRef = useScrollToStage(phase !== "order");

  const startGame = () => {
    unlockAudio();
    const s = Math.floor(Math.random() * 100) + 1;
    setSecret(s);
    setRanges(Object.fromEntries(order.map((i) => [i, FULL_RANGE])));
    setSurvivors([...order]);
    setEscapedNames([]);
    setTries(Object.fromEntries(order.map((i) => [i, 0])));
    setLosers([]);
    setPhase("prepare");
  };

  const currentIdx = survivors ? survivors[0] : null;
  const currentPlayer = currentIdx != null ? players[currentIdx] : null;
  const [lo, hi] = (currentIdx != null && ranges[currentIdx]) || FULL_RANGE;
  const setMyRange = (r) => setRanges((prev) => ({ ...prev, [currentIdx]: r }));

  const handleReady = () => {
    setGuess("");
    setFeedback(null);
    setPhase("input");
  };

  const handleGuess = () => {
    const g = parseInt(guess, 10);
    if (isNaN(g) || g < lo || g > hi) return;
    setTries((prev) => ({ ...prev, [currentIdx]: (prev[currentIdx] ?? 0) + 1 }));

    if (g < secret) {
      beep(880, 100, "square", 0.04);
      setMyRange([g + 1, hi]);
      setFeedback("low");
    } else if (g > secret) {
      beep(330, 100, "square", 0.04);
      setMyRange([lo, g - 1]);
      setFeedback("high");
    } else {
      // 정답 — 탈출!
      chime();
      setEscapedNames((prev) => [...prev, currentPlayer.name]);
      setFeedback("escaped");
    }
    setPhase("feedback");
  };

  const advance = () => {
    const isEscaped = feedback === "escaped";
    const newSurvivors = isEscaped
      ? survivors.slice(1)                         // 현재 플레이어 제거
      : [...survivors.slice(1), survivors[0]];     // 현재 플레이어를 뒤로

    if (newSurvivors.length === 0) {
      // 전원 탈출 → 시도 횟수가 가장 많은 사람이 당첨
      fanfare();
      const most = Math.max(...order.map((i) => tries[i] ?? 0));
      const worst = order.filter((i) => (tries[i] ?? 0) === most);
      const ids = worst.map((i) => players[i].id);
      setLosers(worst);
      setSurvivors(newSurvivors);
      setPhase("done");
      setTimeout(() => {
        if (ids.length === 1) onFinish(ids[0]);
        else if (onTie) onTie(ids);
        else onFinish(ids);
      }, GAME_FINISH_MS);
      return;
    }
    setSurvivors(newSurvivors);
    setPhase("prepare");
  };

  // 생존자 현황 표시 텍스트
  const statusLine = survivors
    ? `남은 ${survivors.length}명 · 탈출 ${players.length - survivors.length}명`
    : null;

  // ── 순서 정하기 ─────────────────────────────────────────────
  if (phase === "order") {
    return html`
      <${TurnOrderSetup}
        players=${players}
        order=${order}
        onChange=${setOrder}
        onStart=${startGame}
        note="폰을 돌아가며 숫자를 입력해요 · 전원이 맞힐 때까지 진행, 가장 많이 시도한 사람이 당첨"
        startLabel="게임 시작"
      />
    `;
  }

  // ── 결과: 시도 횟수 순위 ───────────────────────────────────
  if (phase === "done") {
    const tie = losers.length > 1;
    const ranked = [...order].sort((a, b) => (tries[b] ?? 0) - (tries[a] ?? 0));
    return html`
      <div ref=${stageRef} style=${{ ...styles.gameStage, gap: 0 }}>
        <p style=${{ textAlign: "center", fontSize: 13, fontWeight: 700, color: "#8A8FA3", margin: "0 0 10px" }}>
          시도 횟수 (많을수록 당첨)
        </p>
        <div style=${{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          ${ranked.map((i) => {
            const [bg, fg] = colorOf(i);
            const hit = losers.includes(i);
            return html`
              <div key=${i} style=${{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                background: hit ? "#FDF0EC" : "#F6F8FB",
                border: `1px solid ${hit ? "#F4C4B7" : "#E3E6EC"}`, borderRadius: 6,
              }}>
                <span style=${{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: bg, color: fg }}>
                  ${players[i].name}
                </span>
                <span style=${{ marginLeft: "auto", fontSize: 15, fontWeight: 800, color: hit ? "#E83B3B" : C_DARK, fontVariantNumeric: "tabular-nums" }}>
                  ${tries[i] ?? 0}번
                </span>
              </div>
            `;
          })}
        </div>
        <p style=${{ ...styles.hint, marginBottom: 0 }}>
          ${tie
            ? `동점! ${losers.map((i) => players[i].name).join(", ")}님이 ${tries[losers[0]]}번으로 같아요`
            : `${players[losers[0]]?.name}님이 가장 많이 시도했어요`}
        </p>
      </div>
    `;
  }

  // ── 준비 화면 (프라이버시 안내) ─────────────────────────────
  if (phase === "prepare" && currentPlayer) {
    return html`
      <div ref=${stageRef} style=${{ ...styles.gameStage, gap: 0 }}>
        <${TurnBanner} player=${currentPlayer} index=${currentIdx} />
        <p style=${{ textAlign: "center", fontSize: 13, color: C_MUTED, margin: "0 0 14px" }}>
          ${statusLine}
        </p>
        <p style=${{
          textAlign: "center",
          fontSize: 14,
          fontWeight: 700,
          color: "#7B5800",
          margin: "14px 0 20px",
          padding: "11px 16px",
          background: "#FFF8E1",
          borderRadius: 8,
          border: "1px solid #FFE082",
          lineHeight: 1.5,
        }}>
          다른 분들은 화면을 보지 않도록 해주세요! 👋
        </p>
        <${BigButton} onClick=${handleReady}>준비됐어요<//>
      </div>
    `;
  }

  // ── 숫자 입력 ──────────────────────────────────────────────
  if (phase === "input" && currentPlayer) {
    const g = parseInt(guess, 10);
    const valid = !isNaN(g) && g >= lo && g <= hi;
    return html`
      <div ref=${stageRef} style=${{ ...styles.gameStage, gap: 0 }}>
        <${TurnBanner} player=${currentPlayer} index=${currentIdx} />
        <p style=${{ textAlign: "center", fontSize: 12, color: C_MUTED, margin: "0 0 16px" }}>
          ${statusLine}
        </p>

        <div style=${{ textAlign: "center", marginBottom: 20 }}>
          <div style=${{
            display: "inline-block",
            fontSize: 40,
            fontWeight: 900,
            color: C_DARK,
            letterSpacing: "-1px",
            fontVariantNumeric: "tabular-nums",
          }}>
            ${lo === hi ? lo : `${lo} ~ ${hi}`}
          </div>
          <p style=${{ margin: "2px 0 0", fontSize: 11.5, color: C_MUTED }}>${currentPlayer.name}님이 지금까지 좁힌 범위예요</p>
        </div>

        <input
          className="settle-name-input"
          style=${{
            ...styles.nameInputFull,
            textAlign: "center",
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: "4px",
            marginBottom: 4,
            fontVariantNumeric: "tabular-nums",
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder=${lo === hi ? `${lo}` : `${lo}~${hi}`}
          value=${guess}
          onInput=${(e) => setGuess(e.target.value)}
          autoFocus
        />
        <p style=${{ ...styles.hint, marginBottom: 0 }}>
          ${lo}~${hi} 사이 숫자
        </p>
        <${BigButton} onClick=${handleGuess} disabled=${!valid}>확인<//>
      </div>
    `;
  }

  // ── 결과 피드백 ────────────────────────────────────────────
  if (phase === "feedback" && currentPlayer) {
    const isEscaped = feedback === "escaped";
    const isLow = feedback === "low";
    const [newLo, newHi] = ranges[currentIdx] || FULL_RANGE;
    return html`
      <div ref=${stageRef} style=${{ ...styles.gameStage, alignItems: "center", paddingTop: 24, gap: 0 }}>
        <div style=${{ fontSize: 72, lineHeight: 1, marginBottom: 12 }}>
          ${isEscaped ? "🎉" : isLow ? "⬆️" : "⬇️"}
        </div>
        <p style=${{
          fontSize: 24,
          fontWeight: 900,
          color: isEscaped ? C_GREEN : C_DARK,
          margin: "0 0 8px",
          letterSpacing: "-0.5px",
        }}>
          ${isEscaped
            ? `${currentPlayer.name}님 ${tries[currentIdx]}번 만에 탈출!`
            : isLow ? "더 높아요!" : "더 낮아요!"}
        </p>
        ${isEscaped && escapedNames.length > 0 && html`
          <p style=${{ fontSize: 13, color: C_MUTED, margin: "0 0 20px" }}>
            탈출: ${escapedNames.join(", ")}
          </p>
        `}
        ${!isEscaped && html`
          <p style=${{
            fontSize: 18,
            color: C_DARK,
            fontWeight: 800,
            margin: "0 0 24px",
            fontVariantNumeric: "tabular-nums",
          }}>
            내 새 범위: <span style=${{ color: "#E83B3B" }}>${newLo} ~ ${newHi}</span>
          </p>
        `}
        <${BigButton} onClick=${advance}>
          ${isEscaped ? "다음 차례로" : "다음 차례로"}
        <//>
      </div>
    `;
  }

  return null;
}
