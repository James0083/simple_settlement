/*
 * 터치 대결 — 인원에 따라 두 가지 방식.
 *
 *   2명  땅따먹기: 화면을 위아래로 나눠 한 명씩 맡는다(위쪽은 180° 돌려 마주 보고 한다).
 *        내 영역을 누를 때마다 경계선이 상대 쪽으로 밀려 내 영역이 커진다 — 영역이 커질수록 누르기 쉬워지고
 *        상대는 어려워진다. 화면 전체를 채운 사람이 이기고, 밀려난 사람이 당첨.
 *   3명+ 연타: 순서대로 한 명씩 제한 시간(RELAY_SECONDS) 동안 화면을 최대한 많이 누른다.
 *        가장 적게 누른 사람이 당첨. 꼴찌가 동점이면 그 사람들끼리 다시 한다.
 *
 * 플레이 중에는 화면 전체를 덮는 판(오버레이)을 띄운다 — 하단 탭바·스크롤에 손가락이 걸리지 않게.
 * 여러 손가락 동시 터치(pointerdown 마다 1회)를 그대로 센다. 시작 전 3·2·1 카운트다운 동안의 터치는 세지 않는다.
 */
import { useState, useRef, useEffect } from "react";
import { html } from "../shared/html.js";
import { styles, C_RED, C_DARK } from "../shared/styles.js";
import { shuffle } from "./random.js";
import { tapPop, countBeep, fanfare, vibrate, unlockAudio } from "./sfx.js";
import { colorOf } from "./palette.js";
import { BigButton, TurnBanner } from "./common.js";
import { TurnOrderSetup, TurnStrip } from "./TurnOrder.js";

export const DUEL_STEP = 0.025; // 한 번 누를 때 경계선이 움직이는 양 (화면 높이 비율) — 가운데서 약 20번 더 누르면 승리
export const RELAY_SECONDS = 5;

// 3·2·1 카운트다운 후 onGo(). 돌려주는 값: 지금 숫자(3,2,1) / "GO" / null
function useCountdown() {
  const [count, setCount] = useState(null);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const start = (onGo) => {
    [3, 2, 1].forEach((n, i) =>
      timers.current.push(
        setTimeout(() => {
          setCount(n);
          countBeep(false);
        }, i * 700)
      )
    );
    timers.current.push(
      setTimeout(() => {
        setCount("GO");
        countBeep(true);
        vibrate(60);
        onGo();
      }, 2100)
    );
    timers.current.push(setTimeout(() => setCount(null), 2700));
  };
  const cancel = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setCount(null);
  };
  return { count, start, cancel };
}

// 플레이 중 화면 전체를 덮는 판. 열려 있는 동안 페이지 스크롤을 막는다.
// iOS 사파리는 body 의 overflow: hidden 을 무시하고 뒤 페이지를 스크롤하므로 세 겹으로 막는다:
//   1) body 를 지금 스크롤 위치 그대로 position: fixed 로 고정 (닫을 때 원래 위치로 되돌림)
//   2) 문서 전체의 touchmove 기본 동작(스크롤·당김) 취소 — passive: false 여야 취소된다
//   3) overscroll-behavior: none 으로 화면 끝 당김(바운스·새로고침) 방지
function FullScreen({ children, background }) {
  useEffect(() => {
    const { body, documentElement: root } = document;
    const y = window.scrollY;
    const prev = {
      body: body.getAttribute("style") ?? "",
      root: root.style.overscrollBehavior,
    };
    Object.assign(body.style, { position: "fixed", top: `-${y}px`, left: "0", right: "0", width: "100%", overflow: "hidden" });
    root.style.overscrollBehavior = "none";
    const block = (e) => e.cancelable && e.preventDefault();
    document.addEventListener("touchmove", block, { passive: false });
    return () => {
      document.removeEventListener("touchmove", block);
      body.setAttribute("style", prev.body);
      root.style.overscrollBehavior = prev.root;
      window.scrollTo(0, y);
    };
  }, []);
  return html`<div style=${{ ...styles.tapOverlay, background }} data-tap-overlay="">${children}</div>`;
}

function CountBubble({ count }) {
  if (count === null) return null;
  return html`<div style=${styles.tapCountBubble} aria-live="assertive"><span key=${count} style=${styles.tapCountText}>${count}</span></div>`;
}

