/* 기능 판정 — 한 곳에서만 결정한다. */
import { load } from "./storage.js";
import { REC } from "./rec.js";

const entitlements = () => {
  const e = load("entitlements", {});
  return e && typeof e === "object" ? e : {};
};

export const isAdFree = () => entitlements().adFree === true;

// 공개일(releaseAt, 한국 시간 그날 0시)이 지났는지. 공개일이 없으면 이미 공개.
// 공개 전 게임을 미리 확인하려면 콘솔에서: localStorage.setItem("ddak:entitlements", '{"previewGames":true}')
export const releaseTime = (game) => (game.releaseAt ? Date.parse(`${game.releaseAt}T00:00:00+09:00`) : 0);
// 녹화 모드(개발 서버 전용, rec.js)의 unlock=all 이면 모두 열린다.
export const isReleased = (game, now = Date.now()) =>
  (import.meta.env?.DEV && REC?.unlock) || entitlements().previewGames === true || now >= releaseTime(game);

// 공개 뒤 이 기간 동안 게임 카드에 NEW 뱃지를 단다. releaseAt 은 이 기간이 끝나면 지운다(npm test 가 알려준다).
export const NEW_BADGE_DAYS = 14;
const DAY_MS = 24 * 3600e3;
export const newUntil = (game) => (game.releaseAt ? releaseTime(game) + NEW_BADGE_DAYS * DAY_MS : 0);
export const isNewGame = (game, now = Date.now()) =>
  !(import.meta.env?.DEV && REC) && !!game.releaseAt && isReleased(game, now) && now < newUntil(game);

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
