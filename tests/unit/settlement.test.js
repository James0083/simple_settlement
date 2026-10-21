/* 정산 알고리즘(src/settlement/settlement.js) — 가이드 글(guide/settle · guide/cases)의 예시를 그대로 검증한다. */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseAmount,
  splitRound,
  isRoundValid,
  computeStats,
  computeFairTransactions,
  groupTransactions,
  buildResultText,
} from "../../src/settlement/settlement.js";

const people = (...names) => names.map((name) => ({ id: name, name, account: "" }));
const round = (payerId, amount, participantIds, customAmounts = {}) => ({
  id: `${payerId}-${amount}`,
  title: "",
  payerId,
  amount: String(amount),
  participantIds,
  customAmounts,
});
const shareOf = (stats) => Object.fromEntries(stats.map((s) => [s.name, Math.round(s.share)]));
const transfers = (stats) => computeFairTransactions(stats).map((t) => `${t.from}→${t.to} ${t.amount}`);

test("parseAmount — + 로 이은 금액을 더한다", () => {
  assert.equal(parseAmount("13000+4000"), 17000);
  assert.equal(parseAmount("13000+"), 13000); // 입력 중인 맨 끝 +
  assert.equal(parseAmount(""), 0);
  assert.equal(parseAmount(undefined), 0);
});

test("회차마다 참여한 사람끼리만 나눈다 (guide/settle 네 명 예시)", () => {
  const ps = people("민수", "지영", "현우", "수진");
  const stats = computeStats(ps, [
    round("민수", 120000, ["민수", "지영", "현우", "수진"]),
    round("지영", 90000, ["민수", "지영", "현우"]),
    round("수진", 26000, ["지영", "수진"]),
  ]);
  assert.deepEqual(shareOf(stats), { 민수: 60000, 지영: 73000, 현우: 60000, 수진: 43000 });
  // 딱 맞는 짝끼리 묶여 송금 두 번
  assert.deepEqual(transfers(stats).sort(), ["수진→지영 17000", "현우→민수 60000"]);
});

test("송금 횟수가 같으면 결제하지 않은 사람이 더 보낸다 (guide/settle 4단계 예시)", () => {
  const ps = people("큰손", "작은손", "안냄", "부분결제");
  const all = ["큰손", "작은손", "안냄", "부분결제"];
  const stats = computeStats(ps, [round("큰손", 90000, all), round("작은손", 50000, all), round("부분결제", 20000, all)]);
  const tx = computeFairTransactions(stats);
  assert.equal(tx.length, 3);
  assert.equal(tx.filter((t) => t.from === "안냄").length, 2);
  assert.equal(tx.filter((t) => t.from === "부분결제").length, 1);
});

// 10,000원 ÷ 3명 = 3,333.33…원. 최대 나머지법으로 정수화하므로 각자 3,333 또는 3,334원을 보내고,
// 반올림 차이는 1원을 넘지 않는다(나머지가 모두 같으면 누가 1원을 더 맡을지는 정해져 있지 않다).
test("1원 단위 — 송금은 정수이고 정확한 몫과 1원 이내", () => {
  const ps = people("A", "B", "C");
  const stats = computeStats(ps, [round("A", 10000, ["A", "B", "C"])]);
  const tx = computeFairTransactions(stats);
  assert.equal(tx.length, 2);
  for (const t of tx) {
    assert.ok(Number.isInteger(t.amount));
    assert.ok(Math.abs(t.amount - 10000 / 3) < 1, `${t.from} → ${t.amount}`);
  }
  const received = tx.reduce((s, t) => s + t.amount, 0);
  assert.ok(Math.abs(received - (10000 - 10000 / 3)) < 1, `A 가 받는 돈 ${received}`);
});

test("금액 따로 입력 — 개별 금액을 뺀 나머지만 1/n (A 13,000 · B 12,000 · C 9,000, 총 55,000)", () => {
  const ps = people("A", "B", "C");
  const r = round("A", 55000, ["A", "B", "C"], { A: "9000+4000", B: "12000", C: "9000" });
  const { common } = splitRound(r, new Set(["A", "B", "C"]));
  assert.equal(common, 21000);
  const stats = computeStats(ps, [r]);
  assert.deepEqual(shareOf(stats), { A: 20000, B: 19000, C: 16000 });
  assert.deepEqual(
    stats.map((s) => s.custom),
    [13000, 12000, 9000]
  );
  assert.deepEqual(transfers(stats).sort(), ["B→A 19000", "C→A 16000"]);
});

test("금액 따로 입력 — 참여자에서 빠진 사람의 개별 금액은 세지 않는다", () => {
  const r = round("A", 30000, ["A", "B"], { A: "5000", C: "8000" });
  assert.equal(splitRound(r, new Set(["A", "B", "C"])).common, 25000);
});

test("개별 금액 합이 총액보다 크면 그 회차는 계산에서 빠진다", () => {
  const ids = new Set(["A", "B"]);
  assert.equal(isRoundValid(round("A", 10000, ["A", "B"], { A: "6000", B: "5000" }), ids), false);
  assert.equal(isRoundValid(round("A", 10000, ["A", "B"], { A: "6000", B: "4000" }), ids), true);
  assert.equal(isRoundValid(round("A", 0, ["A", "B"]), ids), false); // 금액 없음
  assert.equal(isRoundValid(round("", 10000, ["A", "B"]), ids), false); // 결제자 없음
});

test("결과 복사 텍스트에 개별 + 공통 내역이 들어간다", () => {
  const ps = people("A", "B", "C");
  const stats = computeStats(ps, [round("A", 55000, ["A", "B", "C"], { A: "13000", B: "12000", C: "9000" })]);
  const text = buildResultText(stats, groupTransactions(computeFairTransactions(stats)));
  assert.match(text, /A {2}낸 금액 55,000원 \/ 부담 20,000원 \(개별 13,000 \+ 공통 7,000\)/);
  assert.match(text, /B \(총 19,000원\)\n {2}→ A {2}19,000원/);
});

test("동명이인 — 송금을 이름이 아니라 id 로 묶는다", () => {
  const ps = [
    { id: "a", name: "철수", account: "" },
    { id: "b", name: "철수", account: "" },
    { id: "c", name: "영희", account: "" },
  ];
  const stats = computeStats(ps, [round("c", 30000, ["a", "b", "c"])]);
  const groups = groupTransactions(computeFairTransactions(stats));
  assert.equal(groups.length, 2);
  assert.ok(groups.every((g) => g.subtotal === 10000));
});
