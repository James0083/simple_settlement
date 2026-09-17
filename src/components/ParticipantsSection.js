/* 참가자 이름 입력 목록 (금액은 여기서 넣지 않는다). 계좌는 토글로 펼쳐지는 선택 입력. */
import { html } from "../lib/html.js";
import { styles } from "../ui/styles.js";

export function ParticipantsSection({
  participants,
  onAdd,
  onUpdateName,
  onUpdateAccount,
  onToggleAccount,
  onRemove,
}) {
  return html`
    <section style=${styles.section}>
      <div style=${styles.sectionLabel}>참가자</div>
      <div style=${styles.peopleList}>
        ${participants.map(
          (p) => html`
            <div key=${p.id} style=${styles.personBlock}>
              <div style=${styles.personRow}>
                <input
                  className="settle-name-input"
                  style=${styles.nameInputFull}
                  type="text"
                  placeholder="이름"
                  value=${p.name}
                  onChange=${(e) => onUpdateName(p.id, e.target.value)}
                />
                <button
                  type="button"
                  style=${styles.accountToggleBtn}
                  onClick=${() => onToggleAccount(p.id)}
                  aria-label=${`${p.name || "참가자"} 계좌 ${p.showAccount ? "닫기" : "입력"}`}
                >
                  ${p.showAccount ? "계좌 닫기" : (p.account.trim() ? "계좌 수정" : "+ 계좌")}
                </button>
                <button
                  className="settle-remove-btn"
                  style=${styles.removeBtn}
                  onClick=${() => onRemove(p.id)}
                  aria-label=${`${p.name || "참가자"} 삭제`}
                >
                  ✕
                </button>
              </div>
              ${p.showAccount &&
              html`
                <input
                  className="settle-account-input"
                  style=${styles.accountInput}
                  type="text"
                  placeholder="정산받을 계좌 (예: 카카오뱅크 3333-01-1234567) — 선택"
                  value=${p.account}
                  onChange=${(e) => onUpdateAccount(p.id, e.target.value)}
                />
              `}
            </div>
          `
        )}
      </div>
      <button className="settle-add-btn" style=${styles.addBtn} onClick=${onAdd}>
        + 참가자 추가
      </button>
    </section>
  `;
}
