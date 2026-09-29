/*
 * 악어이빨 3D 장면 — 실제 "악어 이빨" 장난감처럼 매끈한 초록 플라스틱 악어.
 * 둥근 돔 모양 윗턱·아래턱, 빨간 입안, 잇몸에 박힌 네모난 이빨(위아래 같은 모양), 큰 눈, 작은 몸.
 * 아래 이빨을 누르면 onTooth(번호). 누른 이빨은 잇몸 속으로 들어가고, 아픈 이빨이면 윗턱이 닫힌다(snap).
 * 좌우로 밀면 악어가 돌아가고(±70°), 두 손가락·휠·버튼으로 확대한다. 눈은 늘 카메라(보는 사람)를 본다.
 * 물 때는 입을 더 크게 벌렸다가 쾅 닫히며 머리가 앞으로 튀어나오고, 표정이 사나워진다
 * (찡그린 눈꺼풀 · 세로로 가늘어진 노란 눈 · 내려온 눈썹 · 벌름거리는 콧구멍 · 입 밖으로 드러난 송곳니).
 * 어느 이빨이 아픈지는 이 장면이 모른다 — 게임 로직(CrocodileGame)이 정한다.
 */
import { createStage, easeOutCubic, easeInQuad, easeOutBack } from "./stage.js";

const OPEN = -0.72; // 윗턱 벌린 각도 (라디안)

// 턱은 위에서 보면 타원 (가로 반지름 RX, 앞뒤 반지름 RZ, 가운데 CZ)
const RX = 0.95;
const RZ = 1.15;
const CZ = 1.05;
const LIP = 0.07; // 입술 테두리 굵기
const PIVOT_Z = 0.8; // 좌우로 돌릴 때의 축 (입 가운데쯤)
const TURN_MAX = (70 * Math.PI) / 180;

