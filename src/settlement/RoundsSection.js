/* 회차 입력 — 회차마다 이름 · 결제자 1명 · 금액 · 참여자 목록 · 참여자별 개별 금액(선택) */
import { useState, useRef } from "react";
import { html } from "../shared/html.js";
import { styles } from "../shared/styles.js";
import { ChevronIcon } from "../shared/icons.js";
import { won } from "../shared/util.js";
import { splitRound, parseAmount } from "./settlement.js";

// 개별 금액 한 줄 — "13000+4000" 처럼 여러 메뉴를 이어 적을 수 있다.
// 휴대폰 숫자 키패드에는 + 가 없어서 옆에 + 버튼을 두고, 누르면 + 를 붙이고 입력칸으로 돌아간다.
function CustomAmountRow({ name, value, onChange }) {
  const inputRef = useRef(null);
  const hasPlus = value.includes("+");
  const addPlus = () => {
    if (value && !value.endsWith("+")) onChange(`${value}+`);
    inputRef.current?.focus();
  };
  return html`
    <div>
      <div style=${styles.customRow}>
        <span style=${styles.customName}>${name}</span>
        <div style=${styles.amountWrap}>
          <input
            ref=${inputRef}
            className="settle-amount-input"
            style=${styles.amountInput}
            type="text"
            inputMode="numeric"
            placeholder="0"
            aria-label=${`${name} 개별 금액`}
            value=${value}
            onChange=${(e) => onChange(e.target.value)}
          />
          <span style=${styles.wonSuffix}>원</span>
        </div>
        <button
          type="button"
          style=${styles.customPlusBtn}
          onClick=${addPlus}
          aria-label=${`${name} 메뉴 금액 더하기`}
        >
          +
        </button>
      </div>
      ${hasPlus && html`<p style=${styles.customSum}>= ${won(parseAmount(value))}원</p>`}
    </div>
  `;
}

// 금액 따로 입력 — 맨 위 공통 금액(총액 - 개별 금액 합, 1/n), 그 아래 참여자별 개별 금액 입력칸
function CustomAmountsPanel({ round, validParticipants, onUpdateCustomAmount }) {
  const { activeIds, common } = splitRound(round, new Set(validParticipants.map((p) => p.id)));
  const activePeople = validParticipants.filter((p) => activeIds.includes(p.id));
  const hasAmount = (parseFloat(round.amount) || 0) > 0;

  if (activePeople.length === 0) {
    return html`
      <div style=${styles.customPanel}>
        <span style=${styles.chipEmptyHint}>참여한 사람을 먼저 선택해주세요</span>
      </div>
    `;
  }
  return html`
    <div style=${styles.customPanel}>
      <div style=${styles.customCommonRow}>
        <span style=${styles.customCommonLabel}>공통 금액 (1/n)</span>
        <span style=${styles.customCommonValue}>${won(Math.max(0, common))}원</span>
      </div>
      <p style=${styles.customPerHead}>1인당 ${won(Math.max(0, common) / activePeople.length)}원</p>
      ${activePeople.map(
        (p) => html`
          <${CustomAmountRow}
            key=${p.id}
            name=${p.name.trim()}
            value=${round.customAmounts[p.id] || ""}
            onChange=${(raw) => onUpdateCustomAmount(round.id, p.id, raw)}
          />
        `
      )}
      ${hasAmount &&
      common < 0 &&
      html`<p style=${styles.customWarn}>⚠ 개별 금액 합이 총액보다 ${won(-common)}원 많아요</p>`}
    </div>
  `;
}

function RoundCard({
  round,
  index,
  validParticipants,
  allSelected,
  onUpdate,
  onUpdateAmount,
  onUpdateCustomAmount,
  onRemove,
  onToggleParticipant,
  onToggleAll,
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const customCount = round.participantIds.filter((id) => round.customAmounts[id]).length;

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

      <button
        type="button"
        style=${styles.customToggleBtn}
        onClick=${() => setCustomOpen(!customOpen)}
        aria-expanded=${customOpen}
      >
        금액 따로 입력
        ${customCount > 0 && html`<span style=${styles.customToggleCount}>· ${customCount}명 입력됨</span>`}
        <${ChevronIcon} up=${customOpen} style=${styles.customChevron} />
      </button>
      ${customOpen &&
      html`
        <${CustomAmountsPanel}
          round=${round}
          validParticipants=${validParticipants}
          onUpdateCustomAmount=${onUpdateCustomAmount}
        />
      `}
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
  onUpdateCustomAmount,
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
              onUpdateCustomAmount=${onUpdateCustomAmount}
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
