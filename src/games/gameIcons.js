/* SVG 게임 아이콘(viewBox 64×64) + 동물 레이스 동물 아이콘(viewBox 40×40, 오른쪽을 보는 옆모습) */
import { html } from "../shared/html.js";

// ── 게임 카드 아이콘 (viewBox 0 0 64 64) ─────────────────────

export function RouletteIcon({ size = 32 }) {
  return html`
    <svg xmlns="http://www.w3.org/2000/svg" width=${size} height=${size} viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="29" fill="#E8EAF0"/>
      <circle cx="32" cy="32" r="24" fill="#C62828"/>
      <circle cx="32" cy="32" r="17" fill="#EEE"/>
      <circle cx="32" cy="32" r="10" fill="#1565C0"/>
      <circle cx="32" cy="32" r="5" fill="#F9A825"/>
      <line x1="48" y1="16" x2="34" y2="30" stroke="#424242" stroke-width="2.5" stroke-linecap="round"/>
      <polygon points="34,30 30,26 31,24" fill="#9E9E9E"/>
      <line x1="48" y1="16" x2="53" y2="11" stroke="#E53935" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
  `;
}

export function LadderIcon({ size = 32 }) {
  return html`
    <svg xmlns="http://www.w3.org/2000/svg" width=${size} height=${size} viewBox="0 0 64 64">
      <rect x="16" y="6" width="7" height="52" rx="3" fill="#795548"/>
      <rect x="41" y="6" width="7" height="52" rx="3" fill="#795548"/>
      <rect x="16" y="16" width="32" height="5" rx="2.5" fill="#A1887F"/>
      <rect x="16" y="29" width="32" height="5" rx="2.5" fill="#A1887F"/>
      <rect x="16" y="42" width="32" height="5" rx="2.5" fill="#A1887F"/>
    </svg>
  `;
}

export function BombIcon({ size = 32 }) {
  return html`
    <svg xmlns="http://www.w3.org/2000/svg" width=${size} height=${size} viewBox="0 0 64 64">
      <circle cx="32" cy="38" r="22" fill="#212121"/>
      <path d="M32 16 Q40 8 48 12" stroke="#795548" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="48" cy="11" rx="4" ry="6" fill="#FF6F00" opacity="0.9"/>
      <ellipse cx="48" cy="10" rx="2.5" ry="4" fill="#FFEB3B"/>
      <ellipse cx="25" cy="30" rx="6" ry="4" fill="#424242" opacity="0.5"/>
    </svg>
  `;
}

/* 해적룰렛: 해적 깃발 (두개골 + 교차 뼈, 모두 깃발 안) */
export function PirateIcon({ size = 32 }) {
  return html`
    <svg xmlns="http://www.w3.org/2000/svg" width=${size} height=${size} viewBox="0 0 64 64">
      <rect x="8" y="4" width="5" height="56" rx="2.5" fill="#6D4C41"/>
      <rect x="13" y="6" width="46" height="38" fill="#212121"/>
      <!-- 교차 뼈 (두개골 뒤) -->
      <g fill="#FAFAFA">
        <line x1="22" y1="28" x2="50" y2="38" stroke="#FAFAFA" stroke-width="3" stroke-linecap="round"/>
        <line x1="22" y1="38" x2="50" y2="28" stroke="#FAFAFA" stroke-width="3" stroke-linecap="round"/>
        <circle cx="20.5" cy="29.3" r="2.2"/><circle cx="21.6" cy="26.1" r="2.2"/>
        <circle cx="50.4" cy="39.9" r="2.2"/><circle cx="51.5" cy="36.7" r="2.2"/>
        <circle cx="21.6" cy="39.9" r="2.2"/><circle cx="20.5" cy="36.7" r="2.2"/>
        <circle cx="51.5" cy="29.3" r="2.2"/><circle cx="50.4" cy="26.1" r="2.2"/>
      </g>
      <!-- 두개골 -->
      <circle cx="36" cy="19" r="8.5" fill="#FAFAFA"/>
      <rect x="31" y="23" width="10" height="7" rx="2" fill="#FAFAFA"/>
      <circle cx="32.6" cy="19.5" r="2.7" fill="#212121"/>
      <circle cx="39.4" cy="19.5" r="2.7" fill="#212121"/>
      <polygon points="36,22.3 34.8,24.8 37.2,24.8" fill="#212121"/>
      <line x1="34.3" y1="27" x2="34.3" y2="30" stroke="#212121" stroke-width="1"/>
      <line x1="37.7" y1="27" x2="37.7" y2="30" stroke="#212121" stroke-width="1"/>
    </svg>
  `;
}

