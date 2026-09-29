/*
 * 게임 효과음(WebAudio 합성음 — 음원 파일 없음) · 진동. 소리는 기본 꺼짐 — 사용자가 켜면 기기에 기억한다.
 * 진동은 지원 기기(주로 Android)에서만 동작하고, 나머지에서는 아무 일도 하지 않는다.
 *
 * 모든 소리는 마스터 볼륨(master) 하나를 거친다. 소리 켬/끔은 이 볼륨만 올리고 내리므로
 * 게임 중간에 바꿔도 이미 나고 있는 소리(심장박동 · 룰렛 딱딱 소리 등)까지 바로 반영된다.
 * 짧은 효과음은 꺼져 있으면 아예 만들지 않고, 길게 이어지는 소리는 꺼져 있어도 조용히 흘려 두어
 * 중간에 켜면 바로 들린다. iOS 는 사용자 제스처 안에서 AudioContext 를 깨워야 하므로
 * 소리 켜기·게임 시작 버튼에서 unlockAudio() 를 부른다.
 */
import { load, save } from "./storage.js";

let soundOn = load("sound", false) === true;
let ctx = null;
const masters = new WeakMap();
const listeners = new Set();

export const isSoundOn = () => soundOn;
export function setSoundOn(on) {
  soundOn = on;
  save("sound", on);
  if (ctx) {
    const m = master(ctx);
    m.gain.cancelScheduledValues(ctx.currentTime);
    m.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.02);
  }
  if (on) unlockAudio();
  listeners.forEach((fn) => fn(on));
}
// 소리 켬/끔이 바뀌면 알림 (여러 곳의 토글 버튼을 맞추려고)
export function onSoundChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function ensureCtx() {
  ctx ??= new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}
function master(a) {
  let m = masters.get(a);
  if (!m) {
    m = a.createGain();
    m.gain.value = soundOn ? 1 : 0;
    m.connect(a.destination);
    masters.set(a, m);
  }
  return m;
}

// 잠든 실시간 AudioContext 깨우기 (녹음용 OfflineAudioContext 는 건드리지 않는다)
function wake(a) {
  if (soundOn && a.state === "suspended" && !(window.OfflineAudioContext && a instanceof OfflineAudioContext)) {
    a.resume().catch(() => {});
  }
}

export function unlockAudio() {
  try {
    wake(ensureCtx());
  } catch (e) {
    // 오디오를 못 쓰는 환경 — 무시
  }
}

// 짧은 효과음용: 소리가 꺼져 있으면 null. 길게 이어지는 소리(always)는 꺼져 있어도 만든다.
function audio(always = false) {
  if (!soundOn && !always) return null;
  try {
    const a = ensureCtx();
    wake(a);
    return a;
  } catch (e) {
    return null;
  }
}

const noop = () => {};

// 짧은 소리 하나 — 소리 켬일 때만, 실패하면 조용히 넘어간다. fn(a, 지금 시각, 출력)
function play(fn) {
  const a = audio();
  if (!a) return;
  try {
    fn(a, a.currentTime, master(a));
  } catch (e) {
    // 무시
  }
}

// ── 합성 도구 ───────────────────────────────────
const noiseBufs = new WeakMap();
function noiseBuffer(a) {
  let b = noiseBufs.get(a);
  if (!b) {
    b = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noiseBufs.set(a, b);
  }
  return b;
}

// 노이즈 (필터를 거쳐 at 초에 시작, len 초 동안 사라짐). 필터를 돌려줘 주파수를 움직일 수 있게.
function noise(a, out, at, len, vol, type, freq, q = 1, attack = 0.002) {
  const src = a.createBufferSource();
  src.buffer = noiseBuffer(a);
  const f = a.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, at);
  f.Q.value = q;
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + len);
  src.connect(f).connect(g).connect(out);
  src.start(at, Math.random() * 0.8);
  src.stop(at + len + 0.02);
  return { filter: f, gain: g };
}

// 음 하나 (주파수 f0 → f1 로 미끄러질 수 있음)
function tone(a, out, at, len, vol, type, f0, f1 = f0, attack = 0.004) {
  const osc = a.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, at);
  if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, at + len);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + len);
  osc.connect(g).connect(out);
  osc.start(at);
  osc.stop(at + len + 0.02);
  return osc;
}

// 소리를 거칠게 찌그러뜨리는 장치 (폭발 · 비명)
function shaper(a, k) {
  const ws = a.createWaveShaper();
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(k * x) / Math.tanh(k);
  }
  ws.curve = curve;
  return ws;
}

