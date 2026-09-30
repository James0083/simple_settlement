/*
 * 정산 알고리즘 — 딱정산의 핵심. 순수 함수만 모아 둔다. (React 의존 없음)
 *
 * 데이터 구조
 *   참가자: { id, name, account }   — account 는 정산받을 계좌(선택, 빈 문자열 가능)
 *   회차:   { id, title, payerId, amount, participantIds: [id, ...] }
 *
 * 흐름: computeStats → computeFairTransactions → groupTransactions
 */
import { won } from "../shared/util.js";

// 잔액이 이 값보다 작으면 부동소수점 오차로 보고 0(정산 불필요)으로 취급한다.
export const BALANCE_EPS = 0.5;

// 회차가 계산에 포함될 수 있는지 — 금액 > 0, 결제자가 유효, 참여자 1명 이상
export function isRoundValid(round, validIdSet) {
  const amount = parseFloat(round.amount) || 0;
  if (amount <= 0) return false;
  if (!validIdSet.has(round.payerId)) return false;
  return round.participantIds.some((id) => validIdSet.has(id));
}

// 회차별로 결제(paid)/부담(share)을 집계하고 잔액(balance = paid - share)을 낸다.
// 한 사람이 특정 회차에 빠졌으면 그 회차 share 계산에서 자동 제외된다.
export function computeStats(validParticipants, rounds) {
  const validIdSet = new Set(validParticipants.map((p) => p.id));
  const map = new Map();
  validParticipants.forEach((p) =>
    map.set(p.id, { id: p.id, name: p.name.trim(), account: (p.account || "").trim(), paid: 0, share: 0 })
  );

  rounds.forEach((r) => {
    if (!isRoundValid(r, validIdSet)) return;
    const amount = parseFloat(r.amount) || 0;
    const activeIds = r.participantIds.filter((id) => validIdSet.has(id));

    map.get(r.payerId).paid += amount;
    const share = amount / activeIds.length;
    activeIds.forEach((id) => {
      map.get(id).share += share;
    });
  });

  return Array.from(map.values()).map((s) => ({ ...s, balance: s.paid - s.share }));
}

// ── 송금 계산 ───────────────────────────────────────────────
// 목표 (앞의 것이 우선):
//   1. 송금 횟수 최소 — 차액 합이 0 이 되는 가장 작은 무리들로 사람을 나누면(무리 수 최대),
//      무리마다 (인원 - 1)번이면 끝난다. 전체 횟수 = 차액 있는 사람 수 - 무리 수. 부분집합 DP 로 정확히 구한다.
//   2. 보내는 횟수가 고르게 — 한 사람이 여러 번 보내는 일을 줄인다.
//   3. 더 보내야 한다면 한 푼도 결제하지 않은 사람이 먼저 — 결제한 사람의 송금 부담을 줄인다.
// 채권자/채무자는 id 로 구분한다 — 동명이인이 섞이지 않고, 계좌(account)도 채권자 객체에서 그대로 싣는다.

// 인원이 이보다 많으면 정확한 DP(2^n) 대신 욕심쟁이 방식으로 푼다.
const EXACT_MAX_PEOPLE = 18;
// 무리 안에서 보내는 사람·받는 사람 순서를 모두 따져 보는 경우의 수 한도
const ORDER_SEARCH_LIMIT = 5000;

// 잔액을 원 단위 정수로 — 합이 정확히 0 이 되게 소수점을 버린 뒤 나머지가 큰 사람부터 1원씩 더한다(최대 나머지법).
function roundBalances(balances) {
  const rows = balances.map((p) => {
    const floor = Math.floor(p.balance + 1e-6);
    return { p, amount: floor, rem: p.balance - floor };
  });
  const missing = -rows.reduce((s, r) => s + r.amount, 0);
  [...rows].sort((a, b) => b.rem - a.rem).slice(0, Math.max(0, missing)).forEach((r) => (r.amount += 1));
  return rows.filter((r) => r.amount !== 0).map((r) => ({ ...r.p, amount: r.amount }));
}

// 차액 합이 0 인 무리로 최대한 많이 나눈다 (people.length <= EXACT_MAX_PEOPLE).
// dp[mask] = mask 에서 한 명씩 빼 나갈 때 거치는 "합이 0 인 집합"의 최대 개수. 그 순서를 따라가면 무리가 나온다.
function splitZeroSumGroups(people) {
  const n = people.length;
  const full = (1 << n) - 1;
  const sum = new Float64Array(1 << n);
  const dp = new Int8Array(1 << n);
  for (let mask = 1; mask <= full; mask++) {
    const low = mask & -mask;
    sum[mask] = sum[mask ^ low] + people[31 - Math.clz32(low)].amount;
    let best = 0;
    for (let rest = mask; rest; rest &= rest - 1) {
      const v = dp[mask ^ (rest & -rest)];
      if (v > best) best = v;
    }
    dp[mask] = best + (sum[mask] === 0 ? 1 : 0);
  }
  const groups = [];
  let current = [];
  let mask = full;
  while (mask) {
    const target = dp[mask] - (sum[mask] === 0 ? 1 : 0);
    let pick = -1;
    for (let rest = mask; rest; rest &= rest - 1) {
      const bit = rest & -rest;
      if (dp[mask ^ bit] === target) {
        pick = bit;
        break;
      }
    }
    current.push(people[31 - Math.clz32(pick)]);
    mask ^= pick;
    if (sum[mask] === 0) {
      groups.push(current);
      current = [];
    }
  }
  return groups;
}

