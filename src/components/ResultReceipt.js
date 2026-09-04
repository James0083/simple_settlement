/* 이미지로 캡처되는 영역 — 사람별 결제 내역 표 + 최종 송금 결과 */
import { forwardRef } from "react";
import { html } from "../lib/html.js";
import { styles } from "../ui/styles.js";
import { won } from "../lib/util.js";
import { BrandLogo } from "./BrandLogo.js";

export const ResultReceipt = forwardRef(function ResultReceipt(
  { calcDate, stats, groupedTransactions },
  ref
) {
  return html`
    <div ref=${ref} style=${styles.captureWrap}>
      <div style=${styles.captureTitleRow}>
        <span style=${styles.captureTitleText}>
          <${BrandLogo} style=${styles.captureLogo} />
          딱정산
        </span>
        <span className="settle-stamp" style=${styles.stamp}>정산 완료</span>
      </div>
      <p style=${styles.captureDate}>${calcDate}</p>

      <div style=${styles.statsBlock}>
        <div style=${styles.statsSubLabel}>사람별 결제 내역</div>
        <div style=${styles.statsHeadRow}>
          <span style=${{ ...styles.statsCell, flex: 1.1 }}>이름</span>
          <span style=${{ ...styles.statsCell, flex: 1, textAlign: "right" }}>낸 금액</span>
          <span style=${{ ...styles.statsCell, flex: 1, textAlign: "right" }}>부담액</span>
          <span style=${{ ...styles.statsCell, flex: 1, textAlign: "right" }}>차액</span>
        </div>
        ${stats.map(
          (s) => html`
            <div key=${s.id} style=${styles.statsRow}>
              <span style=${{ ...styles.statsName, flex: 1.1 }}>${s.name}</span>
              <span style=${{ ...styles.statsNum, flex: 1 }}>${won(s.paid)}원</span>
              <span style=${{ ...styles.statsNum, flex: 1 }}>${won(s.share)}원</span>
              <span
                style=${{
                  ...styles.statsNum,
                  flex: 1,
                  fontWeight: 700,
                  color: s.balance > 0.5 ? "#0F9D64" : s.balance < -0.5 ? "#E8503A" : "#9AA0B0",
                }}
              >
                ${s.balance > 0.5 ? "+" : ""}${won(s.balance)}원
              </span>
            </div>
          `
        )}
      </div>

      <div style=${styles.dashedDivider} aria-hidden="true"></div>

      <div style=${styles.statsSubLabel}>정산 결과</div>
      <p style=${styles.groupHint}>보내는 사람별로 묶어서 보여드려요</p>

      ${groupedTransactions.length === 0
        ? html`<p style=${styles.evenText}>정산할 차액이 없어요.</p>`
        : html`
            <div style=${styles.groupList}>
              ${groupedTransactions.map(
                (g, gi) => html`
                  <div key=${gi} style=${styles.groupCard}>
                    <div style=${styles.groupHeadRow}>
                      <span style=${styles.groupFrom}>${g.from}</span>
                      <span style=${styles.groupSubtotal}>총 ${won(g.subtotal)}원</span>
                    </div>
                    <ul style=${styles.txList}>
                      ${g.items.map(
                        (t, i) => html`
                          <li key=${i} style=${styles.txRow}>
                            <span style=${styles.txArrow}>→</span>
                            <span style=${styles.txTo}>${t.to}</span>
                            <span style=${styles.txAmount}>${won(t.amount)}원</span>
                          </li>
                        `
                      )}
                    </ul>
                  </div>
                `
              )}
            </div>
          `}
    </div>
  `;
});
