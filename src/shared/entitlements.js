/*
 * 유료 기능 판정 — 한 곳에서만 결정한다.
 * 지금은 결제 수단이 없어 항상 무료 사용자다. 나중에 결제(스토어 인앱결제 또는 서버리스 결제 승인)를
 * 붙이면 결제가 끝난 뒤 entitlements 를 기록하고, 이 파일의 판정만 그대로 쓰면 된다.
 */
import { load } from "./storage.js";

const entitlements = () => {
  const e = load("entitlements", {});
  return e && typeof e === "object" ? e : {};
};

export const isPremium = () => entitlements().premium === true;
export const isAdFree = () => isPremium() || entitlements().adFree === true;

// 개발 중 확인용: 로컬 서버(localhost)에서는 구현된 유료 게임을 결제 없이 열어 볼 수 있다. 배포 사이트에는 영향 없음.
const devUnlock = () => {
  try {
    return ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  } catch (e) {
    return false;
  }
};

// 유료 게임은 결제했고(또는 로컬 개발 중) + 실제로 구현된 게임만 열린다.
export const canPlay = (game) => game.tier === "free" || ((isPremium() || devUnlock()) && !!game.component);
