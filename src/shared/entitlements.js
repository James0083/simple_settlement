/* 기능 판정 — 한 곳에서만 결정한다. */
import { load } from "./storage.js";

const entitlements = () => {
  const e = load("entitlements", {});
  return e && typeof e === "object" ? e : {};
};

export const isAdFree = () => entitlements().adFree === true;

// 공개일(releaseAt, 한국 시간 그날 0시)이 지났는지. 공개일이 없으면 이미 공개.
// 공개 전 게임을 미리 확인하려면 콘솔에서: localStorage.setItem("ddak:entitlements", '{"previewGames":true}')
export const releaseTime = (game) => (game.releaseAt ? Date.parse(`${game.releaseAt}T00:00:00+09:00`) : 0);
export const isReleased = (game, now = Date.now()) =>
  entitlements().previewGames === true || now >= releaseTime(game);

// 구현된 게임(component 있음)이고 공개일이 지났으면 누구나 플레이 가능.
export const canPlay = (game) => !!game.component && isReleased(game);

// "10월 5일(월) 공개" — 잠긴 게임 카드·안내용
export const releaseLabel = (game) => {
  if (!game.releaseAt) return "곧 출시";
  const d = new Date(`${game.releaseAt}T00:00:00+09:00`);
  const kst = new Date(d.getTime() + 9 * 3600e3);
  const day = "일월화수목금토"[kst.getUTCDay()];
  return `${kst.getUTCMonth() + 1}월 ${kst.getUTCDate()}일(${day}) 공개`;
};