/* 악어이빨: 전신 측면, 열린 입과 선명한 이빨 */
export function CrocodileIcon({ size = 32 }) {
  return html`
    <svg xmlns="http://www.w3.org/2000/svg" width=${size} height=${size} viewBox="0 0 64 64">
      <!-- 다리 (몸통보다 먼저 그려 이음새를 몸통이 덮음) -->
      <g stroke="#388E3C" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 38 L21 44.5 L26 45.5"/>
        <path d="M35 38 L35 44.5 L40 45.5"/>
      </g>
      <g stroke="#1B5E20" stroke-width="1.6" stroke-linecap="round">
        <line x1="25" y1="44" x2="29.5" y2="43.3"/><line x1="25" y1="45.7" x2="30" y2="46.1"/><line x1="25" y1="47.3" x2="29.2" y2="48.7"/>
        <line x1="39" y1="44" x2="43.5" y2="43.3"/><line x1="39" y1="45.7" x2="44" y2="46.1"/><line x1="39" y1="47.3" x2="43.2" y2="48.7"/>
      </g>
      <!-- 입 안 -->
      <polygon points="44,33 61,30.5 60,41 42,37" fill="#7B1F1F"/>
      <!-- 아래턱 (경첩이 머리와 겹침) -->
      <path d="M40 36 L60 41 Q62.5 42 61 44 L44 43.5 Q39 42.5 40 36 Z" fill="#2E7D32"/>
      <!-- 꼬리 + 몸통 + 머리 + 위턱 (한 덩어리) -->
      <path d="M3 33 Q10 28 18 27 C26 23 36 23 42 25 L50 25 Q58 25 62 28 L62 31 L44 34 L44 38 C38 43 26 44 18 41 Q10 38 3 33 Z" fill="#388E3C"/>
      <!-- 배 -->
      <ellipse cx="30" cy="39.3" rx="10" ry="2.6" fill="#81C784"/>
      <!-- 등 비늘 -->
      <g fill="#2E7D32">
        <polygon points="10.5,29.8 12,25.8 13.5,29.8"/>
        <polygon points="18,27.8 20,22.8 22,27.8"/>
        <polygon points="23,26.3 25,21.3 27,26.3"/>
        <polygon points="29,25.3 31,20.3 33,25.3"/>
        <polygon points="35,25.5 37,20.5 39,25.5"/>
      </g>
      <!-- 이빨 -->
      <g fill="#FFFFFF">
        <polygon points="47,33.5 49,33.2 48,36.6"/>
        <polygon points="52,32.7 54,32.3 53,35.6"/>
        <polygon points="57,31.8 59,31.5 58,34.6"/>
        <polygon points="49.5,38.2 51.5,38.8 50.5,35.4"/>
        <polygon points="54.5,39.6 56.5,40.2 55.5,36.8"/>
      </g>
      <!-- 콧구멍 -->
      <circle cx="59.5" cy="27.2" r="0.9" fill="#1B5E20"/>
      <!-- 눈 (머리 위 혹) -->
      <circle cx="46" cy="24" r="3.6" fill="#388E3C"/>
      <circle cx="46" cy="23.6" r="2.3" fill="#FFF59D"/>
      <ellipse cx="46.2" cy="23.6" rx="0.8" ry="1.8" fill="#1B1B1B"/>
    </svg>
  `;
}

/* 터치대결: 검지를 편 주먹 ☝️ (나머지 손가락은 위에서 아래로 접힘) */
export function TapBattleIcon({ size = 32 }) {
  return html`
    <svg xmlns="http://www.w3.org/2000/svg" width=${size} height=${size} viewBox="0 0 64 64">
      <!-- 손목 -->
      <rect x="22" y="50" width="20" height="12" rx="3" fill="#FFCC80"/>
      <!-- 검지 (주먹과 겹침) -->
      <rect x="18" y="8" width="11" height="32" rx="5.5" fill="#FFCC80"/>
      <!-- 주먹 (손등) -->
      <rect x="17" y="28" width="31" height="26" rx="9" fill="#FFCC80"/>
      <!-- 위에서 아래로 접힌 손가락 3개 (중지·약지·소지): 윗부분 마디, 아래로 말려 내려옴 -->
      <g fill="#FFCC80" stroke="#E69A4C" stroke-width="1.2">
        <rect x="29" y="29" width="7" height="19" rx="3.5"/>
        <rect x="36" y="30" width="6.5" height="18" rx="3.25"/>
        <rect x="42.5" y="32" width="5.5" height="15" rx="2.75"/>
      </g>
      <!-- 접힌 마디 주름 -->
      <g stroke="#E69A4C" stroke-width="1.1" stroke-linecap="round">
        <line x1="30.5" y1="36" x2="34.5" y2="36"/>
        <line x1="37.5" y1="36.5" x2="41" y2="36.5"/>
        <line x1="43.8" y1="37.5" x2="46.7" y2="37.5"/>
      </g>
      <!-- 엄지 (주먹 앞을 가로지름) -->
      <path d="M18 37 Q16 47 23 48.5 L33 48" stroke="#FFCC80" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M21 45.5 Q25 49 33 48" stroke="#E69A4C" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <!-- 검지 손톱·마디 -->
      <rect x="20" y="9.5" width="7" height="8" rx="3.5" fill="#FFE0B2"/>
      <line x1="20" y1="25" x2="27" y2="25" stroke="#E69A4C" stroke-width="1.2" stroke-linecap="round"/>
      <!-- 터치 효과 -->
      <g stroke="#FF8F00" stroke-width="2" stroke-linecap="round">
        <line x1="23.5" y1="4" x2="23.5" y2="1"/>
        <line x1="16" y1="6" x2="14" y2="4"/>
        <line x1="31" y1="6" x2="33" y2="4"/>
      </g>
    </svg>
  `;
}

export function FingerIcon({ size = 32 }) {
  return html`
    <svg xmlns="http://www.w3.org/2000/svg" width=${size} height=${size} viewBox="0 0 64 64">
      <rect x="10" y="6" width="44" height="52" rx="7" fill="#37474F"/>
      <rect x="13" y="10" width="38" height="44" rx="5" fill="#E3F2FD"/>
      <rect x="10" y="52" width="44" height="6" rx="4" fill="#37474F"/>
      <circle cx="24" cy="28" r="8" fill="#EF5350" opacity="0.85"/>
      <circle cx="40" cy="20" r="8" fill="#42A5F5" opacity="0.85"/>
      <circle cx="38" cy="38" r="8" fill="#66BB6A" opacity="0.85"/>
      <circle cx="21" cy="25" r="2.5" fill="white" opacity="0.5"/>
      <circle cx="37" cy="17" r="2.5" fill="white" opacity="0.5"/>
      <circle cx="35" cy="35" r="2.5" fill="white" opacity="0.5"/>
    </svg>
  `;
}

export function UpDownIcon({ size = 32 }) {
  return html`
    <svg xmlns="http://www.w3.org/2000/svg" width=${size} height=${size} viewBox="0 0 64 64">
      <rect x="8" y="14" width="48" height="36" rx="6" fill="#1A237E"/>
      <rect x="11" y="17" width="42" height="30" rx="4" fill="#0D47A1"/>
      <text x="32" y="37" font-size="20" font-weight="800" fill="#40C4FF"
        text-anchor="middle" font-family="monospace">??</text>
      <polygon points="32,6 26,14 38,14" fill="#F44336"/>
      <polygon points="32,58 26,50 38,50" fill="#4CAF50"/>
    </svg>
  `;
}