// 길게 이어지는 소리의 출력 — stop() 하면 부드럽게 줄이고 끊는다
function bus(a, vol = 1) {
  const g = a.createGain();
  g.gain.value = vol;
  g.connect(master(a));
  const stop = (fade = 0.15) => {
    try {
      g.gain.cancelScheduledValues(a.currentTime);
      g.gain.setValueAtTime(g.gain.value, a.currentTime);
      g.gain.linearRampToValueAtTime(0, a.currentTime + fade);
      setTimeout(() => g.disconnect(), fade * 1000 + 100);
    } catch (e) {
      // 무시
    }
  };
  return { out: g, stop };
}

export function beep(freq = 880, ms = 60, type = "square", volume = 0.04) {
  play((a, t, out) => tone(a, out, t, ms / 1000, volume, type, freq, freq, 0.002));
}

// ── 폭탄: 시계 "똑·딱" · 폭발 "펑!" ──────────────
let tickTock = false;
export function tick(urgent = false) {
  play((a, t, out) => {
    tickTock = !tickTock;
    const f = tickTock ? 3100 : 2300; // 똑(높음) · 딱(낮음) 번갈아
    noise(a, out, t, 0.035, urgent ? 0.5 : 0.35, "bandpass", f, 6);
    tone(a, out, t, 0.03, urgent ? 0.12 : 0.08, "sine", f / 2);
  });
}

// 폭발 — 순간 터지는 파열음 + 가슴을 치는 낮은 쿵 + 점점 어두워지며 사라지는 굉음
export function explosion(volume = 1) {
  play((a, t, master) => {
    // 전체를 한 번 더 줄여 최대 음량이 1을 넘지 않게(찢어지는 소리 방지)
    const out = a.createGain();
    out.gain.value = volume;
    out.connect(master);
    const dist = shaper(a, 3);
    const g = a.createGain();
    g.gain.value = 0.6;
    dist.connect(g).connect(out);
    // 굉음: 넓은 노이즈가 밝게 터졌다가 필터가 닫히며 "우르르" 사라진다
    const body = noise(a, dist, t, 1.9, 1.0, "lowpass", 5000, 0.7, 0.004);
    body.filter.frequency.exponentialRampToValueAtTime(900, t + 0.12);
    body.filter.frequency.exponentialRampToValueAtTime(140, t + 1.6);
    // 쿵
    tone(a, dist, t, 0.7, 1.0, "sine", 110, 32, 0.003);
    tone(a, dist, t, 0.25, 0.5, "triangle", 70, 40, 0.003);
    // 파열 순간의 "팍"
    noise(a, out, t, 0.07, 0.3, "highpass", 2500, 0.7, 0.001);
  });
}

// ── 터치 대결: 터치 "톡" · 카운트다운 "삐" ──────────
// side 0/1 로 음 높이를 달리해 두 사람의 연타가 섞여도 구분되게. 아주 짧게(빠른 연타에도 뭉개지지 않게).
export function tapPop(side = 0) {
  play((a, t, out) => {
    const f = side ? 1250 : 880;
    tone(a, out, t, 0.05, 0.16, "sine", f * 1.3, f, 0.001);
    noise(a, out, t, 0.012, 0.08, "bandpass", f * 2, 3, 0.0005);
  });
}

export function countBeep(go = false) {
  play((a, t, out) => {
    tone(a, out, t, go ? 0.35 : 0.14, go ? 0.22 : 0.16, "square", go ? 1320 : 660, go ? 1320 : 660, 0.002);
  });
}

// ── 룰렛: 구분선이 바늘을 "딱딱" 치는 소리 ───────
// times: 지금부터 몇 초 뒤에 칠지 목록 (원판이 느려지면 간격이 벌어진다). stop() 으로 멈춘다.
export function wheelClicks(times) {
  const a = audio(true);
  if (!a) return noop;
  try {
    const { out, stop } = bus(a);
    const t0 = a.currentTime + 0.02;
    times.forEach((s, i) => {
      const at = t0 + s;
      // 빠를 땐 가볍게, 느려질수록 또렷하게
      const gap = i ? s - times[i - 1] : 0.1;
      const vol = Math.min(0.55, 0.22 + gap * 0.8);
      noise(a, out, at, 0.018, vol, "bandpass", 2600, 2.5, 0.001);
      tone(a, out, at, 0.025, vol * 0.35, "triangle", 1500, 900, 0.001);
    });
    return stop;
  } catch (e) {
    return noop;
  }
}

