/* 쿠팡 파트너스 배너 — A/B 테스트 + 가중치 랜덤 선택 */
import { load } from "../shared/storage.js";

export const DISCLOSURE =
  "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.";

export const TRACKING_CODE = "AF8796350";

// 배너 3종: 파트너스 대시보드 리포트로 CTR 확인 후 weights 수동 조정
export const BANNERS = [
  { id: 1033973, label: "general", height: 100 }, // 사용자 맞춤 캐러셀
  { id: 1034004, label: "food",    height: 100 }, // 식품 카테고리
  { id: 1034006, label: "kitchen", height: 100 }, // 주방 카테고리
];

// ── 가중치 조정 ────────────────────────────────────────────
// 파트너스 리포트에서 각 label 의 클릭 수를 확인 후 아래 값을 변경.
// 예: food 가 2배 CTR → { general: 1, food: 2, kitchen: 1 }
// localStorage "ddak:coupangWeights" 에 저장해도 됩니다 (개발·테스트용).
const DEFAULT_WEIGHTS = { general: 1, food: 1, kitchen: 1 };

// 가중치 랜덤 선택 — 점수 높은 배너가 더 자주 노출됨
export function pickBanner() {
  const saved = load("coupangWeights", null);
  const weights = saved && typeof saved === "object" ? { ...DEFAULT_WEIGHTS, ...saved } : DEFAULT_WEIGHTS;

  const pool = BANNERS.map((b) => ({ b, w: Math.max(0.001, weights[b.label] ?? 1) }));
  const total = pool.reduce((s, e) => s + e.w, 0);
  let r = Math.random() * total;
  for (const { b, w } of pool) {
    r -= w;
    if (r <= 0) return b;
  }
  return pool[pool.length - 1].b;
}
