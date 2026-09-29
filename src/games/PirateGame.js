/*
 * 해적룰렛 (3D) — 통에 구멍 16~24개(인원에 맞춰), 그중 하나가 함정. 함정 위치는 처음에 정한다.
 * 먼저 순서를 정하고(바꿀 수 있음), 차례대로 구멍에 칼을 꽂는다. 함정에 꽂으면 해적이 튀어나오고
 * 그 사람이 당첨. 통은 좌우로 밀어서 돌릴 수 있다.
 */
import { useState, useRef, useEffect } from "react";
import { html } from "../shared/html.js";
import { styles } from "../shared/styles.js";
import { randInt, shuffle } from "./random.js";
import { swordIn, popUp, scream, vibrate, unlockAudio } from "./sfx.js";
import { colorOf } from "./palette.js";
import { TurnBanner, useScrollToStage, GAME_FINISH_MS } from "./common.js";
import { TurnOrderSetup, TurnStrip } from "./TurnOrder.js";
import { ThreeView } from "./three/ThreeView.js";
import { loadThree } from "./three/stage.js";
import { buildPirateScene } from "./three/pirateScene.js";

export const holeCount = (players) => (players <= 4 ? 16 : players <= 7 ? 20 : 24);

export function PirateGame({ players: initialPlayers, onFinish }) {
  const [players] = useState(initialPlayers);
  const n = players.length;
  const holes = holeCount(n);
  const [trap] = useState(() => randInt(holes));
  const [order, setOrder] = useState(() => shuffle(players.map((_, i) => i)));
  const [phase, setPhase] = useState("order"); // order | play | popped
  const [turnPos, setTurnPos] = useState(0);
  const [left, setLeft] = useState(holes);
  const filled = useRef(new Set());
  const scene = useRef(null);
  const timer = useRef(null);
  const alive = useRef(true);
  const live = useRef(null);
  live.current = { phase, turnPos, order };

  useEffect(() => {
    loadThree().catch(() => {}); // 순서를 정하는 동안 3D 를 미리 받아 둔다
    return () => {
      alive.current = false;
      clearTimeout(timer.current);
    };
  }, []);

  const onHole = (hole) => {
    const { phase, turnPos, order } = live.current;
    if (phase !== "play" || filled.current.has(hole)) return;
    filled.current.add(hole);
    const who = order[turnPos];
    scene.current?.stab(hole, colorOf(who)[0]);
    setLeft(holes - filled.current.size);
    if (hole === trap) {
      setPhase("popped");
      swordIn();
      popUp();
      scream(0.12); // 튀어나와 날아가며 "으아악!"
      vibrate([200, 60, 300]);
      // 해적이 떨어지는 것까지 보고 나서 결과 (3D 를 못 불러왔으면 바로)
      const landed = scene.current ? scene.current.pop(trap) : Promise.resolve();
      landed.then(() => {
        if (alive.current) timer.current = setTimeout(() => onFinish(players[who].id), GAME_FINISH_MS);
      });
    } else {
      swordIn();
      vibrate(20);
      setTurnPos((turnPos + 1) % n);
    }
  };
  const onHoleRef = useRef(onHole);
  onHoleRef.current = onHole;
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
        note="이 순서대로 한 명씩 칼을 꽂아요. 해적을 튀어나오게 한 사람이 당첨!"
      />
    `;
  }

  const who = order[turnPos];
  return html`
    <div ref=${stageRef} style=${styles.gameStage}>
      <${TurnBanner} label=${phase === "popped" ? "걸렸다!" : "지금 차례"} player=${players[who]} index=${who} />
      <${TurnStrip} players=${players} order=${order} current=${turnPos} />
      <${ThreeView}
        label="해적 통 — 좌우로 밀어 돌리고 구멍을 눌러 칼을 꽂아요"
        build=${(THREE, el) => buildPirateScene(THREE, el, { holes, onHole: (i) => onHoleRef.current(i) })}
        onReady=${(api) => (scene.current = api)}
      />
      <p style=${styles.hint}>
        ${phase === "popped"
          ? "해적이 튀어나왔어요!"
          : `통을 좌우로 밀어 돌리고, 구멍을 눌러 칼을 꽂으세요 · 두 손가락으로 확대 · 남은 구멍 ${left}개`}
      </p>
    </div>
  `;
}
