/*
 * 3D 게임 무대 — Three.js 를 게임을 열 때만 불러오고(loadThree), 공통 조명·그림자·크기 조절·
 * 탭/드래그 입력·확대(두 손가락·휠·버튼)·카메라 흔들림·트윈을 제공한다. 장면(해적 통·악어)은 이 위에 모델만 올린다.
 */
let threePromise = null;

// 한 번만 불러오고, 실패하면 다음에 다시 시도할 수 있게 비운다.
export function loadThree() {
  threePromise ??= import("three").catch((e) => {
    threePromise = null;
    throw e;
  });
  return threePromise;
}

export const easeOutCubic = (t) => 1 - (1 - t) ** 3;
export const easeInQuad = (t) => t * t;
export const easeOutBack = (t) => {
  const c = 1.9;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
};

// 캔버스에 그린 그림을 텍스처로
export function canvasTexture(THREE, w, h, draw, { repeat, color = true } = {}) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const tex = new THREE.CanvasTexture(c);
  if (color) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  return tex;
}

export function createStage(THREE, container, { pos, target, fov = 38 }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const canvas = renderer.domElement;
  Object.assign(canvas.style, { display: "block", width: "100%", height: "100%", touchAction: "none" });
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
  const basePos = new THREE.Vector3(...pos);
  const lookAt = new THREE.Vector3(...target);
  camera.position.copy(basePos);
  camera.lookAt(lookAt);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9bfcc, 1.5));
  const sun = new THREE.DirectionalLight(0xffffff, 2.6);
  sun.position.set(3, 7, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 25 });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xfff1e0, 0.7);
  fill.position.set(-4, 3, 3);
  scene.add(fill);

  // 바닥은 그림자만 받는 투명 면 — 카드 배경 위에 물체가 놓인 것처럼 보인다
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.18 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const frames = new Set();
  // 확대: 카메라를 바라보는 점 쪽으로 당긴다. zoom 이 작을수록 가깝다 (0.55 ~ 1.35).
  const ZOOM_MIN = 0.55;
  const ZOOM_MAX = 1.35;
  let zoom = 1;
  const setZoom = (z) => (zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z)));
  let shakeAmp = 0;
  let shakeUntil = 0;
  let last = performance.now();
  renderer.setAnimationLoop((now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    frames.forEach((fn) => fn(dt, now / 1000));
    camera.position.copy(basePos).sub(lookAt).multiplyScalar(zoom).add(lookAt);
    if (now < shakeUntil) {
      const k = shakeAmp * ((shakeUntil - now) / 450);
      camera.position.x += (Math.random() - 0.5) * k;
      camera.position.y += (Math.random() - 0.5) * k;
    }
    camera.lookAt(lookAt);
    renderer.render(scene, camera);
  });

  const resize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  const onFrame = (fn) => {
    frames.add(fn);
    return () => frames.delete(fn);
  };

  // ms 동안 update(0→1) 를 부른다
  const tween = (ms, update, ease = (t) => t) =>
    new Promise((resolve) => {
      let elapsed = 0;
      const off = onFrame((dt) => {
        elapsed += dt * 1000;
        const t = Math.min(1, elapsed / ms);
        update(ease(t));
        if (t >= 1) {
          off();
          resolve();
        }
      });
    });

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pick = (clientX, clientY, objects) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    // 드래그 직후 아직 그려지지 않은 프레임이 있어도 최신 위치로 맞춘다
    scene.updateMatrixWorld();
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects(objects, true)[0] ?? null;
  };

  // 물체의 화면 좌표 + 카메라를 얼마나 마주 보는지(facing, +z 가 앞면인 물체 기준)
  const project = (obj) => {
    const p = obj.getWorldPosition(new THREE.Vector3());
    const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(obj.getWorldQuaternion(new THREE.Quaternion()));
    const facing = normal.dot(basePos.clone().sub(p).normalize());
    const v = p.clone().project(camera);
    const r = canvas.getBoundingClientRect();
    return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height, facing };
  };

  // 탭(거의 안 움직이고 뗌)과 가로 드래그를 구분한다. 두 손가락이면 확대/축소(핀치) — 이때는 탭·드래그를 하지 않는다.
  // PC 에서는 마우스 휠로 확대/축소.
  const gestures = ({ onTap, onDrag }) => {
    const pts = new Map(); // pointerId -> { x, y }
    let down = null;
    let pinch = null; // { d0, z0 }
    const spread = () => {
      const [a, b] = [...pts.values()];
      return Math.hypot(a.x - b.x, a.y - b.y) || 1;
    };
    canvas.addEventListener("pointerdown", (e) => {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (err) {
        // 합성 이벤트 등 — 무시
      }
      if (pts.size === 2) {
        pinch = { d0: spread(), z0: zoom };
        down = null; // 두 번째 손가락이 닿으면 탭·드래그 취소
      } else if (pts.size === 1 && !pinch) {
        down = { id: e.pointerId, lx: e.clientX, moved: 0 };
      }
    });
    canvas.addEventListener("pointermove", (e) => {
      if (pts.has(e.pointerId)) pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pts.size >= 2) {
        setZoom(pinch.z0 * (pinch.d0 / spread()));
        return;
      }
      if (!down || e.pointerId !== down.id) return;
      const dx = e.clientX - down.lx;
      down.lx = e.clientX;
      down.moved += Math.abs(dx);
      if (down.moved > 6) onDrag?.(dx);
    });
    const up = (e, tap) => {
      pts.delete(e.pointerId);
      if (tap && down && e.pointerId === down.id && down.moved <= 6) onTap?.(e.clientX, e.clientY);
      if (e.pointerId === down?.id) down = null;
      if (pts.size === 0) pinch = null; // 핀치 뒤 남은 손가락을 떼도 탭으로 치지 않는다
    };
    canvas.addEventListener("pointerup", (e) => up(e, true));
    canvas.addEventListener("pointercancel", (e) => up(e, false));
    canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        setZoom(zoom * Math.exp(e.deltaY * 0.0015));
      },
      { passive: false }
    );
  };

  // 확대 버튼(＋/－)용 — 부드럽게 바꾼다. 결과 장면처럼 전체를 보여줘야 할 때는 zoomTo(1).
  const zoomTo = (z, ms = 220) => {
    const z0 = zoom;
    const z1 = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
    return tween(ms, (k) => (zoom = z0 + (z1 - z0) * k), easeOutCubic);
  };
  const zoomBy = (f) => zoomTo(zoom * f);

  // 카메라를 부드럽게 옮긴다 (결과 장면을 넓게 보여줄 때)
  const moveCamera = (pos, target, ms = 700) => {
    const p0 = basePos.clone();
    const t0 = lookAt.clone();
    const p1 = new THREE.Vector3(...pos);
    const t1 = new THREE.Vector3(...target);
    return tween(ms, (k) => {
      basePos.lerpVectors(p0, p1, k);
      lookAt.lerpVectors(t0, t1, k);
    }, easeOutCubic);
  };

  const shake = (amp = 0.12, ms = 450) => {
    shakeAmp = amp;
    shakeUntil = performance.now() + ms;
  };

  const dispose = () => {
    renderer.setAnimationLoop(null);
    ro.disconnect();
    scene.traverse((o) => {
      o.geometry?.dispose();
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      mats.forEach((m) => {
        Object.values(m).forEach((v) => v?.isTexture && v.dispose());
        m.dispose();
      });
    });
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };

  return {
    THREE, scene, camera, renderer, onFrame, tween, pick, project, gestures, shake, moveCamera, zoomTo, zoomBy,
    getZoom: () => zoom,
    dispose,
  };
}
