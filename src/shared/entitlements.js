/* 기능 판정 — 한 곳에서만 결정한다. */
import { load } from "./storage.js";

const entitlements = () => {
  const e = load("entitlements", {});
  return e && typeof e === "object" ? e : {};
};

export const isAdFree = () => entitlements().adFree === true;

// 구현된 게임(component 있음)이면 누구나 플레이 가능.
export const canPlay = (game) => !!game.component;