export function TenSecIcon({ size = 32 }) {
  return html`
    <svg xmlns="http://www.w3.org/2000/svg" width=${size} height=${size} viewBox="0 0 64 64">
      <circle cx="32" cy="36" r="24" fill="#ECEFF1"/>
      <circle cx="32" cy="36" r="24" fill="none" stroke="#B0BEC5" stroke-width="2"/>
      <circle cx="32" cy="36" r="20" fill="none" stroke="#CFD8DC" stroke-width="1.5"/>
      <rect x="28" y="8" width="8" height="6" rx="2" fill="#90A4AE"/>
      <rect x="26" y="11" width="12" height="3" rx="1.5" fill="#78909C"/>
      <rect x="16" y="9" width="6" height="4" rx="2" fill="#78909C"/>
      <line x1="32" y1="36" x2="32" y2="18" stroke="#F44336" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="32" y1="36" x2="44" y2="36" stroke="#37474F" stroke-width="2" stroke-linecap="round"/>
      <circle cx="32" cy="36" r="3" fill="#455A64"/>
      <line x1="32" y1="14" x2="32" y2="18" stroke="#607D8B" stroke-width="2"/>
      <line x1="50" y1="36" x2="46" y2="36" stroke="#607D8B" stroke-width="2"/>
      <line x1="14" y1="36" x2="18" y2="36" stroke="#607D8B" stroke-width="2"/>
      <line x1="32" y1="58" x2="32" y2="54" stroke="#607D8B" stroke-width="2"/>
    </svg>
  `;
}

export function RaceIcon({ size = 32 }) {
  return html`
    <svg xmlns="http://www.w3.org/2000/svg" width=${size} height=${size} viewBox="0 0 64 64">
      <rect x="4" y="4" width="56" height="56" rx="6" fill="#E8F5E9"/>
      <!-- 체커 패턴 -->
      <rect x="4" y="4" width="11" height="9" fill="#212121" opacity="0.85"/>
      <rect x="15" y="4" width="11" height="9" fill="white"/>
      <rect x="26" y="4" width="11" height="9" fill="#212121" opacity="0.85"/>
      <rect x="37" y="4" width="11" height="9" fill="white"/>
      <rect x="48" y="4" width="12" height="9" fill="#212121" opacity="0.85"/>
      <rect x="4" y="13" width="11" height="9" fill="white"/>
      <rect x="15" y="13" width="11" height="9" fill="#212121" opacity="0.85"/>
      <rect x="26" y="13" width="11" height="9" fill="white"/>
      <rect x="37" y="13" width="11" height="9" fill="#212121" opacity="0.85"/>
      <rect x="48" y="13" width="12" height="9" fill="white"/>
      <!-- 결승선 세로 줄 -->
      <rect x="4" y="22" width="56" height="2" fill="#388E3C" opacity="0.3"/>
      <!-- 거북이 (왼쪽, 뒤처짐) -->
      <ellipse cx="18" cy="46" rx="10" ry="7" fill="#388E3C"/>
      <circle cx="18" cy="40" r="4" fill="#43A047"/>
      <circle cx="22" cy="38" r="2" fill="#388E3C"/>
      <!-- 토끼 (오른쪽, 앞섬) -->
      <ellipse cx="46" cy="46" rx="9" ry="6" fill="#EEE"/>
      <circle cx="46" cy="40" r="4" fill="#F5F5F5"/>
      <ellipse cx="43" cy="34" rx="2" ry="5" fill="#EEE"/>
      <ellipse cx="49" cy="34" rx="2" ry="5" fill="#EEE"/>
      <circle cx="46" cy="40" r="1.5" fill="#F48FB1"/>
    </svg>
  `;
}

// ── 동물 레이스 동물 아이콘 (viewBox 0 0 40 40, 달리는 옆면) ──
// 모든 요소는 x: 0~40, y: 0~40 범위 내에 있어야 합니다.

function AnimalBase({ size, children }) {
  return html`
    <svg xmlns="http://www.w3.org/2000/svg" width=${size} height=${size} viewBox="0 0 40 40"
      style=${{ overflow: "visible" }}>
      <!-- 바닥 그림자 -->
      <ellipse cx="20" cy="37" rx="13" ry="2.5" fill="rgba(0,0,0,0.18)"/>
      ${children}
    </svg>
  `;
}

function Turtle({ size }) {
  return html`<${AnimalBase} size=${size}>
    <!-- 먼 다리 -->
    <rect x="13.5" y="30" width="4" height="6" rx="2" fill="#388E3C"/>
    <rect x="23.5" y="30" width="4" height="6" rx="2" fill="#388E3C"/>
    <!-- 몸 전체를 낮춰 다리를 짧게 -->
    <g transform="translate(0,3)">
    <!-- 꼬리 -->
    <path d="M8.5,25 L4,27.5 L8.5,28 Z" fill="#66BB6A"/>
    <!-- 목 -->
    <path d="M25,22 Q28,19.5 30,20.5 L30,25 Q27,26 25,26 Z" fill="#66BB6A"/>
    <!-- 머리 (오른쪽) -->
    <ellipse cx="31" cy="21" rx="5" ry="3.8" fill="#66BB6A"/>
    <!-- 눈·입 -->
    <circle cx="33" cy="19.8" r="1.1" fill="#212121"/>
    <circle cx="33.4" cy="19.4" r="0.35" fill="white"/>
    <path d="M35.8,22.3 Q34.5,23.2 33,22.9" stroke="#2E7D32" stroke-width="0.6" fill="none" stroke-linecap="round"/>
    </g>
    <!-- 가까운 다리 (굵고 짧은 기둥 + 발) -->
    <rect x="9.5" y="30" width="5" height="6" rx="2.5" fill="#66BB6A"/>
    <ellipse cx="12.5" cy="35.8" rx="3.2" ry="1.3" fill="#66BB6A"/>
    <rect x="21" y="30" width="5" height="6" rx="2.5" fill="#66BB6A"/>
    <ellipse cx="24" cy="35.8" rx="3.2" ry="1.3" fill="#66BB6A"/>
    <g transform="translate(0,3)">
    <!-- 등껍질 (반구형) -->
    <path d="M6.5,28 Q7,14 18.5,13.5 Q29.5,14 30.5,28 Z" fill="#2E7D32"/>
    <path d="M9,27 Q9.5,16.5 18.5,16 Q27.5,16.5 28,27 Z" fill="#388E3C"/>
    <!-- 껍질 무늬 -->
    <g fill="#1B5E20" opacity="0.4">
      <path d="M15,20 L22,20 L23.5,24 L13.5,24 Z"/>
      <circle cx="11.5" cy="24.5" r="1.6"/>
      <circle cx="25.5" cy="24.5" r="1.6"/>
    </g>
    <!-- 껍질 테두리 -->
    <rect x="6" y="26.8" width="25" height="2.6" rx="1.3" fill="#A5D6A7"/>
    </g>
  <//>`;
}

