/* 새 미니게임의 판정 · 계산 (반응속도 · 복불복 나눠내기 · 탑 쌓기 · 기억력 릴레이 · 라이어 게임) */
import { test } from "node:test";
import assert from "node:assert/strict";
import { GAMES, playersOkFor, gamesInListOrder } from "../../src/games/registry.js";
import { reactionLosers } from "../../src/games/ReactionGame.js";
import { splitAmounts, MIN_PER_PERSON } from "../../src/games/SplitLuckGame.js";
import { dropBlock, BASE_W, PERFECT_RATIO } from "../../src/games/StackGame.js";
import { simonStep } from "../../src/games/SimonGame.js";
import { LIAR_CATEGORIES } from "../../src/games/liarWords.js";
import { pickWord } from "../../src/games/LiarGame.js";

test("반응속도 — 가장 느린 사람, 부정 출발이 있으면 부정 출발한 사람", () => {
  assert.deepEqual(reactionLosers([{ playerIdx: 0, ms: 250 }, { playerIdx: 1, ms: 410 }, { playerIdx: 2, ms: 300 }]), [1]);
  assert.deepEqual(reactionLosers([{ playerIdx: 0, ms: 900 }, { playerIdx: 1, ms: null }]), [1]);
  assert.deepEqual(reactionLosers([{ playerIdx: 0, ms: null }, { playerIdx: 1, ms: 200 }, { playerIdx: 2, ms: null }]), [0, 2]);
  assert.deepEqual(reactionLosers([{ playerIdx: 0, ms: 333 }, { playerIdx: 1, ms: 333 }]), [0, 1]); // 동점
});

test("복불복 나눠내기 — 합이 총액과 같고, 모두 0원보다 크고, 100원 단위(끝전 1명), 최고 금액은 한 명", () => {
  for (const [total, n] of [[60000, 3], [2000, 2], [15000, 15], [123456, 7], [1000000, 4]]) {
    for (let k = 0; k < 200; k++) {
      const a = splitAmounts(total, n);
      assert.equal(a.length, n);
      assert.equal(a.reduce((s, x) => s + x, 0), total, `${total}/${n}: ${a}`);
      assert.ok(a.every((x) => x > 0), `0원 봉투: ${a}`);
      assert.ok(a.filter((x) => x % 100 !== 0).length <= 1, `100원 단위가 아님: ${a}`);
      const max = Math.max(...a);
      assert.equal(a.filter((x) => x === max).length, 1, `최고 금액이 여럿: ${a}`);
    }
  }
});

test("복불복 나눠내기 — 끝전은 가장 많이 내는 사람에게, 총액이 너무 적으면 거절", () => {
  const a = splitAmounts(10050, 3);
  assert.equal(Math.max(...a) % 100, 50);
  assert.throws(() => splitAmounts(3 * MIN_PER_PERSON - 1, 3), RangeError);
});

test("복불복 나눠내기 — 무게가 같으면 똑같이(끝전 제외) 나뉜다", () => {
  // 같은 무게가 계속 나오면 최고 금액이 겹쳐 다시 뽑으므로, 첫 번만 조금 다르게 준다
  let i = 0;
  const rand = () => (i++ === 0 ? 0.01 : 0);
  const a = splitAmounts(30000, 3, rand);
  assert.equal(a.reduce((s, x) => s + x, 0), 30000);
  assert.ok(a.every((x) => Math.abs(x - 10000) <= 300), `${a}`);
});

test("탑 쌓기 — 겹친 만큼 남고, 빗나가면 놓침, 거의 맞으면 퍼펙트", () => {
  const top = { x: 60, w: 180 };
  assert.deepEqual(dropBlock(top, 100, 180), { x: 100, w: 140, perfect: false, cut: { x: 240, w: 40 } });
  assert.deepEqual(dropBlock(top, 20, 180), { x: 60, w: 140, perfect: false, cut: { x: 20, w: 40 } });
  assert.deepEqual(dropBlock(top, 240, 180), { miss: true }); // 딱 끝에 닿으면 겹침 0
  const nearly = dropBlock({ x: 60, w: 100 }, 60 + 100 * PERFECT_RATIO, 100);
  assert.equal(nearly.perfect, true);
  assert.equal(nearly.x, 60);
  assert.ok(nearly.w > 100 && nearly.w <= BASE_W);
  assert.equal(dropBlock({ x: 60, w: BASE_W }, 61, BASE_W).w, BASE_W); // 퍼펙트 보너스는 바닥 폭까지
});

