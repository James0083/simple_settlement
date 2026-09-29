/* 게임 공용 색 — [배경, 글자] 쌍. 플레이어 순서대로 돌아가며 쓴다. */
export const PLAYER_COLORS = [
  ["#E8503A", "#FFFFFF"],
  ["#1A1D29", "#FFFFFF"],
  ["#0F9D64", "#FFFFFF"],
  ["#F2B233", "#1A1D29"],
  ["#3A6FE8", "#FFFFFF"],
  ["#8E5BD0", "#FFFFFF"],
  ["#F28C38", "#1A1D29"],
  ["#2BB5A8", "#1A1D29"],
  ["#C2185B", "#FFFFFF"],
  ["#9AA0B0", "#1A1D29"],
];

export const colorOf = (index) => PLAYER_COLORS[index % PLAYER_COLORS.length];

// SVG 안 이름 라벨용 — 길면 줄인다
export const shortName = (name, max = 4) => (name.length > max ? name.slice(0, max) + "…" : name);
