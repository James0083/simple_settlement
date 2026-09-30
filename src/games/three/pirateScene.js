/*
 * 해적룰렛 3D 장면 — 나무 통(볼록한 판자 + 쇠띠 + 리벳) 둘레에 칼 구멍, 통 위로 머리를 내민 해적.
 * 통은 좌우로 밀어 돌리고, 구멍을 누르면 onHole(구멍 번호). 칼 꽂기·해적 발사는 api 로 부른다.
 * 어느 구멍이 함정인지는 이 장면이 모른다 — 게임 로직(PirateGame)이 정한다.
 */
import { createStage, canvasTexture, easeOutCubic } from "./stage.js";
import { SWORD_SOUND_MS } from "../sfx.js";

const H = 2; // 통 높이
const radiusAt = (y) => 0.9 + 0.13 * Math.sin((Math.PI * y) / H); // 가운데가 볼록

// 구멍을 줄마다 고르게 나눈다 (20개 이하는 2줄, 넘으면 3줄). 16·20·24개는 예전처럼 8+8 · 10+10 · 8+8+8.
function holeLayout(holes) {
  const ys = holes > 20 ? [0.55, 1.0, 1.45] : [0.68, 1.34];
  const base = Math.floor(holes / ys.length);
  const extra = holes % ys.length;
  return ys.map((y, r) => ({ y, count: base + (r < extra ? 1 : 0) }));
}

function drawWood(g, w, h) {
  const staves = 16;
  for (let i = 0; i < staves; i++) {
    const x0 = (i * w) / staves;
    const sw = w / staves;
    g.fillStyle = `hsl(${26 + Math.random() * 6}, ${50 + Math.random() * 10}%, ${34 + Math.random() * 9}%)`;
    g.fillRect(x0, 0, sw, h);
    for (let k = 0; k < 16; k++) {
      const gx = x0 + Math.random() * sw;
      g.strokeStyle = `rgba(55, 28, 10, ${0.08 + Math.random() * 0.14})`;
      g.lineWidth = 0.8 + Math.random() * 1.6;
      g.beginPath();
      g.moveTo(gx, 0);
      g.bezierCurveTo(gx + (Math.random() - 0.5) * 10, h * 0.33, gx + (Math.random() - 0.5) * 10, h * 0.66, gx + (Math.random() - 0.5) * 6, h);
      g.stroke();
    }
    // 옹이
    if (Math.random() < 0.35) {
      g.fillStyle = "rgba(50, 25, 8, 0.45)";
      g.beginPath();
      g.ellipse(x0 + sw / 2, Math.random() * h, 4, 9, 0, 0, Math.PI * 2);
      g.fill();
    }
    // 판자 사이 홈
    g.fillStyle = "rgba(25, 12, 4, 0.7)";
    g.fillRect(x0, 0, 3, h);
    g.fillStyle = "rgba(255, 220, 170, 0.12)";
    g.fillRect(x0 + 3, 0, 2, h);
  }
}