test("기억력 릴레이 — 따라 누르기 · 틀림 · 하나 더하기", () => {
  assert.equal(simonStep([], 0, 2), "added"); // 첫 사람은 아무거나
  assert.equal(simonStep([1, 3], 0, 1), "next");
  assert.equal(simonStep([1, 3], 1, 0), "wrong");
  assert.equal(simonStep([1, 3], 2, 0), "added");
});

test("라이어 게임 — 3~10명, 카테고리마다 제시어 30개 이상 · 중복 없음", () => {
  const liar = GAMES.find((g) => g.id === "liar");
  assert.equal(playersOkFor(liar, 2), false);
  assert.equal(playersOkFor(liar, 3), true);
  assert.equal(playersOkFor(liar, 10), true);
  assert.equal(playersOkFor(liar, 11), false);
  assert.equal(new Set(LIAR_CATEGORIES.map((c) => c.id)).size, LIAR_CATEGORIES.length);
  for (const c of LIAR_CATEGORIES) {
    assert.ok(c.words.length >= 30, `${c.label} ${c.words.length}개`);
    assert.equal(new Set(c.words).size, c.words.length, `${c.label} 중복`);
    assert.ok(c.words.every((w) => w.trim() === w && w.length > 0));
  }
});

test("라이어 게임 — 최근에 나온 제시어는 다시 뽑지 않고, 다 썼으면 전체에서", () => {
  const words = ["사과", "배", "감"];
  for (let i = 0; i < 50; i++) assert.equal(pickWord(words, ["사과", "배"]), "감");
  assert.ok(words.includes(pickWord(words, words)));
});

test("목록 순서 — 즐겨찾기 → (즐겨찾기가 없으면) 공개된 복불복 → 나머지 공개 게임 → 잠긴 게임", () => {
  const games = [
    { id: "a" }, { id: "b" }, { id: "c" },
    { id: "pin", pinFirst: true, locked: true },
    { id: "late", locked: true },
  ];
  const order = (opts) => gamesInListOrder(games, opts).map((g) => g.id);
  const lockedUntil = (open) => (g) => !g.locked || open.includes(g.id);

  // 아무것도 안 정했고 복불복이 아직 잠김 → 제 순서, 잠긴 게임은 뒤
  assert.deepEqual(order({ released: lockedUntil([]) }), ["a", "b", "c", "pin", "late"]);
  // 복불복이 공개되는 순간 맨 앞
  assert.deepEqual(order({ released: lockedUntil(["pin"]) }), ["pin", "a", "b", "c", "late"]);
  // 즐겨찾기가 있으면 그 순서가 먼저이고 복불복도 다른 게임처럼 제자리
  assert.deepEqual(order({ favorites: ["c", "a"], released: lockedUntil(["pin"]) }), ["c", "a", "b", "pin", "late"]);
  // 새로 공개된 게임은 공개 게임 맨 아래, 아직 잠긴 게임은 그 뒤
  assert.deepEqual(order({ favorites: ["c"], released: lockedUntil(["pin", "late"]) }), ["c", "a", "b", "pin", "late"]);
  // 잠긴 게임 · 없는 게임 id 는 즐겨찾기에 있어도 무시
  assert.deepEqual(order({ favorites: ["late", "zzz", "b"], released: lockedUntil([]) }), ["b", "a", "c", "pin", "late"]);
});

test("목록 순서 — 실제 목록: 잠긴 게임은 모두 맨 뒤", () => {
  const list = gamesInListOrder(GAMES, { released: (g) => !g.releaseAt || g.releaseAt < "2026-10-26" });
  const firstLocked = list.findIndex((g) => g.releaseAt >= "2026-10-26");
  assert.ok(list.slice(firstLocked).every((g) => g.releaseAt >= "2026-10-26"));
  assert.equal(list.length, GAMES.length);
});