function Rabbit({ size }) {
  return html`<${AnimalBase} size=${size}>
    <!-- 외곽선 (흰 몸이 배경에 묻히지 않게) -->
    <g fill="#EEE" stroke="#BDBDBD" stroke-width="1.6">
      <ellipse cx="17" cy="26" rx="10" ry="8"/>
      <circle cx="29" cy="21" r="7"/>
      <ellipse cx="12" cy="34" rx="6" ry="2.5"/>
      <rect x="24" y="29" width="3.5" height="8" rx="1.75"/>
      <circle cx="7.5" cy="24" r="3.5"/>
    </g>
    <!-- 귀 (뒤로 누임) -->
    <ellipse cx="23" cy="12" rx="2.6" ry="6.5" fill="#EEE" stroke="#BDBDBD" stroke-width="0.8" transform="rotate(-25,23,12)"/>
    <ellipse cx="23" cy="12" rx="1.2" ry="4.5" fill="#F48FB1" transform="rotate(-25,23,12)"/>
    <!-- 채우기 (이음새 없이 한 덩어리) -->
    <g fill="#F5F5F5">
      <ellipse cx="17" cy="26" rx="10" ry="8"/>
      <circle cx="29" cy="21" r="7"/>
      <ellipse cx="12" cy="34" rx="6" ry="2.5" fill="#E8E8E8"/>
      <rect x="24" y="27" width="3.5" height="10" rx="1.75" fill="#E8E8E8"/>
      <circle cx="7.5" cy="24" r="3.5" fill="#FFFFFF"/>
    </g>
    <circle cx="31" cy="19" r="1.8" fill="#E91E63"/>
    <circle cx="31.5" cy="18.5" r="0.5" fill="white"/>
    <circle cx="35.5" cy="22" r="1" fill="#F48FB1"/>
  <//>`;
}

function Dog({ size }) {
  return html`<${AnimalBase} size=${size}>
    <!-- 몸통 -->
    <ellipse cx="18" cy="26" rx="11" ry="8" fill="#A1887F"/>
    <!-- 꼬리 (위로 올라감) -->
    <path d="M8,24 Q3,17 8,13" stroke="#8D6E63" stroke-width="3" fill="none" stroke-linecap="round"/>
    <!-- 머리 -->
    <circle cx="30" cy="20" r="8" fill="#BCAAA4"/>
    <!-- 귀 (늘어진, 가까운 귀만 — 측면) -->
    <ellipse cx="24" cy="18" rx="4.5" ry="6" fill="#8D6E63" transform="rotate(-5,24,18)"/>
    <!-- 주둥이 -->
    <ellipse cx="36" cy="23" rx="4.5" ry="3.5" fill="#BCAAA4"/>
    <!-- 눈 -->
    <circle cx="31" cy="17" r="2" fill="#212121"/>
    <circle cx="31.5" cy="16.5" r="0.7" fill="white"/>
    <!-- 코 -->
    <ellipse cx="38" cy="22" rx="2" ry="1.5" fill="#212121"/>
    <!-- 다리 -->
    <rect x="9" y="30" width="4" height="7" rx="2" fill="#A1887F"/>
    <rect x="15" y="30" width="4" height="7" rx="2" fill="#A1887F"/>
    <rect x="22" y="30" width="4" height="7" rx="2" fill="#8D6E63"/>
    <rect x="27" y="30" width="4" height="7" rx="2" fill="#8D6E63"/>
  <//>`;
}

function Cat({ size }) {
  return html`<${AnimalBase} size=${size}>
    <!-- 꼬리 (위로 말림) -->
    <path d="M8,24 Q3,19 5,13 Q6,10 9,10" stroke="#78909C" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <!-- 뒷다리 (먼 쪽) -->
    <rect x="9" y="28" width="3.2" height="9" rx="1.6" fill="#607D8B"/>
    <rect x="24" y="28" width="3.2" height="9" rx="1.6" fill="#607D8B"/>
    <!-- 몸통 (가늘고 긴) -->
    <ellipse cx="17.5" cy="25.5" rx="10.5" ry="5.8" fill="#90A4AE"/>
    <!-- 줄무늬 -->
    <g stroke="#607D8B" stroke-width="1.4" stroke-linecap="round" opacity="0.7">
      <path d="M13,20.5 Q12.5,23 13.5,25"/>
      <path d="M17,20 Q16.5,22.5 17.5,24.5"/>
      <path d="M21,20.3 Q20.5,22.8 21.5,24.8"/>
    </g>
    <!-- 앞다리 (가까운 쪽) -->
    <rect x="12" y="28" width="3.2" height="9" rx="1.6" fill="#90A4AE"/>
    <rect x="27" y="27" width="3.2" height="10" rx="1.6" fill="#90A4AE"/>
    <!-- 목 -->
    <ellipse cx="26" cy="22" rx="4" ry="4.5" fill="#90A4AE"/>
    <!-- 먼 귀 -->
    <polygon points="30.5,14 32.5,8 34,15" fill="#78909C"/>
    <!-- 머리 -->
    <circle cx="30" cy="18.5" r="5.8" fill="#90A4AE"/>
    <!-- 주둥이 -->
    <ellipse cx="34.8" cy="20.5" rx="2.8" ry="2.3" fill="#B0BEC5"/>
    <!-- 가까운 귀 -->
    <polygon points="25.5,15 26.5,7.5 31,13" fill="#90A4AE"/>
    <polygon points="26.6,13.8 27.2,9.6 29.6,12.6" fill="#F48FB1"/>
    <!-- 눈 (옆모습, 앞쪽) -->
    <ellipse cx="32" cy="17.3" rx="1.3" ry="1.7" fill="#66BB6A"/>
    <ellipse cx="32.3" cy="17.3" rx="0.5" ry="1.4" fill="#212121"/>
    <!-- 코·입 -->
    <path d="M37.6,19.2 L36.4,19.4 L37.3,20.4 Z" fill="#F06292"/>
    <path d="M37.2,20.6 Q36.8,22 35.4,22" stroke="#546E7A" stroke-width="0.6" fill="none"/>
    <!-- 수염 (앞으로) -->
    <g stroke="#546E7A" stroke-width="0.5" stroke-linecap="round">
      <line x1="35" y1="20.3" x2="39.6" y2="19.3"/>
      <line x1="35" y1="21" x2="39.6" y2="21.6"/>
    </g>
  <//>`;
}