function drawSkull(g, w, h) {
  g.clearRect(0, 0, w, h);
  g.save();
  g.translate(w / 2, h / 2);
  g.fillStyle = "#F4F1E8";
  // 뼈 두 개 (X)
  for (const a of [Math.PI / 4, -Math.PI / 4]) {
    g.save();
    g.rotate(a);
    g.fillRect(-92, -11, 184, 22);
    for (const sx of [-92, 92]) for (const sy of [-11, 11]) {
      g.beginPath();
      g.arc(sx, sy, 15, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }
  // 해골
  g.beginPath();
  g.arc(0, -12, 54, 0, Math.PI * 2);
  g.fill();
  g.fillRect(-32, 24, 64, 34);
  g.globalCompositeOperation = "destination-out";
  for (const sx of [-21, 21]) {
    g.beginPath();
    g.arc(sx, -10, 15, 0, Math.PI * 2);
    g.fill();
  }
  g.beginPath();
  g.moveTo(0, 6);
  g.lineTo(-7, 20);
  g.lineTo(7, 20);
  g.fill();
  for (const sx of [-17, -6, 6, 17]) g.fillRect(sx - 3, 40, 6, 18);
  g.restore();
}

export function buildPirateScene(THREE, container, { holes, onHole }) {
  const stage = createStage(THREE, container, { pos: [0, 3.3, 5.7], target: [0, 1.3, 0], fov: 38 });
  const { scene } = stage;
  const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
  const mesh = (geo, mat, { shadow = true } = {}) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = shadow;
    m.receiveShadow = true;
    return m;
  };

  // ── 통 ─────────────────────────────────────────
  const barrel = new THREE.Group();
  scene.add(barrel);
  const wood = canvasTexture(THREE, 1024, 256, drawWood);
  const profile = [];
  for (let j = 0; j <= 24; j++) {
    const y = (j / 24) * H;
    profile.push(new THREE.Vector2(radiusAt(y), y));
  }
  const shell = mesh(
    new THREE.LatheGeometry(profile, 72),
    M(0xffffff, { map: wood, bumpMap: wood, bumpScale: 1.2, roughness: 0.75, side: THREE.DoubleSide })
  );
  barrel.add(shell);

  // 통 안쪽 어둠 — 해적 몸통은 이 아래에 숨어 있다
  const inside = mesh(new THREE.CircleGeometry(radiusAt(H - 0.1), 48), M(0x140b05, { roughness: 1 }), { shadow: false });
  inside.rotation.x = -Math.PI / 2;
  inside.position.y = H - 0.1;
  barrel.add(inside);

  const rim = mesh(new THREE.TorusGeometry(radiusAt(H), 0.055, 12, 72), M(0x6b4423, { roughness: 0.6 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = H;
  barrel.add(rim);

  const iron = M(0x3a3e48, { metalness: 0.75, roughness: 0.38 });
  const rivetGeo = new THREE.SphereGeometry(0.028, 10, 8);
  const band = (y) => {
    const r = radiusAt(y) + 0.012;
    const b = mesh(new THREE.TorusGeometry(r, 0.03, 10, 72), iron);
    b.rotation.x = Math.PI / 2;
    b.scale.z = 2.2; // 납작하고 넓은 띠
    b.position.y = y;
    barrel.add(b);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.13;
      const rv = mesh(rivetGeo, iron);
      rv.position.set((r + 0.025) * Math.sin(a), y, (r + 0.025) * Math.cos(a));
      barrel.add(rv);
    }
  };
  band(0.16);
  band(H - 0.2);
  const rows = holeLayout(holes);
  if (rows.length === 2) band(1.01);

  // ── 칼 구멍 ────────────────────────────────────
  const brass = M(0xb8893a, { metalness: 0.65, roughness: 0.35 });
  const dark = M(0x0b0603, { roughness: 1 });
  const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const holeGroups = [];
  const rimMats = [];
  const hitMeshes = [];
  const spots = rows.flatMap(({ y, count }, row) =>
    Array.from({ length: count }, (_, k) => ({ y, theta: ((k + (row % 2) * 0.5) / count) * Math.PI * 2 }))
  );
  for (let i = 0; i < holes; i++) {
    const { y, theta } = spots[i];
    const r = radiusAt(y);
    const g = new THREE.Group();
    g.position.set(r * Math.sin(theta), y, r * Math.cos(theta));
    g.rotation.y = theta; // 로컬 +z 가 바깥쪽
    const rimMat = brass.clone();
    rimMats.push(rimMat);
    const plate = mesh(new THREE.BoxGeometry(0.2, 0.28, 0.04), rimMat);
    const slot = mesh(new THREE.BoxGeometry(0.1, 0.19, 0.03), dark, { shadow: false });
    slot.position.z = 0.012;
    const hit = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.38), hitMat);
    hit.position.z = 0.06;
    hit.userData.hole = i;
    g.add(plate, slot, hit);
    barrel.add(g);
    holeGroups.push(g);
    hitMeshes.push(hit);
  }

  // ── 칼 ─────────────────────────────────────────
  const SWORD_IN = -0.24; // 다 꽂혔을 때 칼 위치 (가드가 구멍 판 바로 앞에 온다)
  const goldMat = M(0xe0b040, { metalness: 0.7, roughness: 0.3 });
  function makeSword(color) {
    const g = new THREE.Group();
    const plastic = M(color, { roughness: 0.32 });
    // 칼날이 통 밖으로 한 뼘쯤 나와 보이게
    const blade = mesh(new THREE.BoxGeometry(0.085, 0.024, 0.8), plastic);
    blade.position.z = -0.08; // -0.48 ~ 0.32
    const guard = mesh(new THREE.BoxGeometry(0.32, 0.055, 0.055), goldMat);
    guard.position.z = 0.34;
    const grip = mesh(new THREE.CylinderGeometry(0.036, 0.04, 0.24, 12), plastic);
    grip.rotation.x = Math.PI / 2;
    grip.position.z = 0.48;
    const pommel = mesh(new THREE.SphereGeometry(0.055, 12, 10), goldMat);
    pommel.position.z = 0.62;
    g.add(blade, guard, grip, pommel);
    g.scale.setScalar(1.15);
    return g;
  }

  // ── 해적 ───────────────────────────────────────
  const pirate = new THREE.Group();
  const skin = M(0xf1c19b, { roughness: 0.55 });
  const navy = M(0x26335e, { roughness: 0.8 });
  const black = M(0x17181c, { roughness: 0.45 });
  const brown = M(0x3b2314, { roughness: 0.9, side: THREE.DoubleSide });
  const stripes = canvasTexture(THREE, 64, 256, (g, w, h) => {
    for (let i = 0; i < 10; i++) {
      g.fillStyle = i % 2 ? "#F7F3EA" : "#D7263D";
      g.fillRect(0, (i * h) / 10, w, h / 10);
    }
  });
  const shirt = M(0xffffff, { map: stripes, roughness: 0.75 });

  for (const s of [-1, 1]) {
    const leg = mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.46, 16), navy);
    leg.position.set(0.13 * s, 0.42, 0);
    const boot = mesh(new THREE.CylinderGeometry(0.115, 0.12, 0.22, 16), black);
    boot.position.set(0.13 * s, 0.11, 0);
    const toe = mesh(new THREE.SphereGeometry(0.11, 16, 12), black);
    toe.scale.set(1, 0.6, 1.5);
    toe.position.set(0.13 * s, 0.05, 0.09);
    pirate.add(leg, boot, toe);
  }
  const hips = mesh(new THREE.CylinderGeometry(0.31, 0.29, 0.22, 24), navy);
  hips.position.y = 0.74;
  const belt = mesh(new THREE.CylinderGeometry(0.325, 0.325, 0.08, 24), black);
  belt.position.y = 0.86;
  const buckle = mesh(new THREE.BoxGeometry(0.13, 0.1, 0.03), goldMat);
  buckle.position.set(0, 0.86, 0.33);
  const torso = mesh(new THREE.CylinderGeometry(0.29, 0.325, 0.6, 24), shirt);
  torso.position.y = 1.19;
  const shoulders = mesh(new THREE.SphereGeometry(0.29, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), shirt);
  shoulders.scale.y = 0.45;
  shoulders.position.y = 1.48;
  pirate.add(hips, belt, buckle, torso, shoulders);

  const arms = [];
  for (const s of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(0.32 * s, 1.44, 0);
    arm.rotation.z = 0.32 * s;
    const sleeve = mesh(new THREE.CapsuleGeometry(0.085, 0.36, 6, 12), shirt);
    sleeve.position.y = -0.24;
    arm.add(sleeve);
    if (s < 0) {
      const hand = mesh(new THREE.SphereGeometry(0.095, 16, 12), skin);
      hand.position.y = -0.52;
      arm.add(hand);
    } else {
      const cuff = mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.09, 12), black);
      cuff.position.y = -0.5;
      const hook = mesh(
        new THREE.TorusGeometry(0.075, 0.018, 8, 20, Math.PI * 1.3),
        M(0xc9ccd4, { metalness: 0.9, roughness: 0.22 })
      );
      hook.position.set(0.02, -0.62, 0);
      hook.rotation.z = Math.PI * 0.85;
      arm.add(cuff, hook);
    }
    pirate.add(arm);
    arms.push(arm);
  }

  const neck = mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.12, 16), skin);
  neck.position.y = 1.56;
  pirate.add(neck);

  const head = new THREE.Group();
  head.position.y = 1.86;
  pirate.add(head);
  head.add(mesh(new THREE.SphereGeometry(0.34, 32, 24), skin));
  for (const s of [-1, 1]) {
    const ear = mesh(new THREE.SphereGeometry(0.07, 12, 10), skin);
    ear.scale.set(0.5, 1, 0.8);
    ear.position.set(0.33 * s, -0.01, 0);
    head.add(ear);
  }
  const earring = mesh(new THREE.TorusGeometry(0.04, 0.009, 8, 16), goldMat);
  earring.position.set(-0.35, -0.09, 0.01);
  earring.rotation.y = Math.PI / 2;
  head.add(earring);

  const nose = mesh(new THREE.SphereGeometry(0.07, 16, 12), M(0xe29a74, { roughness: 0.5 }));
  nose.position.set(0, -0.01, 0.335);
  head.add(nose);

  // 눈 (화면 왼쪽) + 눈썹
  const eye = mesh(new THREE.SphereGeometry(0.07, 16, 12), M(0xffffff, { roughness: 0.2 }));
  eye.position.set(-0.12, 0.09, 0.29);
  const pupil = mesh(new THREE.SphereGeometry(0.036, 12, 10), black);
  pupil.position.set(-0.12, 0.09, 0.355);
  const brow = mesh(new THREE.BoxGeometry(0.15, 0.035, 0.04), brown);
  brow.position.set(-0.12, 0.19, 0.3);
  brow.rotation.z = 0.18;
  head.add(eye, pupil, brow);

  // 안대 + 끈
  const patch = mesh(new THREE.CylinderGeometry(0.088, 0.088, 0.02, 20), black);
  patch.rotation.x = Math.PI / 2;
  patch.rotation.z = -0.35;
  patch.position.set(0.125, 0.09, 0.305);
  const strap = mesh(new THREE.TorusGeometry(0.345, 0.012, 8, 48), black);
  strap.rotation.set(Math.PI / 2 - 0.25, 0.38, 0);
  strap.position.y = 0.1;
  head.add(patch, strap);

  // 수염 · 콧수염 · 입
  const beard = mesh(new THREE.SphereGeometry(0.355, 32, 16, Math.PI * 0.05, Math.PI * 0.9, Math.PI * 0.55, Math.PI * 0.42), brown);
  head.add(beard);
  for (const s of [-1, 1]) {
    const tache = mesh(new THREE.CapsuleGeometry(0.03, 0.12, 4, 8), brown);
    tache.rotation.z = s * 1.2;
    tache.position.set(0.075 * s, -0.09, 0.33);
    head.add(tache);
  }
  const mouth = mesh(new THREE.TorusGeometry(0.05, 0.016, 8, 16, Math.PI), M(0x7a1f2b));
  mouth.rotation.z = Math.PI;
  mouth.position.set(0, -0.15, 0.36);
  head.add(mouth);

  // 삼각 모자 + 금테 + 해골 표시
  const crown = mesh(new THREE.SphereGeometry(0.33, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), black);
  crown.scale.y = 0.8;
  crown.position.y = 0.16;
  const brim = mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.05, 3), black);
  brim.position.y = 0.2;
  const trim = mesh(new THREE.TorusGeometry(0.7, 0.022, 6, 3), goldMat);
  trim.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  trim.position.y = 0.228;
  const skull = new THREE.Mesh(
    new THREE.PlaneGeometry(0.2, 0.2),
    new THREE.MeshStandardMaterial({ map: canvasTexture(THREE, 256, 256, drawSkull), transparent: true, roughness: 0.5 })
  );
  skull.position.set(0, 0.34, 0.265);
  skull.rotation.x = -0.6;
  head.add(crown, brim, trim, skull);

  // 몸 가운데를 축으로 돌도록 root 로 감싼다 (발끝 축으로 돌면 어색하다). 통보다 조금 작게.
  const SCALE = 0.78;
  const CENTER_Y = 1.1; // 해적 모델에서 몸 가운데 높이
  const root = new THREE.Group();
  root.scale.setScalar(SCALE);
  pirate.position.y = -CENTER_Y;
  root.add(pirate);
  scene.add(root);
  const HEAD_UP = (1.86 - CENTER_Y) * SCALE; // 몸 가운데 → 머리 가운데
  const IDLE_Y = H + 0.2 - HEAD_UP; // 머리가 통 윗면 바로 위로 나오게
  const LYING_Y = 0.33 * SCALE; // 옆으로 누웠을 때 몸 가운데 높이
  const LAND = new THREE.Vector3(1.25, LYING_Y, 1.0); // 통 오른쪽 앞 바닥
  // 누운 자세 — 머리는 오른쪽 뒤, 얼굴은 화면 쪽
  const LYING_ROT = { x: 0, y: Math.PI / 4, z: -Math.PI / 2 };
  const G = 16; // 중력
  const PEAK = 4.0; // 가장 높이 올라가는 몸 가운데 높이
  root.position.y = IDLE_Y;

  // ── 움직임 ─────────────────────────────────────
  let spin = 0; // 통 회전 관성 (프레임당 라디안)
  let dragAt = 0;
  // 발사: 움츠림(anticipate) → 비행(flight, 뒤로 한 바퀴 돌며 누운 자세로) → 착지(landed, 한 번 튕김)
  let pop = null;
  let onLanded = null; // pop() 이 돌려준 Promise 를 착지(튕김까지) 끝나면 푼다
  const smooth = (u) => u * u * (3 - 2 * u);

  stage.onFrame((dt, t) => {
    // 손을 뗀 뒤의 관성 (끄는 중에는 손가락을 그대로 따라간다)
    if (performance.now() - dragAt > 60 && Math.abs(spin) > 0.0001) {
      barrel.rotation.y += spin;
      spin *= Math.pow(0.02, dt);
    }
    if (!pop) {
      head.rotation.y = Math.sin(t * 1.3) * 0.35;
      head.rotation.z = Math.sin(t * 0.9) * 0.05;
      root.position.y = IDLE_Y + Math.sin(t * 2.2) * 0.012;
      return;
    }
    pop.t += dt;
    if (pop.phase === "anticipate") {
      // 0.14초 동안 쏙 움츠렸다가
      const k = Math.min(1, pop.t / 0.14);
      root.position.y = IDLE_Y - 0.08 * Math.sin((k * Math.PI) / 2);
      root.scale.set(SCALE * (1 + 0.06 * k), SCALE * (1 - 0.1 * k), SCALE * (1 + 0.06 * k));
      if (k >= 1) {
        const y0 = root.position.y;
        const vy = Math.sqrt(2 * G * (PEAK - y0));
        const T = (vy + Math.sqrt(vy * vy + 2 * G * (y0 - LAND.y))) / G;
        pop = { phase: "flight", t: 0, T, y0, v: new THREE.Vector3(LAND.x / T, vy, LAND.z / T) };
      }
      return;
    }
    if (pop.phase === "flight") {
      const { T, y0, v } = pop;
      const tt = Math.min(pop.t, T);
      const u = tt / T;
      root.position.set(v.x * tt, y0 + v.y * tt - 0.5 * G * tt * tt, v.z * tt);
      // 튀어나갈 때 길쭉하게 늘었다가 원래대로
      const stretch = 1 + 0.12 * Math.max(0, 1 - pop.t / 0.25);
      root.scale.set(SCALE / Math.sqrt(stretch), SCALE * stretch, SCALE / Math.sqrt(stretch));
      // 뒤로 한 바퀴 돌면서 누운 자세로 서서히 바뀐다 (끝에서 x 는 -2π, 즉 0 과 같은 자세)
      const e = smooth(u);
      root.rotation.set(LYING_ROT.x - Math.PI * 2 * e, LYING_ROT.y * e, LYING_ROT.z * e);
      // 올라갈 때는 팔을 번쩍, 내려올 땐 허우적
      arms.forEach((a, i) => (a.rotation.z = (i ? 1 : -1) * (u < 0.45 ? 2.5 : 1.6 + Math.sin(t * 18) * 0.35)));
      head.rotation.set(-0.3 * Math.sin(Math.PI * u), 0, 0);
      if (pop.t >= T) {
        pop = { phase: "landed", t: 0 };
        root.position.copy(LAND);
        root.rotation.set(LYING_ROT.x, LYING_ROT.y, LYING_ROT.z);
        stage.shake(0.07, 260);
      }
      return;
    }
    if (pop.phase === "landed") {
      // 한 번 통 튕기고 팔이 툭 떨어진다
      const k = Math.min(1, pop.t / 0.6);
      root.position.y = LAND.y + 0.22 * Math.abs(Math.sin(Math.PI * 1.5 * k)) * (1 - k);
      root.rotation.y = LYING_ROT.y + 0.12 * Math.sin(Math.PI * 3 * k) * (1 - k);
      arms.forEach((a, i) => (a.rotation.z = (i ? 1 : -1) * (1.6 - 1.0 * easeOutCubic(k))));
      if (k >= 1 && onLanded) {
        onLanded();
        onLanded = null;
      }
    }
  });

  stage.gestures({
    onDrag: (dx) => {
      spin = dx * 0.012;
      barrel.rotation.y += spin;
      dragAt = performance.now();
    },
    onTap: (x, y) => {
      const hit = stage.pick(x, y, [shell, ...hitMeshes.filter((h) => !h.userData.filled)]);
      const hole = hit?.object.userData.hole;
      if (hole !== undefined) onHole(hole);
    },
  });

  return {
    dispose: stage.dispose,
    // 칼 꽂기 — 밖에서 미끄러져 들어간다
    stab(hole, color) {
      hitMeshes[hole].userData.filled = true;
      const sword = makeSword(color);
      // 칼날을 세로로 세워 꽂는다 — 날이 위아래를 향하고 가드도 세로 (세로로 긴 구멍에 맞게)
      sword.rotation.z = Math.PI / 2;
      sword.rotation.x = (Math.random() - 0.5) * 0.1;
      holeGroups[hole].add(sword);
      // 칼날은 통 안으로 깊숙이 — 밖에는 칼날 끝 조금과 손잡이만 보인다
      // "스으윽-턱" 소리에 맞춰 천천히 밀려 들어가다가 끝에서 멈춘다
      stage.tween(SWORD_SOUND_MS, (k) => (sword.position.z = SWORD_IN + 0.7 * (1 - k)), (t) => t * t * (3 - 2 * t));
    },
    // 해적 발사 + 함정 구멍 빨갛게. 착지하면 풀리는 Promise 를 돌려준다.
    pop(trap) {
      rimMats[trap].color.set(0xe8503a);
      rimMats[trap].emissive.set(0x7a1a10);
      pop = { phase: "anticipate", t: 0 };
      stage.shake(0.16, 450);
      stage.zoomTo(1, 500); // 확대해 둔 상태여도 날아가는 해적이 다 보이게
      // 해적이 날아가 떨어지는 곳까지 보이게 카메라를 뒤로 뺀다
      stage.moveCamera([1.0, 4.3, 7.8], [0.75, 1.0, 0.3], 900);
      // 착지까지 끝나면 풀린다 — 느린 기기에서도 해적이 떨어지는 걸 다 보고 결과로 넘어가게
      return new Promise((resolve) => (onLanded = resolve));
    },
    // 테스트·접근성용: 구멍의 화면 위치와 앞면 여부
    holeScreen: (hole) => stage.project(holeGroups[hole]),
    rotate: (rad) => (barrel.rotation.y += rad),
    zoomBy: stage.zoomBy,
    getZoom: stage.getZoom,
  };
}
