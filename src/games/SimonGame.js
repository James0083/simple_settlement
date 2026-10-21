/*
 * 기억력 릴레이 — 색 버튼 4개. 앞사람까지 나온 순서를 그대로 누른 뒤 자기 것을 하나 더하고 폰을 넘긴다.
 * 순서를 틀리게 누른 사람이 당첨 (사이먼 게임). 첫 사람은 아무거나 하나만 누르면 된다.
 * "순서 다시 보여주기"를 켜면 차례마다 지금까지의 순서를 한 번 재생해 준다 (기본은 꺼짐 — 외워야 한다).
 */
import { Fragment, useState, useRef, useEffect } from "react";
import { html } from "../shared/html.js";
import { styles, C_RED } from "../shared/styles.js";
import { ChipGroup } from "../shared/ChipGroup.js";
import { shuffle } from "./random.js";
import { unlockAudio, beep, explosion, fanfare, vibrate } from "./sfx.js";
import { GAME_FINISH_MS, TurnBanner, BigButton, useScrollToStage } from "./common.js";
import { TurnOrderSetup, TurnStrip } from "./TurnOrder.js";

// 버튼마다 고정 음 (도 · 미 · 솔 · 높은 도). 색만으로 구분하기 어려운 사람도 있어 모양을 함께 그린다.
export const PADS = [
  { id: 0, label: "빨강", shape: "●", color: "#E8503A", lit: "#FF8A73", freq: 523 },
  { id: 1, label: "파랑", shape: "▲", color: "#3A6FE8", lit: "#82A6FF", freq: 659 },
  { id: 2, label: "초록", shape: "■", color: "#0F9D64", lit: "#4FD69C", freq: 784 },
  { id: 3, label: "노랑", shape: "★", color: "#F2B233", lit: "#FFE08A", freq: 1047 },
];
const LIGHT_MS = 220; // 누른 버튼이 빛나는 시간
const REPLAY_STEP_MS = 520; // 다시 보여주기 한 칸 간격
const PRESS_LOCK_MS = 120; // 한 번 누른 뒤 잠깐 막기 (두 번 눌림 방지)

/*
 * 한 번 누를 때의 판정. seq: 지금까지의 순서, pos: 이번이 몇 번째 입력(0부터), pad: 누른 버튼.
 * pos < seq.length 면 따라 누르는 중 — 같아야 한다. pos === seq.length 면 내가 하나 더하는 입력.
 * 돌려주는 값: "wrong" | "next"(계속 누름) | "added"(내 것까지 더함 → 차례 끝)
 */
export function simonStep(seq, pos, pad) {
  if (pos < seq.length) return seq[pos] === pad ? "next" : "wrong";
  return "added";
}

