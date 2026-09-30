/* 동물 레이스 — 15초 자동 진행, 꼴찌가 당첨 */
import { useState, useEffect, useRef } from "react";
import { html } from "../shared/html.js";
import { styles, C_RED } from "../shared/styles.js";
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
  const endTimers = useRef([]);
  useEffect(() => () => endTimers.current.forEach(clearTimeout), []);

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

      // 평소 분포: 0칸 40% · 1칸 35% · 2칸 20% · 3칸 5% (평균 0.9칸/틱 → 20칸을 약 8초에 완주)
      // 평균보다 3칸 넘게 앞선 선두는 느려지고(긴장감), 남은 4초부터는 모두 빨라진다.
      const avgPos = Object.values(prev).reduce((a, b) => a + b, 0) / players.length;
      assignments.forEach(({ playerIdx }) => {
        if (finishedRef.current.includes(playerIdx)) return;
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
        endTimers.current.push(
          setTimeout(() => {
            setPhase("done");
            endTimers.current.push(setTimeout(() => onFinish(players[loser].id), GAME_FINISH_MS));
          }, 800)
        );
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

  // ── 준비 화면: 동물 배정 ────────────────────────────────────
  if (phase === "ready") {
    return html`
      <div style=${styles.gameStage}>
        <p style=${styles.gameCaption}>동물 배정</p>
        <div style=${styles.rankList}>
          ${assignments.map(({ playerIdx, animal }) => {
            const [bg, fg] = colorOf(playerIdx);
            return html`
              <div key=${playerIdx} style=${{ ...styles.rankRow, background: bg + "22", borderColor: bg + "66" }}>
                <${AnimalIcon} id=${animal} size=${32} />
                <span style=${styles.rankName}>${players[playerIdx].name}</span>
                <span style=${{ ...styles.nameTag, background: bg, color: fg }}>${ANIMAL_NAMES[animal]}</span>
              </div>
            `;
          })}
        </div>
        <p style=${{ ...styles.hint, marginBottom: 4 }}>꼴찌로 결승선을 통과하면 당첨이에요 · 15초 자동 진행</p>
        <${BigButton} onClick=${startRace}>레이스 시작!<//>
      </div>
    `;
  }

  const pct = (playerIdx) => Math.min(((dispRef.current[playerIdx] ?? 0) / TOTAL_STEPS) * 100, 100);
  const isRacing = phase === "racing";

  // ── 레이스 트랙 ─────────────────────────────────────────────
  return html`
    <div style=${{ ...styles.gameStage, paddingBottom: 20 }}>
      <div style=${styles.raceHead}>
        <p style=${styles.raceStatus}>${phase === "done" ? "레이스 종료!" : "레이스 중"}</p>
        ${isRacing && html`
          <p style=${{ ...styles.raceTimer, ...(timeLeft <= 4 ? { color: C_RED } : null) }}>${timeLeft}초</p>
        `}
      </div>

      <div style=${{ ...styles.raceTrack, minHeight: TRACK_MIN_H, gap: LANE_GAP }}>
        <div style=${styles.raceFinishLine} aria-hidden="true" />
        ${assignments.map(({ playerIdx, animal }) => {
          const isFinish = finished.includes(playerIdx);
          const [bg, fg] = colorOf(playerIdx);
          return html`
            <div key=${playerIdx} style=${{ ...styles.raceLane, minHeight: LANE_MIN_H }}>
              <span style=${styles.raceLaneName}>${players[playerIdx].name}</span>
              <div style=${styles.raceLaneTrack}>
                <!-- 동물: rAF 루프가 left 를 매 프레임 갱신 -->
                <div
                  ref=${(el) => { animalEls.current[playerIdx] = el; }}
                  style=${{ ...styles.raceRunner, left: `calc(${pct(playerIdx)}% - 17px)` }}
                >
                  <${AnimalIcon} id=${animal} size=${26} />
                </div>
                ${isFinish && html`
                  <div style=${{ ...styles.raceRankBadge, background: bg, color: fg }}>${finished.indexOf(playerIdx) + 1}위</div>
                `}
              </div>
            </div>
          `;
        })}
      </div>

      ${finished.length > 0 && html`
        <p style=${styles.raceFinishOrder}>완주: ${finished.map((idx) => players[idx].name).join(" → ")}</p>
      `}
      ${phase === "done" && loserIdx != null && html`
        <p style=${{ ...styles.hint, marginBottom: 0 }}>꼴찌 <strong>${players[loserIdx].name}</strong>님이 당첨!</p>
      `}
    </div>
  `;
}