function Frog({ size }) {
  return html`<${AnimalBase} size=${size}>
    <!-- 뒷다리 (큰 L자형, 전부 0~40 내) -->
    <!-- 왼쪽 뒷다리: 몸에서 왼쪽-아래로 뻗고 발로 끝 -->
    <path d="M11,26 Q5,30 6,35" stroke="#2E7D32" stroke-width="5"
      fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <ellipse cx="6" cy="35" rx="4" ry="2" fill="#2E7D32"/>
    <!-- 오른쪽 뒷다리 (약간 다른 각도) -->
    <path d="M14,29 Q8,33 9,38" stroke="#388E3C" stroke-width="4"
      fill="none" stroke-linecap="round"/>
    <ellipse cx="9" cy="38" rx="4" ry="1.8" fill="#388E3C"/>
    <!-- 몸통 -->
    <ellipse cx="21" cy="24" rx="12" ry="9" fill="#43A047"/>
    <!-- 배 (밝은 연두) -->
    <ellipse cx="21" cy="25" rx="8" ry="6.5" fill="#A5D6A7"/>
    <!-- 머리 -->
    <ellipse cx="30" cy="17" rx="9" ry="7" fill="#388E3C"/>
    <!-- 눈 (튀어나온, x ≤ 38) -->
    <circle cx="25" cy="10" r="4.5" fill="#A5D6A7"/>
    <circle cx="25" cy="10" r="2.8" fill="#212121"/>
    <circle cx="23.8" cy="9" r="0.9" fill="white"/>
    <circle cx="34" cy="10" r="4.5" fill="#A5D6A7"/>
    <circle cx="34" cy="10" r="2.8" fill="#212121"/>
    <circle cx="32.8" cy="9" r="0.9" fill="white"/>
    <!-- 입 -->
    <path d="M25,21 Q30,24 35,21" stroke="#1B5E20" stroke-width="1.5" fill="none"/>
    <!-- 앞다리 (오른쪽으로) -->
    <path d="M29,26 Q35,29 37,27" stroke="#2E7D32" stroke-width="3.5"
      fill="none" stroke-linecap="round"/>
  <//>`;
}

function Bear({ size }) {
  return html`<${AnimalBase} size=${size}>
    <!-- 먼 다리 -->
    <rect x="7" y="28" width="5" height="9" rx="2.5" fill="#4E342E"/>
    <rect x="23" y="28" width="5" height="9" rx="2.5" fill="#4E342E"/>
    <!-- 꼬리 -->
    <circle cx="5.5" cy="22" r="2" fill="#5D4037"/>
    <!-- 몸통 (어깨 혹) -->
    <path d="M5,25 Q5,17 13,16 Q20,13.5 26,16 Q31,19 30,26 Q29,32 18,32 Q6,32 5,25 Z" fill="#6D4C41"/>
    <!-- 가까운 다리 -->
    <rect x="10" y="28" width="5.5" height="9" rx="2.75" fill="#6D4C41"/>
    <rect x="26" y="27" width="5.5" height="10" rx="2.75" fill="#6D4C41"/>
    <!-- 머리 -->
    <ellipse cx="30" cy="19" rx="6" ry="5.5" fill="#6D4C41"/>
    <!-- 주둥이 -->
    <ellipse cx="35.4" cy="21" rx="3.6" ry="2.6" fill="#A1887F"/>
    <!-- 귀 -->
    <circle cx="27" cy="13.8" r="2.5" fill="#6D4C41"/>
    <circle cx="27" cy="13.8" r="1.3" fill="#A1887F"/>
    <!-- 눈 -->
    <circle cx="31.5" cy="17.2" r="1.1" fill="#212121"/>
    <circle cx="31.8" cy="16.9" r="0.35" fill="white"/>
    <!-- 코·입 -->
    <ellipse cx="38.4" cy="19.9" rx="1.3" ry="1" fill="#212121"/>
    <path d="M37.8,21.8 Q36.5,23 35,22.6" stroke="#4E342E" stroke-width="0.7" fill="none" stroke-linecap="round"/>
  <//>`;
}

function Panda({ size }) {
  return html`<${AnimalBase} size=${size}>
    <!-- 외곽선 -->
    <g fill="#FAFAFA" stroke="#BDBDBD" stroke-width="1.6">
      <ellipse cx="18" cy="26" rx="13" ry="9"/>
      <circle cx="30" cy="18" r="9"/>
      <circle cx="6" cy="23" r="2.5"/>
    </g>
    <!-- 귀 -->
    <circle cx="24" cy="10" r="4" fill="#212121"/>
    <!-- 채우기 -->
    <ellipse cx="18" cy="26" rx="13" ry="9" fill="#FAFAFA"/>
    <circle cx="6" cy="23" r="2.5" fill="#FAFAFA"/>
    <!-- 다리 (몸통과 겹침) -->
    <rect x="8" y="29" width="5.5" height="8" rx="2.75" fill="#212121"/>
    <rect x="14.5" y="30" width="5.5" height="7" rx="2.75" fill="#212121"/>
    <rect x="21" y="29" width="5.5" height="8" rx="2.75" fill="#212121"/>
    <rect x="27" y="30" width="5.5" height="7" rx="2.75" fill="#212121"/>
    <!-- 어깨 띠 -->
    <path d="M20 18.5 Q27 20 27 26 L27 33 Q23 34 21 32 Q19 26 20 18.5 Z" fill="#212121"/>
    <!-- 머리 -->
    <circle cx="30" cy="18" r="9" fill="#FAFAFA"/>
    <!-- 눈 패치 + 눈 -->
    <ellipse cx="30" cy="16.5" rx="3.2" ry="4" fill="#212121" transform="rotate(20,30,16.5)"/>
    <circle cx="30.3" cy="16" r="1.4" fill="white"/>
    <circle cx="30.5" cy="16" r="0.8" fill="#212121"/>
    <!-- 코 -->
    <ellipse cx="37.5" cy="20" rx="1.8" ry="1.3" fill="#212121"/>
    <path d="M34 23 Q35.5 24.5 37.5 23" stroke="#424242" stroke-width="0.9" fill="none"/>
  <//>`;
}

