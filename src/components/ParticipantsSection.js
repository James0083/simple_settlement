/* 참가자 이름 입력 목록 (금액은 여기서 넣지 않는다). 계좌는 토글로 펼쳐지는 선택 입력. */
import { html } from "../lib/html.js";
import { styles } from "../ui/styles.js";

// 트림한 이름별 등장 횟수 — 2번 이상이면 동명이인으로 간주해 경고를 보여준다.
// (송금 대상/결제자 선택 등에서 동명이인이 구분되지 않아 혼동될 수 있음)
function countNames(participants) {
  const counts = new Map();
  participants.forEach((p) => {
    const name = p.name.trim();
    if (!name) return;
    counts.set(name, (counts.get(name) || 0) + 1);
  });
  return counts;
}

export function ParticipantsSection({
  participants,
  onAdd,
  onUpdateName,
  onUpdateAccount,
  onToggleAccount,
  onRemove,
}) {
  const nameCounts = countNames(participants);

  return html`
    <section style=${styles.section}>
      <div style=${styles.sectionLabel}>참가자</div>
      <div style=${styles.peopleList}>
        ${participants.map((p) => {
          const trimmedName = p.name.trim();
          const isDuplicateName = trimmedName.length > 0 && nameCounts.get(trimmedName) > 1;
          return html`
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
              ${isDuplicateName &&
              html`<p style=${styles.nameWarn}>⚠ 같은 이름이 있어요 — 구분을 위해 다르게 입력해주세요 (예: 철수1, 철수2)</p>`}
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
          `;
        })}
      </div>
      <button className="settle-add-btn" style=${styles.addBtn} onClick=${onAdd}>
        + 참가자 추가
      </button>
    </section>
  `;
}