// ── 2명: 땅따먹기 ────────────────────────────────
function Duel({ players, onFinish }) {
  // sides[0] = 위(돌려서 보는 쪽), sides[1] = 아래 — players 의 인덱스
  const [sides, setSides] = useState(() => shuffle([0, 1]));
  const [phase, setPhase] = useState("ready"); // ready | play | over | finished
  const [share, setShare] = useState(0.5); // 위쪽이 차지한 비율
  const [taps, setTaps] = useState([0, 0]);
  const [winnerSide, setWinnerSide] = useState(null);
  const live = useRef({ playing: false, share: 0.5 });
  const cd = useCountdown();
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const begin = () => {
    unlockAudio();
    live.current = { playing: false, share: 0.5 };
    setShare(0.5);
    setTaps([0, 0]);
    setWinnerSide(null);
    setPhase("play");
    cd.start(() => (live.current.playing = true));
  };

  const quit = () => {
    cd.cancel();
    live.current.playing = false;
    setPhase("ready");
  };

  const tap = (side, e) => {
    e.preventDefault();
    if (!live.current.playing) return;
    const next = Math.min(1, Math.max(0, live.current.share + (side === 0 ? DUEL_STEP : -DUEL_STEP)));
    live.current.share = next;
    setShare(next);
    setTaps((t) => (side === 0 ? [t[0] + 1, t[1]] : [t[0], t[1] + 1]));
    tapPop(side);
    vibrate(8);
    if (next >= 1 || next <= 0) {
      const win = next >= 1 ? 0 : 1;
      live.current.playing = false;
      setWinnerSide(win);
      setPhase("over");
      fanfare();
      vibrate([80, 40, 160]);
      // 승부 장면을 잠깐 보여준 뒤 판을 닫고 결과로
      timers.current.push(
        setTimeout(() => {
          setPhase("finished");
          onFinish(players[sides[1 - win]].id);
        }, 1800)
      );
    }
  };

  const [top, bottom] = sides.map((i) => players[i]);
  const [topBg, topFg] = colorOf(sides[0]);
  const [botBg, botFg] = colorOf(sides[1]);

  if (phase === "ready" || phase === "finished") {
    return html`
      <div style=${styles.gameStage}>
        <div style=${styles.duelPreview}>
          <div style=${{ ...styles.duelPreviewHalf, background: topBg, color: topFg }}>
            <span style=${{ transform: "rotate(180deg)" }}>${top.name}</span>
          </div>
          <div style=${{ ...styles.duelPreviewHalf, background: botBg, color: botFg }}>
            <span>${bottom.name}</span>
          </div>
        </div>
        ${phase === "finished"
          ? html`<p style=${styles.hint}>${players[sides[winnerSide]].name} 승리 · 터치 ${taps[0]} : ${taps[1]}</p>`
          : html`
              <p style=${styles.hint}>
                폰을 가운데 두고 마주 앉아요. 내 영역을 누를수록 넓어지고, 화면을 다 채우면 승리! 밀려난 사람이 당첨이에요.
              </p>
              <button type="button" className="settle-add-btn" style=${styles.shuffleBtn} onClick=${() => setSides([sides[1], sides[0]])}>
                위·아래 바꾸기
              </button>
              <${BigButton} onClick=${begin}>대결 시작 (화면 전체로 열려요)<//>
            `}
      </div>
    `;
  }

  const over = phase === "over";
  const half = (side, p, bg, fg, flip) => html`
    <div
      style=${{ ...styles.duelHalf, height: `${p * 100}%`, background: bg, color: fg }}
      onPointerDown=${(e) => tap(side, e)}
      data-duel-side=${side}
    >
      <div style=${{ ...styles.duelLabel, transform: flip ? "rotate(180deg)" : "none" }}>
        <div style=${styles.duelName}>${players[sides[side]].name}</div>
        <div key=${taps[side]} style=${styles.duelTaps}>${taps[side]}</div>
        ${over && html`<div style=${styles.duelResult}>${winnerSide === side ? "승리!" : "당첨!"}</div>`}
      </div>
    </div>
  `;

  return html`
    <${FullScreen} background=${C_DARK}>
      ${half(0, share, topBg, topFg, true)}
      ${half(1, 1 - share, botBg, botFg, false)}
      <${CountBubble} count=${cd.count} />
      ${!over &&
      html`<button type="button" style=${{ ...styles.tapQuit, top: `calc(${share * 100}% - 18px)` }} onClick=${quit} aria-label="그만하기">✕</button>`}
    <//>
  `;
}