export function SimonGame({ players, onFinish }) {
  const [phase, setPhase] = useState("order"); // order | ready | replay | input | passed | wrong | done
  const [order, setOrder] = useState(() => shuffle(players.map((_, i) => i)));
  const [replayOn, setReplayOn] = useState(false);
  const [turnPos, setTurnPos] = useState(0);
  const [seq, setSeq] = useState([]);
  const [pos, setPos] = useState(0); // 이번 차례에 누른 개수
  const [lit, setLit] = useState(null); // 빛나는 버튼
  const [wrongAt, setWrongAt] = useState(null); // { pos, pad }
  const locked = useRef(false);
  const timers = useRef([]);
  const stageRef = useScrollToStage(["ready", "replay", "input", "passed", "wrong"].includes(phase), `${phase}-${turnPos}`);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const playerIdx = order[turnPos % order.length];
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  const light = (pad) => {
    setLit(pad);
    beep(PADS[pad].freq, LIGHT_MS, "sine", 0.06);
    later(() => setLit((cur) => (cur === pad ? null : cur)), LIGHT_MS);
  };

  const startGame = () => {
    unlockAudio();
    setPhase("ready");
  };

  const begin = () => {
    setPos(0);
    if (!replayOn || seq.length === 0) return setPhase("input");
    setPhase("replay");
    seq.forEach((pad, i) => later(() => light(pad), 300 + i * REPLAY_STEP_MS));
    later(() => setPhase("input"), 300 + seq.length * REPLAY_STEP_MS);
  };

  const press = (pad) => {
    if (phase !== "input" || locked.current) return;
    locked.current = true;
    later(() => (locked.current = false), PRESS_LOCK_MS);
    const result = simonStep(seq, pos, pad);
    if (result === "wrong") {
      explosion(0.5);
      vibrate(200);
      setWrongAt({ pos, pad });
      setPhase("wrong");
      return;
    }
    light(pad);
    if (result === "next") return setPos(pos + 1);
    setSeq([...seq, pad]);
    later(() => setPhase("passed"), LIGHT_MS + 80);
  };

  const pass = () => {
    setTurnPos(turnPos + 1);
    setPhase("ready");
  };

  const finish = () => {
    if (phase !== "wrong") return; // 한 번만
    setPhase("done");
    fanfare();
    later(() => onFinish(players[playerIdx].id), GAME_FINISH_MS);
  };

  const dots = (list, mark = null) => html`
    <div style=${styles.simonDots} aria-label=${`순서 ${list.map((p) => PADS[p].label).join(", ")}`}>
      ${list.map(
        (p, i) => html`
          <span
            key=${i}
            style=${{ ...styles.simonDot, background: PADS[p].color, ...(mark === i ? styles.simonDotMark : null) }}
            aria-hidden="true"
          >${PADS[p].shape}</span>
        `
      )}
    </div>
  `;

  if (phase === "order") {
    return html`
      <div>
        <div style=${{ ...styles.orderHead, marginBottom: 8 }}>
          <span style=${styles.sectionLabelInline}>순서 다시 보여주기</span>
        </div>
        <${ChipGroup}
          label="순서 다시 보여주기"
          options=${[
            { id: "off", label: "안 보여줌 (외우기)" },
            { id: "on", label: "보여줌 (쉬움)" },
          ]}
          value=${replayOn ? "on" : "off"}
          onChange=${(id) => setReplayOn(id === "on")}
        />
        <div style=${{ height: 14 }}></div>
        <${TurnOrderSetup}
          players=${players}
          order=${order}
          onChange=${setOrder}
          onStart=${startGame}
          note="앞사람까지의 순서를 그대로 누르고 하나 더 · 틀린 사람이 당첨"
          startLabel="게임 시작"
        />
      </div>
    `;
  }

  const padGrid = html`
    <div style=${styles.simonGrid}>
      ${PADS.map(
        (p) => html`
          <button
            key=${p.id}
            type="button"
            style=${{
              ...styles.simonPad,
              background: lit === p.id ? p.lit : p.color,
              transform: lit === p.id ? "scale(0.96)" : "none",
              opacity: phase === "input" || lit === p.id ? 1 : 0.55,
            }}
            onPointerDown=${() => press(p.id)}
            disabled=${phase !== "input"}
            aria-label=${p.label}
          >
            <span style=${styles.simonShape} aria-hidden="true">${p.shape}</span>
          </button>
        `
      )}
    </div>
  `;

  if (phase === "ready") {
    return html`
      <div ref=${stageRef} style=${styles.gameStage}>
        <${TurnStrip} players=${players} order=${order} current=${turnPos % order.length} />
        <${TurnBanner} player=${players[playerIdx]} index=${playerIdx} />
        <p style=${styles.bsRules}>
          ${seq.length === 0
            ? html`<${Fragment}>첫 차례예요. 아무 버튼이나 <strong>하나</strong> 누르세요<//>`
            : html`<${Fragment}>앞사람까지 <strong>${seq.length}개</strong> — 그대로 누르고 <strong>하나 더</strong><//>`}
        </p>
        <${BigButton} onClick=${begin}>준비됐어요<//>
      </div>
    `;
  }

  if (phase === "replay" || phase === "input") {
    const adding = pos >= seq.length;
    return html`
      <div ref=${stageRef} style=${styles.gameStage}>
        <${TurnBanner} player=${players[playerIdx]} index=${playerIdx} />
        <p style=${styles.gameMeta} aria-live="polite">
          ${phase === "replay"
            ? "순서를 잘 보세요…"
            : adding
              ? html`<${Fragment}><strong>이제 하나 더!</strong> 아무 버튼이나<//>`
              : `${pos + 1} / ${seq.length}번째`}
        </p>
        ${padGrid}
      </div>
    `;
  }

  if (phase === "passed") {
    const nextIdx = order[(turnPos + 1) % order.length];
    return html`
      <div ref=${stageRef} style=${styles.gameStageCenter}>
        <div style=${styles.feedbackEmoji} aria-hidden="true">👍</div>
        <p style=${styles.feedbackTitle}>통과! 이제 ${seq.length}개</p>
        <p style=${styles.gameMeta}>다음 사람에게 폰을 넘겨주세요</p>
        <${BigButton} onClick=${pass}>${players[nextIdx].name}님 차례로<//>
      </div>
    `;
  }

  if ((phase === "wrong" || phase === "done") && wrongAt) {
    return html`
      <div ref=${stageRef} style=${styles.gameStageCenter}>
        <div style=${styles.feedbackEmoji} aria-hidden="true">💥</div>
        <p style=${{ ...styles.feedbackTitle, color: C_RED }}>${players[playerIdx].name}님 틀렸어요!</p>
        <p style=${styles.gameMeta}>
          ${wrongAt.pos + 1}번째는 ${PADS[seq[wrongAt.pos]].label}인데 ${PADS[wrongAt.pad].label}을 눌렀어요
        </p>
        <p style=${{ ...styles.gameCaption, margin: "0 0 8px" }}>정답 순서 (${seq.length}개)</p>
        ${dots(seq, wrongAt.pos)}
        <${BigButton} onClick=${finish} disabled=${phase === "done"}>확인<//>
      </div>
    `;
  }

  return null;
}
