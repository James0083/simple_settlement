/* 미니게임 레지스트리 · 공개일 · 공정 난수 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { GAMES, MIN_PLAYERS, MAX_PLAYERS, playersOkFor } from "../../src/games/registry.js";
import { releaseLabel, isReleased, isNewGame, newUntil, NEW_BADGE_DAYS } from "../../src/shared/entitlements.js";
import { randInt, shuffle } from "../../src/games/random.js";

test("게임 id 는 겹치지 않고, 모두 컴포넌트가 있다", () => {
  const ids = GAMES.map((g) => g.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const g of GAMES) assert.equal(typeof g.component, "function", `${g.id} 컴포넌트 없음`);
});

test("인원 판정 — 보통은 2~15명, exactPlayers 게임은 그 인원만", () => {
  const roulette = GAMES.find((g) => g.id === "roulette");
  assert.equal(playersOkFor(roulette, MIN_PLAYERS - 1), false);
  assert.equal(playersOkFor(roulette, MIN_PLAYERS), true);
  assert.equal(playersOkFor(roulette, MAX_PLAYERS), true);
  assert.equal(playersOkFor(roulette, MAX_PLAYERS + 1), false);

  const hideseek = GAMES.find((g) => g.id === "hideseek");
  assert.equal(hideseek.exactPlayers, 2);
  assert.equal(playersOkFor(hideseek, 2), true);
  assert.equal(playersOkFor(hideseek, 3), false);
});

test("releaseAt — YYYY-MM-DD 형식이고 월요일", () => {
  for (const g of GAMES.filter((g) => g.releaseAt)) {
    assert.match(g.releaseAt, /^\d{4}-\d{2}-\d{2}$/, `${g.id}: ${g.releaseAt}`);
    assert.match(releaseLabel(g), /\(월\) 공개$/, `${g.id} 공개일이 월요일이 아님: ${releaseLabel(g)}`);
  }
});

// 공개 뒤 NEW 뱃지 기간(2주)이 끝난 게임은 releaseAt 을 지운다(registry.js 규칙). 때가 되면 이 테스트가 실패해 알려준다.
test("NEW 뱃지 기간이 끝난 releaseAt 이 남아 있지 않다", () => {
  const stale = GAMES.filter((g) => g.releaseAt && newUntil(g) <= Date.now()).map((g) => `${g.id}(${g.releaseAt})`);
  assert.deepEqual(stale, [], `NEW 기간이 끝났으니 registry.js 에서 releaseAt 을 지우세요: ${stale.join(", ")}`);
});

test("NEW 뱃지 — 공개한 날부터 2주 동안만", () => {
  const g = { releaseAt: "2026-11-02" };
  const open = Date.parse("2026-11-02T00:00:00+09:00");
  const day = 24 * 3600e3;
  assert.equal(isNewGame(g, open - 1), false); // 공개 전
  assert.equal(isNewGame(g, open), true);
  assert.equal(isNewGame(g, open + NEW_BADGE_DAYS * day - 1), true);
  assert.equal(isNewGame(g, open + NEW_BADGE_DAYS * day), false);
  assert.equal(isNewGame({}, open), false); // releaseAt 이 없으면 오래된 게임
});

test("공개 판정 · 표시 — 한국 시간 그날 0시에 열린다", () => {
  const g = { releaseAt: "2026-11-02" };
  assert.equal(releaseLabel(g), "11월 2일(월) 공개");
  const open = Date.parse("2026-11-02T00:00:00+09:00");
  assert.equal(isReleased(g, open - 1), false);
  assert.equal(isReleased(g, open), true);
  assert.equal(isReleased({}, 0), true); // releaseAt 이 없으면 이미 공개
});

test("randInt — 0 이상 n 미만 정수, 모든 값이 나온다", () => {
  const seen = new Set();
  for (let i = 0; i < 2000; i++) {
    const v = randInt(6);
    assert.ok(Number.isInteger(v) && v >= 0 && v < 6);
    seen.add(v);
  }
  assert.equal(seen.size, 6);
  assert.throws(() => randInt(0), RangeError);
});

test("shuffle — 같은 원소의 새 배열을 돌려주고 원본은 그대로", () => {
  const src = [1, 2, 3, 4, 5];
  const out = shuffle(src);
  assert.notEqual(out, src);
  assert.deepEqual([...out].sort(), src);
  assert.deepEqual(src, [1, 2, 3, 4, 5]);
});