function Fox({ size }) {
  return html`<${AnimalBase} size=${size}>
    <!-- 꼬리 (북실, 뒤로 뻗음 + 흰 끝) -->
    <path d="M10,23 Q3,22 1.5,28 Q5,31 11,27 Z" fill="#EF6C00"/>
    <path d="M3.4,24.8 Q1.2,26 1.5,28 Q3.3,29.6 5.6,28.8 Q4,27 3.4,24.8 Z" fill="#FAFAFA"/>
    <!-- 먼 다리 -->
    <rect x="9" y="28" width="3" height="9" rx="1.5" fill="#5D4037"/>
    <rect x="23" y="28" width="3" height="9" rx="1.5" fill="#5D4037"/>
    <!-- 몸통 -->
    <ellipse cx="17" cy="25" rx="10" ry="5.8" fill="#EF6C00"/>
    <!-- 배 -->
    <path d="M12,29.5 Q18,31.5 25,29 Q19,29.8 12,29.5 Z" fill="#FFE0B2"/>
    <!-- 가까운 다리 (검은 양말) -->
    <rect x="12" y="28" width="3" height="9" rx="1.5" fill="#E65100"/>
    <rect x="12" y="33" width="3" height="4" rx="1.5" fill="#3E2723"/>
    <rect x="26" y="27" width="3" height="10" rx="1.5" fill="#E65100"/>
    <rect x="26" y="33" width="3" height="4" rx="1.5" fill="#3E2723"/>
    <!-- 목 -->
    <ellipse cx="25.5" cy="22" rx="4" ry="4.5" fill="#EF6C00"/>
    <!-- 먼 귀 -->
    <polygon points="29,14 31.5,6 33,14.5" fill="#BF360C"/>
    <!-- 머리 -->
    <ellipse cx="29" cy="18" rx="5" ry="4.8" fill="#EF6C00"/>
    <!-- 뾰족한 주둥이 -->
    <path d="M31,14.5 Q35,17 39,19.8 Q35,22.3 30,22.6 Z" fill="#EF6C00"/>
    <!-- 흰 볼·턱 -->
    <path d="M26.5,20.5 Q32,20.8 38.5,20.3 Q35,22.4 30,23.2 Q27,22.8 26.5,20.5 Z" fill="#FAFAFA"/>
    <!-- 가까운 귀 -->
    <polygon points="24.5,15.5 26,5.5 30.5,13.5" fill="#EF6C00"/>
    <polygon points="25.8,13.8 26.6,8.5 29,13" fill="#3E2723"/>
    <!-- 눈 -->
    <ellipse cx="31" cy="16.8" rx="1.1" ry="1" fill="#212121"/>
    <circle cx="31.3" cy="16.5" r="0.35" fill="white"/>
    <!-- 코 -->
    <ellipse cx="38.6" cy="19.7" rx="1.1" ry="0.9" fill="#212121"/>
  <//>`;
}

function Mouse({ size }) {
  return html`<${AnimalBase} size=${size}>
    <!-- 꼬리 (가늘고 긺, 땅 따라) -->
    <path d="M9,28 Q3,30 3,34 Q4,36.5 8,35.5" stroke="#F48FB1" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    <!-- 먼 다리 -->
    <ellipse cx="13" cy="35.5" rx="2.3" ry="1.3" fill="#F48FB1"/>
    <ellipse cx="25" cy="35.5" rx="2" ry="1.2" fill="#F48FB1"/>
    <!-- 몸통 (둥근 물방울) -->
    <path d="M8,29 Q7,20 17,19 Q25,18.5 29,22 Q31,27 27,32 Q20,35 12,34 Q8,33 8,29 Z" fill="#9E9E9E"/>
    <!-- 머리 + 뾰족한 코 -->
    <path d="M24,21 Q28,18 32,20.5 Q35,22.5 38,24.2 Q35,26.8 30,27.5 Q25,28 24,25 Z" fill="#BDBDBD"/>
    <!-- 가까운 다리 -->
    <ellipse cx="16" cy="35.5" rx="2.5" ry="1.4" fill="#F8BBD0"/>
    <ellipse cx="28" cy="35.5" rx="2.2" ry="1.3" fill="#F8BBD0"/>
    <rect x="15" y="31" width="2.4" height="4.5" rx="1.2" fill="#9E9E9E"/>
    <rect x="27" y="29" width="2.2" height="6.5" rx="1.1" fill="#BDBDBD"/>
    <!-- 귀 (크고 둥글, 머리 위) -->
    <circle cx="27" cy="16.5" r="4" fill="#BDBDBD"/>
    <circle cx="27" cy="16.5" r="2.6" fill="#F48FB1"/>
    <!-- 눈 -->
    <circle cx="31.5" cy="21.8" r="1.1" fill="#212121"/>
    <circle cx="31.8" cy="21.5" r="0.35" fill="white"/>
    <!-- 코 -->
    <circle cx="38" cy="24.2" r="0.9" fill="#F06292"/>
    <!-- 수염 -->
    <g stroke="#616161" stroke-width="0.5" stroke-linecap="round">
      <line x1="35.5" y1="24.5" x2="39.8" y2="22.8"/>
      <line x1="35.5" y1="25.2" x2="39.8" y2="26"/>
    </g>
  <//>`;
}

