/*
 * 정산 알고리즘 — 딱정산의 핵심. 순수 함수만 모아 둔다. (React 의존 없음)
 *
 * 데이터 구조
 *   참가자: { id, name }
 *   회차:   { id, title, payerId, amount, participantIds: [id, ...] }
 *
 * 흐름: computeStats → computeFairTransactions → groupTransactions
 */
import { won } from "./util.js";

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
    map.set(p.id, { id: p.id, name: p.name.trim(), paid: 0, share: 0 })
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

// 채무자 각각이 채권자 각각에게 "받을 금액에 비례"해서 나눠 보내도록 계산.
// -> 한 사람에게 정산이 몰리지 않고, 여러 채무자가 비슷한 구조로 나눠 보내게 됨.
// 원 단위 반올림 오차는 나머지가 큰 거래부터 1원씩 보정한다(최대 나머지법).
export function computeFairTransactions(balances) {
  const creditors = balances.filter((p) => p.balance > 0.5);
  const debtors = balances
    .filter((p) => p.balance < -0.5)
    .map((p) => ({ name: p.name, debt: -p.balance }));

  if (creditors.length === 0 || debtors.length === 0) return [];

  const totalCredit = creditors.reduce((s, c) => s + c.balance, 0);

  const entries = [];
  debtors.forEach((d) => {
    creditors.forEach((c) => {
      const raw = (d.debt * c.balance) / totalCredit;
      entries.push({ from: d.name, to: c.name, raw, floor: Math.floor(raw) });
    });
  });

  const sumFloor = entries.reduce((s, e) => s + e.floor, 0);
  const targetTotal = Math.round(totalCredit);
  const diff = targetTotal - sumFloor;

  const order = entries
    .map((e, idx) => ({ idx, remainder: e.raw - e.floor }))
    .sort((a, b) => b.remainder - a.remainder);

  for (let i = 0; i < diff && i < order.length; i++) {
    entries[order[i].idx].floor += 1;
  }

  return entries
    .filter((e) => e.floor > 0)
    .map((e) => ({ from: e.from, to: e.to, amount: e.floor }));
}

// 개별 송금 내역을 "보내는 사람" 기준으로 묶는다.
export function groupTransactions(flatTransactions) {
  const order = [];
  const map = new Map();
  flatTransactions.forEach((t) => {
    if (!map.has(t.from)) {
      map.set(t.from, []);
      order.push(t.from);
    }
    map.get(t.from).push(t);
  });
  return order.map((from) => {
    const items = map.get(from);
    return { from, items, subtotal: items.reduce((s, i) => s + i.amount, 0) };
  });
}

// 결과를 카카오톡 등에 붙여넣기 좋은 평문으로 만든다.
export function buildResultText(stats, groupedTransactions) {
  const lines = ["정산 결과"];
  stats.forEach((s) => {
    const sign = s.balance > 0.5 ? "+" : "";
    lines.push(
      `${s.name}  낸 금액 ${won(s.paid)}원 / 부담 ${won(s.share)}원 / 차액 ${sign}${won(s.balance)}원`
    );
  });
  lines.push("");
  groupedTransactions.forEach((g) => {
    lines.push(`${g.from} (총 ${won(g.subtotal)}원)`);
    g.items.forEach((i) => lines.push(`  → ${i.to}  ${won(i.amount)}원`));
  });
  return lines.join("\n");
}
