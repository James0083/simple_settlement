/*
 * 플랫폼 어댑터 — 웹(ddakjeongsan.com).
 * 앱 코드는 "#platform" 으로 import 하고, vite.config.js 가 빌드 대상에 따라 이 파일 또는 ait.js 로 연결한다.
 * 두 파일은 같은 이름을 export 한다 — 하나를 고치면 다른 쪽도 맞춘다.
 */

export const IS_AIT = false;

// 앱 시작 시 한 번 (웹은 할 일 없음)
export function initPlatform() {}

export async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

export function vibrate(pattern) {
  try {
    navigator.vibrate?.(pattern);
  } catch (e) {
    // 미지원 — 무시
  }
}

// 외부 링크 <a> 속성 — 새 탭으로 연다
export const externalLink = (url) => ({ href: url, target: "_blank", rel: "noopener" });

// 기기에 이미지 바로 저장. 웹은 없음 → 기존 흐름(모바일 미리보기 · 데스크톱 다운로드)
export const saveImage = null;

// 분석 이벤트 — 웹은 아직 수집하지 않는다
export function trackScreen() {}
export function trackEvent() {}