export function buildCrocScene(THREE, container, { teeth, onTooth }) {
  const CAMERA = [0.6, 4.2, 4.6]; // 비스듬히 내려다봄 — 두 눈과 모든 이빨이 보인다
  const stage = createStage(THREE, container, { pos: CAMERA, target: [0, 0.6, 0.72], fov: 36 });
  const { scene } = stage;
  const mesh = (geo, mat, { shadow = true } = {}) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = shadow;
    m.receiveShadow = true;
    return m;
  };
  // 반짝이는 장난감 플라스틱
  const plastic = (color, o = {}) =>
    new THREE.MeshPhysicalMaterial({ color, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.25, ...o });
  const green = plastic(0x3fbf45);
  const greenDark = plastic(0x2e9e36);
  const red = plastic(0xd7282f, { roughness: 0.38, clearcoat: 0.4 });
  const tongueMat = plastic(0xe8474d, { roughness: 0.4, clearcoat: 0.4 });
  const white = plastic(0xfbfbf6, { roughness: 0.25, clearcoat: 0.8 });
  const yellow = plastic(0xf2c230);
  const black = plastic(0x15171c, { roughness: 0.2 });

  // 돌림판(turntable) 위에 악어를 올려, 입 가운데를 축으로 돈다
  const turntable = new THREE.Group();
  turntable.position.z = PIVOT_Z;
  scene.add(turntable);
  const croc = new THREE.Group();
  croc.position.z = -PIVOT_Z;
  turntable.add(croc);

  // 타원 둘레 점 — φ=0 이 앞(+z), 양옆으로 벌어진다
  const rimAt = (phi, sx, sz) => [sx * Math.sin(phi), CZ + sz * Math.cos(phi)];
  // 타원 판 (위를 보거나 아래를 보는)
  const ellipseDisc = (sx, sz, mat, up = true) => {
    const d = mesh(new THREE.CircleGeometry(1, 48), mat, { shadow: false });
    d.rotation.x = up ? -Math.PI / 2 : Math.PI / 2;
    d.scale.set(sx, sz, 1);
    return d;
  };
  // 둥근 입술 테두리
  const lipRing = (sx, sz) => {
    const r = mesh(new THREE.TorusGeometry(1, LIP / Math.min(sx, sz), 14, 72), green);
    r.rotation.x = Math.PI / 2;
    r.scale.set(sx, sz, Math.min(sx, sz));
    return r;
  };

  // ── 아래턱 (둥근 그릇) · 빨간 잇몸 · 혀 ─────────
  const LOWER_TOP = 0.42;
  // 바닥에 닿는 두툼한 받침 — 아래 모서리만 둥글게. 눌린 이빨이 속으로 들어가도 밖으로 비치지 않는다.
  const lowerProfile = [[0, 0], [0.9, 0], [0.96, 0.02], [0.995, 0.07], [1, 0.13], [1, LOWER_TOP]].map(
    ([r, y]) => new THREE.Vector2(r, y)
  );
  const lower = mesh(new THREE.LatheGeometry(lowerProfile, 72), green.clone());
  lower.material.side = THREE.DoubleSide;
  lower.scale.set(RX, 1, RZ);
  lower.position.set(0, 0, CZ);
  const lowerLip = lipRing(RX - LIP * 0.6, RZ - LIP * 0.6);
  lowerLip.position.set(0, LOWER_TOP, CZ);
  const gum = ellipseDisc(RX - LIP * 1.4, RZ - LIP * 1.4, red);
  gum.position.set(0, LOWER_TOP + 0.005, CZ);
  // 도톰한 혀 — 위가 볼록하게
  const tongue = mesh(new THREE.SphereGeometry(1, 40, 24), tongueMat);
  tongue.scale.set(0.4, 0.2, 0.6);
  tongue.position.set(0, LOWER_TOP - 0.05, CZ - 0.12);
  const throat = ellipseDisc(0.38, 0.14, plastic(0x6e1016, { roughness: 1, clearcoat: 0 }));
  throat.position.set(0, LOWER_TOP + 0.012, 0.12);
  croc.add(lower, lowerLip, gum, tongue, throat);

  // ── 이빨 — 잇몸에서 솟은 네모난 어금니 + 이빨을 감싼 잇몸 턱 ──
  const toothGeo = new THREE.LatheGeometry(
    [[0, -0.09], [0.1, -0.09], [0.1, 0.02], [0.094, 0.1], [0.08, 0.15], [0.05, 0.175], [0, 0.18]].map(
      ([x, y]) => new THREE.Vector2(x, y)
    ),
    4 // 네모난 단면
  );
  toothGeo.rotateY(Math.PI / 4);
  const collarGeo = new THREE.TorusGeometry(0.1, 0.035, 8, 20);
  collarGeo.rotateX(Math.PI / 2);

  const TEETH_SX = RX - 0.2;
  const TEETH_SZ = RZ - 0.2;
  // 앞을 중심으로 좌우 ±115° 안에만 늘어선다 — 경첩 쪽(뒤)은 벌린 윗턱에 가려 누르기 어려우므로 비운다
  const SPAN = Math.PI * 0.64;
  // 이빨이 많으면(20개) 간격을 위해 조금 작게
  const TOOTH_SCALE = teeth > 16 ? 0.86 : teeth > 13 ? 0.94 : 1;
  const phiOf = (k, count, span = SPAN) => -span + ((k + 0.5) / count) * span * 2;

  const toothMeshes = [];
  const anchors = []; // 화면 위치를 재는 기준점
  for (let k = 0; k < teeth; k++) {
    const phi = phiOf(k, teeth);
    const [x, z] = rimAt(phi, TEETH_SX, TEETH_SZ);
    const tooth = mesh(toothGeo, white.clone());
    tooth.scale.setScalar(TOOTH_SCALE);
    tooth.position.set(x, LOWER_TOP, z);
    tooth.rotation.y = phi; // 네모난 면이 입술을 따라 돈다
    const collar = mesh(collarGeo, red, { shadow: false });
    collar.position.set(x, LOWER_TOP + 0.005, z);
    const anchor = new THREE.Object3D();
    anchor.position.set(x, LOWER_TOP + 0.1, z);
    croc.add(tooth, collar, anchor);
    toothMeshes.push(tooth);
    anchors.push(anchor);
  }

  // ── 윗턱 (둥근 돔) — 뒤쪽 경첩을 축으로 열리고 닫힌다 ──
  const HINGE_Y = LOWER_TOP;
  const upper = new THREE.Group();
  upper.position.set(0, HINGE_Y, 0);
  upper.rotation.x = OPEN;
  croc.add(upper);
  const dome = mesh(new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), green);
  dome.scale.set(RX, 0.55, RZ);
  dome.position.set(0, 0, CZ);
  const upperLip = lipRing(RX - LIP * 0.6, RZ - LIP * 0.6);
  upperLip.position.set(0, 0, CZ);
  const palate = ellipseDisc(RX - LIP * 1.4, RZ - LIP * 1.4, red, false);
  palate.position.set(0, -0.005, CZ);
  upper.add(dome, upperLip, palate);

  // 윗니 — 아랫니와 같은 모양을 뒤집어서 입천장에 박는다 (누르지는 않음).
  // 경첩 가까이는 아랫니와 맞닿아 기둥처럼 보이므로 앞쪽에만 둔다.
  const upperCount = Math.max(10, teeth - 3);
  for (let k = 0; k < upperCount; k++) {
    const phi = phiOf(k, upperCount, Math.PI * 0.66);
    const [x, z] = rimAt(phi, TEETH_SX + 0.02, TEETH_SZ + 0.02);
    const tooth = mesh(toothGeo, white);
    tooth.rotation.set(Math.PI, -phi, 0);
    tooth.scale.setScalar(0.85);
    tooth.position.set(x, -0.005, z);
    const collar = mesh(collarGeo, red, { shadow: false });
    collar.position.set(x, -0.01, z);
    upper.add(tooth, collar);
  }

  // 송곳니 — 물 때 입 밖으로 드러나는 지그재그 이빨. 벌린 동안은 숨겨 두고(크기 0) 닫히면서 자라난다.
  // 윗니는 윗입술 바깥에서 아래로, 아랫니는 아랫입술 바깥에서 위로 — 서로 엇갈려 맞물린다.
  const fangGeo = new THREE.ConeGeometry(0.075, 0.24, 14);
  const fangs = [];
  const FANG_SPAN = Math.PI * 0.6;
  const UPPER_FANGS = 9;
  for (let k = 0; k < UPPER_FANGS; k++) {
    const phi = phiOf(k, UPPER_FANGS, FANG_SPAN);
    const [x, z] = rimAt(phi, RX + 0.02, RZ + 0.02);
    const f = mesh(fangGeo, white);
    f.rotation.x = Math.PI; // 아래를 향해
    f.position.set(x, -0.1, z);
    f.scale.setScalar(0.001);
    upper.add(f);
    fangs.push(f);
  }
  for (let k = 0; k < UPPER_FANGS - 1; k++) {
    const phi = phiOf(k + 0.5, UPPER_FANGS, FANG_SPAN); // 윗니 사이사이
    const [x, z] = rimAt(phi, RX + 0.02, RZ + 0.02);
    const f = mesh(fangGeo, white);
    f.position.set(x, LOWER_TOP + 0.1, z);
    f.scale.setScalar(0.001);
    croc.add(f);
    fangs.push(f);
  }

  // 콧구멍 — 주둥이 앞 위의 둥근 혹 두 개 (화나면 벌름거린다)
  const nostrils = [];
  for (const s of [-1, 1]) {
    const bump = mesh(new THREE.SphereGeometry(0.22, 24, 16), green);
    bump.scale.set(1, 0.8, 1);
    bump.position.set(0.24 * s, 0.3, 1.82);
    const nostril = mesh(new THREE.SphereGeometry(0.075, 16, 12), black, { shadow: false });
    nostril.scale.set(1, 0.7, 0.6);
    nostril.position.set(0.26 * s, 0.42, 1.97);
    nostril.rotation.x = -0.6;
    upper.add(bump, nostril);
    nostrils.push(nostril);
  }

  // 눈 — 윗턱 뒤쪽 위 초록 둔덕에 올라앉은 큰 동그란 눈 (까만 눈동자 + 반짝이).
  // 눈마다 눈꺼풀(반구)과 눈썹이 붙어 있다. 평소엔 숨겨 두고, 화나면 나타나 안쪽으로 기울어 덮는다.
  const eyeWhite = white.clone();
  const EYE_ANGRY = new THREE.Color(0xf4d23c);
  const EYE_CALM = eyeWhite.color.clone();
  const eyes = [];
  const lids = [];
  const brows = [];
  const pupils = [];
  for (const s of [-1, 1]) {
    // 입을 벌리면 주둥이 끝이 올라와 눈을 가리므로, 눈을 둔덕 위에 올려 주둥이 너머로 보이게 한다.
    const socket = mesh(new THREE.SphereGeometry(0.27, 28, 18), green);
    socket.scale.set(1, 1.35, 1);
    socket.position.set(0.4 * s, 0.56, 0.4);
    const eye = new THREE.Group();
    eye.position.set(0.4 * s, 0.86, 0.44);
    eye.add(mesh(new THREE.SphereGeometry(0.25, 32, 20), eyeWhite));
    const pupil = mesh(new THREE.SphereGeometry(0.13, 24, 16), black, { shadow: false });
    pupil.scale.set(1, 1, 0.4);
    pupil.position.set(0, 0, 0.2);
    const shine = mesh(
      new THREE.SphereGeometry(0.04, 12, 10),
      plastic(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.6 }),
      { shadow: false }
    );
    shine.position.set(0.045, 0.05, 0.25);
    const lid = mesh(new THREE.SphereGeometry(0.268, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), greenDark);
    lid.material = greenDark.clone();
    lid.material.side = THREE.DoubleSide;
    lid.rotation.set(-1.45, 0, 0); // 뒤로 젖혀 둠
    lid.userData.side = s;
    const brow = mesh(new THREE.SphereGeometry(1, 20, 12), greenDark);
    brow.scale.set(0.2, 0.05, 0.09);
    brow.position.set(0, 0.3, 0.08);
    brow.userData.side = s;
    eye.add(pupil, shine, lid, brow);
    upper.add(socket, eye);
    eyes.push(eye);
    lids.push(lid);
    brows.push(brow);
    pupils.push(pupil);
  }
  // 두 눈이 같은 방향(두 눈 가운데 → 카메라)을 나란히 본다 — 각자 카메라 한 점을 보면 사팔눈처럼 보인다.
  // 매 프레임 부르므로 악어를 돌리거나 확대해도 계속 보는 사람을 쳐다본다.
  const eyeA = new THREE.Vector3();
  const eyeB = new THREE.Vector3();
  const gaze = new THREE.Vector3();
  const aimEyes = () => {
    upper.updateWorldMatrix(true, true);
    eyes[0].getWorldPosition(eyeA);
    eyes[1].getWorldPosition(eyeB);
    gaze.copy(stage.camera.position).sub(eyeA.clone().add(eyeB).multiplyScalar(0.5)).normalize();
    eyes[0].lookAt(eyeA.add(gaze));
    eyes[1].lookAt(eyeB.add(gaze));
  };
  aimEyes();

  // 화난 표정 정도 (0 = 평소, 1 = 사나움)
  const setAngry = (a) => {
    lids.forEach((lid) => {
      lid.visible = a > 0.02;
      lid.rotation.set(-1.45 + 1.75 * a, 0, 0.5 * a * lid.userData.side);
    });
    brows.forEach((b) => {
      b.visible = a > 0.02;
      b.position.y = 0.3 - 0.07 * a;
      b.rotation.z = 0.55 * a * b.userData.side;
    });
    pupils.forEach((p) => p.scale.set(1 - 0.68 * a, 1 + 0.25 * a, 0.4));
    eyeWhite.color.lerpColors(EYE_CALM, EYE_ANGRY, a);
  };
  let angry = 0;
  setAngry(0);

  // ── 경첩 · 작은 몸 · 다리 · 꼬리 ────────────────
  const hinge = mesh(new THREE.CylinderGeometry(0.3, 0.3, RX * 2 - 0.1, 32), green);
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, HINGE_Y, 0.02);
  croc.add(hinge);
  for (const s of [-1, 1]) {
    const bolt = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.06, 24), yellow);
    bolt.rotation.z = Math.PI / 2;
    bolt.position.set((RX - 0.02) * s, HINGE_Y, 0.02);
    croc.add(bolt);
  }
  const body = mesh(new THREE.SphereGeometry(1, 32, 20), green);
  body.scale.set(0.72, 0.42, 0.7);
  body.position.set(0, 0.42, -0.55);
  const tail = mesh(new THREE.ConeGeometry(0.28, 0.9, 20), green);
  tail.rotation.x = -Math.PI / 2 - 0.25;
  tail.position.set(0, 0.3, -1.4);
  croc.add(body, tail);
  // 등 돌기 — 작은 둥근 혹
  for (let i = 0; i < 4; i++) {
    const b = mesh(new THREE.SphereGeometry(0.07, 12, 10), greenDark);
    b.position.set(0, 0.84 - i * 0.04, -0.35 - i * 0.22);
    croc.add(b);
  }
  // 짧은 다리 + 노란 발톱
  for (const [sx, z] of [[-1, -0.2], [1, -0.2], [-1, -0.85], [1, -0.85]]) {
    const leg = mesh(new THREE.SphereGeometry(0.2, 20, 14), green);
    leg.scale.set(1, 0.8, 1.2);
    leg.position.set(0.66 * sx, 0.16, z);
    croc.add(leg);
    for (let c = -1; c <= 1; c++) {
      const claw = mesh(new THREE.SphereGeometry(0.05, 12, 10), yellow);
      claw.position.set(0.7 * sx + c * 0.08, 0.05, z + 0.22);
      croc.add(claw);
    }
  }

  // ── 움직임 ─────────────────────────────────────
  let snapped = false;
  stage.onFrame((dt, t) => {
    aimEyes();
    if (angry > 0) nostrils.forEach((n, i) => n.scale.set(1 + 0.35 * Math.abs(Math.sin(t * 7 + i)), 0.7, 0.6));
    if (snapped) return;
    upper.rotation.x = OPEN + Math.sin(t * 1.5) * 0.015; // 숨쉬기
  });

  // 이빨이 화면에서 촘촘하므로, 누른 곳에서 가장 가까운(아직 안 누른) 이빨을 고른다.
  // 손가락 너비(약 30px) 안에 이빨이 없으면 무시. 악어를 돌려서 턱 뒤에 가려진 이빨은 고르지 않는다.
  const TAP_RADIUS = 30;
  const pressed = new Set();
  const ray = new THREE.Raycaster();
  const anchorPos = new THREE.Vector3();
  const visible = (k) => {
    anchors[k].getWorldPosition(anchorPos);
    const from = stage.camera.position;
    const dir = anchorPos.clone().sub(from);
    const dist = dir.length();
    ray.set(from, dir.normalize());
    const hit = ray.intersectObject(croc, true)[0];
    return !hit || hit.object === toothMeshes[k] || hit.distance > dist - 0.12;
  };
  stage.gestures({
    onDrag: (dx) => {
      turntable.rotation.y = Math.max(-TURN_MAX, Math.min(TURN_MAX, turntable.rotation.y + dx * 0.01));
    },
    onTap: (x, y) => {
      if (snapped) return;
      scene.updateMatrixWorld();
      let best = null;
      anchors.forEach((a, k) => {
        if (pressed.has(k)) return;
        const p = stage.project(a);
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < TAP_RADIUS && (!best || d < best.d) && visible(k)) best = { k, d };
      });
      if (best) onTooth(best.k);
    },
  });

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  return {
    dispose: stage.dispose,
    // 누른 이빨은 잇몸 속으로 쑥 들어간다
    press(k) {
      pressed.add(k);
      const tooth = toothMeshes[k];
      tooth.material.color.set(0xe6e6de);
      stage.tween(140, (e) => (tooth.position.y = LOWER_TOP - 0.13 * e), easeOutCubic);
    },
    // 아픈 이빨 — 입을 한 번 더 크게 벌렸다가(예비 동작) 쾅 닫히며 앞으로 튀어나온다. 표정이 사나워지고
    // 송곳니가 드러난다. 닫히는 순간 onChomp() (소리·진동·화면 번쩍임). 잠시 뒤 살짝 벌려 아픈 이빨(노랑)을 보여준다.
    async snap(bad, { onChomp } = {}) {
      snapped = true;
      const from = upper.rotation.x;
      const WIDE = -0.98;
      stage.tween(260, (e) => setAngry((angry = e)), easeOutCubic);
      await stage.tween(150, (e) => (upper.rotation.x = from + (WIDE - from) * e), easeOutCubic);
      await stage.tween(95, (e) => {
        upper.rotation.x = WIDE + (0.02 - WIDE) * e;
        fangs.forEach((f) => f.scale.setScalar(Math.max(0.001, e)));
      }, easeInQuad);
      onChomp?.();
      stage.shake(0.3, 560);
      // 보는 사람 쪽으로 머리를 들이민다
      stage.tween(520, (e) => {
        const b = Math.sin(Math.PI * Math.min(1, e * 1.6)) * (1 - 0.35 * e);
        turntable.position.z = PIVOT_Z + 0.5 * b;
        turntable.position.y = 0.12 * b;
        turntable.scale.setScalar(1 + 0.1 * b);
      });
      await stage.tween(260, (e) => (upper.rotation.x = 0.02 - 0.08 * Math.sin(Math.PI * e)));
      upper.rotation.x = 0;
      turntable.position.set(0, 0, PIVOT_Z);
      turntable.scale.setScalar(1);
      const tooth = toothMeshes[bad];
      tooth.material.color.set(0xf2b233);
      tooth.material.emissive.set(0x7a4a00);
      await wait(900);
      await stage.tween(420, (e) => (upper.rotation.x = -0.38 * e), easeOutBack);
    },
    toothScreen: (k) => stage.project(anchors[k]),
    // 테스트용
    turn: (rad) => (turntable.rotation.y = Math.max(-TURN_MAX, Math.min(TURN_MAX, rad))),
    getTurn: () => turntable.rotation.y,
    zoomBy: stage.zoomBy,
    getZoom: stage.getZoom,
  };
}