// 멈췄을 때 "띵!"
export function chime() {
  play((a, t, out) => {
    [[1318.5, 0], [1760, 0.09]].forEach(([f, d]) => {
      tone(a, out, t + d, 0.6, 0.12, "sine", f);
      tone(a, out, t + d, 0.15, 0.04, "sine", f * 3);
    });
  });
}

// ── 악어: 긴장감 — 심장박동 "두-근" + 낮은 울림 ───
// 남은 이빨이 줄수록 setLevel(0→1) 로 박동이 빨라지고 울림이 짙어진다. { stop, setLevel }
export function tensionLoop() {
  const a = audio(true);
  const off = { stop: noop, setLevel: noop };
  if (!a) return off;
  try {
    const { out, stop } = bus(a);
    let level = 0;
    let alive = true;
    let timer = null;

    // 낮은 울림 — 살짝 어긋난 두 저음이 맥놀이를 만든다
    const drone = a.createGain();
    drone.gain.value = 0.0001;
    const lp = a.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 160;
    lp.Q.value = 3;
    lp.connect(drone).connect(out);
    const oscs = [55, 55.8, 82.4].map((f) => {
      const o = a.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      o.connect(lp);
      o.start();
      return o;
    });
    drone.gain.setTargetAtTime(0.05, a.currentTime, 0.8);

    const beat = (at, vol) => {
      tone(a, out, at, 0.16, vol, "sine", 70, 38, 0.006); // 두
      tone(a, out, at + 0.2, 0.14, vol * 0.7, "sine", 62, 36, 0.006); // 근
      noise(a, out, at, 0.05, vol * 0.25, "lowpass", 220);
    };
    const next = () => {
      if (!alive) return;
      beat(a.currentTime + 0.03, 0.5 + 0.3 * level);
      timer = setTimeout(next, (1.15 - 0.65 * level) * 1000); // 1.15초 → 0.5초 간격
    };
    timer = setTimeout(next, 300);

    return {
      stop: () => {
        alive = false;
        clearTimeout(timer);
        stop(0.25);
        setTimeout(() => oscs.forEach((o) => o.stop()), 400);
      },
      setLevel: (x) => {
        level = Math.max(0, Math.min(1, x));
        lp.frequency.setTargetAtTime(160 + 260 * level, a.currentTime, 0.3);
        drone.gain.setTargetAtTime(0.05 + 0.07 * level, a.currentTime, 0.3);
      },
    };
  } catch (e) {
    return off;
  }
}

// 이빨을 눌렀을 때 "딸깍" — 배경음과 따로 울린다 (배경음을 멈춰도 들린다)
export function toothClick() {
  play((a, t, out) => {
    noise(a, out, t, 0.03, 0.35, "bandpass", 1800, 3);
    tone(a, out, t, 0.05, 0.1, "square", 900, 500);
  });
}

// 악어가 무는 소리 "딱!" — 단단한 플라스틱 윗턱·아랫턱이 한 번에 맞부딪히는 짧고 날카로운 소리.
// 밝은 파열음 + 속이 빈 플라스틱 몸통의 짧은 울림, 뒤따르는 잔향 없이 딱 끊긴다.
export function chomp() {
  play((a, t, out) => {
    noise(a, out, t, 0.022, 0.9, "bandpass", 3200, 1.6, 0.0005); // 딱
    noise(a, out, t, 0.04, 0.5, "bandpass", 1300, 2.5, 0.0005);
    tone(a, out, t, 0.06, 0.35, "triangle", 950, 700, 0.0005); // 플라스틱 울림
    tone(a, out, t, 0.08, 0.3, "sine", 240, 150, 0.001); // 턱 무게
  });
}

// ── 사다리: 타는 동안만 실로폰 멜로디 ─────────────
const N = (semi) => 523.25 * 2 ** (semi / 12); // C5 기준 반음
// 사다리를 오르내리는 느낌 — 계단처럼 오르락내리락
const RUN = [0, 4, 7, 12, 11, 7, 4, 2, 5, 9, 12, 14, 12, 9, 5, 7, 11, 14, 19, 16];
let runUntil = 0;

function mallet(a, out, at, freq, vol) {
  // 실로폰 — 기음 + 높은 배음이 빨리 사라진다
  tone(a, out, at, 0.32, vol, "sine", freq);
  tone(a, out, at, 0.07, vol * 0.35, "sine", freq * 4);
}

