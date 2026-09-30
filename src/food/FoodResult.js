/*
 * 오늘 뭐먹지 — 추천 결과. 인원 4명당 1개 메뉴 추천(15명이면 4개). 대안 3개.
 * 매장: 네이버지도·카카오맵 검색 / 배달: 메뉴명 복사. 공통: 다시 뽑기 · 정산에 회차로 추가.
 * 4명 이상이면 함께 먹으면 더 맛있는 곁들임 메뉴를 보여준다.
 */
import { useState } from "react";
import { html } from "../shared/html.js";
import { styles } from "../shared/styles.js";
import { GENRES } from "./foodData.js";
import { formatPrice, searchQuery, naverMapUrl, kakaoMapUrl, RELAX_MESSAGES } from "./food.js";
import { DISCLOSURE, TRACKING_CODE, pickBanner } from "./coupang.js";

function CoupangBanner() {
  const [banner] = useState(() => pickBanner());
  const src = `https://ads-partners.coupang.com/widgets.html?id=${banner.id}&template=carousel&trackingCode=${TRACKING_CODE}&subId=&width=680&height=${banner.height}&tsource=`;
  return html`
    <div style=${{ margin: "12px 0", overflow: "hidden" }}>
      <iframe
        src=${src}
        width="100%"
        height=${banner.height}
        frameborder="0"
        scrolling="no"
        referrerpolicy="unsafe-url"
        title="쿠팡 파트너스"
      ></iframe>
      <p style=${styles.coupangDisclosure}>${DISCLOSURE}</p>
    </div>
  `;
}

const genreLabel = (id) => GENRES.find((g) => g.id === id)?.label ?? "";

export function FoodResult({ result, mode, copied, onPromote, onReroll, onChoose, onCopy, onAddToSettle }) {
  if (result.picks.length === 0) {
    return html`
      <div style=${styles.foodEmpty}>
        조건에 맞는 메뉴가 없어요. 빼고 싶은 것이나 방식을 바꿔 보세요.
      </div>
    `;
  }

  const menuCount = result.menuCount ?? 1;
  const mains = result.picks.slice(0, menuCount);
  const alts = result.picks.slice(menuCount);

  // 배달 복사: "치킨, 피자 + 마라탕" 형태로 합친다
  const copyLabel = mains
    .map((m) => {
      const pair = result.pairs?.[m.id];
      const q = searchQuery(m);
      return pair ? `${q}, ${searchQuery(pair)}` : q;
    })
    .join(" + ");

  return html`
    <div>
      ${result.relaxed.length > 0 &&
      html`<p style=${styles.relaxNote}>${RELAX_MESSAGES[result.relaxed[result.relaxed.length - 1]]}</p>`}

      ${mains.map(
        (main, idx) => html`
          ${idx > 0 &&
          html`<div
            style=${{ textAlign: "center", fontSize: 20, color: "#9AA0B0", margin: "6px 0", fontWeight: 700 }}
          >
            +
          </div>`}
          <div key=${main.id} style=${styles.foodCard}>
            <div style=${styles.foodPickLabel}>${menuCount > 1 ? `${idx + 1}차` : "오늘은 이거!"}</div>
            <div style=${styles.foodEmoji} aria-hidden="true">${main.emoji}</div>
            <div style=${styles.foodName}>${main.name}</div>
            <div style=${styles.foodMeta}>${genreLabel(main.genre)} · ${formatPrice(main)}</div>
            ${result.pairs?.[main.id] &&
            html`
              <div style=${styles.pairBox}>
                <div style=${styles.pairLabel}>이런 메뉴를 함께 먹으면 더 맛있어요</div>
                <div style=${styles.pairName}>+ ${result.pairs[main.id].emoji} ${result.pairs[main.id].name}</div>
                <div style=${styles.foodMeta}>${formatPrice(result.pairs[main.id])}</div>
              </div>
            `}
            ${mode === "dineIn" &&
            html`
              <div style=${styles.actionRow}>
                <a
                  style=${styles.mapBtn}
                  className="settle-download-btn"
                  href=${naverMapUrl(searchQuery(main))}
                  target="_blank"
                  rel="noopener"
                  onClick=${() => onChoose(main)}
                >
                  네이버지도에서 찾기
                </a>
                <a
                  style=${styles.mapBtn}
                  className="settle-download-btn"
                  href=${kakaoMapUrl(searchQuery(main))}
                  target="_blank"
                  rel="noopener"
                  onClick=${() => onChoose(main)}
                >
                  카카오맵에서 찾기
                </a>
              </div>
            `}
          </div>
        `
      )}

      ${mode === "delivery" &&
      html`
        <div style=${styles.actionRow}>
          <button className="settle-copy-btn" style=${styles.copyBtn} onClick=${() => onCopy(mains, result.pairs)}>
            ${copied ? "복사됐어요" : `'${copyLabel}' 복사하기`}
          </button>
        </div>
        <p style=${styles.foodHint}>배달앱 검색창에 붙여넣어 보세요</p>
      `}

      ${alts.length > 0 &&
      html`
        <div style=${styles.altBlock}>
          <div style=${styles.roundChipLabel}>이건 어때요?</div>
          <div style=${styles.chipRow}>
            ${alts.map(
              (f) => html`
                <button
                  key=${f.id}
                  type="button"
                  className="settle-chip-inactive"
                  style=${{ ...styles.chip, ...styles.chipInactive, ...styles.altChip }}
                  onClick=${() => onPromote(f, 0)}
                >
                  ${f.emoji} ${f.name}
                </button>
              `
            )}
          </div>
        </div>
      `}

      <${CoupangBanner} />

      <div style=${styles.actionRow}>
        <button className="settle-add-btn" style=${styles.rerollBtn} onClick=${onReroll}>다시 뽑기</button>
        <button
          className="settle-add-btn"
          style=${styles.rerollBtn}
          onClick=${() => onAddToSettle(mains, result.pairs)}
        >
          정산에 회차로 추가
        </button>
      </div>
    </div>
  `;
}
