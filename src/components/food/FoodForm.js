/* 오늘 뭐먹지 — 조건 입력 (인원 · 방식 · 장르 · 가격대 · 제외 · 식사 시간) */
import { html } from "../../lib/html.js";
import { styles } from "../../ui/styles.js";
import { ChipGroup } from "../ChipGroup.js";
import { GENRES } from "../../lib/foodData.js";
import { PRICE_BANDS, MODES, MEALS, EXCLUDES } from "../../lib/food.js";

const MIN_PEOPLE = 1;
const MAX_PEOPLE = 20;

function Field({ label, hint, children }) {
  return html`
    <div style=${styles.foodField}>
      <div style=${styles.foodLabelRow}>
        <span style=${styles.sectionLabelInline}>${label}</span>
        ${hint && html`<span style=${styles.foodHint}>${hint}</span>`}
      </div>
      ${children}
    </div>
  `;
}

export function FoodForm({ input, onChange }) {
  const set = (field) => (value) => onChange({ ...input, [field]: value });
  const people = input.people;
  return html`
    <section>
      <${Field} label="인원">
        <div style=${styles.stepper}>
          <button
            type="button"
            className="settle-step-btn"
            style=${styles.stepBtn}
            onClick=${() => set("people")(Math.max(MIN_PEOPLE, people - 1))}
            disabled=${people <= MIN_PEOPLE}
            aria-label="인원 줄이기"
          >
            −
          </button>
          <span style=${styles.stepValue} aria-live="polite">${people}<span style=${styles.wonSuffix}>명</span></span>
          <button
            type="button"
            className="settle-step-btn"
            style=${styles.stepBtn}
            onClick=${() => set("people")(Math.min(MAX_PEOPLE, people + 1))}
            disabled=${people >= MAX_PEOPLE}
            aria-label="인원 늘리기"
          >
            +
          </button>
        </div>
      <//>

      <${Field} label="어디서">
        <${ChipGroup} label="어디서" options=${MODES} value=${input.mode} onChange=${set("mode")} />
      <//>

      <${Field} label="장르" hint="안 고르면 전부">
        <${ChipGroup} label="장르" multi options=${GENRES} value=${input.genres} onChange=${set("genres")} />
      <//>

      <${Field} label="1인 가격대">
        <${ChipGroup} label="1인 가격대" options=${PRICE_BANDS} value=${input.price} onChange=${set("price")} />
      <//>

      <${Field} label="빼고 싶은 것">
        <${ChipGroup} label="빼고 싶은 것" multi options=${EXCLUDES} value=${input.exclude} onChange=${set("exclude")} />
      <//>

      <${Field} label="식사">
        <${ChipGroup} label="식사" options=${MEALS} value=${input.meal} onChange=${set("meal")} />
      <//>
    </section>
  `;
}