function Lion({ size }) {
  return html`<${AnimalBase} size=${size}>
    <!-- 꼬리 (끝에 털 뭉치) -->
    <path d="M7,24 Q2,26 3,19" stroke="#F9A825" stroke-width="2" fill="none" stroke-linecap="round"/>
    <ellipse cx="3" cy="17.5" rx="2" ry="2.6" fill="#BF360C"/>
    <!-- 먼 다리 -->
    <rect x="8" y="28" width="4" height="9" rx="2" fill="#E0A020"/>
    <rect x="22" y="28" width="4" height="9" rx="2" fill="#E0A020"/>
    <!-- 몸통 -->
    <ellipse cx="17" cy="25" rx="11" ry="6.5" fill="#F9A825"/>
    <!-- 가까운 다리 -->
    <rect x="11" y="28" width="4.2" height="9" rx="2.1" fill="#F9A825"/>
    <rect x="26" y="27" width="4.2" height="10" rx="2.1" fill="#F9A825"/>
    <!-- 갈기 (머리 뒤·목을 감쌈) -->
    <path d="M22,26 Q19,18 22,12 Q25,7 31,8 Q35,9.5 34.5,14 L33,24 Q29,29 22,26 Z" fill="#E65100"/>
    <g fill="#E65100">
      <circle cx="21.5" cy="15" r="2.5"/>
      <circle cx="21" cy="20" r="2.5"/>
      <circle cx="23" cy="25" r="2.5"/>
      <circle cx="24.5" cy="10" r="2.5"/>
      <circle cx="29.5" cy="7.8" r="2.5"/>
    </g>
    <!-- 머리 -->
    <ellipse cx="30.5" cy="17.5" rx="5.2" ry="5" fill="#FDD835"/>
    <!-- 주둥이 -->
    <ellipse cx="35.2" cy="19.8" rx="3.4" ry="2.7" fill="#FFE082"/>
    <!-- 귀 -->
    <circle cx="28.5" cy="12.5" r="1.6" fill="#FDD835"/>
    <!-- 눈 -->
    <ellipse cx="32.3" cy="16" rx="0.9" ry="1.1" fill="#4E342E"/>
    <!-- 코·입 -->
    <path d="M38.8,17.9 L37.2,17.9 Q37.6,19.4 38.6,19.2 Z" fill="#6D4C41"/>
    <path d="M38.2,19.6 Q37.6,21.6 35.8,21.6" stroke="#8D6E63" stroke-width="0.6" fill="none" stroke-linecap="round"/>
  <//>`;
}

function Pig({ size }) {
  return html`<${AnimalBase} size=${size}>
    <!-- 먼 다리 -->
    <rect x="9" y="29" width="3.6" height="7.5" rx="1.8" fill="#E57F9A"/>
    <rect x="23" y="29" width="3.6" height="7.5" rx="1.8" fill="#E57F9A"/>
    <!-- 꼬리 (돌돌 말림) -->
    <path d="M7,23 Q3.5,22 4.5,19.5 Q6,18 6.5,20 Q6.5,21.5 5,21" stroke="#F48FB1" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <!-- 몸통 (통통) -->
    <ellipse cx="17" cy="24.5" rx="11" ry="7.5" fill="#F8BBD0"/>
    <!-- 가까운 다리 -->
    <rect x="12" y="29" width="3.8" height="7.5" rx="1.9" fill="#F8BBD0"/>
    <rect x="26" y="28.5" width="3.8" height="8" rx="1.9" fill="#F8BBD0"/>
    <!-- 머리 -->
    <circle cx="29.5" cy="20" r="6" fill="#F8BBD0"/>
    <!-- 코 (납작한 원통) -->
    <rect x="34" y="18.5" width="4" height="5.5" rx="1.6" fill="#F48FB1"/>
    <ellipse cx="38" cy="21.2" rx="0.9" ry="2.7" fill="#F06292"/>
    <circle cx="38" cy="20.2" r="0.4" fill="#AD1457"/>
    <circle cx="38" cy="22.2" r="0.4" fill="#AD1457"/>
    <!-- 귀 (앞으로 접힘) -->
    <path d="M26.5,15.5 L29,9.5 L32,14.5 Z" fill="#F48FB1"/>
    <!-- 눈 -->
    <circle cx="32" cy="17.8" r="1" fill="#212121"/>
    <circle cx="32.3" cy="17.5" r="0.3" fill="white"/>
  <//>`;
}

function Chick({ size }) {
  return html`<${AnimalBase} size=${size}>
    <!-- 다리 (가는 두 다리) -->
    <g stroke="#FB8C00" stroke-width="1.3" stroke-linecap="round" fill="none">
      <path d="M17,29 L16,36 L18.5,36.5"/>
      <path d="M22,29 L23,36 L25.5,36.5"/>
    </g>
    <!-- 꽁지 -->
    <path d="M8,22 L3.5,17.5 L5,23.5 L3,25 L9,26 Z" fill="#FBC02D"/>
    <!-- 몸통 -->
    <ellipse cx="18.5" cy="24" rx="10.5" ry="7.5" fill="#FFEB3B"/>
    <!-- 날개 -->
    <path d="M12,22.5 Q18,19.5 22.5,23 Q19,28.5 12,26 Z" fill="#FBC02D"/>
    <!-- 머리 -->
    <circle cx="28" cy="16.5" r="6" fill="#FFEB3B"/>
    <!-- 볏 -->
    <path d="M24.5,11.5 Q25,8 27,9.8 Q28,7 30,9.5 Q31.5,8.5 31.5,11.5 Z" fill="#E53935"/>
    <!-- 부리 -->
    <path d="M33.5,15.5 L38.5,17 L33.5,18.8 Z" fill="#FB8C00"/>
    <!-- 볼 -->
    <circle cx="30.5" cy="19.2" r="1.3" fill="#FF8A80" opacity="0.8"/>
    <!-- 눈 -->
    <circle cx="30.5" cy="15.3" r="1.1" fill="#212121"/>
    <circle cx="30.8" cy="15" r="0.35" fill="white"/>
  <//>`;
}

function Penguin({ size }) {
  return html`<${AnimalBase} size=${size}>
    <!-- 발 -->
    <ellipse cx="17" cy="36" rx="3" ry="1.2" fill="#FB8C00"/>
    <ellipse cx="23.5" cy="36" rx="3" ry="1.2" fill="#FB8C00"/>
    <!-- 몸 (옆모습, 앞으로 기울임) -->
    <path d="M12,33 Q8,24 14,15 Q19,8 25,10 Q31,12.5 30,20 Q29.5,28 27,33 Q20,36.5 12,33 Z" fill="#263238"/>
    <!-- 배 (앞쪽 흰 부분) -->
    <path d="M22,17 Q28,18 27.8,24 Q27,30 24,33.5 Q19,34.5 18.5,31 Q21,24 22,17 Z" fill="#FAFAFA"/>
    <!-- 날개 -->
    <path d="M16,19 Q11,25 12.5,31 Q16,27 18,21 Z" fill="#37474F"/>
    <!-- 부리 -->
    <path d="M29.5,14.5 L35.5,16.2 L29.5,17.6 Z" fill="#FB8C00"/>
    <!-- 눈 (흰 테) -->
    <circle cx="26.8" cy="13.6" r="1.8" fill="#FAFAFA"/>
    <circle cx="27.3" cy="13.6" r="0.95" fill="#212121"/>
  <//>`;
}

