/*
 * 미니게임 탭.
 *   #/games          참가자 고르기 + 게임 고르기
 *   #/games/<게임id>  플레이 → 결과 → (정산에 추가 · 한 판 더 · 다른 게임)
 * 참가자는 정산 명단(s.validParticipants)을 그대로 쓰고, 이 탭에서 뺄 사람만 따로 기억한다.
 * 게임 카드의 ★ 로 자주 하는 게임을 목록 맨 앞에 고정한다(기기에 "gameFavorites" 로 저장). 순서는 gamesInListOrder.
 * 결과의 당첨자 id 가 정산 참가자 id 와 같으므로 그대로 회차로 넘길 수 있다.
 */
import { useState, useEffect } from "react";
import { html } from "../shared/html.js";
import { styles, C_RED, C_MUTED } from "../shared/styles.js";
import { navigate, routeHref } from "../shared/router.js";
import { canPlay, releaseLabel, isNewGame } from "../shared/entitlements.js";
import { load, save } from "../shared/storage.js";
import { josa } from "./josa.js";
import { isSoundOn, setSoundOn, onSoundChange } from "./sfx.js";
import { ReceiptCard, ScreenHeader } from "../shared/ReceiptCard.js";
import { DiceIcon } from "../shared/icons.js";
import { ChipGroup } from "../shared/ChipGroup.js";
import { GAMES, MAX_PLAYERS, playersOkFor, playerRangeOf, gamesInListOrder } from "./registry.js";
import { GameResult } from "./GameResult.js";
import { AdSlot } from "../shared/AdSlot.js";
import { REC } from "../shared/rec.js";
import { IS_AIT, trackEvent } from "#platform";

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

// 소리가 꺼져 있으면 효과음·배경음을 못 들으므로 눈에 띄게 한 번 권한다 (켜면 사라진다). 녹화 모드(rec.js)에서는 숨긴다.
function SoundHint() {
  const on = useSoundOn();
  if (on || (import.meta.env?.DEV && REC)) return null;
  return html`
    <button type="button" className="settle-add-btn" style=${styles.soundHint} onClick=${() => setSoundOn(true)}>
      🔊 소리 켜고 하면 더 재밌어요 · 켜기
    </button>
  `;
}

// 동점 — 동점자끼리 같은 게임을 다시 하거나, 동점자만 골라 둔 채 게임 목록으로 간다
function TieResult({ tied, onRematch, onPickGame }) {
  const names = tied.map((p) => p.name);
  return html`
    <div>
      <div style=${styles.dashedDivider} aria-hidden="true"></div>
      <div style=${styles.loserBlock}>
        <div style=${styles.loserEmoji} aria-hidden="true">🤝</div>
        <div style=${{ ...styles.loserName, ...styles.loserNameMany }}>${names.join(" · ")}</div>
        <div style=${styles.loserText}>동점이에요! ${tied.length}명이 한 번 더 겨뤄요</div>
      </div>
      <div style=${styles.actionRow}>
        <button className="settle-copy-btn" style=${styles.copyBtn} onClick=${onRematch}>동점자끼리 다시 하기</button>
      </div>
      <div style=${styles.actionRow}>
        <button className="settle-add-btn" style=${styles.rerollBtn} onClick=${onPickGame}>동점자끼리 다른 게임</button>
      </div>
    </div>
  `;
}

