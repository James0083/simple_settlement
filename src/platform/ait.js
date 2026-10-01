/*
 * 플랫폼 어댑터 — 앱인토스(토스 앱 웹뷰). `npm run build:ait` · `npm run dev:ait` 에서만 쓰인다.
 * web.js 와 같은 이름을 export 한다 — 하나를 고치면 다른 쪽도 맞춘다.
 * SDK 호출은 토스 앱 안에서만 동작하고, 일반 브라우저(dev:ait)에서는 devtools mock 이 대신한다.
 */
import { Analytics, Clipboard, Device, File } from "@apps-in-toss/web-framework";
import "./fonts.ait.css";

export const IS_AIT = true;

export function initPlatform() {}

// 클립보드 쓰기 권한은 apps-in-toss.config.ts 의 permissions 에 선언돼 있다
export async function copyText(text) {
  try {
    await Clipboard.setText(text);
  } catch (e) {
    await navigator.clipboard.writeText(text);
  }
}

// navigator.vibrate 패턴(ms) → 토스 햅틱 종류. iOS 도 진동한다.
function hapticType(pattern) {
  if (Array.isArray(pattern)) return "error"; // 폭발·물림 같은 당첨 순간
  if (pattern <= 10) return "tickWeak"; // 연타
  if (pattern <= 30) return "tap"; // 구멍·이빨 누름
  if (pattern <= 80) return "basicMedium";
  return "success"; // 결과 확정
}

export function vibrate(pattern) {
  Device.triggerHaptic({ type: hapticType(pattern) }).catch(() => {});
}

// 외부 링크 — 웹뷰 안에서 열지 않고 기기 브라우저·지도 앱으로 넘긴다
export const externalLink = (url) => ({
  href: url,
  onClick: (e) => {
    e.preventDefault();
    Device.openURL(url).catch(() => {});
  },
});

// 기기에 이미지 바로 저장. 지원하지 않는 토스 앱 버전이거나 실패하면 false → 미리보기 오버레이로 대체
export async function saveImage(dataUrl, fileName) {
  if (!File.saveBase64.isSupported()) return false;
  try {
    await File.saveBase64({ data: dataUrl.split(",")[1], fileName, mimeType: "image/png" });
    return true;
  } catch (e) {
    return false;
  }
}

export function trackScreen(name) {
  Analytics.screen({ log_name: name })?.catch(() => {});
}

export function trackEvent(name, params = {}) {
  Analytics.click({ log_name: name, ...params })?.catch(() => {});
}
