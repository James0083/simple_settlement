/* 딱정산 — 최상위 컴포넌트. 상태는 useSettlement 훅에, 화면 조각은 components/ 에. */
import { html } from "./lib/html.js";
import { styles } from "./ui/styles.js";
import { useSettlement } from "./hooks/useSettlement.js";
import { BrandLogo } from "./components/BrandLogo.js";
import { ParticipantsSection } from "./components/ParticipantsSection.js";
import { RoundsSection } from "./components/RoundsSection.js";
import { SummarySection } from "./components/SummarySection.js";
import { ResultReceipt } from "./components/ResultReceipt.js";
import { ImagePreviewOverlay } from "./components/ImagePreviewOverlay.js";
import { SiteFooter } from "./components/SiteFooter.js";

export function App() {
  const s = useSettlement();

  return html`
    <div style=${styles.page}>
      <div style=${styles.receipt}>
        <div style=${styles.zigzagTop} aria-hidden="true"></div>

        <div style=${styles.inner}>
          <header style=${styles.header}>
            <${BrandLogo} style=${styles.logo} />
            <h1 style=${styles.title}>딱정산</h1>
            <p style=${styles.subtitle}>
              회차별로 결제자와 참여자를 나눠 입력하면, 자동으로 정산해드려요
            </p>
          </header>

          <${ParticipantsSection}
            participants=${s.participants}
            onAdd=${s.addParticipant}
            onUpdateName=${s.updateParticipantName}
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
            </div>
          `}
        </div>

        <div style=${styles.zigzagBottom} aria-hidden="true"></div>
      </div>

      <${SiteFooter} />

      <${ImagePreviewOverlay} preview=${s.imagePreview} onClose=${() => s.setImagePreview(null)} />
    </div>
  `;
}
