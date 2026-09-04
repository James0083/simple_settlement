/* 계산 전 요약 — 참가 인원 · 정산 회차 · 총 사용 금액 */
import { html } from "../lib/html.js";
import { styles } from "../ui/styles.js";
import { won } from "../lib/util.js";

export function SummarySection({ participantsCount, roundsCount, totalAmount }) {
  return html`
    <section style=${styles.summaryBlock}>
      <div style=${styles.summaryRow}>
        <span style=${styles.summaryLabel}>참가 인원</span>
        <span style=${styles.summaryValue}>${participantsCount}명</span>
      </div>
      <div style=${styles.summaryRow}>
        <span style=${styles.summaryLabel}>정산 회차</span>
        <span style=${styles.summaryValue}>${roundsCount}건</span>
      </div>
      <div style=${styles.summaryRow}>
        <span style=${styles.summaryLabel}>총 사용 금액</span>
        <span style=${{ ...styles.summaryValue, color: "#E8503A" }}>${won(totalAmount)}원</span>
      </div>
    </section>
  `;
}
