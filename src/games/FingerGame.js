/*
 * 손가락 룰렛 — 모두 손가락을 올리면 3초 카운트다운 후 자동으로 한 손가락을 고른다.
 * 어느 손가락이 누구인지 앱은 모르므로 원에는 이름을 쓰지 않고, 끝난 뒤 "결과 입력하기"에서
 * 뽑힌 손가락의 주인을 사람이 직접 고른다. 카운트다운 중 손가락을 떼면 취소되고 다시 기다린다.
 */
import { useState, useRef, useEffect } from "react";
import { html } from "../shared/html.js";
import { styles, C_MUTED } from "../shared/styles.js";
import { colorOf } from "./palette.js";
import { unlockAudio, countBeep, fanfare, vibrate } from "./sfx.js";

const CIRCLE_R = 44; // 원 반지름 px
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
    setWinnerPos(Math.floor(Math.random() * snap.length));
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
        const [bg] = colorOf(c.color);
        const isWinner = isDone && i === winnerPos;
        const isLoser = isDone && !isWinner;
        return html`
          <div key=${c.id} style=${{
            position: "absolute",
            left: c.x,
            top: c.y,
            transform: `translate(-50%, -50%) scale(${isLoser ? 0.4 : isWinner ? 1.9 : 1})`,
            width: CIRCLE_R * 2,
            height: CIRCLE_R * 2,
            borderRadius: "50%",
            background: bg,
            border: isWinner ? "3px solid #FFD700" : "3px solid rgba(255,255,255,0.2)",
            opacity: isLoser ? 0.15 : 1,
            transition: "transform 0.5s cubic-bezier(0.34,1.56,0.64,1), opacity 0.5s, border-color 0.3s",
            boxShadow: isWinner ? "0 0 40px rgba(255,215,0,0.7)" : "0 4px 16px rgba(0,0,0,0.4)",
            pointerEvents: "none",
          }}/>
        `;
      })}

      <!-- 대기 중: 인원 안내 -->
      ${phase === "waiting" && html`
        <div style=${{ position: "absolute", bottom: 100, left: 16, right: 16, textAlign: "center", pointerEvents: "none" }}>
          <p style=${{ color: "white", fontSize: 30, fontWeight: 900, margin: "0 0 4px", fontVariantNumeric: "tabular-nums" }}>
            ${fingers.length} / ${players.length}명
          </p>
          <p style=${{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: 0 }}>
            모두 손가락을 올리면 3초 뒤 자동으로 시작해요
          </p>
        </div>
      `}

      <!-- 카운트다운 숫자 -->
      ${phase === "countdown" && countdown != null && html`
        <div style=${{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <span style=${{ fontSize: 120, fontWeight: 900, color: "white", textShadow: "0 4px 48px rgba(0,0,0,0.6)" }}>
            ${countdown}
          </span>
          <span style=${{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>손가락을 떼지 마세요</span>
        </div>
      `}

      <!-- 결과: 뽑힌 손가락의 주인을 직접 입력 -->
      ${phase === "done" && html`
        <div style=${{ position: "absolute", bottom: 60, left: 16, right: 16, textAlign: "center" }}>
          <p style=${{ color: "#FFD700", fontSize: 26, fontWeight: 900, margin: "0 0 16px", textShadow: "0 2px 20px rgba(0,0,0,0.6)" }}>
            💡 빛나는 손가락의 주인이 당첨!
          </p>
          <div style=${{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button type="button" style=${fingerBtn("#E83B3B")} onClick=${() => go("pick")}>결과 입력하기</button>
            <button type="button" style=${fingerBtn("rgba(255,255,255,0.15)")} onClick=${retry}>다시 하기</button>
          </div>
        </div>
      `}

      ${phase === "pick" && html`
        <div style=${{
          position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "70%", overflowY: "auto",
          background: "#FFFFFF", borderRadius: "16px 16px 0 0", padding: "18px 16px 28px",
        }}>
          <p style=${{ margin: "0 0 12px", fontSize: 16, fontWeight: 800, textAlign: "center" }}>빛나는 손가락은 누구였나요?</p>
          <div style=${{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            ${players.map((p, i) => html`
              <button key=${p.id} type="button" style=${{
                padding: "12px 8px", border: "1px solid #E3E6EC", borderRadius: 8, background: "#F6F8FB",
                fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }} onClick=${() => submit(i)}>${p.name}</button>
            `)}
          </div>
          <button type="button" style=${{
            display: "block", margin: "14px auto 0", border: "none", background: "none",
            color: "#8A8FA3", fontFamily: "inherit", fontSize: 13, cursor: "pointer",
          }} onClick=${() => go("done")}>← 돌아가기</button>
        </div>
      `}
    </div>
  `;
}

const fingerBtn = (bg) => ({
  padding: "13px 22px",
  fontSize: 16,
  fontWeight: 800,
  background: bg,
  color: "white",
  border: "none",
  borderRadius: 40,
  fontFamily: "inherit",
  cursor: "pointer",
});