function Tiger({ size }) {
  return html`<${AnimalBase} size=${size}>
    <!-- 꼬리 -->
    <path d="M7,23 Q2,24 2.5,17" stroke="#FB8C00" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M2.3,19.5 L4.6,19.8 M2.8,22.5 L5,22" stroke="#3E2723" stroke-width="0.9"/>
    <!-- 먼 다리 -->
    <rect x="8" y="28" width="4" height="9" rx="2" fill="#E07B00"/>
    <rect x="22" y="28" width="4" height="9" rx="2" fill="#E07B00"/>
    <!-- 몸통 -->
    <ellipse cx="17" cy="25" rx="11" ry="6.5" fill="#FB8C00"/>
    <!-- 배 -->
    <path d="M9,28.5 Q17,33 26,28.5 Q18,30.5 9,28.5 Z" fill="#FFF3E0"/>
    <!-- 줄무늬 -->
    <g stroke="#3E2723" stroke-width="1.3" stroke-linecap="round" fill="none">
      <path d="M11,19.5 Q10,22 11,24"/>
      <path d="M15,18.6 Q14,21.5 15,24"/>
      <path d="M19,18.6 Q18,21.5 19,24"/>
      <path d="M23,19.2 Q22,22 23,24"/>
    </g>
    <!-- 가까운 다리 -->
    <rect x="11" y="28" width="4.2" height="9" rx="2.1" fill="#FB8C00"/>
    <rect x="26" y="27" width="4.2" height="10" rx="2.1" fill="#FB8C00"/>
    <!-- 목 -->
    <ellipse cx="26" cy="21.5" rx="4" ry="4.5" fill="#FB8C00"/>
    <!-- 머리 -->
    <ellipse cx="30.5" cy="18" rx="5.3" ry="5" fill="#FB8C00"/>
    <!-- 주둥이 (흰) -->
    <ellipse cx="35.2" cy="20.3" rx="3.4" ry="2.6" fill="#FFF3E0"/>
    <!-- 얼굴 줄무늬 -->
    <g stroke="#3E2723" stroke-width="1" stroke-linecap="round">
      <line x1="29" y1="13.6" x2="29.6" y2="15.8"/>
      <line x1="27" y1="15.5" x2="28.3" y2="17"/>
      <line x1="27" y1="19.5" x2="28.8" y2="19.6"/>
    </g>
    <!-- 귀 -->
    <circle cx="28" cy="13.2" r="1.8" fill="#FB8C00"/>
    <circle cx="28" cy="13.2" r="0.9" fill="#3E2723"/>
    <!-- 눈 -->
    <ellipse cx="32.4" cy="16.6" rx="0.9" ry="1.1" fill="#212121"/>
    <!-- 코·입 -->
    <path d="M38.6,18.6 L37,18.6 Q37.5,20 38.4,19.8 Z" fill="#6D4C41"/>
    <path d="M38.1,20.3 Q37.5,22 35.8,22" stroke="#8D6E63" stroke-width="0.6" fill="none" stroke-linecap="round"/>
  <//>`;
}

function Elephant({ size }) {
  return html`<${AnimalBase} size=${size}>
    <!-- 먼 다리 -->
    <rect x="8" y="28" width="5" height="9" rx="2" fill="#78909C"/>
    <rect x="22" y="28" width="5" height="9" rx="2" fill="#78909C"/>
    <!-- 꼬리 -->
    <path d="M5.5,21 Q3,24 3.5,27" stroke="#90A4AE" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <!-- 몸통 -->
    <ellipse cx="16.5" cy="23" rx="11.5" ry="8.5" fill="#90A4AE"/>
    <!-- 가까운 다리 -->
    <rect x="11" y="28" width="5.2" height="9" rx="2" fill="#90A4AE"/>
    <rect x="24.5" y="27" width="5.2" height="10" rx="2" fill="#90A4AE"/>
    <!-- 머리 -->
    <circle cx="29.5" cy="17.5" r="6.5" fill="#90A4AE"/>
    <!-- 코 (길게 내려와 앞으로 말림) -->
    <path d="M33.5,19 Q37.5,22 36.5,28 Q36,31 38.5,31" stroke="#90A4AE" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <!-- 상아 -->
    <path d="M32,22.5 Q34,25.5 36,24.5" stroke="#FFFDE7" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <!-- 귀 (크게 펄럭) -->
    <path d="M24,12.5 Q18.5,14 19.5,21 Q21,26 26,23.5 Q27.5,18 24,12.5 Z" fill="#B0BEC5"/>
    <path d="M23.5,15 Q20.8,16.5 21.5,20.5 Q22.5,23 25,22 Q25.5,18.5 23.5,15 Z" fill="#F8BBD0" opacity="0.7"/>
    <!-- 눈 -->
    <circle cx="31.5" cy="15.6" r="1" fill="#212121"/>
    <circle cx="31.8" cy="15.3" r="0.3" fill="white"/>
  <//>`;
}

const ANIMAL_COMPONENTS = {
  turtle: Turtle, rabbit: Rabbit, dog: Dog, cat: Cat,
  frog: Frog, bear: Bear, panda: Panda, fox: Fox, mouse: Mouse, lion: Lion,
  pig: Pig, chick: Chick, penguin: Penguin, tiger: Tiger, elephant: Elephant,
};

export function AnimalIcon({ id, size = 28 }) {
  const Comp = ANIMAL_COMPONENTS[id];
  if (!Comp) return html`<span style=${{ fontSize: size * 0.7 }}>🐾</span>`;
  return html`<${Comp} size=${size} />`;
}
