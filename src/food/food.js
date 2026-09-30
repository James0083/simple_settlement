/*
 * 오늘 뭐먹지 — 추천 알고리즘 (순수 함수, React 의존 없음).
 *
 *   1. 걸러내기  배달/매장 · 제외 태그(매운 것·날것)는 항상 지킨다. 가격대 · 장르도 거른다.
 *   2. 완화      걸러낸 결과가 0개면 가격대 → 장르 순으로 조건을 풀고, 무엇을 풀었는지 돌려준다.
 *   3. 점수      인원이 어울리는지 · 나눠먹기(4명 이상) · 식사 시간 · 최근에 고른 메뉴(감점).
 *   4. 가중 랜덤 점수 상위 절반(최소 8개) 안에서 점수² 에 비례해 뽑는다 — 매번 같은 답이 나오지 않게.
 *   5. 곁들임    4명 이상이면 뽑힌 메뉴마다 어울리는 곁들임(PAIRS)을 하나씩 골라 둔다
 *               (배달/매장 · 제외 태그를 지키고, 1순위와 대안이 서로 같지 않게).
 *
 * rng 를 주입받으므로 테스트에서 결과를 고정할 수 있다.
 */
import { won } from "../shared/util.js";

export const PRICE_BANDS = [
  { id: "any", label: "상관없음", min: 0, max: Infinity },
  { id: "u10", label: "~1만", min: 0, max: 10000 },
  { id: "10-20", label: "1–2만", min: 10000, max: 20000 },
  { id: "20-30", label: "2–3만", min: 20000, max: 30000 },
  { id: "30+", label: "3만+", min: 30000, max: Infinity },
];

export const MODES = [
  { id: "dineIn", label: "매장에서" },
  { id: "delivery", label: "배달로" },
];

export const MEALS = [
  { id: "lunch", label: "점심" },
  { id: "dinner", label: "저녁" },
  { id: "late", label: "야식" },
];

export const EXCLUDES = [
  { id: "spicy", label: "매운 것" },
  { id: "raw", label: "날것(회·초밥)" },
];

// 지금 시각 → 기본 식사 시간
export function mealForHour(hour) {
  if (hour >= 5 && hour < 15) return "lunch";
  if (hour >= 15 && hour < 21) return "dinner";
  return "late";
}

// 가격 범위가 가격대와 겹치는지. 경계값(예: 딱 10,000원)은 아래 구간에만 속한다.
const overlaps = ([min, max], band) => min < band.max && max > band.min;

// 앞에서부터 차례로 시도하는 완화 단계
const RELAX_STEPS = [[], ["price"], ["price", "genre"]];

export const RELAX_MESSAGES = {
  price: "고른 가격대에 맞는 메뉴가 없어 가격대를 넓혀서 찾았어요",
  genre: "고른 장르에 맞는 메뉴가 없어 다른 장르도 함께 찾았어요",
};

export function filterFoods(foods, input, relax = new Set()) {
  const band = PRICE_BANDS.find((b) => b.id === input.price) ?? PRICE_BANDS[0];
  return foods.filter(
    (f) =>
      (input.mode === "delivery" ? f.delivery : f.dineIn) &&
      !input.exclude.some((t) => f.tags.includes(t)) &&
      (relax.has("genre") || input.genres.length === 0 || input.genres.includes(f.genre)) &&
      (relax.has("price") || overlaps(f.price, band))
  );
}

// history: 최근에 고른 메뉴 id (최신이 앞)
export function scoreFood(food, input, history = []) {
  let score = 1;
  const [gMin, gMax] = food.group;
  score += input.people >= gMin && input.people <= gMax ? 2 : -0.8;
  if (food.tags.includes("share")) {
    if (input.people >= 4) score += 1;
    if (input.people === 1) score -= 0.5;
  }
  if (food.meals.includes(input.meal)) score += 1.5;
  if (history.includes(food.id)) score -= 1.5;
  return Math.max(0.1, score);
}

function weightedIndex(weights, rng) {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1;
}

/*
 * seen: 이번에 이미 보여준 메뉴 id — "다시 뽑기"에서 빼고 뽑는다.
 * 남은 후보가 count 개보다 적으면 seen 을 무시하고 처음부터 뽑고 reset: true 를 돌려준다.
 * 반환: { picks: [1순위, 대안...], relaxed: ["price", ...], total: 조건에 맞는 후보 수, reset }
 */
export const PAIR_MIN_PEOPLE = 4;

// main 과 함께 시키면 어울리는 메뉴 하나 (없으면 null). 앞쪽(흔한 조합)일수록 잘 뽑힌다.
export function pairFor(main, input, foods, pairs, rng = Math.random) {
  const ok = (pairs[main.id] ?? [])
    .map((id) => foods.find((f) => f.id === id))
    .filter(
      (f) =>
        f &&
        f.id !== main.id &&
        (input.mode === "delivery" ? f.delivery : f.dineIn) &&
        !input.exclude.some((t) => f.tags.includes(t))
    );
  if (ok.length === 0) return null;
  return ok[weightedIndex(ok.map((_, i) => 1 / (i + 1)), rng)];
}

export function recommend(input, foods, { rng = Math.random, history = [], seen = [], pairs = null } = {}) {
  // 4명당 메뉴 1개 (1-4명→1, 5-8명→2, 9-12명→3, 13-15명→4)
  const menuCount = Math.min(Math.ceil(input.people / 4), 5);
  const count = menuCount + 3; // 주 추천 N개 + 대안 3개

  let candidates = [];
  let relaxed = [];
  for (const step of RELAX_STEPS) {
    candidates = filterFoods(foods, input, new Set(step));
    relaxed = step;
    if (candidates.length > 0) break;
  }
  if (candidates.length === 0) return { picks: [], menuCount, relaxed: [], total: 0, reset: false, pairs: {} };

  const unseen = candidates.filter((f) => !seen.includes(f.id));
  const reset = seen.length > 0 && unseen.length < Math.min(count, candidates.length);
  const base = reset ? candidates : unseen;

  const pool = base
    .map((f) => ({ f, w: scoreFood(f, input, history) ** 2 }))
    .sort((a, b) => b.w - a.w)
    .slice(0, Math.max(8, Math.ceil(base.length / 2)));

  const picks = [];
  while (picks.length < count && pool.length > 0) {
    const i = weightedIndex(pool.map((p) => p.w), rng);
    picks.push(pool.splice(i, 1)[0].f);
  }
  // 4명 이상이면 뽑힌 메뉴마다 곁들임 — 대안을 1순위로 올려도 바로 보여줄 수 있게 미리 골라 둔다
  const pairMap = {};
  if (pairs && input.people >= PAIR_MIN_PEOPLE) {
    picks.forEach((f) => (pairMap[f.id] = pairFor(f, input, foods, pairs, rng)));
  }
  return { picks, menuCount, relaxed, total: candidates.length, reset, pairs: pairMap };
}

export const formatPrice = (food) => `1인 ${won(food.price[0])}~${won(food.price[1])}원`;

export const searchQuery = (food) => food.q ?? food.name;

// 지도 검색 링크 (위치 권한·API 키 없이, 각 지도 앱이 현재 위치 주변으로 검색한다)
export const naverMapUrl = (query) => `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
export const kakaoMapUrl = (query) => `https://map.kakao.com/link/search/${encodeURIComponent(query)}`;
