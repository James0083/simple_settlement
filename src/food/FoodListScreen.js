/* 뭐먹지 — 음식 전체 목록. 장르별 탭 + 카드 그리드 + 메뉴 추가 요청 링크. */
import { useState } from "react";
import { html } from "../shared/html.js";
import { C_RED, C_DARK, C_MUTED, C_WHITE, C_SUB } from "../shared/styles.js";
import { FOODS, GENRES } from "./foodData.js";

const ALL_TAB = { id: "all", label: "전체" };

export function FoodListScreen({ onBack }) {
  const [genre, setGenre] = useState("all");

  const tabs = [ALL_TAB, ...GENRES];
  const filtered = genre === "all" ? FOODS : FOODS.filter((f) => f.genre === genre);

  return html`
    <div style=${{ padding: "0 0 24px" }}>
      <!-- 헤더 -->
      <div style=${{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <button
          style=${{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: C_MUTED,
            fontFamily: "inherit",
            fontSize: 13,
            padding: "4px 0",
          }}
          onClick=${onBack}
        >
          ← 뒤로
        </button>
        <span
          style=${{
            flex: 1,
            textAlign: "center",
            fontWeight: 800,
            fontSize: 16,
            color: C_DARK,
            letterSpacing: "-0.3px",
          }}
        >
          음식 목록
        </span>
        <span style=${{ width: 48 }}></span>
      </div>

      <!-- 장르 탭 (가로 스크롤) -->
      <div
        style=${{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          paddingBottom: 6,
          marginBottom: 10,
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        ${tabs.map(
          (t) => html`
            <button
              key=${t.id}
              style=${{
                flexShrink: 0,
                padding: "6px 14px",
                borderRadius: 20,
                border: genre === t.id ? "none" : "1.5px solid #DDE1E8",
                background: genre === t.id ? C_RED : C_WHITE,
                color: genre === t.id ? C_WHITE : C_SUB,
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: genre === t.id ? 700 : 500,
                cursor: "pointer",
                transition: "background 0.12s, color 0.12s",
              }}
              onClick=${() => setGenre(t.id)}
            >
              ${t.label}
            </button>
          `
        )}
      </div>

      <!-- 결과 수 -->
      <p style=${{ fontSize: 12, color: C_MUTED, margin: "0 0 10px", textAlign: "right" }}>
        ${filtered.length}개
      </p>

      <!-- 음식 그리드 -->
      <div
        style=${{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
        }}
      >
        ${filtered.map(
          (f) => html`
            <div
              key=${f.id}
              style=${{
                background: C_WHITE,
                border: "1px solid #EEF1F4",
                borderRadius: 8,
                padding: "10px 6px 8px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
              }}
            >
              <span style=${{ fontSize: 22, lineHeight: 1 }}>${f.emoji}</span>
              <span
                style=${{
                  fontSize: 12,
                  fontWeight: 600,
                  color: C_DARK,
                  lineHeight: 1.3,
                  wordBreak: "keep-all",
                }}
              >
                ${f.name}
              </span>
              <span style=${{ fontSize: 10.5, color: C_MUTED }}>
                ~${Math.round(f.price[1] / 1000)}천
              </span>
            </div>
          `
        )}
      </div>

      <!-- 메뉴 추가 요청 -->
      <div
        style=${{
          marginTop: 24,
          padding: "16px",
          background: "#F6F8FB",
          borderRadius: 8,
          textAlign: "center",
        }}
      >
        <p style=${{ margin: "0 0 10px", fontSize: 13, color: C_SUB, lineHeight: 1.6 }}>
          먹고 싶은 메뉴가 없나요?<br />
          문의하기에서 <strong>메뉴추가</strong>로 요청해 주세요.
        </p>
        <a
          href="contact.html"
          style=${{
            display: "inline-block",
            fontSize: 13,
            fontWeight: 700,
            color: C_RED,
            textDecoration: "none",
          }}
        >
          문의하기 →
        </a>
      </div>
    </div>
  `;
}
