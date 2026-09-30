/* 동물 레이스 — 15초 자동 진행, 꼴찌가 당첨 */
import { useState, useEffect, useRef } from "react";
import { html } from "../shared/html.js";
import { styles, C_DARK, C_MUTED } from "../shared/styles.js";
import { colorOf } from "./palette.js";
import { shuffle, randInt } from "./random.js";
import { unlockAudio, beep, chime, fanfare } from "./sfx.js";
import { GAME_FINISH_MS, BigButton } from "./common.js";
import { AnimalIcon } from "./gameIcons.js";

// 최대 인원(MAX_PLAYERS)만큼 서로 다른 동물이 있어야 한다
const ANIMALS = [
  "turtle", "rabbit", "dog", "cat", "frog", "bear", "panda", "fox", "mouse", "lion",
  "pig", "chick", "penguin", "tiger", "elephant",
];
const ANIMAL_NAMES = {
  turtle: "거북이", rabbit: "토끼", dog: "강아지", cat: "고양이", frog: "개구리",
  bear: "곰", panda: "판다", fox: "여우", mouse: "쥐", lion: "사자",
  pig: "돼지", chick: "병아리", penguin: "펭귄", tiger: "호랑이", elephant: "코끼리",
};
// 트랙: 최소 높이를 채우도록 레인이 늘어나고, 인원이 많으면 레인 최소 높이만큼 아래로 길어진다
const TRACK_MIN_H = 240;
const LANE_MIN_H = 30;
const LANE_GAP = 6;
const TOTAL_STEPS = 20;
const RACE_MS = 15000;  // 총 레이스 시간
const TICK_MS = 350;    // 업데이트 간격
// 화면 이동: 틱 위치를 목표로 삼아 매 프레임 부드럽게 따라감
const FOLLOW_LAG_S = 0.45; // 목표까지 따라가는 시간 상수 (클수록 느긋하게 따라감)
const VEL_SMOOTH = 5;      // 속도 변화 완화 (클수록 빠르게 가감속)

// 레이스 음악: 작은 음계 루프
const MUSIC_NOTES = [523, 587, 659, 784, 880, 784, 659, 587, 523, 523];
const MUSIC_INTERVAL_MS = 160;

