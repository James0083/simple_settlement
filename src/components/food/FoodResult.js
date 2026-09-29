/*
 * 오늘 뭐먹지 — 추천 결과. 1순위 크게 + 대안 2개(누르면 1순위로 올라옴).
 * 매장: 네이버지도·카카오맵 검색 / 배달: 메뉴명 복사. 공통: 다시 뽑기 · 정산에 회차로 추가.
 * 4명 이상이면 함께 먹으면 더 맛있는 곁들임 메뉴를 보여준다.
 */
import { html } from "../../lib/html.js";
import { styles } from "../../ui/styles.js";
import { GENRES } from "../../lib/foodData.js";
import { formatPrice, searchQuery, naverMapUrl, kakaoMapUrl, RELAX_MESSAGES } from "../../lib/food.js";
import { getCoupangLink, DISCLOSURE } from "../../lib/coupang.js";

function CoupangBanner({ genreId }) {
  const link = getCoupangLink(genreId);
  if (!link) return null;
  return html`
    <div style=${styles.coupangBanner}>
      <a href=${link} target="_blank" rel="noopener sponsored" style=${styles.coupangLink}>
        🛒 이 음식과 어울리는 상품 보기
      </a>
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
  const [main, ...alts] = result.picks;
  const q = searchQuery(main);
  const pair = result.pairs?.[main.id] ?? null;
  return html`
    <div>
      ${result.relaxed.length > 0 &&
      html`<p style=${styles.relaxNote}>${RELAX_MESSAGES[result.relaxed[result.relaxed.length - 1]]}</p>`}

      <div style=${styles.foodCard}>
        <div style=${styles.foodPickLabel}>오늘은 이거!</div>
        <div style=${styles.foodEmoji} aria-hidden="true">${main.emoji}</div>
        <div style=${styles.foodName}>${main.name}</div>
        <div style=${styles.foodMeta}>${genreLabel(main.genre)} · ${formatPrice(main)}</div>
        ${pair &&
        html`
          <div style=${styles.pairBox}>
            <div style=${styles.pairLabel}>이런 메뉴를 함께 먹으면 더 맛있어요</div>
            <div style=${styles.pairName}>+ ${pair.emoji} ${pair.name}</div>
            <div style=${styles.foodMeta}>${formatPrice(pair)}</div>
          </div>
        `}

        ${mode === "dineIn"
          ? html`
              <div style=${styles.actionRow}>
                <a
                  style=${styles.mapBtn}
                  className="settle-download-btn"
                  href=${naverMapUrl(q)}
                  target="_blank"
                  rel="noopener"
                  onClick=${() => onChoose(main)}
                >
                  네이버지도에서 찾기
                </a>
                <a
                  style=${styles.mapBtn}
                  className="settle-download-btn"
                  href=${kakaoMapUrl(q)}
                  target="_blank"
                  rel="noopener"
                  onClick=${() => onChoose(main)}
                >
                  카카오맵에서 찾기
                </a>
              </div>
            `
          : html`
              <div style=${styles.actionRow}>
                <button className="settle-copy-btn" style=${styles.copyBtn} onClick=${() => onCopy(main, pair)}>
                  ${copied ? "복사됐어요" : `'${pair ? `${q}, ${searchQuery(pair)}` : q}' 복사하기`}
                </button>
              </div>
              <p style=${styles.foodHint}>배달앱 검색창에 붙여넣어 보세요</p>
            `}
      </div>

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
                  onClick=${() => onPromote(f)}
                >
                  ${f.emoji} ${f.name}
                </button>
              `
            )}
          </div>
        </div>
      `}

      <${CoupangBanner} genreId=${main.genre} />

      <div style=${styles.actionRow}>
        <button className="settle-add-btn" style=${styles.rerollBtn} onClick=${onReroll}>다시 뽑기</button>
        <button className="settle-add-btn" style=${styles.rerollBtn} onClick=${() => onAddToSettle(main, pair)}>
          정산에 회차로 추가
        </button>
      </div>
    </div>
  `;
}
