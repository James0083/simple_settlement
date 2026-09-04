/* 참가자 이름 입력 목록 (금액은 여기서 넣지 않는다) */
import { html } from "../lib/html.js";
import { styles } from "../ui/styles.js";

export function ParticipantsSection({ participants, onAdd, onUpdateName, onRemove }) {
  return html`
    <section style=${styles.section}>
      <div style=${styles.sectionLabel}>참가자</div>
      <div style=${styles.peopleList}>
        ${participants.map(
          (p) => html`
            <div key=${p.id} style=${styles.personRow}>
              <input
                className="settle-name-input"
                style=${styles.nameInputFull}
                type="text"
                placeholder="이름"
                value=${p.name}
                onChange=${(e) => onUpdateName(p.id, e.target.value)}
              />
              <button
                className="settle-remove-btn"
                style=${styles.removeBtn}
                onClick=${() => onRemove(p.id)}
                aria-label=${`${p.name || "참가자"} 삭제`}
              >
                ✕
              </button>
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