export function RaceGame({ players, onFinish }) {
  const [phase, setPhase] = useState("ready"); // ready | racing | done

  const [assignments] = useState(() => {
    const pool = shuffle([...ANIMALS]);
    // 동물 수보다 인원이 많으면 다시 돌려 쓴다 (이름·색으로 구분)
    return players.map((_, i) => ({ playerIdx: i, animal: pool[i % pool.length] }));
  });

  const [finished, setFinished] = useState([]); // 통과 순서 [playerIdx...]
  const [loserIdx, setLoserIdx] = useState(null);
  const [timeLeft, setTimeLeft] = useState(Math.ceil(RACE_MS / 1000));

  // Mutable refs (stale closure 방지)
  const posRef = useRef(Object.fromEntries(players.map((_, i) => [i, 0])));
  const finishedRef = useRef([]);
  const doneRef = useRef(false);
  // 화면 표시용 위치·속도 (rAF 루프가 DOM을 직접 갱신 — 프레임마다 리렌더 없음)
  const dispRef = useRef({});
  const velRef = useRef({});
  const animalEls = useRef({});

  const startRace = () => {
    unlockAudio();
    // 초기화
    const initPos = Object.fromEntries(players.map((_, i) => [i, 0]));
    posRef.current = { ...initPos };
    finishedRef.current = [];
    doneRef.current = false;
    dispRef.current = {};
    velRef.current = {};
    setFinished([]);
    setLoserIdx(null);
    setTimeLeft(Math.ceil(RACE_MS / 1000));
    setPhase("racing");
  };

  useEffect(() => {
    if (phase !== "racing") return;

    const raceStart = Date.now();
    let noteIdx = 0;

    // 배경음악
    const musicId = setInterval(() => {
      if (doneRef.current) return;
      beep(MUSIC_NOTES[noteIdx % MUSIC_NOTES.length], 90, "sine", 0.028);
      noteIdx++;
    }, MUSIC_INTERVAL_MS);

    // 레이스 틱
    const raceId = setInterval(() => {
      if (doneRef.current) return;

      const elapsed = Date.now() - raceStart;
      const tl = Math.max(0, Math.ceil((RACE_MS - elapsed) / 1000));
      setTimeLeft(tl);

      // 포지션 업데이트
      const prev = posRef.current;
      const next = { ...prev };
      const newlyFinished = [];
      const isUrgent = tl <= 4;

      assignments.forEach(({ playerIdx }) => {
        if (finishedRef.current.includes(playerIdx)) return;
        // 분포: 40% 0칸, 35% 1칸, 15% 2칸, 10% 3칸 → 평균 ≈ 0.95
        // RACE_MS/TICK_MS ≈ 43 틱, 43×0.95 ≈ 41 → TOTAL_STEPS=20에서 약 21틱에 완주
        // 균형있게 유지하기 위해 선두가 너무 앞서면 약간 느려짐 (rubber band)
        const avgPos = Object.values(prev).reduce((a, b) => a + b, 0) / players.length;
        const isLeader = prev[playerIdx] > avgPos + 3;
        const r = randInt(20);
        let advance;
        if (isLeader) {
          // 선두: 더 느리게 (긴장감)
          advance = r < 10 ? 0 : r < 17 ? 1 : 2;
        } else if (isUrgent) {
          // 막바지: 빠르게 몰아침
          advance = r < 3 ? 0 : r < 13 ? 1 : r < 18 ? 2 : 3;
        } else {
          advance = r < 8 ? 0 : r < 15 ? 1 : r < 19 ? 2 : 3;
        }
        next[playerIdx] = Math.min(prev[playerIdx] + advance, TOTAL_STEPS);
        if (next[playerIdx] >= TOTAL_STEPS && !finishedRef.current.includes(playerIdx)) {
          newlyFinished.push(playerIdx);
        }
      });

      posRef.current = next;

      if (newlyFinished.length > 0) {
        newlyFinished.forEach(() => chime());
        finishedRef.current = [...finishedRef.current, ...newlyFinished];
        setFinished([...finishedRef.current]);
      }

      // 종료 조건: 1명 남았거나 시간 초과
      const stillRunning = assignments.filter(
        (a) => !finishedRef.current.includes(a.playerIdx)
      );
      const shouldEnd = stillRunning.length <= 1 || elapsed >= RACE_MS;

      if (shouldEnd && !doneRef.current) {
        doneRef.current = true;
        clearInterval(raceId);
        clearInterval(musicId);

        // 패배자: 마지막 통과자 or 미통과 중 최후위
        let loser;
        if (stillRunning.length === 1) {
          loser = stillRunning[0].playerIdx;
        } else if (stillRunning.length > 1) {
          // 시간 초과 시 최저 포지션이 패배
          loser = stillRunning.reduce((a, b) =>
            (posRef.current[a.playerIdx] ?? 0) <= (posRef.current[b.playerIdx] ?? 0) ? a : b
          ).playerIdx;
        } else {
          // 모두 완주 → 마지막 통과자
          loser = finishedRef.current[finishedRef.current.length - 1];
        }

        fanfare();
        setLoserIdx(loser);
        setTimeout(() => {
          setPhase("done");
          setTimeout(() => onFinish(players[loser].id), GAME_FINISH_MS);
        }, 800);
      }
    }, TICK_MS);

    return () => {
      clearInterval(raceId);
      clearInterval(musicId);
    };
  }, [phase]);

  // 표시 위치가 틱 위치를 속도를 부드럽게 바꿔가며 따라감 → 끊김 없는 이동
  useEffect(() => {
    if (phase === "ready") return;
    let raf;
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      let moving = false;
      assignments.forEach(({ playerIdx }) => {
        const target = posRef.current[playerIdx] ?? 0;
        const cur = dispRef.current[playerIdx] ?? 0;
        const v = velRef.current[playerIdx] ?? 0;
        const desired = Math.max(0, (target - cur) / FOLLOW_LAG_S);
        const nv = v + (desired - v) * Math.min(1, dt * VEL_SMOOTH);
        let np = Math.min(cur + nv * dt, target);
        if (target - np < 0.01) np = target;
        else moving = true;
        dispRef.current[playerIdx] = np;
        velRef.current[playerIdx] = nv;
        const el = animalEls.current[playerIdx];
        if (el) el.style.left = `calc(${(np / TOTAL_STEPS) * 100}% - 17px)`;
      });
      if (phase === "racing" || moving) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // ── 준비 화면 ───────────────────────────────────────────────
  if (phase === "ready") {
    return html`
      <div style=${{ ...styles.gameStage, gap: 0 }}>
        <p style=${{
          textAlign: "center", fontSize: 13, fontWeight: 700,
          color: "#8A8FA3", letterSpacing: "1px", margin: "0 0 14px",
        }}>동물 배정</p>
        <div style=${{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          ${assignments.map(({ playerIdx, animal }) => {
            const [bg, fg] = colorOf(playerIdx);
            return html`
              <div key=${playerIdx} style=${{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px",
                background: bg + "22",
                border: `1px solid ${bg}66`,
                borderRadius: 6,
              }}>
                <${AnimalIcon} id=${animal} size=${32} />
                <span style=${{ flex: 1, fontSize: 14, fontWeight: 700, color: C_DARK }}>
                  ${players[playerIdx].name}
                </span>
                <span style=${{
                  fontSize: 12, fontWeight: 700,
                  padding: "2px 8px", borderRadius: 10,
                  background: bg, color: fg,
                }}>
                  ${ANIMAL_NAMES[animal]}
                </span>
              </div>
            `;
          })}
        </div>
        <p style=${{ ...styles.hint, marginBottom: 4 }}>
          꼴찌로 결승선을 통과하면 당첨이에요 · 15초 자동 진행
        </p>
        <${BigButton} onClick=${startRace}>레이스 시작!<//>
      </div>
    `;
  }

  const pct = (playerIdx) => Math.min(((dispRef.current[playerIdx] ?? 0) / TOTAL_STEPS) * 100, 100);
  const isRacing = phase === "racing";

  // ── 레이스 트랙 ─────────────────────────────────────────────
  return html`
    <div style=${{ ...styles.gameStage, gap: 0, paddingBottom: 20 }}>
      <!-- 헤더: 상태 + 남은 시간 -->
      <div style=${{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 10,
      }}>
        <p style=${{ fontSize: 13, fontWeight: 700, color: "#8A8FA3", margin: 0 }}>
          ${phase === "done" ? "레이스 종료!" : "레이스 중"}
        </p>
        ${isRacing && html`
          <p style=${{
            fontSize: 14, fontWeight: 800, margin: 0,
            color: timeLeft <= 4 ? "#E83B3B" : C_MUTED,
            fontVariantNumeric: "tabular-nums",
          }}>
            ${timeLeft}초
          </p>
        `}
      </div>

      <!-- 트랙 -->
      <div style=${{
        background: "#F0FFF4",
        border: "1.5px solid #C8E6C9",
        borderRadius: 8,
        padding: "10px 8px 10px 4px",
        marginBottom: 12,
        position: "relative",
        minHeight: TRACK_MIN_H,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: LANE_GAP,
      }}>
        <!-- 결승선 수직 라인 -->
        <div style=${{
          position: "absolute", right: 8, top: 6, bottom: 6,
          width: 3,
          background: "repeating-linear-gradient(180deg,#212121 0 5px,#fff 5px 10px)",
          opacity: 0.3, borderRadius: 1,
        }}/>

        ${assignments.map(({ playerIdx, animal }) => {
          const p = pct(playerIdx);
          const isFinish = finished.includes(playerIdx);
          const rankNum = isFinish ? finished.indexOf(playerIdx) + 1 : null;
          const [bg, fg] = colorOf(playerIdx);
          return html`
            <div key=${playerIdx} style=${{
              display: "flex", alignItems: "stretch", gap: 4,
              flex: "1 1 0", minHeight: LANE_MIN_H,
            }}>
              <!-- 이름 -->
              <span style=${{
                minWidth: 34, fontSize: 10, fontWeight: 700, color: C_DARK,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                textAlign: "right", alignSelf: "center",
              }}>
                ${players[playerIdx].name}
              </span>

              <!-- 레인 (고정 폭, 오른쪽 여백 = 결승선) -->
              <div style=${{
                flex: 1,
                background: "#E8F5E9",
                borderRadius: 4,
                position: "relative",
                overflow: "hidden",
                border: "1px solid #C8E6C9",
                marginRight: 12,
              }}>
                <!-- 잔디 줄무늬 -->
                <div style=${{
                  position: "absolute", inset: 0,
                  backgroundImage: "repeating-linear-gradient(90deg,transparent 0 20px,rgba(0,0,0,0.04) 20px 21px)",
                }}/>
                <!-- 동물 (rAF 루프가 left를 매 프레임 갱신) -->
                <div ref=${(el) => { animalEls.current[playerIdx] = el; }} style=${{
                  position: "absolute",
                  left: `calc(${p}% - 17px)`,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 1,
                  lineHeight: 0,
                }}>
                  <${AnimalIcon} id=${animal} size=${26} />
                </div>
                <!-- 완주 순위 배지 -->
                ${isFinish && html`
                  <div style=${{
                    position: "absolute", right: 2, top: "50%",
                    transform: "translateY(-50%)",
                    background: bg, color: fg,
                    borderRadius: 8, padding: "1px 5px",
                    fontSize: 10, fontWeight: 800, zIndex: 2,
                  }}>
                    ${rankNum}위
                  </div>
                `}
              </div>
            </div>
          `;
        })}
      </div>

      <!-- 완주 순서 -->
      ${finished.length > 0 && html`
        <p style=${{ fontSize: 11.5, color: C_MUTED, textAlign: "center", margin: "0 0 8px" }}>
          완주: ${finished.map((idx) => players[idx].name).join(" → ")}
        </p>
      `}

      <!-- 결과 메시지 -->
      ${phase === "done" && loserIdx != null && html`
        <p style=${{ ...styles.hint, marginBottom: 0 }}>
          꼴찌 <strong>${players[loserIdx].name}</strong>님이 당첨!
        </p>
      `}
    </div>
  `;
}
