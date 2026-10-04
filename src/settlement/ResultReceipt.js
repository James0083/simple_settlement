/* 이미지로 캡처되는 영역 — 사람별 결제 내역 표 + 최종 송금 결과 */
import { forwardRef, Fragment, useState, useRef, useEffect, useLayoutEffect } from "react";
import { html } from "../shared/html.js";
import { styles, C_RED, C_GREEN, C_MUTED } from "../shared/styles.js";
import { won } from "../shared/util.js";
import { BrandLogo } from "../shared/BrandLogo.js";

// 표는 머리글·모든 행이 한 그리드라 열 경계가 항상 맞는다. 이름 칸은 한글 네 글자(13.5px 굵게)가 들어가는 고정 폭
// (더 긴 이름은 줄바꿈), 금액 칸 셋은 남는 폭을 똑같이 나누되 가장 긴 금액보다 좁아지지 않는다.
// 금액 칸에는 숫자만 두고 단위 "원"은 머리글에 적는다 — 360px 폰에서도 6자리까지 12px 로 한 줄에 들어간다.
// 7자리(100만 원) 이상이 하나라도 있으면 금액 글자를 줄여 360px 에서도 한 줄을 지킨다. (이미지 저장도 같은 크기)
const LONG_AMOUNT = 1_000_000;
const NUM_FONT_LONG = 10;

const hasLongAmount = (stats) =>
  stats.some((s) => [s.paid, s.share, s.balance].some((v) => Math.abs(Math.round(v)) >= LONG_AMOUNT));

const balanceColor = (s) => (s.balance > 0.5 ? C_GREEN : s.balance < -0.5 ? C_RED : C_MUTED);
const signedWon = (s) => `${s.balance > 0.5 ? "+" : ""}${won(s.balance)}`;

// 그래도 표가 넘치면(320px 폰 등) 금액을 이름 아래 줄로 내린 배치로 바꾼다.
// 화면 폭 기준값 대신 실제로 그린 표가 넘치는지 잰다 — 폭(회전)이나 금액이 바뀌면 표로 다시 그려 보고 또 잰다.
// useLayoutEffect 라 화면에 그려지기 전에 정해져 깜빡이지 않고, 이미지 저장도 화면과 같은 배치로 나온다.
function useStackedLayout(stats) {
  const blockRef = useRef(null);
  const gridRef = useRef(null);
  const [boxW, setBoxW] = useState(0);
  const [stacked, setStacked] = useState(false);

  // 폭만 본다 — 배치가 바뀌며 높이가 변해도 다시 재지 않게.
  useEffect(() => {
    const el = blockRef.current;
    if (!el) return;
    const measure = () => el.clientWidth > 0 && setBoxW(el.clientWidth);
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useLayoutEffect(() => setStacked(false), [boxW, stats]);
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!stacked && grid && grid.scrollWidth > grid.clientWidth + 1) setStacked(true);
  });

  return { blockRef, gridRef, stacked };
}

// 좁은 화면용 — 1줄: 이름 · 차액, 2줄: 낸 금액 · 부담액, (3줄: 개별 + 공통 내역)
function StackedStats({ stats }) {
  return html`
    <div>
      ${stats.map(
        (s) => html`
          <div key=${s.id} style=${styles.statsStackRow}>
            <div style=${styles.statsStackHead}>
              <span style=${styles.statsName}>${s.name}</span>
              <span style=${{ ...styles.statsNum, fontWeight: 700, color: balanceColor(s) }}>${signedWon(s)}원</span>
            </div>
            <p style=${styles.statsStackSub}>
              <span style=${styles.statsStackItem}>낸 금액 ${won(s.paid)}원</span> ·${" "}
              <span style=${styles.statsStackItem}>부담액 ${won(s.share)}원</span>
            </p>
            ${s.custom > 0 &&
            html`<p style=${styles.statsStackSub}>= 개별 ${won(s.custom)}원 + 공통 ${won(s.share - s.custom)}원</p>`}
          </div>
        `
      )}
    </div>
  `;
}

export const ResultReceipt = forwardRef(function ResultReceipt(
  { calcDate, stats, groupedTransactions },
  ref
) {
  const num = hasLongAmount(stats) ? { ...styles.statsNum, fontSize: NUM_FONT_LONG } : styles.statsNum;
  const { blockRef, gridRef, stacked } = useStackedLayout(stats);

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

      <div ref=${blockRef} style=${styles.statsBlock}>
        <div style=${styles.statsSubLabel}>사람별 결제 내역</div>
        ${stacked
          ? html`<${StackedStats} stats=${stats} />`
          : html`
            <div ref=${gridRef} style=${styles.statsGrid}>
              <span style=${styles.statsCell}>이름</span>
              <span style=${{ ...styles.statsCell, textAlign: "right" }}>낸 금액(원)</span>
              <span style=${{ ...styles.statsCell, textAlign: "right" }}>부담액(원)</span>
              <span style=${{ ...styles.statsCell, textAlign: "right" }}>차액(원)</span>
              <div style=${styles.statsHeadDivider} aria-hidden="true"></div>
              ${stats.map(
                (s) => html`
                  <${Fragment} key=${s.id}>
                    <span style=${styles.statsName}>${s.name}</span>
                    <span style=${num}>${won(s.paid)}</span>
                    <span style=${num}>${won(s.share)}</span>
                    <span style=${{ ...num, fontWeight: 700, color: balanceColor(s) }}>${signedWon(s)}</span>
                    ${s.custom > 0 &&
                    html`
                      <p style=${styles.statsBreakdown}>
                        = 개별 ${won(s.custom)}원 + 공통 ${won(s.share - s.custom)}원
                      </p>
                    `}
                    <div style=${styles.statsRowDivider} aria-hidden="true"></div>
                  <//>
                `
              )}
            </div>
          `}
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
                          <li key=${i} style=${styles.txItem}>
                            <div style=${styles.txRow}>
                              <span style=${styles.txArrow}>→</span>
                              <span style=${styles.txTo}>${t.to}</span>
                              <span style=${styles.txAmount}>${won(t.amount)}원</span>
                            </div>
                            ${t.toAccount && html`<div style=${styles.txAccount}>${t.toAccount}</div>`}
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
