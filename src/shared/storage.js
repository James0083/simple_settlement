/*
 * localStorage 래퍼 — 기기 안에만 저장한다 (서버 없음).
 * 시크릿 모드·저장소 차단 환경에서는 접근 자체가 throw 할 수 있어 모두 try/catch 로 감싸고,
 * 실패하면 저장 없이 fallback 으로 동작한다.
 */
const PREFIX = "ddak:";

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    // 저장 실패는 무시 — 앱은 저장 없이 계속 동작한다.
  }
}
