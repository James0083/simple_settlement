/*
 * 미니게임 탭.
 *   #/games          참가자 고르기 + 게임 고르기
 *   #/games/<게임id>  플레이 → 결과 → (정산에 추가 · 한 판 더 · 다른 게임)
 * 참가자는 정산 명단(s.validParticipants)을 그대로 쓰고, 이 탭에서 뺄 사람만 따로 기억한다.
 * 결과의 당첨자 id 가 정산 참가자 id 와 같으므로 그대로 회차로 넘길 수 있다.
 */
import { useState, useEffect } from "react";
import { html } from "../shared/html.js";
import { styles, C_RED, C_MUTED } from "../shared/styles.js";
import { navigate, routeHref } from "../shared/router.js";
import { canPlay } from "../shared/entitlements.js";
import { josa } from "./josa.js";
import { isSoundOn, setSoundOn, onSoundChange } from "./sfx.js";
import { ReceiptCard, ScreenHeader } from "../shared/ReceiptCard.js";
import { DiceIcon } from "../shared/icons.js";
import { ChipGroup } from "../shared/ChipGroup.js";
import { GAMES, MIN_PLAYERS, MAX_PLAYERS } from "./registry.js";
import { GameResult } from "./GameResult.js";
import { AdSlot } from "../shared/AdSlot.js";

function useSoundOn() {
  const [on, setOn] = useState(isSoundOn);
  useEffect(() => onSoundChange(setOn), []);
  return on;
}

function SoundToggle() {
  const on = useSoundOn();
  const toggle = () => setSoundOn(!on);
  return html`
    <button type="button" style=${styles.soundBtn} onClick=${toggle} aria-pressed=${on}>
      ${on ? "🔊 소리 켬" : "🔇 소리 끔"}
    </button>
  `;
}

// 소리가 꺼져 있으면 효과음·배경음을 못 들으므로 눈에 띄게 한 번 권한다 (켜면 사라진다)
function SoundHint() {
  const on = useSoundOn();
  if (on) return null;
  return html`
    <button type="button" className="settle-add-btn" style=${styles.soundHint} onClick=${() => setSoundOn(true)}>
      🔊 소리 켜고 하면 더 재밌어요 · 켜기
    </button>
  `;
}

function GamePlay({ game, players, s }) {
  const [round, setRound] = useState(0); // 바뀌면 게임을 새로 마운트(한 판 더)
  const [loserIds, setLoserIds] = useState(null); // 당첨자 id 목록 (사다리는 여러 명일 수 있다)
  const Game = game.component;
  const losers = loserIds ? loserIds.map((id) => players.find((p) => p.id === id)).filter(Boolean) : [];
  // 게임은 당첨자 id 하나 또는 id 배열로 끝을 알린다
  const finish = (result) => setLoserIds([].concat(result));

  const again = () => {
    setLoserIds(null);
    setRound(round + 1);
    window.scrollTo(0, 0);
  };

  // 당첨자가 한 명일 때만: 게임 참가자 전원이 참여자, 당첨자가 결제자
  const addToSettle = () => {
    s.addRoundFrom({
      title: `${s.nextRoundNo}차 ${game.name} 게임`,
      payerId: losers[0].id,
      participantIds: players.map((p) => p.id),
    });
    navigate("settle");
  };

  return html`
    <${ReceiptCard}>
      <div style=${styles.gameTopRow}>
        <a href=${routeHref("games")} style=${styles.backLink}>← 게임 목록</a>
        <${SoundToggle} />
      </div>
      <header style=${styles.gameHeader}>
        <div style=${styles.gameHeaderEmoji} aria-hidden="true">${game.emoji}</div>
        <h1 style=${styles.gameTitle}>${game.name}</h1>
        <p style=${styles.subtitle}>${game.desc}</p>
      </header>
      <${SoundHint} />
      <${AdSlot} placement="game-start" />

      <${Game} key=${`game-${round}`} players=${players} onFinish=${finish} />

      ${losers.length > 0 &&
      html`
        <${GameResult}
          key=${`result-${round}`}
          game=${game}
          losers=${losers}
          players=${players}
          onAgain=${again}
          onAddToSettle=${losers.length === 1 ? addToSettle : null}
        />
      `}
    <//>
  `;
}

