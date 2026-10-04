/* 정산 탭 — 참가자 · 회차 입력 → 계산 → 결과. 상태는 셸(App)에서 받은 useSettlement 값(s). */
import { html } from "../shared/html.js";
import { styles } from "../shared/styles.js";
import { BrandLogo } from "../shared/BrandLogo.js";
import { ReceiptCard, ScreenHeader } from "../shared/ReceiptCard.js";
import { ParticipantsSection } from "./ParticipantsSection.js";
import { RoundsSection } from "./RoundsSection.js";
import { SummarySection } from "./SummarySection.js";
import { ResultReceipt } from "./ResultReceipt.js";
import { AdSlot } from "../shared/AdSlot.js";

export function SettleScreen({ s }) {
  return html`
    <${ReceiptCard}>
      <${ScreenHeader}
        Icon=${BrandLogo}
        title="딱정산"
        subtitle="회차별로 결제자와 참여자를 나눠 입력하면, 자동으로 정산해드려요"
      />

      <${ParticipantsSection}
        participants=${s.participants}
        onAdd=${s.addParticipant}
        onUpdateName=${s.updateParticipantName}
        onUpdateAccount=${s.updateParticipantAccount}
        onToggleAccount=${s.toggleParticipantAccount}
        onRemove=${s.removeParticipant}
      />

      <div style=${styles.dashedDivider} aria-hidden="true"></div>

      <${RoundsSection}
        rounds=${s.rounds}
        validParticipants=${s.validParticipants}
        isAllSelected=${s.isAllSelected}
        onAdd=${s.addRound}
        onUpdate=${s.updateRound}
        onUpdateAmount=${s.updateRoundAmount}
        onUpdateCustomAmount=${s.updateRoundCustomAmount}
        onRemove=${s.removeRound}
        onToggleParticipant=${s.toggleRoundParticipant}
        onToggleAll=${s.toggleAllRoundParticipants}
      />

      <div style=${styles.dashedDivider} aria-hidden="true"></div>

      <${SummarySection}
        participantsCount=${s.validParticipantsCount}
        roundsCount=${s.validRoundsCount}
        totalAmount=${s.totalAmount}
      />

      <${AdSlot} placement="settle-mid" />

      <button
        className="settle-calc-btn"
        style=${{
          ...styles.calcBtn,
          opacity: s.canCalculate ? 1 : 0.45,
          cursor: s.canCalculate ? "pointer" : "not-allowed",
        }}
        onClick=${s.handleCalculate}
        disabled=${!s.canCalculate}
      >
        정산 계산하기
      </button>
      ${!s.canCalculate &&
      html`
        <p style=${styles.hint}>
          참가자 2명 이상, 결제자·금액·참여자를 모두 입력한 회차가 1개 이상이어야 계산할 수
          있어요.
        </p>
      `}

      ${s.calculated &&
      html`
        <div ref=${s.resultRef}>
          <div style=${styles.dashedDivider} aria-hidden="true"></div>

          <${ResultReceipt}
            ref=${s.captureRef}
            calcDate=${s.calcDate}
            stats=${s.stats}
            groupedTransactions=${s.groupedTransactions}
          />

          <div style=${styles.actionRow}>
            <button className="settle-copy-btn" style=${styles.copyBtn} onClick=${s.handleCopy}>
              ${s.copied ? "복사됐어요" : "결과 복사하기"}
            </button>
            <button
              className="settle-download-btn"
              style=${{
                ...styles.downloadBtn,
                opacity: s.downloading ? 0.6 : 1,
                cursor: s.downloading ? "not-allowed" : "pointer",
              }}
              onClick=${s.handleDownloadImage}
              disabled=${s.downloading}
            >
              ${s.downloading ? "이미지 생성 중..." : "이미지로 저장"}
            </button>
          </div>
          <${AdSlot} placement="settle-result" />
        </div>
      `}
    <//>
  `;
}