// ── 3명 이상: 한 명씩 연타 ──────────────────────────
function Relay({ players, onFinish }) {
  const n = players.length;
  const [order, setOrder] = useState(() => shuffle(players.map((_, i) => i)));
  const [phase, setPhase] = useState("order"); // order | turnReady | play | shown | done
  const [queue, setQueue] = useState([]); // 이번 라운드에 할 사람들 (order 안의 순서대로)
  const [pos, setPos] = useState(0); // queue 안에서 지금 차례
  const [scores, setScores] = useState({}); // 플레이어 인덱스 → 이번 라운드 터치 수
  const [taps, setTaps] = useState(0);
  const [left, setLeft] = useState(RELAY_SECONDS);
  const [rematch, setRematch] = useState(false);
  const live = useRef({ playing: false, taps: 0 });
  const cd = useCountdown();
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const startRound = (who) => {
    setQueue(who);
    setPos(0);
    setScores({});
    setPhase("turnReady");
  };

  const go = () => {
    unlockAudio();
    live.current = { playing: false, taps: 0 };
    setTaps(0);
    setLeft(RELAY_SECONDS);
    setPhase("play");
    cd.start(() => {
      live.current.playing = true;
      const t0 = performance.now();
      const tick = () => {
        const rest = Math.max(0, RELAY_SECONDS - (performance.now() - t0) / 1000);
        setLeft(rest);
        if (rest > 0 && live.current.playing) timers.current.push(setTimeout(tick, 50));
      };
      tick();
      timers.current.push(setTimeout(stop, RELAY_SECONDS * 1000));
    });
  };

  const stop = () => {
    live.current.playing = false;
    countBeep(true);
    vibrate(120);
    setPhase("shown");
    timers.current.push(setTimeout(() => record(live.current.taps), 1400));
  };

  // 한 사람이 끝나면 점수를 적고 다음 사람 / 라운드 결과
  const record = (count) => {
    const who = queue[pos];
    const nextScores = { ...scores, [who]: count };
    setScores(nextScores);
    if (pos + 1 < queue.length) {
      setPos(pos + 1);
      setPhase("turnReady");
      return;
    }
    const min = Math.min(...queue.map((i) => nextScores[i]));
    const lowest = queue.filter((i) => nextScores[i] === min);
    if (lowest.length === 1) {
      setPhase("done");
      fanfare();
      onFinish(players[lowest[0]].id);
    } else {
      // 꼴찌 동점 — 그 사람들끼리 다시
      setRematch(true);
      timers.current.push(setTimeout(() => startRound(lowest), 1600));
      setPhase("tie");
    }
  };

  const tap = (e) => {
    e.preventDefault();
    if (!live.current.playing) return;
    live.current.taps += 1;
    setTaps(live.current.taps);
    tapPop(live.current.taps % 2);
    vibrate(6);
  };

  if (phase === "order") {
    return html`
      <${TurnOrderSetup}
        players=${players}
        order=${order}
        onChange=${setOrder}
        onStart=${() => startRound(order)}
        note=${`이 순서대로 한 명씩 ${RELAY_SECONDS}초 동안 화면을 최대한 많이 눌러요. 가장 적게 누른 사람이 당첨!`}
      />
    `;
  }

  const current = queue[pos];
  const [bg, fg] = colorOf(current ?? 0);

  if (phase === "play" || phase === "shown") {
    return html`
      <${FullScreen} background=${bg}>
        <div style=${{ ...styles.relayPad, color: fg }} onPointerDown=${tap} data-relay-pad="">
          <div style=${styles.duelName}>${players[current].name}</div>
          <div key=${taps} style=${styles.relayTaps}>${taps}</div>
          <div style=${styles.relayTimeTrack}>
            <div style=${{ ...styles.relayTimeBar, width: `${(left / RELAY_SECONDS) * 100}%`, background: fg }}></div>
          </div>
          <div style=${styles.relayHint}>${phase === "shown" ? `${taps}번! 끝` : cd.count !== null && cd.count !== "GO" ? "준비…" : `${left.toFixed(1)}초`}</div>
        </div>
        <${CountBubble} count=${cd.count} />
      <//>
    `;
  }

  // 점수판 — 이번 라운드(재대결이면 동점자만)
  const board = html`
    <ol style=${styles.relayBoard}>
      ${order
        .filter((i) => queue.includes(i))
        .map((i) => {
          const [cbg, cfg] = colorOf(i);
          const done = scores[i] !== undefined;
          return html`
            <li key=${i} style=${{ ...styles.relayRow, ...(i === current && phase === "turnReady" ? styles.relayRowNow : null) }}>
              <span style=${{ ...styles.orderNo, background: cbg, color: cfg }}>${order.indexOf(i) + 1}</span>
              <span style=${styles.orderName}>${players[i].name}</span>
              <span style=${styles.relayScore}>${done ? `${scores[i]}번` : i === current ? "차례" : "-"}</span>
            </li>
          `;
        })}
    </ol>
  `;

  if (phase === "tie") {
    return html`
      <div style=${styles.gameStage}>
        ${board}
        <p style=${{ ...styles.hint, color: C_RED, fontWeight: 700 }}>꼴찌 동점! 동점인 사람끼리 다시 해요</p>
      </div>
    `;
  }

  if (phase === "done") {
    return html`<div style=${styles.gameStage}>${board}</div>`;
  }

  // turnReady
  return html`
    <div style=${styles.gameStage}>
      <${TurnBanner} label=${rematch ? "재대결" : "지금 차례"} player=${players[current]} index=${current} />
      <${TurnStrip} players=${players} order=${order.filter((i) => queue.includes(i))} current=${pos} />
      ${board}
      <p style=${styles.hint}>${players[current].name}님, 폰을 받고 준비되면 눌러요. 3·2·1 뒤 ${RELAY_SECONDS}초 동안 연타!</p>
      <${BigButton} onClick=${go}>준비됐어요 (화면 전체로 열려요)<//>
    </div>
  `;
}

export function TapBattleGame({ players: initialPlayers, onFinish }) {
  const [players] = useState(initialPlayers);
  return players.length === 2
    ? html`<${Duel} players=${players} onFinish=${onFinish} />`
    : html`<${Relay} players=${players} onFinish=${onFinish} />`;
}
