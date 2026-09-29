/*
 * 광고 자리 — 구글 애드센스 배너
 *
 * 자리 목록:
 *   settle-result  정산 결과 아래              (320×100)
 *   settle-mid     정산 요약↓ 계산하기 버튼↑   (320×50)
 *   food-form      뭐먹지 폼↓ 메뉴정하기 버튼↑ (320×100)
 *   food-result    뭐먹지 결과 아래            (320×100)
 *   games-mid      참가자 섹션↓ 게임 목록↑     (320×50)
 *   games-list     미니게임 목록 아래          (320×50)
 *   game-start     게임 헤더↓ 게임 본체↑       (320×50)
 *   game-result    미니게임 결과 아래          (320×100)
 *
 * 활성화 방법:
 *   1. 애드센스(https://adsense.google.com) 승인 후 발급된 Publisher ID를 ADSENSE_PUB_ID 에 채운다.
 *   2. 각 광고 단위 슬롯 ID를 UNIT_IDS 에 채운다.
 *   3. index.html 의 애드센스 script 태그 주석을 해제한다.
 *   4. AD_ENABLED 를 true 로 변경한다.
 *
 * 배치 확인: 주소 뒤에 ?adpreview 를 붙이면 광고 없이 자리만 점선으로 보여준다.
 */
import { useEffect } from "react";
import { html } from "./html.js";
import { styles } from "./styles.js";
import { isAdFree } from "./entitlements.js";

// 애드센스 승인 후 true 로 변경
const AD_ENABLED = false;

// 애드센스 Publisher ID
const ADSENSE_PUB_ID = "ca-pub-3948983509562369";

// 애드센스 슬롯 ID — 승인 후 각 광고 단위 생성 시 발급된 숫자 ID로 교체
const UNIT_IDS = {
  "settle-result": "0000000000",
  "settle-mid":    "0000000000",
  "food-form":     "0000000000",
  "food-result":   "0000000000",
  "games-mid":     "0000000000",
  "games-list":    "0000000000",
  "game-start":    "0000000000",
  "game-result":   "0000000000",
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

  useEffect(() => {
    if (!AD_ENABLED || isAdFree()) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}
  }, []);

  if (!AD_ENABLED) {
    if (!preview()) return null;
    return html`<div data-ad-slot=${placement} style=${{ ...box, ...styles.adSlotPreview }}>광고 자리 · ${placement} (${size.width}×${size.height})</div>`;
  }
  if (isAdFree()) return null;
  return html`
    <div data-ad-slot=${placement} style=${box}>
      <ins class="adsbygoogle"
        style="display:block;"
        data-ad-client=${ADSENSE_PUB_ID}
        data-ad-slot=${UNIT_IDS[placement]}
        data-ad-format="auto"
        data-full-width-responsive="true"></ins>
    </div>
  `;
}