function GamePlay({ game, players, s, onPickTied }) {
  const [round, setRound] = useState(0); // 바뀌면 게임을 새로 마운트(한 판 더)
  const [loserIds, setLoserIds] = useState(null); // 당첨자 id 목록 (사다리는 여러 명일 수 있다)
  const [tieIds, setTieIds] = useState(null); // 동점자 id 목록 (onTie 를 부르는 게임만)
  const [split, setSplit] = useState(null); // { total, amounts } — 각자 낼 금액을 정하는 게임만
  const [roundPlayers, setRoundPlayers] = useState(null); // 동점자 재대결이면 그 인원만
  const Game = game.component;
  const playing = roundPlayers ?? players;
  const byId = (id) => players.find((p) => p.id === id);
  const losers = loserIds ? loserIds.map(byId).filter(Boolean) : [];
  const tied = tieIds ? tieIds.map(byId).filter(Boolean) : [];
  // 게임은 당첨자 id 하나 또는 id 배열로 끝을 알린다. 각자 금액을 정한 게임은 extra.amounts 도 넘긴다.
  const finish = (result, extra) => {
    trackEvent("game_finish", { game: game.id, players: playing.length });
    setSplit(extra?.amounts ? { total: extra.total, amounts: extra.amounts } : null);
    setLoserIds([].concat(result));
  };

  const restart = (nextPlayers) => {
    setLoserIds(null);
    setTieIds(null);
    setSplit(null);
    setRoundPlayers(nextPlayers);
    setRound(round + 1);
    window.scrollTo(0, 0);
  };
  const again = () => restart(null); // 한 판 더는 처음 인원 전체로
  const rematch = () => restart(tied);

  // 당첨자가 한 명일 때만: 게임 참가자 전원이 참여자, 당첨자가 결제자.
  // 각자 금액을 정한 게임이면 총액과 금액 따로 입력을 채우고, 결제자는 정산 탭에서 고르게 비워 둔다.
  const addToSettle = () => {
    trackEvent("game_to_settle", { game: game.id });
    const title = `${s.nextRoundNo}차 ${game.name}`;
    if (split) {
      s.addRoundFrom({
        title,
        amount: split.total,
        participantIds: playing.map((p) => p.id),
        customAmounts: Object.fromEntries(Object.entries(split.amounts).map(([id, a]) => [id, String(a)])),
      });
    } else {
      s.addRoundFrom({ title: `${title} 게임`, payerId: losers[0].id, participantIds: players.map((p) => p.id) });
    }
    navigate("settle");
  };

  // 앱인토스는 내비게이션 바에 뒤로가기가 있어 "← 게임 목록" 을 빼고 소리 버튼만 오른쪽에 둔다
  // (게임 화면은 #/games/<id> 라 그 뒤로가기가 게임 목록으로 돌아간다)
  return html`
    <${ReceiptCard}>
      <div style=${styles.gameTopRow}>
        ${IS_AIT
          ? html`<span aria-hidden="true"></span>`
          : html`<a href=${routeHref("games")} style=${styles.backLink}>← 게임 목록</a>`}
        <${SoundToggle} />
      </div>
      <header style=${styles.gameHeader}>
        <div style=${styles.gameHeaderEmoji} aria-hidden="true">
          ${game.icon ? html`<${game.icon} size=${44} />` : game.emoji}
        </div>
        <h1 style=${styles.gameTitle}>${game.name}</h1>
        <p style=${styles.subtitle}>${game.desc}</p>
      </header>
      <${SoundHint} />
      <${AdSlot} placement="game-start" />

      ${roundPlayers && html`
        <p style=${{ ...styles.hint, marginTop: 0 }}>동점자 재대결 · ${roundPlayers.map((p) => p.name).join(", ")}</p>
      `}
      <${Game} key=${`game-${round}`} players=${playing} onFinish=${finish} onTie=${setTieIds} />

      ${tied.length > 1 &&
      html`<${TieResult} key=${`tie-${round}`} tied=${tied} onRematch=${rematch} onPickGame=${() => onPickTied(tieIds)} />`}

      ${losers.length > 0 &&
      html`
        <${GameResult}
          key=${`result-${round}`}
          game=${game}
          losers=${losers}
          players=${players}
          split=${split}
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
  const [favorites, setFavorites] = useState(() => {
    const saved = load("gameFavorites", []);
    return Array.isArray(saved) ? saved.filter((id) => typeof id === "string") : [];
  });
  const updateFavorites = (next) => {
    setFavorites(next);
    save("gameFavorites", next);
  };
  // 누른 순서대로 맨 앞에 쌓인다. 다시 누르면 빠진다.
  const toggleFavorite = (id) =>
    updateFavorites(favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id]);

  const roster = s.validParticipants;
  const players = roster
    .filter((p) => !excluded.includes(p.id))
    .map((p) => ({ id: p.id, name: p.name.trim() }));

  // 동점자만 참가자로 남기고 게임 목록으로 — 다른 게임으로 결판
  const pickTied = (ids) => {
    setExcluded(roster.filter((p) => !ids.includes(p.id)).map((p) => p.id));
    setNotice(`동점자 ${ids.length}명만 골라 뒀어요. 결판낼 게임을 고르세요`);
    navigate("games");
    window.scrollTo(0, 0);
  };

  const game = GAMES.find((g) => g.id === sub);
  if (game && canPlay(game) && playersOkFor(game, players.length)) {
    // 게임마다 key 를 달리해, 다른 게임으로 옮겨가면 이전 결과·판 수가 남지 않게 한다.
    return html`<${GamePlay} key=${game.id} game=${game} players=${players} s=${s} onPickTied=${pickTied} />`;
  }

  const addPlayer = (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    s.addParticipant(name);
    setNewName("");
  };

  const openGame = (g) => {
    if (!canPlay(g)) {
      setNotice(`${g.name}${josa(g.name, "은/는")} ${g.releaseAt ? releaseLabel(g) + "돼요!" : "곧 열려요!"}`);
      return;
    }
    if (!playersOkFor(g, players.length)) {
      const [min, max] = playerRangeOf(g);
      const own = g.exactPlayers || g.minPlayers || g.maxPlayers; // 이 게임만의 인원 제한이면 게임 이름을 붙인다
      const subject = `${g.name}${josa(g.name, "은/는")}`;
      setNotice(
        g.exactPlayers
          ? `${subject} 정확히 ${g.exactPlayers}명이 필요해요 (지금 ${players.length}명)`
          : players.length < min
            ? own ? `${subject} ${min}명 이상 필요해요 (지금 ${players.length}명)` : `참가자를 ${min}명 이상 골라주세요`
            : own ? `${subject} 최대 ${max}명까지 할 수 있어요 (지금 ${players.length}명)` : `최대 ${max}명까지 할 수 있어요`
      );
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
        ${players.length >= MAX_PLAYERS && html`
          <p style=${{
            fontSize: 12.5, fontWeight: 700, color: C_RED,
            margin: "6px 0 4px", textAlign: "left",
            padding: "7px 11px",
            background: "#FDF0EC",
            borderRadius: 6,
            border: "1px solid #F4C4B7",
          }}>
            최대 ${MAX_PLAYERS}명까지 참가할 수 있어요 (현재 ${players.length}명)
          </p>
        `}
        <p style=${{ ...styles.hint, textAlign: "left", color: C_MUTED }}>
          ${players.length}명 참가 · 여기서 추가한 이름은 정산 명단에도 들어가요.
        </p>
      </section>

      <div style=${styles.dashedDivider} aria-hidden="true"></div>

      <${AdSlot} placement="games-mid" />

      <div style=${styles.gameListHead}>
        <span style=${styles.sectionLabelInline}>게임</span>
        <span style=${styles.gameListHint}>☆ 를 누르면 맨 앞에 고정돼요</span>
        ${favorites.length > 0 &&
        html`
          <button type="button" className="settle-add-btn" style=${styles.shuffleBtn} onClick=${() => updateFavorites([])}>
            기본 순서로
          </button>
        `}
      </div>
      <div style=${styles.gameGrid}>
        ${gamesInListOrder(undefined, { favorites }).map((g) => {
          const open = canPlay(g);
          const fav = favorites.includes(g.id);
          return html`
            <div key=${g.id} style=${styles.gameCardWrap}>
              <button
                type="button"
                className=${open ? "game-card" : "game-card game-card-locked"}
                style=${{ ...styles.gameCard, ...(open ? null : styles.gameCardLocked) }}
                onClick=${() => openGame(g)}
              >
                <span style=${styles.gameCardEmoji} aria-hidden="true">
                  ${g.icon ? html`<${g.icon} size=${28} />` : g.emoji}
                </span>
                <span style=${styles.gameCardName}>
                  ${g.name}
                  ${open && isNewGame(g) && html`<span style=${styles.gameCardNew}>NEW</span>`}
                </span>
                <span style=${styles.gameCardDesc}>${open ? g.desc : `🔒 ${releaseLabel(g)}`}</span>
              </button>
              ${open &&
              html`
                <button
                  type="button"
                  style=${{ ...styles.favBtn, ...(fav ? styles.favBtnOn : null) }}
                  onClick=${() => toggleFavorite(g.id)}
                  aria-pressed=${fav}
                  aria-label=${`${g.name} 맨 앞에 고정`}
                >
                  ${fav ? "★" : "☆"}
                </button>
              `}
            </div>
          `;
        })}
      </div>
      ${notice && html`<p style=${styles.gameNotice} role="status">${notice}</p>`}
      <${AdSlot} placement="games-list" />
    <//>
  `;
}
