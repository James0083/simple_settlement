/*
 * 쿠팡 파트너스 링크 — 음식 장르별 관련 상품 링크
 *
 * 사용법:
 *   1. https://partners.coupang.com 에서 링크 발급
 *   2. 아래 LINKS 에 발급받은 링크를 붙여넣기
 *   3. 링크가 없는 장르는 DEFAULT 를 노출
 *
 * 발급 전에는 링크를 null 로 두면 배너가 숨겨짐.
 */

// 쿠팡 파트너스 가입 후 발급한 링크로 교체하세요
const DEFAULT = null; // 공통 식품 카테고리 링크

const LINKS = {
  korean:   null, // 한식 — 뚝배기·냄비류
  chinese:  null, // 중식 — 간편식
  japanese: null, // 일식 — 에어프라이어·도시락 용기
  western:  null, // 양식 — 파스타·소스류
  snack:    null, // 분식 — 컵라면·즉석식품
  asian:    null, // 아시안 — 향신료
  meat:     null, // 고기·구이 — 에어프라이어·구이팬
  fastfood: null, // 패스트푸드 — 용기·소스
  pub:      null, // 술안주 — 안주 세트
};

export const DISCLOSURE =
  "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.";

/**
 * 장르에 맞는 쿠팡 파트너스 링크를 반환한다.
 * 링크가 없으면 null 을 반환한다(배너를 숨겨야 함).
 */
export function getCoupangLink(genreId) {
  return LINKS[genreId] ?? DEFAULT;
}