// 인원이 많을 때: 금액이 딱 맞는 짝부터 묶고, 나머지는 한 무리로.
function splitGreedy(people) {
  const rest = [...people];
  const groups = [];
  for (let i = 0; i < rest.length; i++) {
    const j = rest.findIndex((q, k) => k > i && q.amount === -rest[i].amount);
    if (j > i) {
      groups.push([rest[i], rest[j]]);
      rest.splice(j, 1);
      rest.splice(i, 1);
      i--;
    }
  }
  if (rest.length) groups.push(rest);
  return groups;
}

// 정해진 순서로 앞에서부터 채워 나간다(북서 모서리). 합이 0 이 되는 더 작은 무리가 없으면 (인원 - 1)번이 된다.
function fillInOrder(debtors, creditors) {
  const owe = debtors.map((d) => -d.amount);
  const due = creditors.map((c) => c.amount);
  const edges = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(owe[i], due[j]);
    if (amount > 0) edges.push({ d: debtors[i], c: creditors[j], amount });
    owe[i] -= amount;
    due[j] -= amount;
    if (owe[i] === 0) i++;
    if (due[j] === 0) j++;
  }
  return edges;
}

// 작을수록 좋은 점수: [가장 많이 보내는 횟수, 결제한 사람이 더 보내는 횟수, 보내는 횟수의 쏠림, 가장 많이 받는 횟수]
function edgeScore(edges) {
  const sends = new Map();
  const receives = new Map();
  edges.forEach((e) => {
    sends.set(e.d, (sends.get(e.d) || 0) + 1);
    receives.set(e.c, (receives.get(e.c) || 0) + 1);
  });
  let maxSend = 0;
  let payerExtra = 0;
  let spread = 0;
  sends.forEach((k, d) => {
    maxSend = Math.max(maxSend, k);
    if (d.paid > 0) payerExtra += k - 1;
    spread += k * k;
  });
  return [edges.length, maxSend, payerExtra, spread, Math.max(0, ...receives.values())];
}

const better = (a, b) => {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i];
  return false;
};

function permutations(list) {
  if (list.length <= 1) return [list];
  return list.flatMap((x, i) => permutations([...list.slice(0, i), ...list.slice(i + 1)]).map((rest) => [x, ...rest]));
}

const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));

// 한 무리 안의 송금 — 가능한 순서를 따져 점수가 가장 좋은 것을 고른다.
function settleGroup(group) {
  // 결제하지 않은 사람 먼저, 그다음 보낼 돈이 많은 순 / 받을 돈이 많은 순
  const debtors = group.filter((p) => p.amount < 0).sort((a, b) => (a.paid > 0) - (b.paid > 0) || a.amount - b.amount);
  const creditors = group.filter((p) => p.amount > 0).sort((a, b) => b.amount - a.amount);
  let best = fillInOrder(debtors, creditors);
  if (factorial(debtors.length) * factorial(creditors.length) > ORDER_SEARCH_LIMIT) return best;
  let bestScore = edgeScore(best);
  const creditorOrders = permutations(creditors);
  permutations(debtors).forEach((ds) => {
    creditorOrders.forEach((cs) => {
      const edges = fillInOrder(ds, cs);
      const score = edgeScore(edges);
      if (better(score, bestScore)) {
        best = edges;
        bestScore = score;
      }
    });
  });
  return best;
}

export function computeFairTransactions(balances) {
  const people = roundBalances(balances);
  if (people.length === 0) return [];
  const groups = people.length <= EXACT_MAX_PEOPLE ? splitZeroSumGroups(people) : splitGreedy(people);
  const edges = groups.flatMap(settleGroup);

  // 보여주는 순서: 결제하지 않은 사람이 먼저, 그다음 보낼 총액이 큰 사람
  const sendTotal = new Map();
  edges.forEach((e) => sendTotal.set(e.d, (sendTotal.get(e.d) || 0) + e.amount));
  const inputOrder = new Map(balances.map((p, i) => [p.id, i]));
  const rank = (d) => [d.paid > 0 ? 1 : 0, -sendTotal.get(d), inputOrder.get(d.id)];
  edges.sort((a, b) => {
    const x = rank(a.d);
    const y = rank(b.d);
    return x[0] - y[0] || x[1] - y[1] || x[2] - y[2] || b.amount - a.amount;
  });

  return edges.map((e) => ({ fromId: e.d.id, from: e.d.name, to: e.c.name, toAccount: e.c.account || "", amount: e.amount }));
}

// 개별 송금 내역을 "보내는 사람" 기준으로 묶는다. 동명이인이 섞이지 않도록
// 이름이 아닌 id 로 그룹핑한다.
export function groupTransactions(flatTransactions) {
  const order = [];
  const map = new Map();
  flatTransactions.forEach((t) => {
    if (!map.has(t.fromId)) {
      map.set(t.fromId, []);
      order.push(t.fromId);
    }
    map.get(t.fromId).push(t);
  });
  return order.map((fromId) => {
    const items = map.get(fromId);
    return { from: items[0].from, items, subtotal: items.reduce((s, i) => s + i.amount, 0) };
  });
}

// 결과를 카카오톡 등에 붙여넣기 좋은 평문으로 만든다.
export function buildResultText(stats, groupedTransactions) {
  const lines = ["정산 결과"];
  stats.forEach((s) => {
    const sign = s.balance > BALANCE_EPS ? "+" : "";
    lines.push(
      `${s.name}  낸 금액 ${won(s.paid)}원 / 부담 ${won(s.share)}원 / 차액 ${sign}${won(s.balance)}원`
    );
  });
  lines.push("");
  groupedTransactions.forEach((g) => {
    lines.push(`${g.from} (총 ${won(g.subtotal)}원)`);
    g.items.forEach((i) => {
      const acc = i.toAccount ? ` (${i.toAccount})` : "";
      lines.push(`  → ${i.to}${acc}  ${won(i.amount)}원`);
    });
  });
  return lines.join("\n");
}
