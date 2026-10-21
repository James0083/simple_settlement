/*
 * 복불복 나눠내기 — 몰아주기 대신 총액을 무작위로 나눠 낸다.
 *   1) 총액을 넣는다 (1인 1,000원 이상)
 *   2) 시작할 때 봉투마다 금액을 정해 섞어 둔다 (splitAmounts)
 *   3) 차례대로 봉투 하나를 골라 열면 그 금액이 내 몫 — 열린 봉투에는 이름과 금액이 남아 누가 얼마 걸렸는지 보인다
 *   4) 다 열면 금액표 — 가장 많이 내는 사람을 "당첨"으로 보여준다
 * onFinish(가장 많이 내는 사람 id, { total, amounts: { [id]: 금액 } }) — 정산에 추가하면 금액 따로 입력이 채워진 회차가 된다.
 */
import { Fragment, useState, useRef, useEffect } from "react";
import { html } from "../shared/html.js";
import { styles, C_RED } from "../shared/styles.js";
import { won } from "../shared/util.js";
import { colorOf } from "./palette.js";
import { randomFloat, shuffle } from "./random.js";
import { unlockAudio, beep, chime, fanfare } from "./sfx.js";
import { GAME_FINISH_MS, TurnBanner, BigButton, useScrollToStage } from "./common.js";
import { TurnStrip } from "./TurnOrder.js";

export const MIN_PER_PERSON = 1000; // 총액 하한 = 인원 × 1,000원 (이보다 적으면 0원 봉투가 나올 수 있다)
const UNIT = 100; // 봉투 금액은 100원 단위, 끝전(100원 미만)은 가장 많이 내는 사람에게
const MIN_WEIGHT = 0.3; // 무게 = 0.3 ~ 1.3 → 가장 적은 몫도 가장 많은 몫의 약 1/4 은 된다
const MAX_TOTAL_DIGITS = 9;

/*
 * 총액을 n 개로 무작위로 나눈다. 합은 total 과 정확히 같고, 모두 0원보다 크며,
 * 끝전을 받는 한 명을 빼면 100원 단위다. 가장 큰 금액은 한 명뿐이다(당첨자가 하나로 정해지게).
 * 100원 단위 개수를 무게 비율로 나누고, 내림한 나머지는 소수점이 큰 순으로 하나씩 더 준다(최대 나머지법).
 */
export function splitAmounts(total, n, rand = randomFloat) {
  if (n < 1 || total < n * MIN_PER_PERSON) throw new RangeError("splitAmounts: total too small");
  const units = Math.floor(total / UNIT);
  const rest = total - units * UNIT;
  for (;;) {
    const weights = Array.from({ length: n }, () => MIN_WEIGHT + rand());
    const sum = weights.reduce((s, w) => s + w, 0);
    const exact = weights.map((w) => (units * w) / sum);
    const base = exact.map(Math.floor);
    let left = units - base.reduce((s, b) => s + b, 0);
    const byFraction = exact.map((e, i) => [e - base[i], i]).sort((a, b) => b[0] - a[0]);
    for (const [, i] of byFraction) {
      if (left-- <= 0) break;
      base[i] += 1;
    }
    const amounts = base.map((b) => b * UNIT);
    const max = Math.max(...amounts);
    if (amounts.filter((a) => a === max).length > 1) continue; // 최고 금액이 겹치면 다시
    amounts[amounts.indexOf(max)] += rest;
    return amounts;
  }
}

const toDigits = (raw) => String(raw).replace(/[^0-9]/g, "").replace(/^0+/, "").slice(0, MAX_TOTAL_DIGITS);

