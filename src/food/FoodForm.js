/* 오늘 뭐먹지 — 조건 입력 (인원 · 방식 · 장르 · 못 먹는 메뉴 · 가격대 · 제외 · 식사 시간) */
import { useState } from "react";
import { html } from "../shared/html.js";
import { styles } from "../shared/styles.js";
import { ChipGroup } from "../shared/ChipGroup.js";
import { ChevronIcon } from "../shared/icons.js";
import { FOODS, GENRES } from "./foodData.js";
import { PRICE_BANDS, MODES, MEALS, EXCLUDES, wordMatches } from "./food.js";

const MIN_PEOPLE = 1;
export const MAX_PEOPLE = 15; // 미니게임 인원 상한(MAX_PLAYERS)과 같게 유지
const BLOCKED_MAX = 10;
const BLOCKED_WORD_MAX = 12;
const GENRE_LABEL = Object.fromEntries(GENRES.map((g) => [g.id, g.label]));

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

// 못 먹는 메뉴 — 적은 말이 이름에 들어간 메뉴는 추천에서 뺀다. ▾ 로 빠지는 메뉴를 보고, − 로 그 메뉴만 되살린다.
function BlockedFoods({ blocked, onChange }) {
  const [draft, setDraft] = useState("");
  const [openWord, setOpenWord] = useState(null);

  const add = (e) => {
    e.preventDefault();
    const word = draft.trim();
    if (!word || blocked.length >= BLOCKED_MAX) return;
    const key = word.replace(/\s+/g, "");
    if (!blocked.some((b) => b.word.replace(/\s+/g, "") === key)) onChange([...blocked, { word, allow: [] }]);
    setDraft("");
  };
  const remove = (word) => {
    onChange(blocked.filter((b) => b.word !== word));
    if (openWord === word) setOpenWord(null);
  };
  const setAllowed = (word, id, allowed) =>
    onChange(
      blocked.map((b) =>
        b.word !== word ? b : { ...b, allow: allowed ? [...b.allow, id] : b.allow.filter((x) => x !== id) }
      )
    );

  const open = blocked.find((b) => b.word === openWord);
  const openHits = open ? FOODS.filter((f) => wordMatches(f, open.word)) : [];
  // 빠지는 메뉴 먼저, 되살린 메뉴는 뒤에
  const sortedHits = [...openHits].sort((a, b) => open.allow.includes(a.id) - open.allow.includes(b.id));

  return html`
    <form style=${styles.blockedInputRow} onSubmit=${add}>
      <input
        className="settle-name-input"
        style=${styles.nameInputFull}
        type="text"
        placeholder="못 먹는 메뉴 (예: 짜장면)"
        maxLength=${BLOCKED_WORD_MAX}
        value=${draft}
        onChange=${(e) => setDraft(e.target.value)}
        aria-label="추천에서 뺄 메뉴 이름"
      />
      <button type="submit" className="settle-download-btn" style=${styles.addPlayerBtn} disabled=${blocked.length >= BLOCKED_MAX}>
        빼기
      </button>
    </form>

    ${blocked.length > 0 && html`
      <div style=${styles.blockedRow}>
        ${blocked.map((b) => {
          const hits = FOODS.filter((f) => wordMatches(f, b.word));
          const count = hits.filter((f) => !b.allow.includes(f.id)).length;
          const isOpen = openWord === b.word;
          return html`
            <span key=${b.word} style=${{ ...styles.blockedChip, ...(hits.length === 0 ? styles.blockedChipNone : null) }}>
              <button
                type="button"
                style=${styles.blockedChipToggle}
                onClick=${() => setOpenWord(isOpen ? null : b.word)}
                disabled=${hits.length === 0}
                aria-expanded=${isOpen}
                aria-label=${`${b.word} — 빠지는 메뉴 ${isOpen ? "접기" : "보기"}`}
              >
                ${b.word}
                <span style=${styles.blockedChipCount}>· ${hits.length === 0 ? "목록에 없음" : `${count}개 제외`}</span>
                ${hits.length > 0 && html`<${ChevronIcon} up=${isOpen} style=${styles.blockedChipChevron} />`}
              </button>
              <button type="button" style=${styles.blockedChipX} onClick=${() => remove(b.word)} aria-label=${`${b.word} 지우기`}>×</button>
            </span>
          `;
        })}
      </div>
    `}

    ${open && html`
      <ul style=${styles.blockedList} aria-label=${`${open.word} 때문에 빠지는 메뉴`}>
        ${sortedHits.map((f) => {
          const allowed = open.allow.includes(f.id);
          return html`
            <li key=${f.id} style=${styles.blockedItem}>
              <span aria-hidden="true">${f.emoji}</span>
              <span style=${{ ...styles.blockedItemName, ...(allowed ? styles.blockedItemOff : null) }}>
                ${f.name} <span style=${styles.blockedItemGenre}>${GENRE_LABEL[f.genre]}</span>
              </span>
              <button
                type="button"
                style=${styles.blockedItemBtn}
                onClick=${() => setAllowed(open.word, f.id, !allowed)}
                aria-label=${allowed ? `${f.name} 다시 빼기` : `${f.name} 추천에 다시 넣기`}
              >
                ${allowed ? "+" : "−"}
              </button>
            </li>
          `;
        })}
      </ul>
    `}
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
        <${BlockedFoods} blocked=${input.blocked} onChange=${set("blocked")} />
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
