/*
 * 라이어 게임 — 3~10명(registry 의 minPlayers · maxPlayers). 말로 하는 파티 게임.
 *   1) 카테고리를 고른다. 시작할 때 제시어 하나와 라이어 한 명을 정한다
 *   2) 폰을 돌려 가며 한 명씩 제시어를 확인한다 — 라이어만 "당신은 라이어"를 본다(숫자 맞추기와 같은 가림막)
 *   3) 앱이 정한 사람부터 한 마디씩 제시어를 설명한다 (앱은 순서만 보여준다)
 *   4) 하나 둘 셋에 동시에 가리키고, 가장 많이 지목된 사람을 고른다
 * 지목된 사람이 당첨 — 라이어면 "잡혔다", 아니면 "엉뚱한 사람으로 몰렸다". 어느 쪽이든 지목된 사람이 낸다.
 * (원작의 "잡힌 라이어가 제시어를 맞히면 역전"은 누가 낼지 애매해져 넣지 않는다.)
 * 첫 설명자는 라이어가 아닌 사람 중에서 뽑는다 — 아무것도 듣지 못한 라이어가 먼저 말하면 거의 바로 들킨다.
 * 마지막에 고른 카테고리와 최근 제시어는 기기에 기억해, 한 판 더 할 때 같은 카테고리로 시작하고 같은 제시어가 연달아 나오지 않게 한다.
 */
import { Fragment, useState, useRef, useEffect } from "react";
import { html } from "../shared/html.js";
import { styles, C_RED, C_GREEN } from "../shared/styles.js";
import { ChipGroup } from "../shared/ChipGroup.js";
import { load, save } from "../shared/storage.js";
import { colorOf } from "./palette.js";
import { randInt, shuffle } from "./random.js";
import { unlockAudio, beep, chime, explosion, fanfare, vibrate } from "./sfx.js";
import { GAME_FINISH_MS, TurnBanner, BigButton, useScrollToStage } from "./common.js";
import { LIAR_CATEGORIES } from "./liarWords.js";

const ANY = "any";
const RECENT_MAX = 30; // 이만큼 최근에 나온 제시어는 다시 뽑지 않는다
const pick = (list) => list[randInt(list.length)];

// 최근에 나오지 않은 제시어 하나 — 카테고리를 다 썼으면 전체에서 뽑는다
export function pickWord(words, recent) {
  const fresh = words.filter((w) => !recent.includes(w));
  return pick(fresh.length > 0 ? fresh : words);
}