export function SplitLuckGame({ players, onFinish }) {
  const [phase, setPhase] = useState("setup"); // setup | pick | reveal | results | done
  const [totalRaw, setTotalRaw] = useState("");
  const [order] = useState(() => shuffle(players.map((_, i) => i)));
  const [envelopes, setEnvelopes] = useState([]); // 봉투별 금액 (시작할 때 정함)
  const [opened, setOpened] = useState({}); // 봉투 번호 → playerIdx
  const [turnPos, setTurnPos] = useState(0);
  const [lastEnv, setLastEnv] = useState(null);
  const finishTimer = useRef(null);
  const stageRef = useScrollToStage(phase === "pick" || phase === "reveal", `${phase}-${turnPos}`);
  useEffect(() => () => clearTimeout(finishTimer.current), []);

  const total = Number(totalRaw) || 0;
  const minTotal = players.length * MIN_PER_PERSON;
  const totalOk = total >= minTotal;
  const playerIdx = order[turnPos];

  const start = () => {
    if (!totalOk) return;
    unlockAudio();
    setEnvelopes(splitAmounts(total, players.length));
    setPhase("pick");
  };

  const open = (env) => {
    if (opened[env] != null) return;
    setOpened({ ...opened, [env]: playerIdx });
    setLastEnv(env);
    chime();
    setPhase("reveal");
  };
  const next = () => {
    beep(660, 40, "sine", 0.03);
    if (turnPos + 1 >= order.length) {
      setPhase("results");
    } else {
      setTurnPos(turnPos + 1);
      setPhase("pick");
    }
  };

  // 금액 많은 순
  const rows = Object.entries(opened)
    .map(([env, pi]) => ({ playerIdx: pi, amount: envelopes[env] }))
    .sort((a, b) => b.amount - a.amount);

  const finish = () => {
    if (phase !== "results") return; // 한 번만
    setPhase("done");
    fanfare();
    const amounts = Object.fromEntries(rows.map((r) => [players[r.playerIdx].id, r.amount]));
    const loserId = players[rows[0].playerIdx].id;
    finishTimer.current = setTimeout(() => onFinish(loserId, { total, amounts }), GAME_FINISH_MS);
  };

  // ── 총액 넣기 ──────────────────────────────────────────────
  if (phase === "setup") {
    return html`
      <div style=${styles.gameStage}>
        <p style=${styles.bsRules}>
          총액을 넣으면 봉투 ${players.length}개에 금액이 무작위로 나뉘어 들어가요.<br />
          차례대로 봉투를 하나씩 열어 <strong>나온 금액만큼</strong> 내요.
        </p>
        <label style=${styles.sectionLabelInline} htmlFor="splitluck-total">총액</label>
        <div style=${{ ...styles.amountWrap, flex: "none", margin: "6px 0 4px" }}>
          <input
            id="splitluck-total"
            className="settle-amount-input"
            style=${{ ...styles.amountInput, fontSize: 22 }}
            type="text"
            inputMode="numeric"
            placeholder="0"
            value=${total ? total.toLocaleString("ko-KR") : ""}
            onChange=${(e) => setTotalRaw(toDigits(e.target.value))}
          />
          <span style=${styles.wonSuffix}>원</span>
        </div>
        <p style=${{ ...styles.hint, textAlign: "left", marginTop: 4, ...(total && !totalOk ? { color: C_RED } : null) }}>
          ${players.length}명이면 ${won(minTotal)}원 이상 넣어주세요
        </p>
        <${BigButton} onClick=${start} disabled=${!totalOk}>봉투 나누기<//>
      </div>
    `;
  }

  // ── 봉투 고르기 ────────────────────────────────────────────
  if (phase === "pick") {
    return html`
      <div ref=${stageRef} style=${styles.gameStage}>
        <${TurnStrip} players=${players} order=${order} current=${turnPos} />
        <${TurnBanner} player=${players[playerIdx]} index=${playerIdx} />
        <p style=${styles.gameMeta}>총 ${won(total)}원 · 봉투를 하나 골라 열어요</p>
        <div style=${styles.envGrid}>
          ${envelopes.map((_, env) => {
            const owner = opened[env];
            const taken = owner != null;
            const [bg, fg] = taken ? colorOf(owner) : [];
            return html`
              <button
                key=${env}
                type="button"
                style=${{ ...styles.envBtn, ...(taken ? { ...styles.envBtnOpened, background: bg, color: fg } : null) }}
                onClick=${() => open(env)}
                disabled=${taken}
                aria-label=${taken ? `${players[owner].name}님이 연 봉투 ${won(envelopes[env])}원` : `봉투 ${env + 1}`}
              >
                ${taken
                  ? html`
                      <${Fragment}>
                        <span style=${styles.envName}>${players[owner].name}</span>
                        <span style=${styles.envAmount}>${won(envelopes[env])}원</span>
                      <//>
                    `
                  : "🧧"}
              </button>
            `;
          })}
        </div>
      </div>
    `;
  }

  // ── 봉투 열기 ──────────────────────────────────────────────
  if (phase === "reveal" && lastEnv != null) {
    const lastTurn = turnPos + 1 >= order.length;
    return html`
      <div ref=${stageRef} style=${styles.gameStageCenter}>
        <${TurnBanner} player=${players[playerIdx]} index=${playerIdx} />
        <div style=${styles.tensecPeek}>
          <p style=${{ ...styles.gameMeta, margin: "0 0 4px" }}>내가 낼 금액</p>
          <p style=${styles.tensecPeekTime}>${won(envelopes[lastEnv])}원</p>
        </div>
        <${BigButton} onClick=${next}>${lastTurn ? "결과 보기" : `${players[order[turnPos + 1]].name}님 차례로`}<//>
      </div>
    `;
  }

  // ── 결과 ───────────────────────────────────────────────────
  if (phase === "results" || phase === "done") {
    return html`
      <div ref=${stageRef} style=${styles.gameStage}>
        <p style=${styles.gameCaption}>결과 · 총 ${won(total)}원</p>
        <div style=${styles.rankList}>
          ${rows.map((r, rank) => {
            const [bg, fg] = colorOf(r.playerIdx);
            const top = rank === 0;
            return html`
              <div key=${r.playerIdx} style=${{ ...styles.rankRow, ...(top ? styles.rankRowHit : null) }}>
                <span style=${{ ...styles.rankNo, background: bg, color: fg }}>${rank + 1}</span>
                <span style=${styles.rankName}>${players[r.playerIdx].name}${top ? " 💸" : ""}</span>
                <span style=${{ ...styles.rankValue, ...(top ? { color: C_RED } : null) }}>${won(r.amount)}원</span>
              </div>
            `;
          })}
        </div>
        <p style=${{ ...styles.hint, marginBottom: 4 }}>
          <strong>${players[rows[0].playerIdx].name}</strong>님이 제일 많이 내요!
        </p>
        <${BigButton} onClick=${finish} disabled=${phase === "done"}>확인<//>
      </div>
    `;
  }

  return null;
}
