/*
 * 딱정산 컬러 팔레트 — 여러 형식으로 한 번에 만든다. 색을 바꾸면 이 파일의 데이터만 고치고 다시 실행한다.
 *   node admin/brand/build-palette.mjs
 * 만드는 파일 (admin/brand/):
 *   ddakjeongsan-palette.html   브라우저로 여는 안내 페이지(인터넷 없이도 열림, 글꼴만 대체)
 *   ddakjeongsan-palette.pdf    인쇄 · 공유용 (A4)
 *   ddakjeongsan-palette.md     문서 · 노션 · GitHub 용
 *   ddakjeongsan-palette.png    이미지 한 장 (슬라이드 · 메신저 · SNS 작업용)
 *   ddakjeongsan-palette.svg    벡터 스와치 (Figma · Illustrator 에 끌어다 놓기)
 *   ddakjeongsan.ase            Adobe Swatch Exchange (Photoshop · Illustrator · InDesign 스와치)
 *   ddakjeongsan.gpl            GIMP · Inkscape · Krita 팔레트
 *   ddakjeongsan-tokens.json    디자인 토큰 (W3C DTCG 형식 — Figma Tokens Studio · Style Dictionary)
 *   ddakjeongsan-colors.css     CSS 변수
 * 색 값은 src/shared/styles.js · src/games/palette.js 와 같다(앱 코드가 원본).
 * PDF · PNG 는 테스트와 같은 방식으로 설치된 Chrome 을 playwright-core 로 연다(CHROME_PATH 로 경로 지정 가능).
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const OUT = fileURLToPath(new URL("./", import.meta.url));
const VERSION = "v2.10";
const UPDATED = "2026-10-22";

// ── 데이터 ─────────────────────────────────────────────
const CORE = [
  { id: "red", name: "딱정산 레드", en: "Ddak Red", hex: "#E8503A", fg: "#FFFFFF", tag: "ACCENT", role: "강조 · 주 버튼 · 당첨 도장 · 경고" },
  { id: "ink", name: "잉크 네이비", en: "Ink Navy", hex: "#1A1D29", fg: "#FFFFFF", tag: "INK", role: "기본 글씨 · 로고 · 앱 아이콘 바탕" },
  { id: "ground", name: "영수증 회색", en: "Receipt Gray", hex: "#EEF1F4", fg: "#1A1D29", tag: "GROUND", role: "페이지 바탕 · 브라우저 테마색" },
  { id: "paper", name: "화이트", en: "Paper White", hex: "#FFFFFF", fg: "#1A1D29", tag: "PAPER", role: "영수증 카드 · 반전 글씨" },
  { id: "green", name: "정산 그린", en: "Settle Green", hex: "#0F9D64", fg: "#FFFFFF", tag: "OK", role: "완료 · 받을 돈 · 성공" },
];
const GROUPS = [
  { id: "text", title: "글자 (진한 → 연한)", en: "Text", items: [
    { id: "ink", name: "잉크 네이비", hex: "#1A1D29", use: "제목 · 본문" },
    { id: "dim", name: "딤 그레이", hex: "#4B5165", use: "설명 문단" },
    { id: "sub", name: "서브 그레이", hex: "#5C6178", use: "보조 설명" },
    { id: "label", name: "라벨 그레이", hex: "#8A8FA3", use: "섹션 라벨 · 단위" },
    { id: "muted", name: "뮤트 그레이", hex: "#9AA0B0", use: "비활성 · 힌트 (작은 글씨엔 비추천)" },
  ]},
  { id: "surface", title: "면 · 선", en: "Surface", items: [
    { id: "soft", name: "소프트 면", hex: "#F6F8FB", use: "칩 · 게임 카드 바탕" },
    { id: "divider", name: "구분 면", hex: "#F0F2F6", use: "얇은 구분선" },
    { id: "border", name: "테두리", hex: "#E3E6EC", use: "카드 · 표 테두리" },
    { id: "input", name: "입력선", hex: "#DDE1E8", use: "입력칸 밑줄" },
    { id: "dashed", name: "점선", hex: "#C7CCD8", use: "점선 버튼 · 잠긴 카드" },
  ]},
  { id: "state", title: "상태 틴트", en: "State", items: [
    { id: "red-tint", name: "레드 틴트", hex: "#FDF0EC", use: "경고 · 당첨 줄 바탕" },
    { id: "red-line", name: "레드 라인", hex: "#F4C4B7", use: "경고 테두리" },
    { id: "red-deep", name: "딥 레드", hex: "#B8391F", use: "경고 글씨 · 버튼 그림자" },
    { id: "green-tint", name: "그린 틴트", hex: "#E6F7EF", use: "완료 바탕" },
    { id: "green-deep", name: "딥 그린", hex: "#0C6B4E", use: "완료 글씨" },
    { id: "yellow-tint", name: "옐로 틴트", hex: "#FFF8E1", use: "\"화면 가리기\" 안내 바탕" },
    { id: "yellow-deep", name: "딥 옐로", hex: "#7B5800", use: "안내 글씨" },
  ]},
];
// 미니게임 참가자 색 — [바탕, 이름 글씨] (src/games/palette.js 순서 그대로)
const PLAYERS = [
  ["#E8503A", "#FFFFFF"], ["#1A1D29", "#FFFFFF"], ["#0F9D64", "#FFFFFF"], ["#F2B233", "#1A1D29"], ["#3A6FE8", "#FFFFFF"],
  ["#8E5BD0", "#FFFFFF"], ["#F28C38", "#1A1D29"], ["#2BB5A8", "#1A1D29"], ["#C2185B", "#FFFFFF"], ["#9AA0B0", "#1A1D29"],
  ["#795548", "#FFFFFF"], ["#9CCC65", "#1A1D29"], ["#F48FB1", "#1A1D29"], ["#283593", "#FFFFFF"], ["#4FC3F7", "#1A1D29"],
];
const PLAYER_NAMES = ["민수", "지영", "현우", "수진", "도윤", "서연", "하준", "지아", "은우", "채원", "시우", "유나", "준서", "다인", "예준"];
const RATIO = [
  { pct: 45, hex: "#EEF1F4", fg: "#1A1D29", label: "영수증 회색 — 바탕" },
  { pct: 35, hex: "#FFFFFF", fg: "#1A1D29", label: "화이트 — 카드 · 영수증 종이" },
  { pct: 12, hex: "#1A1D29", fg: "#FFFFFF", label: "잉크 네이비 — 글씨 · 로고" },
  { pct: 6, hex: "#E8503A", fg: "#FFFFFF", label: "딱정산 레드 — 버튼 · 도장" },
  { pct: 2, hex: "#0F9D64", fg: "#FFFFFF", label: "정산 그린 — 완료 · 받을 돈" },
];
const PAIRS = [
  ["#1A1D29", "#EEF1F4", "본문 글씨 / 바탕"],
  ["#1A1D29", "#FFFFFF", "본문 글씨 / 카드"],
  ["#FFFFFF", "#1A1D29", "흰 글씨 / 네이비"],
  ["#4B5165", "#FFFFFF", "설명 글씨 / 카드"],
  ["#E8503A", "#1A1D29", "레드 글씨 / 네이비"],
  ["#FFFFFF", "#E8503A", "버튼 글씨 / 레드"],
  ["#E8503A", "#FFFFFF", "레드 글씨 / 카드"],
  ["#FFFFFF", "#0F9D64", "흰 글씨 / 그린"],
  ["#B8391F", "#FDF0EC", "경고 글씨 / 레드 틴트"],
  ["#8A8FA3", "#FFFFFF", "라벨 / 카드"],
  ["#9AA0B0", "#FFFFFF", "뮤트 / 카드"],
];
const RULES = [
  ["바탕은 영수증 회색이나 흰색.", "어두운 이미지가 필요하면 순검정 대신 잉크 네이비(#1A1D29)를 쓴다."],
  ["빨강은 한 군데만.", "핵심 문구 하나, 버튼 하나, 도장 하나처럼 시선이 갈 곳 한 곳에. 면적이 10%를 넘으면 경고 화면처럼 보인다."],
  ["초록은 \"끝났다 · 받는다\"에만.", "정산 완료, 받을 금액처럼 좋은 결과를 뜻할 때 쓴다."],
  ["모서리는 4~6px로 살짝만.", "앱의 카드 · 버튼은 영수증처럼 각진 편이다. 영수증 아래 지그재그 가장자리도 브랜드 요소다."],
  ["작은 글씨는 빨강 위에 올리지 않는다.", "흰 글씨 + 레드는 3.7 : 1이라 큰 글씨(24px 이상, 굵게 19px 이상)에만 쓴다."],
  ["인쇄할 때는 교정을 본다.", "모든 값은 화면용(sRGB)이다. 특히 레드는 인쇄 교정으로 한 번 확인한다."],
];

// ── 계산 ───────────────────────────────────────────────
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (h) => {
  const [r, g, b] = rgb(h).map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const verdict = (r) => (r >= 4.5 ? "모든 글씨" : r >= 3 ? "큰 글씨만" : "글씨엔 쓰지 않기");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// 모든 색을 이름과 함께 한 줄로 (중복 hex 는 앞의 이름을 쓴다)
const ALL = [
  ...CORE.map((c) => ({ group: "코어", key: `core.${c.id}`, name: c.name, hex: c.hex })),
  ...GROUPS.flatMap((g) => g.items.map((i) => ({ group: g.title.split(" (")[0], key: `${g.id}.${i.id}`, name: i.name, hex: i.hex }))),
  ...PLAYERS.map(([hex], i) => ({ group: "미니게임", key: `player.${i + 1}`, name: `플레이어 ${i + 1}`, hex })),
];

// ── HTML ───────────────────────────────────────────────
const LOGO = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19.5V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v7" /><path d="M5 19.5 6.6 18l1.6 1.5L9.8 18l1.6 1.5L13 19.2" /><path d="M8 7.5h6" /><path d="M8 10.75h6" /><path d="M8 14h4" /><path d="m13.3 14.7 2.6 2.6L20 11.2" /></svg>`;
const code = (label, value) =>
  `<button type="button" class="code" data-copy="${value}" aria-label="${label} ${value} 복사"><span>${value}</span><span class="k">${label}</span></button>`;

const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>딱정산 컬러 팔레트</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=Space+Grotesk:wght@500;700&display=swap">
<style>
  /* 레이아웃: 앱의 "영수증" 카드처럼 종이 위에 놓인 세로 한 장 — 코어 → 비율 → 단계 색 → 게임 색 → 대비 → 글꼴 → 규칙 */
  :root {
    --ground: #EEF1F4; --paper: #FFFFFF; --ink: #1A1D29; --ink-2: #4B5165; --ink-3: #8A8FA3;
    --rule: #E3E6EC; --soft: #F6F8FB; --accent: #E8503A; --ok: #0F9D64;
    --font-body: "Pretendard", "Noto Sans KR", -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
    --font-num: "Space Grotesk", "Pretendard", "Noto Sans KR", sans-serif;
    color-scheme: light;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--ground); color: var(--ink); font-family: var(--font-body); font-size: 15px; line-height: 1.65;
    -webkit-font-smoothing: antialiased; padding: 36px 16px 56px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sheet { max-width: 880px; margin: 0 auto; display: flex; flex-direction: column; gap: 22px; }
  .receipt { background: var(--paper); border-radius: 4px 4px 0 0; padding: 28px clamp(18px, 4vw, 36px) 30px; position: relative; break-inside: avoid; }
  .receipt::after { content: ""; position: absolute; left: 0; right: 0; bottom: -12px; height: 12px;
    background: linear-gradient(135deg, var(--paper) 8px, transparent 0) 0 0 / 16px 16px, linear-gradient(-135deg, var(--paper) 8px, transparent 0) 0 0 / 16px 16px; }
  .brandrow { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .logo { width: 46px; height: 46px; border-radius: 10px; background: #1A1D29; display: grid; place-items: center; flex-shrink: 0; }
  h1 { font-size: clamp(28px, 6vw, 40px); font-weight: 900; letter-spacing: -1.2px; margin: 0; line-height: 1.15; }
  .stamp { font-family: var(--font-num); font-size: 12px; font-weight: 700; letter-spacing: 1px; color: var(--accent);
    border: 2px solid var(--accent); border-radius: 4px; padding: 2px 8px; transform: rotate(-4deg); }
  .lede { color: var(--ink-2); margin: 14px 0 0; max-width: 62ch; }
  .meta { margin-top: 18px; display: flex; flex-wrap: wrap; gap: 8px 18px; font-size: 12.5px; color: var(--ink-3); border-top: 1px dashed var(--rule); padding-top: 14px; }
  .meta b { color: var(--ink-2); }
  h2 { font-size: 13px; font-weight: 700; letter-spacing: 1.5px; color: var(--ink-3); margin: 0 0 4px; }
  .h2sub { font-size: 20px; font-weight: 800; letter-spacing: -0.4px; margin: 0 0 18px; }
  p.note { color: var(--ink-2); font-size: 13.5px; margin: 14px 0 0; max-width: 68ch; }
  .core { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
  .chip { border: 1px solid var(--rule); border-radius: 6px; overflow: hidden; display: flex; flex-direction: column; min-width: 0; }
  .chip .fill { height: 108px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between; }
  .chip .fill .sample { font-weight: 900; font-size: 22px; letter-spacing: -0.5px; }
  .chip .fill .tag { font-size: 11px; font-weight: 700; letter-spacing: 0.5px; opacity: 0.85; }
  .chip .info { padding: 10px 12px 12px; display: flex; flex-direction: column; gap: 2px; }
  .chip .name { font-weight: 800; font-size: 14.5px; }
  .chip .en { font-size: 11.5px; color: var(--ink-3); font-family: var(--font-num); }
  .chip .role { font-size: 12px; color: var(--ink-3); line-height: 1.45; }
  .codes { margin-top: 8px; display: flex; flex-direction: column; gap: 4px; }
  .code { display: flex; justify-content: space-between; align-items: center; gap: 6px; width: 100%; font-family: var(--font-num); font-size: 12.5px;
    font-variant-numeric: tabular-nums; color: var(--ink); background: var(--soft); border: 1px solid transparent; border-radius: 4px; padding: 4px 8px; cursor: pointer; text-align: left; }
  .code:hover { border-color: var(--rule); }
  .code:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
  .code .k { color: var(--ink-3); font-size: 10.5px; font-family: var(--font-body); font-weight: 700; }
  .code.copied .k { color: var(--ok); }
  .ratio { display: flex; height: 64px; border-radius: 6px; overflow: hidden; border: 1px solid var(--rule); }
  .ratio > div { display: flex; align-items: flex-end; padding: 8px 10px; font-family: var(--font-num); font-size: 12px; font-weight: 700; min-width: 0; white-space: nowrap; overflow: hidden; }
  .ratio-legend { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 6px 18px; margin-top: 12px; font-size: 13px; color: var(--ink-2); }
  .ratio-legend span { font-family: var(--font-num); font-weight: 700; color: var(--ink); margin-right: 6px; }
  .groups { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 22px 28px; }
  .group h3 { font-size: 14px; font-weight: 800; margin: 0 0 10px; }
  .row { display: grid; grid-template-columns: 34px 1fr auto; gap: 10px; align-items: center; padding: 6px 0; border-bottom: 1px dashed var(--rule); }
  .row:last-child { border-bottom: none; }
  .dot { width: 34px; height: 34px; border-radius: 6px; border: 1px solid rgba(26,29,41,0.12); }
  .row .rn { font-size: 13px; font-weight: 700; line-height: 1.3; min-width: 0; }
  .row .rn small { display: block; font-weight: 400; color: var(--ink-3); font-size: 11.5px; }
  .row .code { width: auto; }
  .states { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; margin-top: 16px; }
  .state { border-radius: 6px; padding: 10px 12px; font-size: 13px; font-weight: 700; border: 1px solid; }
  .players { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 8px; }
  .player { border-radius: 4px; padding: 10px 10px 8px; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  .player .pn { font-weight: 900; font-size: 15px; letter-spacing: -0.3px; }
  .player .ph { font-family: var(--font-num); font-size: 11.5px; opacity: 0.9; background: none; border: none; color: inherit; padding: 0; text-align: left; cursor: pointer; }
  .tablewrap { overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; min-width: 520px; font-size: 13.5px; }
  th, td { text-align: left; padding: 9px 10px; border-bottom: 1px solid var(--rule); vertical-align: middle; }
  th { font-size: 11.5px; color: var(--ink-3); font-weight: 700; letter-spacing: 0.5px; }
  td.num { font-family: var(--font-num); font-variant-numeric: tabular-nums; font-weight: 700; white-space: nowrap; }
  td small { color: var(--ink-3); font-family: var(--font-num); }
  .pair { display: inline-flex; align-items: center; justify-content: center; min-width: 92px; height: 32px; padding: 0 10px; border-radius: 4px; font-weight: 800; font-size: 13px; border: 1px solid rgba(26,29,41,0.1); }
  .pill { display: inline-block; font-size: 11.5px; font-weight: 700; padding: 2px 8px; border-radius: 999px; white-space: nowrap; }
  .pill.pass { background: #E6F7EF; color: #0C6B4E; }
  .pill.big { background: #FFF3D6; color: #7B5800; }
  .pill.fail { background: #FDF0EC; color: #B8391F; }
  .fonts { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
  .font { border: 1px solid var(--rule); border-radius: 6px; padding: 14px 16px; min-width: 0; }
  .font .big { font-size: 34px; font-weight: 900; letter-spacing: -1px; line-height: 1.2; }
  .font .num { font-family: var(--font-num); font-size: 34px; font-weight: 700; letter-spacing: -1px; line-height: 1.2; }
  .font .fl { font-size: 12.5px; color: var(--ink-3); margin-top: 6px; }
  ul.rules { margin: 0; padding-left: 18px; color: var(--ink-2); font-size: 14px; display: grid; gap: 6px; }
  ul.rules b { color: var(--ink); }
  .files { font-size: 13px; color: var(--ink-2); display: grid; grid-template-columns: max-content 1fr; gap: 4px 14px; margin: 0; }
  .files dt { font-family: var(--font-num); font-weight: 700; color: var(--ink); }
  .files dd { margin: 0; }
  .toast { position: fixed; left: 50%; transform: translateX(-50%); bottom: 18px; background: var(--ink); color: var(--paper); font-size: 13px; font-weight: 700;
    padding: 8px 14px; border-radius: 6px; opacity: 0; transition: opacity 0.2s; pointer-events: none; }
  .toast.on { opacity: 1; }
  @media (prefers-reduced-motion: reduce) { .toast { transition: none; } }
  @media print {
    body { background: #FFFFFF; padding: 0; font-size: 13px; }
    .sheet { gap: 14px; max-width: none; }
    .receipt { padding: 18px 22px; border: 1px solid var(--rule); border-radius: 4px; }
    .receipt::after { display: none; }
    .toast { display: none; }
    .core { grid-template-columns: repeat(5, 1fr); gap: 8px; } /* A4 폭에서 4 + 1 로 끊기지 않게 */
    .chip .fill .sample { font-size: 18px; }
  }
</style>
</head>
<body>
<main class="sheet">
  <header class="receipt">
    <div class="brandrow">
      <div class="logo" aria-hidden="true">${LOGO}</div>
      <h1>딱정산 컬러 팔레트</h1>
      <span class="stamp">${VERSION}</span>
    </div>
    <p class="lede">딱정산 앱 코드(공용 스타일 · 미니게임 색 · 로고 · 앱 아이콘)에 실제로 쓰인 색을 그대로 뽑았습니다.
      영수증 종이 같은 밝은 회색 바탕에 남색 글씨, 그리고 도장처럼 찍히는 빨강 하나가 딱정산의 얼굴입니다. 화면에서는 색 코드를 누르면 복사돼요.</p>
    <div class="meta">
      <div><b>코어</b> ${CORE.length}색</div>
      <div><b>글자 · 면 · 선</b> ${GROUPS[0].items.length + GROUPS[1].items.length}단계</div>
      <div><b>상태</b> ${GROUPS[2].items.length}색</div>
      <div><b>미니게임 플레이어</b> ${PLAYERS.length}색</div>
      <div><b>기준</b> ${UPDATED} · sRGB</div>
    </div>
  </header>

  <section class="receipt">
    <h2>01 · 코어 컬러</h2>
    <p class="h2sub">브랜드를 만드는 다섯 가지 색</p>
    <div class="core">
      ${CORE.map((c) => `
      <div class="chip">
        <div class="fill" style="background:${c.hex}; color:${c.fg};${c.hex === "#FFFFFF" ? " border-bottom:1px solid #E3E6EC;" : ""}">
          <span class="tag">${c.tag}</span><span class="sample">딱정산</span>
        </div>
        <div class="info">
          <span class="name">${c.name}</span>
          <span class="en">${c.en}</span>
          <span class="role">${c.role}</span>
          <div class="codes">${code("HEX", c.hex)}${code("RGB", rgb(c.hex).join(", "))}</div>
        </div>
      </div>`).join("")}
    </div>
    <p class="note">앱 아이콘 · 로고는 <b>잉크 네이비 바탕 + 흰 선</b>, 브라우저 테마색과 앱 배경은 <b>영수증 회색</b>입니다.
      빨강은 "정산 계산하기" 버튼, 결과의 "당첨" 도장처럼 <b>한 화면에 하나</b>만 쓰는 강조색이에요.</p>
  </section>

  <section class="receipt">
    <h2>02 · 쓰는 비율</h2>
    <p class="h2sub">앱 화면에서 각 색이 차지하는 대략의 면적</p>
    <div class="ratio" role="img" aria-label="${RATIO.map((r) => `${r.label.split(" —")[0]} ${r.pct}%`).join(", ")}">
      ${RATIO.map((r, i) => `<div style="flex:${r.pct}; background:${r.hex}; color:${r.fg};${i === 1 ? " border-left:1px solid #E3E6EC;" : ""}">${r.pct >= 5 ? `${r.pct}%` : ""}</div>`).join("")}
    </div>
    <div class="ratio-legend">${RATIO.map((r) => `<div><span>${r.pct}%</span>${r.label}</div>`).join("")}</div>
    <p class="note">포스터 · SNS 이미지도 이 비율을 따르면 앱과 같은 인상이 납니다. 빨강 면적이 10%를 넘으면 경고 화면처럼 보이기 시작해요.</p>
  </section>

  <section class="receipt">
    <h2>03 · 글자 · 면 · 선 · 상태</h2>
    <p class="h2sub">회색 단계와 상태 색</p>
    <div class="groups">
      ${GROUPS.map((g) => `
      <div class="group">
        <h3>${g.title}</h3>
        ${g.items.map((i) => `
        <div class="row"><span class="dot" style="background:${i.hex}"></span><span class="rn">${esc(i.name)}<small>${esc(i.use)}</small></span>${code("HEX", i.hex)}</div>`).join("")}
      </div>`).join("")}
    </div>
    <div class="states">
      <div class="state" style="background:#FDF0EC; border-color:#F4C4B7; color:#B8391F;">⚠ 결제한 사람을 선택하세요</div>
      <div class="state" style="background:#E6F7EF; border-color:#C8E6C9; color:#0C6B4E;">✓ 정산 완료 · 송금 2번</div>
      <div class="state" style="background:#FFF8E1; border-color:#FFE082; color:#7B5800;">다른 분들은 화면을 보지 않도록 해주세요!</div>
    </div>
  </section>

  <section class="receipt">
    <h2>04 · 미니게임 플레이어 컬러</h2>
    <p class="h2sub">참가자 순서대로 돌아가며 쓰는 ${PLAYERS.length}색</p>
    <div class="players">
      ${PLAYERS.map(([bg, fg], i) => `<div class="player" style="background:${bg}; color:${fg};"><span class="pn">${i + 1} · ${PLAYER_NAMES[i]}</span><button type="button" class="ph" data-copy="${bg}" aria-label="${i + 1}번째 플레이어 색 ${bg} 복사">${bg}</button></div>`).join("")}
    </div>
    <p class="note">미니게임에서 사람을 구분하는 보조 팔레트입니다(1번째 참가자 = 빨강, 2번째 = 네이비 …). 이름 글씨색까지 짝으로 정해져 있어요.
      홍보물에서는 게임 · 이벤트처럼 <b>즐거운 분위기</b>가 필요한 곳에만 쓰고, 정산 기능 홍보에는 코어 색만 쓰는 걸 권해요.</p>
  </section>

  <section class="receipt">
    <h2>05 · 글자 대비</h2>
    <p class="h2sub">어떤 색 위에 어떤 글씨를 올려도 되는지</p>
    <div class="tablewrap"><table>
      <thead><tr><th>예시</th><th>글씨 / 바탕</th><th>대비</th><th>판정 (WCAG AA)</th></tr></thead>
      <tbody>
        ${PAIRS.map(([fg, bg, label]) => {
          const r = contrast(fg, bg);
          const cls = r >= 4.5 ? "pass" : r >= 3 ? "big" : "fail";
          return `<tr><td><span class="pair" style="color:${fg}; background:${bg};">₩19,000</span></td><td>${label}<br><small>${fg} / ${bg}</small></td><td class="num">${r.toFixed(2)} : 1</td><td><span class="pill ${cls}">${verdict(r)}</span></td></tr>`;
        }).join("")}
      </tbody>
    </table></div>
    <p class="note">흰 글씨 + 딱정산 레드는 3.7 : 1이라 <b>24px 이상이거나 굵은 19px 이상</b>일 때만 기준을 넘어요.
      작은 글씨를 빨강과 함께 써야 하면 잉크 네이비 바탕에 빨강 글씨(4.5 : 1)로 바꾸세요.</p>
  </section>

  <section class="receipt">
    <h2>06 · 함께 쓰는 글꼴</h2>
    <p class="h2sub">색과 짝을 이루는 두 글꼴</p>
    <div class="fonts">
      <div class="font"><div class="big">모임 비용, 딱!</div><div class="fl"><b>Pretendard</b> — 제목 · 본문 전부 (앱 기본 글꼴). 제목은 800~900 굵기, 자간 살짝 좁게</div></div>
      <div class="font"><div class="num">₩55,000</div><div class="fl"><b>Space Grotesk</b> — 금액 · 숫자 · 도장. 숫자 폭이 같은 tabular 숫자로</div></div>
    </div>
    <p class="note">Pretendard 가 설치돼 있지 않으면 Noto Sans KR(또는 기기 기본 글꼴)로 보여요. 디자인 작업에는 Pretendard 를 설치해서 쓰세요.</p>
  </section>

  <section class="receipt">
    <h2>07 · 홍보물에 쓸 때</h2>
    <p class="h2sub">지키면 앱과 같아 보이는 규칙</p>
    <ul class="rules">${RULES.map(([b, t]) => `<li><b>${esc(b)}</b> ${esc(t)}</li>`).join("")}</ul>
  </section>

  <section class="receipt">
    <h2>08 · 같은 팔레트, 다른 형식</h2>
    <p class="h2sub">이 폴더(admin/brand)의 파일</p>
    <dl class="files">
      <dt>.pdf</dt><dd>인쇄 · 공유용 (이 페이지와 같은 내용)</dd>
      <dt>.md</dt><dd>문서 · 노션 · GitHub</dd>
      <dt>.png · .svg</dt><dd>스와치 이미지 — 슬라이드 · Figma · Illustrator 에 그대로 넣기</dd>
      <dt>.ase</dt><dd>Adobe Photoshop · Illustrator · InDesign 스와치 불러오기</dd>
      <dt>.gpl</dt><dd>GIMP · Inkscape · Krita 팔레트</dd>
      <dt>-tokens.json</dt><dd>디자인 토큰 (W3C DTCG) — Figma Tokens Studio · Style Dictionary</dd>
      <dt>-colors.css</dt><dd>웹 작업용 CSS 변수</dd>
    </dl>
  </section>
</main>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script>
  const toast = document.getElementById("toast");
  let timer;
  const show = (msg) => { toast.textContent = msg; toast.classList.add("on"); clearTimeout(timer); timer = setTimeout(() => toast.classList.remove("on"), 1400); };
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    const value = btn.dataset.copy;
    const done = () => { btn.classList.add("copied"); setTimeout(() => btn.classList.remove("copied"), 1200); show(value + " 복사됨"); };
    const fallback = () => {
      const range = document.createRange();
      range.selectNodeContents(btn.querySelector("span") || btn);
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
      show("선택됐어요 — 복사해서 쓰세요");
    };
    try { navigator.clipboard.writeText(value).then(done, fallback); } catch (err) { fallback(); }
  });
</script>
</body>
</html>
`;

// ── Markdown ───────────────────────────────────────────
const md = `# 딱정산 컬러 팔레트

> ${VERSION} · ${UPDATED} 기준 · 모든 값은 화면용 sRGB. 원본은 앱 코드(\`src/shared/styles.js\` · \`src/games/palette.js\`)이고,
> 이 문서는 \`admin/brand/build-palette.mjs\` 가 만든다 — 색을 바꾸면 스크립트의 데이터를 고치고 다시 실행한다.

![딱정산 컬러 팔레트](ddakjeongsan-palette.png)

영수증 종이 같은 밝은 회색 바탕에 남색 글씨, 그리고 도장처럼 찍히는 빨강 하나가 딱정산의 얼굴이다.

## 1. 코어 컬러

| 이름 | 영문 | HEX | RGB | 쓰임 |
|---|---|---|---|---|
${CORE.map((c) => `| **${c.name}** | ${c.en} | \`${c.hex}\` | ${rgb(c.hex).join(", ")} | ${c.role} |`).join("\n")}

- 앱 아이콘 · 로고: 잉크 네이비 바탕 + 흰 선. 브라우저 테마색과 앱 배경: 영수증 회색.
- 빨강은 "정산 계산하기" 버튼, "당첨" 도장처럼 **한 화면에 하나**만 쓰는 강조색.

## 2. 쓰는 비율 (앱 화면 기준, 대략)

| 비율 | 색 |
|---:|---|
${RATIO.map((r) => `| ${r.pct}% | ${r.label} (\`${r.hex}\`) |`).join("\n")}

빨강 면적이 10%를 넘으면 경고 화면처럼 보이기 시작한다.

## 3. 글자 · 면 · 선 · 상태

${GROUPS.map((g) => `### ${g.title}

| 이름 | HEX | 쓰임 |
|---|---|---|
${g.items.map((i) => `| ${i.name} | \`${i.hex}\` | ${i.use} |`).join("\n")}`).join("\n\n")}

상태 조합: 경고 = 바탕 \`#FDF0EC\` + 테두리 \`#F4C4B7\` + 글씨 \`#B8391F\` · 완료 = 바탕 \`#E6F7EF\` + 테두리 \`#C8E6C9\` + 글씨 \`#0C6B4E\` · 안내 = 바탕 \`#FFF8E1\` + 테두리 \`#FFE082\` + 글씨 \`#7B5800\`

## 4. 미니게임 플레이어 컬러

참가자 순서대로 돌아가며 쓰는 보조 팔레트. 게임 · 이벤트 홍보에만 쓰고, 정산 기능 홍보에는 코어 색만 쓴다.

| 순서 | 바탕 | 이름 글씨 |
|---:|---|---|
${PLAYERS.map(([bg, fg], i) => `| ${i + 1} | \`${bg}\` | \`${fg}\` |`).join("\n")}

## 5. 글자 대비 (WCAG AA)

| 글씨 / 바탕 | 값 | 대비 | 판정 |
|---|---|---:|---|
${PAIRS.map(([fg, bg, label]) => `| ${label} | \`${fg}\` / \`${bg}\` | ${contrast(fg, bg).toFixed(2)} : 1 | ${verdict(contrast(fg, bg))} |`).join("\n")}

"큰 글씨"는 24px 이상, 또는 굵게 19px 이상.

## 6. 글꼴

- **Pretendard** — 제목 · 본문 전부 (앱 기본 글꼴). 제목은 800~900 굵기, 자간 살짝 좁게.
- **Space Grotesk** — 금액 · 숫자 · 도장. 숫자 폭이 같은 tabular 숫자로.

## 7. 홍보물에 쓸 때

${RULES.map(([b, t]) => `- **${b}** ${t}`).join("\n")}

## 8. 같은 팔레트, 다른 형식 (이 폴더)

| 파일 | 쓰는 곳 |
|---|---|
| \`ddakjeongsan-palette.html\` | 브라우저로 여는 안내 페이지 (색 코드 누르면 복사) |
| \`ddakjeongsan-palette.pdf\` | 인쇄 · 공유 |
| \`ddakjeongsan-palette.md\` | 이 문서 — 노션 · GitHub |
| \`ddakjeongsan-palette.png\` / \`.svg\` | 스와치 이미지 — 슬라이드 · Figma · Illustrator 에 그대로 |
| \`ddakjeongsan.ase\` | Adobe Photoshop · Illustrator · InDesign → 스와치 패널 → 스와치 불러오기 |
| \`ddakjeongsan.gpl\` | GIMP · Inkscape · Krita 팔레트 |
| \`ddakjeongsan-tokens.json\` | 디자인 토큰 (W3C DTCG) — Figma Tokens Studio · Style Dictionary |
| \`ddakjeongsan-colors.css\` | 웹 작업용 CSS 변수 |
`;

// ── CSS 변수 ───────────────────────────────────────────
const css = `/* 딱정산 컬러 팔레트 ${VERSION} (${UPDATED}) — admin/brand/build-palette.mjs 가 만든다. 원본은 src/shared/styles.js · src/games/palette.js */
:root {
${ALL.map((c) => `  --ddak-${c.key.replace(".", "-")}: ${c.hex}; /* ${c.name} */`).join("\n")}
}
`;

// ── 디자인 토큰 (W3C Design Tokens Community Group 형식) ──
const token = (hex, description) => ({ $type: "color", $value: hex, $description: description });
const tokens = {
  $description: `딱정산 컬러 팔레트 ${VERSION} (${UPDATED}) — admin/brand/build-palette.mjs 가 만든다`,
  core: Object.fromEntries(CORE.map((c) => [c.id, token(c.hex, `${c.name} (${c.en}) — ${c.role}`)])),
  ...Object.fromEntries(GROUPS.map((g) => [g.id, Object.fromEntries(g.items.map((i) => [i.id, token(i.hex, `${i.name} — ${i.use}`)]))])),
  player: Object.fromEntries(
    PLAYERS.map(([bg, fg], i) => [String(i + 1), { background: token(bg, `미니게임 ${i + 1}번째 참가자 바탕`), text: token(fg, `미니게임 ${i + 1}번째 참가자 이름 글씨`) }])
  ),
};

// ── GIMP 팔레트 ────────────────────────────────────────
const gpl = `GIMP Palette
Name: 딱정산 (Ddakjeongsan) ${VERSION}
Columns: 5
# ${UPDATED} — admin/brand/build-palette.mjs 가 만든다
${ALL.map((c) => `${rgb(c.hex).map((v) => String(v).padStart(3)).join(" ")}\t${c.name} ${c.hex}`).join("\n")}
`;

// ── Adobe Swatch Exchange (.ase) ───────────────────────
// 구조: "ASEF" · 버전 1.0 · 블록 수 → 그룹 시작(0xC001) · 색(0x0001) … · 그룹 끝(0xC002). 숫자는 빅 엔디언.
function ase(groups) {
  const blocks = [];
  const nameBuf = (name) => {
    const s = name + "\0";
    const b = Buffer.alloc(2 + s.length * 2);
    b.writeUInt16BE(s.length, 0);
    for (let i = 0; i < s.length; i++) b.writeUInt16BE(s.charCodeAt(i), 2 + i * 2);
    return b;
  };
  const block = (type, body) => {
    const head = Buffer.alloc(6);
    head.writeUInt16BE(type, 0);
    head.writeUInt32BE(body.length, 2);
    blocks.push(Buffer.concat([head, body]));
  };
  for (const g of groups) {
    block(0xc001, nameBuf(g.name));
    for (const c of g.colors) {
      const rest = Buffer.alloc(4 + 12 + 2);
      rest.write("RGB ", 0, "ascii");
      rgb(c.hex).forEach((v, i) => rest.writeFloatBE(v / 255, 4 + i * 4));
      rest.writeUInt16BE(2, 16); // 2 = normal (global 0 · spot 1)
      block(0x0001, Buffer.concat([nameBuf(`${c.name} ${c.hex}`), rest]));
    }
    block(0xc002, Buffer.alloc(0));
  }
  const head = Buffer.alloc(12);
  head.write("ASEF", 0, "ascii");
  head.writeUInt16BE(1, 4);
  head.writeUInt16BE(0, 6);
  head.writeUInt32BE(blocks.length, 8);
  return Buffer.concat([head, ...blocks]);
}
const aseGroups = [
  { name: "딱정산 코어", colors: CORE },
  ...GROUPS.map((g) => ({ name: `딱정산 ${g.title.split(" (")[0]}`, colors: g.items })),
  { name: "딱정산 미니게임", colors: PLAYERS.map(([hex], i) => ({ name: `플레이어 ${i + 1}`, hex })) },
];

// ── SVG 스와치 시트 (벡터) ──────────────────────────────
function svgSheet() {
  const W = 1200;
  const pad = 48;
  const font = `font-family="Pretendard, 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif"`;
  const num = `font-family="'Space Grotesk', Pretendard, 'Noto Sans KR', sans-serif"`;
  const parts = [];
  let y = pad;
  parts.push(`<rect width="${W}" height="HEIGHT" fill="#EEF1F4"/>`);
  parts.push(`<rect x="${pad}" y="${y}" width="56" height="56" rx="12" fill="#1A1D29"/>`);
  parts.push(`<g transform="translate(${pad + 12} ${y + 12}) scale(1.33)" fill="none" stroke="#FFFFFF" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19.5V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v7"/><path d="M5 19.5 6.6 18l1.6 1.5L9.8 18l1.6 1.5L13 19.2"/><path d="M8 7.5h6"/><path d="M8 10.75h6"/><path d="M8 14h4"/><path d="m13.3 14.7 2.6 2.6L20 11.2"/></g>`);
  parts.push(`<text x="${pad + 76}" y="${y + 40}" ${font} font-size="38" font-weight="900" fill="#1A1D29" letter-spacing="-1">딱정산 컬러 팔레트</text>`);
  parts.push(`<text x="${W - pad}" y="${y + 40}" ${num} font-size="16" font-weight="700" fill="#E8503A" text-anchor="end">${VERSION} · ${UPDATED}</text>`);
  y += 92;

  // 코어
  const cw = (W - pad * 2 - 4 * 16) / 5;
  CORE.forEach((c, i) => {
    const x = pad + i * (cw + 16);
    parts.push(`<rect x="${x}" y="${y}" width="${cw}" height="200" rx="8" fill="${c.hex}" stroke="#D5D9E2"/>`);
    parts.push(`<text x="${x + 16}" y="${y + 30}" ${font} font-size="13" font-weight="700" fill="${c.fg}" opacity="0.85">${c.tag}</text>`);
    parts.push(`<text x="${x + 16}" y="${y + 150}" ${font} font-size="22" font-weight="900" fill="${c.fg}">${c.name}</text>`);
    parts.push(`<text x="${x + 16}" y="${y + 178}" ${num} font-size="17" font-weight="700" fill="${c.fg}">${c.hex}</text>`);
  });
  y += 232;

  // 단계 색 — 세 묶음을 가로로
  const gw = (W - pad * 2 - 2 * 28) / 3;
  const rowH = 44;
  let maxRows = 0;
  GROUPS.forEach((g, gi) => {
    const x = pad + gi * (gw + 28);
    parts.push(`<text x="${x}" y="${y + 16}" ${font} font-size="15" font-weight="800" fill="#1A1D29">${g.title}</text>`);
    g.items.forEach((it, k) => {
      const ry = y + 32 + k * rowH;
      parts.push(`<rect x="${x}" y="${ry}" width="34" height="34" rx="6" fill="${it.hex}" stroke="#D5D9E2"/>`);
      parts.push(`<text x="${x + 46}" y="${ry + 15}" ${font} font-size="14" font-weight="700" fill="#1A1D29">${esc(it.name)}</text>`);
      parts.push(`<text x="${x + 46}" y="${ry + 32}" ${num} font-size="13" fill="#5C6178">${it.hex}</text>`);
    });
    maxRows = Math.max(maxRows, g.items.length);
  });
  y += 32 + maxRows * rowH + 24;

  // 미니게임
  parts.push(`<text x="${pad}" y="${y + 16}" ${font} font-size="15" font-weight="800" fill="#1A1D29">미니게임 플레이어 (참가자 순서대로)</text>`);
  y += 30;
  const pw = (W - pad * 2 - 14 * 8) / 15;
  PLAYERS.forEach(([bg, fg], i) => {
    const x = pad + i * (pw + 8);
    parts.push(`<rect x="${x}" y="${y}" width="${pw}" height="72" rx="4" fill="${bg}"/>`);
    parts.push(`<text x="${x + 8}" y="${y + 24}" ${num} font-size="15" font-weight="700" fill="${fg}">${i + 1}</text>`);
    parts.push(`<text x="${x + 8}" y="${y + 60}" ${num} font-size="10.5" fill="${fg}">${bg}</text>`);
  });
  y += 72 + pad;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${y}" viewBox="0 0 ${W} ${y}">\n${parts.join("\n").replace("HEIGHT", y)}\n</svg>\n`;
}

// ── 쓰기 ───────────────────────────────────────────────
const files = {
  "ddakjeongsan-palette.html": html,
  "ddakjeongsan-palette.md": md,
  "ddakjeongsan-colors.css": css,
  "ddakjeongsan-tokens.json": JSON.stringify(tokens, null, 2) + "\n",
  "ddakjeongsan.gpl": gpl,
  "ddakjeongsan-palette.svg": svgSheet(),
};
for (const [name, body] of Object.entries(files)) writeFileSync(OUT + name, body);
writeFileSync(OUT + "ddakjeongsan.ase", ase(aseGroups));

// PDF · PNG 는 Chrome 으로 그린다 (글꼴을 받아 오도록 잠깐 기다린다)
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" });
try {
  const page = await browser.newPage({ colorScheme: "light" });
  await page.goto("file://" + OUT + "ddakjeongsan-palette.html", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: OUT + "ddakjeongsan-palette.pdf", format: "A4", printBackground: true, margin: { top: "14mm", bottom: "14mm", left: "12mm", right: "12mm" } });

  const svg = files["ddakjeongsan-palette.svg"];
  const [, w, h] = svg.match(/width="(\d+)" height="(\d+)"/);
  const img = await browser.newPage({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: 2 });
  await img.setContent(`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&family=Space+Grotesk:wght@500;700&display=swap"><style>html,body{margin:0}svg{display:block}</style></head><body>${svg}</body></html>`, { waitUntil: "networkidle" });
  await img.evaluate(() => document.fonts.ready);
  await img.screenshot({ path: OUT + "ddakjeongsan-palette.png", fullPage: true });
} finally {
  await browser.close();
}
console.log(`admin/brand 에 ${Object.keys(files).length + 3}개 파일을 만들었다`);