// sec 초 동안 멜로디. 이미 흐르는 중이면(여러 명이 한꺼번에 타도) 겹쳐 울리지 않는다.
export function ladderRun(sec) {
  play((a, t, out) => {
    if (t < runUntil - 0.2) return;
    runUntil = t + sec;
    const STEP = 0.14;
    const count = Math.max(1, Math.floor(sec / STEP));
    for (let i = 0; i < count; i++) {
      mallet(a, out, t + i * STEP, N(RUN[i % RUN.length]), 0.1);
      if (i % 4 === 0) tone(a, out, t + i * STEP, 0.25, 0.06, "triangle", N(RUN[i % RUN.length] - 24));
    }
  });
}

// 통과 칸 도착 "띵동" (전체 공개로 여러 명이 동시에 도착해도 한 번만)
let passAt = -1;
export function ladderPass() {
  play((a, t, out) => {
    if (Math.abs(t - passAt) < 0.15) return;
    passAt = t;
    mallet(a, out, t, N(7), 0.1);
    mallet(a, out, t + 0.12, N(0), 0.1);
  });
}

// 당첨 칸 도착 "빰빠밤!" (같은 순간 여러 번 불려도 한 번만)
let fanfareAt = -1;
export function fanfare() {
  play((a, t, out) => {
    if (Math.abs(t - fanfareAt) < 0.15) return;
    fanfareAt = t;
    [[7, 0, 0.13], [12, 0.14, 0.13], [16, 0.3, 0.55]].forEach(([s, d, len]) => {
      tone(a, out, t + d, len, 0.1, "square", N(s));
      tone(a, out, t + d, len, 0.08, "triangle", N(s - 12));
    });
  });
}

// ── 해적: 칼 꽂기 "스으윽-턱" · 튀어나오기 "뽕" · 비명 "으아악!" ──
export const SWORD_SOUND_MS = 330; // "턱" 이 나는 순간 — 칼이 끝까지 들어가는 애니메이션과 맞춘다

export function swordIn() {
  play((a, t, out) => {
    const hit = t + SWORD_SOUND_MS / 1000;
    // 스으윽 — 칼날이 나무 구멍을 긁으며 들어가는 소리. "턱" 직전까지 점점 커지고 높아지다가 턱과 함께 멈춘다.
    const len = SWORD_SOUND_MS / 1000;
    const s = noise(a, out, t, len + 0.015, 0.4, "bandpass", 1300, 1.2, len - 0.02);
    s.filter.frequency.exponentialRampToValueAtTime(4000, hit);
    const s2 = noise(a, out, t, len + 0.015, 0.14, "highpass", 4500, 0.7, len - 0.02);
    s2.filter.frequency.exponentialRampToValueAtTime(8000, hit);
    // 턱 — 가드가 나무 통에 부딪히는 짧고 단단한 소리
    noise(a, out, hit, 0.045, 0.7, "bandpass", 700, 1.5, 0.001);
    tone(a, out, hit, 0.12, 0.55, "sine", 210, 95, 0.001);
    tone(a, out, hit, 0.07, 0.18, "triangle", 480, 420, 0.001); // 나무 울림
  });
}

// 해적이 튀어나오는 "펑!" — 통 안에서 뭔가 터지듯 짧고 둥근 파열음 + 낮은 쿵 (폭탄 폭발보다 짧고 가볍게)
export function popUp() {
  play((a, t, out) => {
    const body = noise(a, out, t, 0.35, 0.55, "lowpass", 2600, 0.8, 0.002);
    body.filter.frequency.exponentialRampToValueAtTime(260, t + 0.3);
    tone(a, out, t, 0.28, 0.5, "sine", 160, 48, 0.002); // 펑의 둥근 저음
    noise(a, out, t, 0.03, 0.22, "highpass", 3000, 0.7, 0.0005); // 터지는 순간
  });
}

