/*
 * 룰렛 원판의 회전 곡선과, 조각 구분선이 바늘을 지나는 시각 계산 — 화면(RouletteGame)과 "딱딱" 소리가 같은 곡선을 쓴다.
 * React 없이 쓸 수 있게 따로 둔다 (소리 테스트 페이지에서도 불러 씀).
 */
// 원판 회전 곡선 — CSS transition 의 cubic-bezier 와 같은 값
export const WHEEL_EASE = [0.15, 0.6, 0.1, 1];
const EASE = WHEEL_EASE;
const bez = (u, p1, p2) => 3 * (1 - u) ** 2 * u * p1 + 3 * (1 - u) * u * u * p2 + u ** 3;

// total 도를 ms 동안 돌 때, 구분선(seg 도마다)이 바늘을 지나는 시각(초) 목록.
// 곡선을 잘게 나눠 따라가며 seg 의 배수를 넘는 순간을 찾는다. 너무 촘촘한(25ms 미만) 소리는 건너뛴다.
export function clickTimes(total, seg, ms) {
  const times = [];
  let nextAngle = seg;
  let last = -1;
  const STEPS = 4000;
  for (let i = 1; i <= STEPS; i++) {
    const u = i / STEPS;
    const angle = bez(u, EASE[1], EASE[3]) * total;
    while (angle >= nextAngle) {
      const sec = (bez(u, EASE[0], EASE[2]) * ms) / 1000;
      if (sec - last >= 0.025) {
        times.push(sec);
        last = sec;
      }
      nextAngle += seg;
    }
  }
  return times;
}
