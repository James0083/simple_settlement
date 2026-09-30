/* 게임 공용 색 — [배경, 글자] 쌍. 플레이어 순서대로 돌아가며 쓴다. */
import { C_RED, C_DARK, C_WHITE, C_MUTED, C_GREEN } from "../shared/styles.js";

export const PLAYER_COLORS = [
  [C_RED,   C_WHITE],
  [C_DARK,  C_WHITE],
  [C_GREEN, C_WHITE],
  ["#F2B233", C_DARK],
  ["#3A6FE8", C_WHITE],
  ["#8E5BD0", C_WHITE],
  ["#F28C38", C_DARK],
  ["#2BB5A8", C_DARK],
  ["#C2185B", C_WHITE],
  [C_MUTED, C_DARK],
  // 11~15번째 참가자 (최대 15명)
  ["#795548", C_WHITE],
  ["#9CCC65", C_DARK],
  ["#F48FB1", C_DARK],
  ["#283593", C_WHITE],
  ["#4FC3F7", C_DARK],
];

export const colorOf = (index) => PLAYER_COLORS[index % PLAYER_COLORS.length];

// SVG 안 이름 라벨용 — 길면 줄인다
export const shortName = (name, max = 4) => (name.length > max ? name.slice(0, max) + "…" : name);
