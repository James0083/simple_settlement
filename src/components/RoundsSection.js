/* 회차 입력 — 회차마다 이름 · 결제자 1명 · 금액 · 참여자 목록 */
import { html } from "../lib/html.js";
import { styles } from "../ui/styles.js";

function RoundCard({
  round,
  index,
  validParticipants,
  allSelected,
  onUpdate,
  onUpdateAmount,
  onRemove,
  onToggleParticipant,
  onToggleAll,
}) {
  return html`
    <div style=${styles.roundCard}>
      <div style=${styles.roundTopRow}>
        <input
          className="settle-name-input"
          style=${styles.roundTitleInput}
          type="text"
          placeholder=${`정산 이름 (예: ${index + 1}차)`}
          value=${round.title}
          onChange=${(e) => onUpdate(round.id, "title", e.target.value)}
        />
        <button
          className="settle-remove-btn"
          style=${styles.removeBtn}
          onClick=${() => onRemove(round.id)}
          aria-label="회차 삭제"
        >
          ✕
        </button>
      </div>

      <div style=${styles.roundFieldRow}>
        <select
          className="settle-select"
          style=${{ ...styles.selectInput, ...(round.payerId ? null : styles.selectInputWarn) }}
          value=${round.payerId}
          onChange=${(e) => onUpdate(round.id, "payerId", e.target.value)}
        >
          <option value="">결제한 사람</option>
          ${validParticipants.map(
            (p) => html`<option key=${p.id} value=${p.id}>${p.name.trim()}</option>`
          )}
        </select>
        <div style=${styles.amountWrap}>
          <input
            className="settle-amount-input"
            style=${styles.amountInput}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="0"
            value=${round.amount}
            onChange=${(e) => onUpdateAmount(round.id, e.target.value)}
          />
          <span style=${styles.wonSuffix}>원</span>
        </div>
      </div>
      ${!round.payerId && html`<p style=${styles.payerWarn}>⚠ 결제한 사람을 선택하세요</p>`}

      <div style=${styles.roundChipHeadRow}>
        <span style=${styles.roundChipLabel}>참여한 사람</span>
        <button
          type="button"
          style=${styles.roundToggleAllBtn}
          onClick=${() => onToggleAll(round.id)}
        >
          ${allSelected ? "전체 해제" : "전체 선택"}
        </button>
      </div>
      <div style=${styles.chipRow}>
        ${validParticipants.length === 0
          ? html`<span style=${styles.chipEmptyHint}>참가자 이름을 먼저 입력해주세요</span>`
          : validParticipants.map((p) => {
              const active = round.participantIds.includes(p.id);
              return html`
                <button
                  key=${p.id}
                  type="button"
                  className=${active ? "settle-chip-active" : "settle-chip-inactive"}
                  style=${{ ...styles.chip, ...(active ? styles.chipActive : styles.chipInactive) }}
                  onClick=${() => onToggleParticipant(round.id, p.id)}
                >
                  ${p.name.trim()}
                </button>
              `;
            })}
      </div>
    </div>
  `;
}

export function RoundsSection({
  rounds,
  validParticipants,
  isAllSelected,
  onAdd,
  onUpdate,
  onUpdateAmount,
  onRemove,
  onToggleParticipant,
  onToggleAll,
}) {
  return html`
    <section style=${styles.section}>
      <div style=${styles.sectionLabel}>회차</div>
      <div style=${styles.roundsList}>
        ${rounds.map(
          (r, idx) => html`
            <${RoundCard}
              key=${r.id}
              round=${r}
              index=${idx}
              validParticipants=${validParticipants}
              allSelected=${isAllSelected(r)}
              onUpdate=${onUpdate}
              onUpdateAmount=${onUpdateAmount}
              onRemove=${onRemove}
              onToggleParticipant=${onToggleParticipant}
              onToggleAll=${onToggleAll}
            />
          `
        )}
      </div>
      <button className="settle-add-btn" style=${styles.addBtn} onClick=${onAdd}>
        + 회차 추가
      </button>
    </section>
  `;
}
