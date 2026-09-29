/*
 * 미니게임용 난수 — crypto.getRandomValues 기반 (Math.random 보다 예측하기 어렵고 균등하다).
 * randInt 는 거절 샘플링으로 모듈로 편향을 없앤다.
 */
const MAX = 0x100000000; // 2^32

function uint32() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0];
}

// 0 이상 n 미만 정수
export function randInt(n) {
  if (!(n >= 1)) throw new RangeError("randInt: n must be >= 1");
  const limit = MAX - (MAX % n);
  let x;
  do x = uint32();
  while (x >= limit);
  return x % n;
}

// [0, 1) 실수
export const randomFloat = () => uint32() / MAX;

// 피셔-예이츠 셔플 (새 배열을 돌려준다)
export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