// "으아악!" — 수염 난 아저씨의 굵고 낮은 목소리 합성: 톱니파 성대 + 남성 모음 공명(포먼트).
// 낮은 '으'(≈110Hz)에서 '아'로 벌어지며 음이 올라갔다가(≈210Hz) 떨어지고, 끝의 '악' 에서 뚝 끊긴다.
// 한 옥타브 아래 음(목 긁는 소리)과 불규칙한 떨림을 섞어 걸걸하게.
export function scream(delay = 0) {
  play((a, t0, out) => {
    const t = t0 + delay;
    const LEN = 1.1;
    const pitch = [
      [0, 95],
      [0.12, 125], // 으
      [0.34, 210], // 아— 치솟음
      [0.6, 190],
      [LEN, 140], // 악
    ];
    const voices = [
      ["sawtooth", 1, 1],
      ["sawtooth", 0.5, 0.35], // 한 옥타브 아래 — 걸걸한 목
    ].map(([type, ratio, gain]) => {
      const o = a.createOscillator();
      o.type = type;
      pitch.forEach(([d, f], i) => (i ? o.frequency.exponentialRampToValueAtTime(f * ratio, t + d) : o.frequency.setValueAtTime(f * ratio, t)));
      const g = a.createGain();
      g.gain.value = gain;
      o.connect(g);
      return { o, g, ratio };
    });
    // 떨림 — 규칙적인 떨림 + 불규칙한 흔들림
    const vib = a.createOscillator();
    vib.frequency.setValueAtTime(5, t);
    vib.frequency.linearRampToValueAtTime(7.5, t + LEN);
    const wob = a.createBufferSource();
    wob.buffer = noiseBuffer(a);
    const wobLp = a.createBiquadFilter();
    wobLp.type = "lowpass";
    wobLp.frequency.value = 14;
    voices.forEach(({ o, ratio }) => {
      const vd = a.createGain();
      vd.gain.value = 7 * ratio;
      vib.connect(vd).connect(o.frequency);
      const wd = a.createGain();
      wd.gain.value = 120 * ratio;
      wobLp.connect(wd).connect(o.frequency);
    });
    wob.connect(wobLp);

    // 소리 크기에 거친 떨림(목 긁힘) — 빠르고 불규칙한 진폭 흔들림
    const grit = a.createGain();
    grit.gain.value = 0.8;
    const gritSrc = a.createBufferSource();
    gritSrc.buffer = noiseBuffer(a);
    const gritLp = a.createBiquadFilter();
    gritLp.type = "lowpass";
    gritLp.frequency.value = 45;
    const gritDepth = a.createGain();
    gritDepth.gain.value = 0.9;
    gritSrc.connect(gritLp).connect(gritDepth).connect(grit.gain);

    const env = a.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.3, t + 0.07);
    env.gain.exponentialRampToValueAtTime(0.8, t + 0.34);
    env.gain.exponentialRampToValueAtTime(0.5, t + LEN - 0.08);
    env.gain.exponentialRampToValueAtTime(0.0001, t + LEN);
    const rough = shaper(a, 3);
    grit.connect(env).connect(rough).connect(out);

    // 남성 포먼트 — 으(F1 320 · F2 1250) → 아(F1 720 · F2 1150), F3 · F4 는 굵은 목소리 색
    [
      [320, 720, 6, 1],
      [1250, 1150, 8, 0.55],
      [2450, 2450, 10, 0.25],
      [3300, 3300, 12, 0.1],
    ].forEach(([f0, f1, q, v]) => {
      const bp = a.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.setValueAtTime(f0, t);
      bp.frequency.setValueAtTime(f0, t + 0.12);
      bp.frequency.exponentialRampToValueAtTime(f1, t + 0.28);
      bp.Q.value = q;
      const g = a.createGain();
      g.gain.value = v * 3.2;
      voices.forEach(({ g: vg }) => vg.connect(bp));
      bp.connect(g).connect(grit);
    });
    // 쉰 숨소리 (낮게)
    const breath = noise(a, env, t, LEN, 0.18, "bandpass", 1100, 0.9, 0.05);
    breath.filter.frequency.exponentialRampToValueAtTime(1600, t + LEN);
    // 끝의 "ㄱ" — 목이 막히는 짧은 딸깍
    noise(a, out, t + LEN - 0.01, 0.03, 0.2, "bandpass", 1000, 2, 0.001);

    const end = t + LEN + 0.05;
    voices.forEach(({ o }) => {
      o.start(t);
      o.stop(end);
    });
    vib.start(t);
    vib.stop(end);
    wob.start(t, Math.random());
    wob.stop(end);
    gritSrc.start(t, Math.random());
    gritSrc.stop(end);
  });
}

export function vibrate(pattern) {
  try {
    navigator.vibrate?.(pattern);
  } catch (e) {
    // 미지원 — 무시
  }
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// 소리 확인용: 실시간 대신 주어진 AudioContext(예: OfflineAudioContext)에 소리를 그린다.
// 녹음해서 파형·스펙트로그램을 살펴보거나 테스트 페이지에서 쓸 때만 부른다.
export function renderWith(context, fn) {
  const prev = ctx;
  const prevOn = soundOn;
  ctx = context;
  soundOn = true;
  try {
    fn();
  } finally {
    ctx = prev;
    soundOn = prevOn;
  }
}
