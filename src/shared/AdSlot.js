/*
 * 광고 자리 — 카카오 애드핏 배너
 *
 * 자리 목록 (placement → 애드핏 단가코드):
 *   settle-result  정산 결과 아래              DAN-XXXXXXXXXX (320×100)
 *   settle-mid     정산 요약↓ 계산하기 버튼↑   DAN-XXXXXXXXXX (320×50)
 *   food-form      뭐먹지 폼↓ 메뉴정하기 버튼↑ DAN-XXXXXXXXXX (320×100)
 *   food-result    뭐먹지 결과 아래            DAN-XXXXXXXXXX (320×100)
 *   games-mid      참가자 섹션↓ 게임 목록↑     DAN-XXXXXXXXXX (320×50)
 *   games-list     미니게임 목록 아래          DAN-XXXXXXXXXX (320×50)
 *   game-start     게임 헤더↓ 게임 본체↑       DAN-XXXXXXXXXX (320×50)
 *   game-result    미니게임 결과 아래          DAN-XXXXXXXXXX (320×100)
 *
 * 활성화 방법:
 *   1. 애드핏(https://adfit.kakao.com) 심사 완료 후 발급된 단가코드를 UNIT_IDS 에 채운다.
 *   2. AD_ENABLED 를 true 로 변경한다.
 *
 * 배치 확인: 주소 뒤에 ?adpreview 를 붙이면 광고 없이 자리만 점선으로 보여준다.
 */
import { html } from "./html.js";
import { styles } from "./styles.js";
import { isAdFree } from "./entitlements.js";

// 애드핏 심사 완료 후 true 로 변경
const AD_ENABLED = false;

// 애드핏 단가코드 — 심사 완료 후 발급된 코드로 교체
const UNIT_IDS = {
  "settle-result": "DAN-XXXXXXXXXX",
  "settle-mid":    "DAN-XXXXXXXXXX",
  "food-form":     "DAN-XXXXXXXXXX",
  "food-result":   "DAN-XXXXXXXXXX",
  "games-mid":     "DAN-XXXXXXXXXX",
  "games-list":    "DAN-XXXXXXXXXX",
  "game-start":    "DAN-XXXXXXXXXX",
  "game-result":   "DAN-XXXXXXXXXX",
};

export const AD_SLOTS = {
  "settle-result": { width: 320, height: 100 },
  "settle-mid":    { width: 320, height: 50 },
  "food-form":     { width: 320, height: 100 },
  "food-result":   { width: 320, height: 100 },
  "games-mid":     { width: 320, height: 50 },
  "games-list":    { width: 320, height: 50 },
  "game-start":    { width: 320, height: 50 },
  "game-result":   { width: 320, height: 100 },
};

const preview = () => {
  try {
    return new URLSearchParams(location.search).has("adpreview");
  } catch (e) {
    return false;
  }
};

export function AdSlot({ placement }) {
  const size = AD_SLOTS[placement] ?? { width: 320, height: 100 };
  const box = { ...styles.adSlot, maxWidth: size.width, minHeight: size.height };
  if (!AD_ENABLED) {
    if (!preview()) return null;
    return html`<div data-ad-slot=${placement} style=${{ ...box, ...styles.adSlotPreview }}>광고 자리 · ${placement} (${size.width}×${size.height})</div>`;
  }
  if (isAdFree()) return null;
  const unitId = UNIT_IDS[placement];
  return html`
    <div data-ad-slot=${placement} style=${box}>
      <ins class="kakao_ad_area"
        style="display:none;"
        data-ad-unit=${unitId}
        data-ad-width=${String(size.width)}
        data-ad-height=${String(size.height)}></ins>
    </div>
  `;
}
