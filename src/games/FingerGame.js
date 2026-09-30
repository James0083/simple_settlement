/*
 * 손가락 룰렛 — 모두 손가락을 올리면 3초 카운트다운 후 자동으로 한 손가락을 고른다.
 * 어느 손가락이 누구인지 앱은 모르므로 원에는 이름을 쓰지 않고, 끝난 뒤 "결과 입력하기"에서
 * 뽑힌 손가락의 주인을 사람이 직접 고른다. 카운트다운 중 손가락을 떼면 취소되고 다시 기다린다.
 */
import { useState, useRef, useEffect } from "react";
import { html } from "../shared/html.js";
import { styles, C_MUTED } from "../shared/styles.js";
import { colorOf } from "./palette.js";
import { randInt } from "./random.js";
import { unlockAudio, countBeep, fanfare, vibrate } from "./sfx.js";

const COUNT_FROM = 3;
const TICK_MS = 1000;

export function FingerGame({ players, onFinish }) {
  const [fingers, setFingers] = useState([]);    // 화면에 올라온 손가락 [{id, x, y, color}]
  const [phase, setPhase] = useState("waiting"); // waiting | countdown | done | pick | submitted
  const [countdown, setCountdown] = useState(null);
  const [circles, setCircles] = useState([]);    // 뽑을 때 스냅샷
  const [winnerPos, setWinnerPos] = useState(null);

  const ptrMap = useRef(new Map()); // pointerId → {id, x, y, color}
  const phaseRef = useRef("waiting");
  const timer = useRef(null);
  const colorSeq = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const go = (p) => {
    phaseRef.current = p;
    setPhase(p);
  };
  const sync = () => setFingers([...ptrMap.current.values()]);

  const cancelCountdown = () => {
    clearTimeout(timer.current);
    setCountdown(null);
    go("waiting");
  };

  const pick = () => {
    const snap = [...ptrMap.current.values()];
    if (snap.length < 2) return cancelCountdown();
    setCircles(snap);
    setWinnerPos(randInt(snap.length));
    setCountdown(null);
    countBeep(true);
    vibrate(120);
    fanfare();
    go("done");
  };

  const startCountdown = () => {
    unlockAudio();
    go("countdown");
    let n = COUNT_FROM;
    setCountdown(n);
    countBeep(false);
    const tick = () => {
      n--;
      if (n > 0) {
        setCountdown(n);
        countBeep(false);
        timer.current = setTimeout(tick, TICK_MS);
      } else {
        pick();
      }
    };
    timer.current = setTimeout(tick, TICK_MS);
  };

  const onPointerDown = (e) => {
    if (phaseRef.current !== "waiting") return;
    if (ptrMap.current.has(e.pointerId)) return;
    if (ptrMap.current.size >= players.length) return; // 인원 수만큼만
    e.currentTarget.setPointerCapture?.(e.pointerId);
    ptrMap.current.set(e.pointerId, { id: e.pointerId, x: e.clientX, y: e.clientY, color: colorSeq.current++ });
    sync();
    if (ptrMap.current.size === players.length) startCountdown();
  };

  const onPointerMove = (e) => {
    if (phaseRef.current !== "waiting" && phaseRef.current !== "countdown") return;
    const t = ptrMap.current.get(e.pointerId);
    if (!t) return;
    ptrMap.current.set(e.pointerId, { ...t, x: e.clientX, y: e.clientY });
    sync();
  };

  const onPointerUp = (e) => {
    const p = phaseRef.current;
    if (p !== "waiting" && p !== "countdown") return;
    if (!ptrMap.current.delete(e.pointerId)) return;
    sync();
    if (p === "countdown") cancelCountdown(); // 누가 떼면 다시 모두 올릴 때까지 기다린다
  };

  const retry = () => {
    ptrMap.current.clear();
    colorSeq.current = 0;
    setFingers([]);
    setCircles([]);
    setWinnerPos(null);
    go("waiting");
  };

  const submit = (idx) => {
    go("submitted");
    onFinish(players[idx].id);
  };

  // 결과를 넣으면 전체 화면을 닫고, 아래 결과 카드가 보이게 한다
  if (phase === "submitted") {
    return html`<p style=${{ ...styles.hint, color: C_MUTED }}>손가락 룰렛 결과를 입력했어요</p>`;
  }

  const isDone = phase === "done" || phase === "pick";
  const shown = isDone ? circles : fingers;

  return html`
    <div
      style=${{ ...styles.tapOverlay, background: "#111827" }}
      onPointerDown=${onPointerDown}
      onPointerMove=${onPointerMove}
      onPointerUp=${onPointerUp}
      onPointerCancel=${onPointerUp}
    >
      <!-- 손가락 원 — 이름 없이 색만 (누구 손가락인지 앱은 모른다) -->
      ${shown.map((c, i) => {
        const isWinner = isDone && i === winnerPos;
        const isLoser = isDone && !isWinner;
        return html`
          <div key=${c.id} style=${{
            ...styles.fingerCircle,
            left: c.x,
            top: c.y,
            transform: `translate(-50%, -50%) scale(${isLoser ? 0.4 : isWinner ? 1.9 : 1})`,
            background: colorOf(c.color)[0],
            border: isWinner ? "3px solid #FFD700" : "3px solid rgba(255,255,255,0.2)",
            opacity: isLoser ? 0.15 : 1,
            boxShadow: isWinner ? "0 0 40px rgba(255,215,0,0.7)" : "0 4px 16px rgba(0,0,0,0.4)",
          }}/>
        `;
      })}

      ${phase === "waiting" && html`
        <div style=${styles.fingerFooter}>
          <p style=${styles.fingerCount}>${fingers.length} / ${players.length}명</p>
          <p style=${styles.fingerHint}>모두 손가락을 올리면 3초 뒤 자동으로 시작해요</p>
        </div>
      `}

      ${phase === "countdown" && countdown != null && html`
        <div style=${styles.fingerCountdown}>
          <span style=${styles.fingerCountdownNum}>${countdown}</span>
          <span style=${styles.fingerHint}>손가락을 떼지 마세요</span>
        </div>
      `}

      <!-- 결과: 뽑힌 손가락의 주인을 직접 입력 -->
      ${phase === "done" && html`
        <div style=${styles.fingerResult}>
          <p style=${styles.fingerResultText}>💡 빛나는 손가락의 주인이 당첨!</p>
          <div style=${styles.fingerBtnRow}>
            <button type="button" style=${styles.fingerBtn} onClick=${() => go("pick")}>결과 입력하기</button>
            <button type="button" style=${{ ...styles.fingerBtn, ...styles.fingerBtnGhost }} onClick=${retry}>다시 하기</button>
          </div>
        </div>
      `}

      ${phase === "pick" && html`
        <div style=${styles.fingerSheet}>
          <p style=${styles.fingerSheetTitle}>빛나는 손가락은 누구였나요?</p>
          <div style=${styles.fingerSheetGrid}>
            ${players.map((p, i) => html`
              <button key=${p.id} type="button" style=${styles.fingerSheetName} onClick=${() => submit(i)}>${p.name}</button>
            `)}
          </div>
          <button type="button" style=${styles.fingerSheetBack} onClick=${() => go("done")}>← 돌아가기</button>
        </div>
      `}
    </div>
  `;
}
