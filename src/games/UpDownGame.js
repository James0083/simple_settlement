/*
 * 숫자 맞추기 — 모두 같은 비밀 숫자를 각자 자기 범위로 좁혀가며 맞힌다. 맞히면 탈출.
 * 전원이 탈출하면 시도 횟수가 가장 많은 사람이 당첨. 최다 횟수가 여러 명이면 onTie(동점자 id 목록).
 */
import { useState, useRef, useEffect } from "react";
import { html } from "../shared/html.js";
import { styles, C_RED, C_GREEN } from "../shared/styles.js";
import { colorOf } from "./palette.js";
import { shuffle, randInt } from "./random.js";
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
  const finishTimer = useRef(null);
  useEffect(() => () => clearTimeout(finishTimer.current), []);

  const startGame = () => {
    unlockAudio();
    setSecret(FULL_RANGE[0] + randInt(FULL_RANGE[1] - FULL_RANGE[0] + 1));
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
      finishTimer.current = setTimeout(() => {
        if (ids.length === 1) onFinish(ids[0]);
        else if (onTie) onTie(ids);
        else onFinish(ids);
      }, GAME_FINISH_MS);
      return;
    }
    setSurvivors(newSurvivors);
    setPhase("prepare");
  };

  // 남은 사람 · 탈출한 사람 수
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
      <div ref=${stageRef} style=${styles.gameStage}>
        <p style=${styles.gameCaption}>시도 횟수 (많을수록 당첨)</p>
        <div style=${styles.rankList}>
          ${ranked.map((i) => {
            const [bg, fg] = colorOf(i);
            const hit = losers.includes(i);
            return html`
              <div key=${i} style=${{ ...styles.rankRow, ...(hit ? styles.rankRowHit : null) }}>
                <span style=${{ ...styles.nameTag, background: bg, color: fg }}>${players[i].name}</span>
                <span style=${{ ...styles.rankValue, marginLeft: "auto", ...(hit ? { color: C_RED } : null) }}>
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

  // ── 준비 화면 (다른 사람은 보지 않게) ───────────────────────
  if (phase === "prepare" && currentPlayer) {
    return html`
      <div ref=${stageRef} style=${styles.gameStage}>
        <${TurnBanner} player=${currentPlayer} index=${currentIdx} />
        <p style=${styles.gameMeta}>${statusLine}</p>
        <p style=${styles.privacyNote}>다른 분들은 화면을 보지 않도록 해주세요! 👋</p>
        <${BigButton} onClick=${handleReady}>준비됐어요<//>
      </div>
    `;
  }

  // ── 숫자 입력 ──────────────────────────────────────────────
  if (phase === "input" && currentPlayer) {
    const g = parseInt(guess, 10);
    const valid = !isNaN(g) && g >= lo && g <= hi;
    return html`
      <div ref=${stageRef} style=${styles.gameStage}>
        <${TurnBanner} player=${currentPlayer} index=${currentIdx} />
        <p style=${styles.gameMeta}>${statusLine}</p>
        <div style=${styles.updownRange}>${lo === hi ? lo : `${lo} ~ ${hi}`}</div>
        <p style=${styles.updownRangeHint}>${currentPlayer.name}님이 지금까지 좁힌 범위예요</p>
        <input
          className="settle-name-input"
          style=${{ ...styles.nameInputFull, ...styles.updownInput }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder=${lo === hi ? `${lo}` : `${lo}~${hi}`}
          value=${guess}
          onInput=${(e) => setGuess(e.target.value)}
          autoFocus
        />
        <p style=${{ ...styles.hint, marginBottom: 0 }}>${lo}~${hi} 사이 숫자</p>
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
      <div ref=${stageRef} style=${styles.gameStageCenter}>
        <div style=${styles.feedbackEmoji} aria-hidden="true">${isEscaped ? "🎉" : isLow ? "⬆️" : "⬇️"}</div>
        <p style=${{ ...styles.feedbackTitle, ...(isEscaped ? { color: C_GREEN } : null) }}>
          ${isEscaped
            ? `${currentPlayer.name}님 ${tries[currentIdx]}번 만에 탈출!`
            : isLow ? "더 높아요!" : "더 낮아요!"}
        </p>
        ${isEscaped
          ? html`<p style=${styles.gameMeta}>탈출: ${escapedNames.join(", ")}</p>`
          : html`<p style=${styles.feedbackRange}>내 새 범위: <span style=${{ color: C_RED }}>${newLo} ~ ${newHi}</span></p>`}
        <${BigButton} onClick=${advance}>다음 차례로<//>
      </div>
    `;
  }

  return null;
}