export function GamesScreen({ s, sub }) {
  const [excluded, setExcluded] = useState([]); // 이번 게임에서 뺀 참가자 id
  const [newName, setNewName] = useState("");
  const [notice, setNotice] = useState("");

  const roster = s.validParticipants;
  const players = roster
    .filter((p) => !excluded.includes(p.id))
    .map((p) => ({ id: p.id, name: p.name.trim() }));
  const countOk = players.length >= MIN_PLAYERS && players.length <= MAX_PLAYERS;

  const game = GAMES.find((g) => g.id === sub);
  if (game && canPlay(game) && game.component && countOk) {
    // 게임마다 key 를 달리해, 다른 게임으로 옮겨가면 이전 결과·판 수가 남지 않게 한다.
    return html`<${GamePlay} key=${game.id} game=${game} players=${players} s=${s} />`;
  }

  const addPlayer = (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    s.addParticipant(name);
    setNewName("");
  };

  const openGame = (g) => {
    if (!canPlay(g) || !g.component) {
      setNotice(`${g.name}${josa(g.name, "은/는")} 곧 열려요!`);
      return;
    }
    if (!countOk) {
      setNotice(players.length < MIN_PLAYERS ? "참가자를 2명 이상 골라주세요" : `최대 ${MAX_PLAYERS}명까지 할 수 있어요`);
      return;
    }
    setNotice("");
    navigate("games", g.id);
  };

  return html`
    <${ReceiptCard}>
      <${ScreenHeader}
        Icon=${DiceIcon}
        title="미니게임"
        subtitle="간단한 게임으로 오늘 낼 사람을 정해요. 폰 한 대로 돌려가며 해요"
      />

      <section>
        <div style=${styles.foodLabelRow}>
          <span style=${styles.sectionLabelInline}>참가자</span>
          <span style=${styles.foodHint}>누르면 이번 게임에서 빠져요</span>
        </div>
        ${roster.length > 0
          ? html`
              <${ChipGroup}
                label="참가자"
                multi
                options=${roster.map((p) => ({ id: p.id, label: p.name.trim() }))}
                value=${roster.filter((p) => !excluded.includes(p.id)).map((p) => p.id)}
                onChange=${(ids) => setExcluded(roster.filter((p) => !ids.includes(p.id)).map((p) => p.id))}
              />
            `
          : html`<p style=${styles.chipEmptyHint}>아직 참가자가 없어요. 아래에서 추가하세요.</p>`}
        <form style=${styles.addPlayerRow} onSubmit=${addPlayer}>
          <input
            className="settle-name-input"
            style=${styles.nameInputFull}
            type="text"
            placeholder="이름 추가"
            maxLength="12"
            value=${newName}
            onChange=${(e) => setNewName(e.target.value)}
          />
          <button type="submit" className="settle-download-btn" style=${styles.addPlayerBtn}>추가</button>
        </form>
        <p style=${{ ...styles.hint, textAlign: "left", color: countOk ? C_MUTED : C_RED }}>
          ${players.length}명 참가 · ${MIN_PLAYERS}~${MAX_PLAYERS}명까지 할 수 있어요. 여기서 추가한 이름은 정산 명단에도 들어가요.
        </p>
      </section>

      <div style=${styles.dashedDivider} aria-hidden="true"></div>

      <${AdSlot} placement="games-mid" />

      <div style=${styles.sectionLabel}>게임</div>
      <div style=${styles.gameGrid}>
        ${GAMES.map((g) => {
          const open = canPlay(g) && !!g.component;
          return html`
            <button
              key=${g.id}
              type="button"
              className=${open ? "game-card" : "game-card game-card-locked"}
              style=${{ ...styles.gameCard, ...(open ? null : styles.gameCardLocked) }}
              onClick=${() => openGame(g)}
            >
              <span style=${styles.gameCardEmoji} aria-hidden="true">${g.emoji}</span>
              <span style=${styles.gameCardName}>${g.name}</span>
              <span style=${styles.gameCardDesc}>${open ? g.desc : "🔒 곧 출시"}</span>
            </button>
          `;
        })}
      </div>
      ${notice && html`<p style=${styles.gameNotice} role="status">${notice}</p>`}
      <${AdSlot} placement="games-list" />
    <//>
  `;
}