export function LiarGame({ players, onFinish }) {
  const [phase, setPhase] = useState("setup"); // setup | gate | peek | talk | vote | reveal | done
  const [categoryId, setCategoryId] = useState(() => {
    const saved = load("liarCategory", ANY);
    return saved === ANY || LIAR_CATEGORIES.some((c) => c.id === saved) ? saved : ANY;
  });
  const [secret, setSecret] = useState(null); // { category, word, liar(playerIdx), first(playerIdx) }
  const [order] = useState(() => shuffle(players.map((_, i) => i))); // 제시어 확인 순서
  const [peekPos, setPeekPos] = useState(0);
  const [chosen, setChosen] = useState(null); // 지목된 playerIdx
  const finishTimer = useRef(null);
  const stageRef = useScrollToStage(phase !== "setup" && phase !== "done", `${phase}-${peekPos}`);
  useEffect(() => () => clearTimeout(finishTimer.current), []);

  const start = () => {
    unlockAudio();
    const category = categoryId === ANY ? pick(LIAR_CATEGORIES) : LIAR_CATEGORIES.find((c) => c.id === categoryId);
    const recent = load("liarRecent", []);
    const word = pickWord(category.words, Array.isArray(recent) ? recent : []);
    const liar = randInt(players.length);
    const first = pick(players.map((_, i) => i).filter((i) => i !== liar));
    save("liarCategory", categoryId);
    save("liarRecent", [word, ...(Array.isArray(recent) ? recent : [])].slice(0, RECENT_MAX));
    setSecret({ category, word, liar, first });
    setPhase("gate");
  };

  const seen = () => {
    beep(520, 40, "sine", 0.03);
    if (peekPos + 1 >= order.length) {
      setPhase("talk");
    } else {
      setPeekPos(peekPos + 1);
      setPhase("gate");
    }
  };

  const decide = () => {
    if (chosen == null) return;
    const caught = chosen === secret.liar;
    if (caught) {
      chime();
    } else {
      explosion(0.4);
      vibrate(150);
    }
    setPhase("reveal");
  };

  const finish = () => {
    if (phase !== "reveal") return; // 한 번만
    setPhase("done");
    fanfare();
    finishTimer.current = setTimeout(() => onFinish(players[chosen].id), GAME_FINISH_MS);
  };

  // ── 카테고리 고르기 ────────────────────────────────────────
  if (phase === "setup") {
    return html`
      <div style=${styles.gameStage}>
        <p style=${styles.bsRules}>
          라이어 한 명만 제시어를 몰라요.<br />
          한 마디씩 제시어를 설명하고, 라이어를 찾아 지목해요.<br />
          <strong>가장 많이 지목된 사람이 당첨</strong> — 엉뚱한 사람을 지목해도요!
        </p>
        <div style=${{ ...styles.sectionLabelInline, marginBottom: 8 }}>카테고리</div>
        <${ChipGroup}
          label="카테고리"
          options=${[{ id: ANY, label: "아무거나" }, ...LIAR_CATEGORIES.map((c) => ({ id: c.id, label: c.label }))]}
          value=${categoryId}
          onChange=${setCategoryId}
        />
        <${BigButton} onClick=${start}>제시어 정하기<//>
      </div>
    `;
  }

  const peekIdx = order[peekPos];

  // ── 가림막 — 한 명씩 제시어 확인 ───────────────────────────
  if (phase === "gate") {
    return html`
      <div ref=${stageRef} style=${styles.gameStage}>
        <${TurnBanner} label="제시어 확인" player=${players[peekIdx]} index=${peekIdx} />
        <p style=${styles.gameMeta}>${peekPos + 1} / ${order.length}명 · 카테고리 ${secret.category.label}</p>
        <p style=${styles.privacyNote}>
          다른 분들은 화면을 보지 않도록 해주세요! 👋
          <br /><span style=${styles.privacyNoteSub}>${players[peekIdx].name}님만 보고 확인을 눌러요</span>
        </p>
        <${BigButton} onClick=${() => setPhase("peek")}>제시어 보기<//>
      </div>
    `;
  }

  if (phase === "peek") {
    const isLiar = peekIdx === secret.liar;
    const last = peekPos + 1 >= order.length;
    return html`
      <div ref=${stageRef} style=${styles.gameStageCenter}>
        <${TurnBanner} label="제시어 확인" player=${players[peekIdx]} index=${peekIdx} />
        <div style=${styles.liarCard}>
          ${isLiar
            ? html`
                <${Fragment}>
                  <p style=${styles.liarCardLabel}>🤥</p>
                  <p style=${{ ...styles.liarWord, color: C_RED }}>당신은 라이어예요</p>
                  <p style=${styles.liarCardSub}>카테고리는 ${secret.category.label} · 들키지 않게 아는 척하세요</p>
                <//>
              `
            : html`
                <${Fragment}>
                  <p style=${styles.liarCardLabel}>${secret.category.label}</p>
                  <p style=${styles.liarWord}>${secret.word}</p>
                  <p style=${styles.liarCardSub}>라이어가 눈치채지 못하게 설명하세요</p>
                <//>
              `}
        </div>
        <${BigButton} onClick=${seen}>
          ${last ? "확인했어요 · 설명 시작" : `확인했어요 · ${players[order[peekPos + 1]].name}님께 넘기기`}
        <//>
      </div>
    `;
  }

  // ── 설명 ───────────────────────────────────────────────────
  if (phase === "talk") {
    const first = players[secret.first];
    return html`
      <div ref=${stageRef} style=${styles.gameStageCenter}>
        <p style=${styles.gameCaption}>카테고리 · ${secret.category.label}</p>
        <div style=${styles.turnBanner}>
          <span style=${styles.turnLabel}>설명 시작</span>
          <span style=${{ ...styles.turnName, background: colorOf(secret.first)[0], color: colorOf(secret.first)[1] }}>${first.name}</span>
        </div>
        <p style=${styles.bsRules}>
          ${first.name}님부터 돌아가며 제시어를 <strong>한 마디씩</strong> 설명해요.<br />
          너무 자세하면 라이어가 알아채고, 너무 애매하면 의심받아요.<br />
          한두 바퀴 돌면 하나 둘 셋에 라이어를 동시에 가리켜요.
        </p>
        <${BigButton} onClick=${() => setPhase("vote")}>지목하러 가기<//>
      </div>
    `;
  }

  // ── 지목 ───────────────────────────────────────────────────
  if (phase === "vote") {
    return html`
      <div ref=${stageRef} style=${styles.gameStage}>
        <p style=${styles.bsRules}>
          가장 많이 지목된 사람을 고르세요.<br />
          <span style=${styles.privacyNoteSub}>동점이면 동점자끼리 한 마디씩 더 하고 다시 가리켜요</span>
        </p>
        <div style=${styles.liarVoteGrid} role="radiogroup" aria-label="지목된 사람">
          ${players.map((p, i) => {
            const on = chosen === i;
            const [bg, fg] = colorOf(i);
            return html`
              <button
                key=${p.id}
                type="button"
                role="radio"
                aria-checked=${on}
                style=${{ ...styles.liarVoteBtn, ...(on ? { background: bg, color: fg, borderColor: bg } : null) }}
                onClick=${() => setChosen(i)}
              >
                ${p.name}
              </button>
            `;
          })}
        </div>
        <${BigButton} onClick=${decide} disabled=${chosen == null}>
          ${chosen == null ? "지목된 사람을 골라요" : `${players[chosen].name}님으로 결정`}
        <//>
      </div>
    `;
  }

  // ── 공개 ───────────────────────────────────────────────────
  if (phase === "reveal" || phase === "done") {
    const caught = chosen === secret.liar;
    const liar = players[secret.liar];
    return html`
      <div ref=${stageRef} style=${styles.gameStageCenter}>
        <div style=${styles.feedbackEmoji} aria-hidden="true">${caught ? "🎯" : "🤥"}</div>
        <p style=${{ ...styles.feedbackTitle, color: caught ? C_GREEN : C_RED }}>
          ${caught ? `라이어를 잡았어요!` : `${players[chosen].name}님은 라이어가 아니었어요!`}
        </p>
        <div style=${styles.liarCard}>
          <p style=${styles.liarCardSub}>라이어</p>
          <p style=${{ ...styles.liarWord, fontSize: 24 }}>${liar.name}</p>
          <p style=${{ ...styles.liarCardSub, marginTop: 10 }}>제시어 (${secret.category.label})</p>
          <p style=${{ ...styles.liarWord, fontSize: 24 }}>${secret.word}</p>
        </div>
        <p style=${{ ...styles.hint, marginBottom: 4 }}>
          ${caught ? "잡힌 라이어" : "엉뚱하게 몰린"} <strong>${players[chosen].name}</strong>님이 당첨!
        </p>
        <${BigButton} onClick=${finish} disabled=${phase === "done"}>확인<//>
      </div>
    `;
  }

  return null;
}
