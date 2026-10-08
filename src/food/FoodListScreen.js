/* 뭐먹지 — 음식 전체 목록. 장르별 탭 + 카드 그리드 + 메뉴 추가 요청 링크. */
import { useState } from "react";
import { html } from "../shared/html.js";
import { styles } from "../shared/styles.js";
import { FOODS, GENRES } from "./foodData.js";

const ALL_TAB = { id: "all", label: "전체" };
const TABS = [ALL_TAB, ...GENRES];

export function FoodListScreen({ onBack }) {
  const [genre, setGenre] = useState("all");
  const filtered = genre === "all" ? FOODS : FOODS.filter((f) => f.genre === genre);

  return html`
    <div style=${{ paddingBottom: 24 }}>
      <div style=${styles.foodListHead}>
        <button type="button" style=${styles.foodListBack} onClick=${onBack}>← 뒤로</button>
        <span style=${styles.foodListTitle}>음식 목록</span>
        <span style=${{ width: 48 }} aria-hidden="true"></span>
      </div>

      <!-- 장르 탭 (가로 스크롤) -->
      <div style=${styles.foodListTabs} role="tablist">
        ${TABS.map((t) => html`
          <button
            key=${t.id}
            type="button"
            role="tab"
            aria-selected=${genre === t.id}
            style=${{ ...styles.foodListTab, ...(genre === t.id ? styles.foodListTabOn : null) }}
            onClick=${() => setGenre(t.id)}
          >
            ${t.label}
          </button>
        `)}
      </div>

      <p style=${styles.foodListCount}>${filtered.length}개</p>

      <div style=${styles.foodListGrid}>
        ${filtered.map((f) => html`
          <div key=${f.id} style=${styles.foodListCard}>
            <span style=${styles.foodListEmoji} aria-hidden="true">${f.emoji}</span>
            <span style=${styles.foodListName}>${f.name}</span>
            <span style=${styles.foodListPrice}>약 ${f.price[1].toLocaleString()}원</span>
          </div>
        `)}
      </div>

      <!-- 메뉴 추가 요청 -->
      <div style=${styles.foodListRequest}>
        <p style=${styles.foodListRequestText}>
          먹고 싶은 메뉴가 없나요?<br />
          문의하기에서 <strong>메뉴추가</strong>로 요청해 주세요.
        </p>
        <a href="contact" style=${styles.foodListRequestLink}>문의하기 →</a>
      </div>
    </div>
  `;
}
