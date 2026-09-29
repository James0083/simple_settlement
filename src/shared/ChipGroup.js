/*
 * 칩 선택 — 회차 참여자 칩과 같은 모양. multi 면 value 는 배열(여러 개 선택), 아니면 id 하나.
 * options: [{ id, label }]
 */
import { html } from "./html.js";
import { styles } from "./styles.js";

export function ChipGroup({ options, value, multi = false, onChange, label }) {
  const isOn = (id) => (multi ? value.includes(id) : value === id);
  const toggle = (id) => {
    if (!multi) return onChange(id);
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };
  return html`
    <div style=${styles.chipRow} role="group" aria-label=${label}>
      ${options.map((o) => {
        const on = isOn(o.id);
        return html`
          <button
            key=${o.id}
            type="button"
            className=${on ? "settle-chip-active" : "settle-chip-inactive"}
            style=${{ ...styles.chip, ...(on ? styles.chipActive : styles.chipInactive) }}
            aria-pressed=${on}
            onClick=${() => toggle(o.id)}
          >
            ${o.label}
          </button>
        `;
      })}
    </div>
  `;
}
