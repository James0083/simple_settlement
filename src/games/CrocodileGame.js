/*
 * 악어이빨 (3D) — 아래턱 이빨 중 하나가 아픈 이빨. 아픈 이빨은 처음에 정한다.
 * 인원이 많으면 이빨도 늘린다 (한 판이 너무 빨리 끝나지 않게).
 * 먼저 순서를 정하고(바꿀 수 있음), 차례대로 이빨을 누른다. 아픈 이빨을 누르면 입이 닫히며 그 사람이 당첨.
 * 플레이 중엔 심장박동과 낮은 울림이 깔리고(이빨이 줄수록 빨라짐), 물 때는 "딱!" 하며 화면 가장자리가 빨갛게 번쩍인다.
 */
import { useState, useRef, useEffect } from "react";
import { html } from "../shared/html.js";
import { styles } from "../shared/styles.js";
import { randInt, shuffle } from "./random.js";
import { chomp as chompSound, toothClick, tensionLoop, vibrate, unlockAudio } from "./sfx.js";
import { TurnBanner, useScrollToStage, GAME_FINISH_MS } from "./common.js";
import { TurnOrderSetup, TurnStrip } from "./TurnOrder.js";
import { ThreeView } from "./three/ThreeView.js";
import { loadThree } from "./three/stage.js";
import { buildCrocScene } from "./three/crocScene.js";

export const teethFor = (players) => (players <= 4 ? 13 : players <= 7 ? 16 : 18);

export function CrocodileGame({ players: initialPlayers, onFinish }) {
  const [players] = useState(initialPlayers);
  const n = players.length;
  const TEETH = teethFor(n);
  const [bad] = useState(() => randInt(TEETH));
  const [order, setOrder] = useState(() => shuffle(players.map((_, i) => i)));
  const [phase, setPhase] = useState("order"); // order | play | snapped
  const [turnPos, setTurnPos] = useState(0);
  const [left, setLeft] = useState(TEETH);
  const [chomped, setChomped] = useState(false); // 입을 쾅 닫은 순간 — 빨간 번쩍임
  const tension = useRef(null);
  const pressed = useRef(new Set());
  const scene = useRef(null);
  const timers = useRef([]);
  const alive = useRef(true);
  const live = useRef(null);
  live.current = { phase, turnPos, order };

  useEffect(() => {
    loadThree().catch(() => {});
    return () => {
      alive.current = false;
      timers.current.forEach(clearTimeout);
      tension.current?.stop();
    };
  }, []);

  // 플레이가 시작되면 긴장감 배경음. 남은 이빨이 줄수록 심장이 빨리 뛴다.
  useEffect(() => {
    if (phase === "play") tension.current = tensionLoop();
  }, [phase === "play"]);
  useEffect(() => {
    tension.current?.setLevel(1 - (left - 1) / (TEETH - 1));
  }, [left]);

  const onTooth = (k) => {
    const { phase, turnPos, order } = live.current;
    if (phase !== "play" || pressed.current.has(k)) return;
    pressed.current.add(k);
    const who = order[turnPos];
    scene.current?.press(k);
    toothClick(); // 아픈 이빨도 누르는 순간엔 똑같이 "딸깍" — 소리로 미리 알 수 없게
    setLeft(TEETH - pressed.current.size);
    if (k === bad) {
      setPhase("snapped");
      // 이빨이 들어가는 걸 잠깐 보여준 뒤 입이 닫히고, 아픈 이빨을 보여주는 것까지 끝나면 결과
      timers.current.push(
        setTimeout(() => {
          const chomp = () => {
            tension.current?.stop();
            chompSound();
            vibrate([300, 60, 200]);
            setChomped(true);
          };
          const shown = scene.current ? scene.current.snap(bad, { onChomp: chomp }) : (chomp(), Promise.resolve());
          shown.then(() => {
            if (alive.current) timers.current.push(setTimeout(() => onFinish(players[who].id), GAME_FINISH_MS));
          });
        }, 160)
      );
    } else {
      vibrate(20);
      setTurnPos((turnPos + 1) % n);
    }
  };
  const onToothRef = useRef(onTooth);
  onToothRef.current = onTooth;
  const stageRef = useScrollToStage(phase !== "order");

  if (phase === "order") {
    return html`
      <${TurnOrderSetup}
        players=${players}
        order=${order}
        onChange=${setOrder}
        onStart=${() => {
          unlockAudio();
          setPhase("play");
        }}
        note="이 순서대로 한 명씩 이빨을 눌러요. 악어가 입을 닫으면 그 사람이 당첨!"
      />
    `;
  }

  const who = order[turnPos];
  return html`
    <div ref=${stageRef} style=${styles.gameStage}>
      ${chomped && html`<div style=${styles.dangerFlash} aria-hidden="true"></div>`}
      <${TurnBanner} label=${phase === "snapped" ? "물렸다!" : "지금 차례"} player=${players[who]} index=${who} />
      <${TurnStrip} players=${players} order=${order} current=${turnPos} />
      <${ThreeView}
        label="입을 벌린 악어 — 이빨을 눌러요"
        build=${(THREE, el) => buildCrocScene(THREE, el, { teeth: TEETH, onTooth: (k) => onToothRef.current(k) })}
        onReady=${(api) => (scene.current = api)}
      />
      <p style=${styles.hint}>
        ${phase === "snapped"
          ? "악어가 입을 닫았어요!"
          : `이빨을 하나 눌러 보세요 · 좌우로 밀어 돌리고 두 손가락으로 확대 · 남은 이빨 ${left}개`}
      </p>
    </div>
  `;
}
