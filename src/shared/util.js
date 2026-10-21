/*
 * 공통 유틸 — 딱정산
 */

export const TOAST_MS = 1800;

// 금액 표기: 반올림 후 천단위 구분
export const won = (n) => Math.round(n).toLocaleString("ko-KR");

// 금액 입력: 숫자만 남기고 맨 앞 0 은 지운다 ("0" 단독 입력도 빈 값으로). maxDigits 를 주면 그 자리수까지만.
export const toDigits = (raw, maxDigits = Infinity) =>
  String(raw).replace(/[^0-9]/g, "").replace(/^0+/, "").slice(0, maxDigits);

export const uid = () => Math.random().toString(36).slice(2, 9);

// account: 정산받을 계좌(선택). showAccount: 참가자 입력란에서 계좌 입력칸을 펼쳤는지.
export const makeParticipant = (name = "") => ({ id: uid(), name, account: "", showAccount: false });

// 모바일/태블릿이면 true. 데스크톱(맥·윈도우)은 false 로 두고 곧바로 파일을
// 다운로드시킨다. 모바일에서는 브라우저가 이미지 파일 다운로드를 막는 경우가
// 많아, 대신 이미지를 크게 띄워 "길게 눌러 사진에 추가" 하도록 안내한다.
export function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod|Android/i.test(ua)) return true;
  // iPadOS 13+ Safari 는 UA 를 Macintosh 로 보고하므로 터치 지원 여부로 구분한다.
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return true;
  return false;
}
