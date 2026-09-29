/*
 * 하단 고정 탭바 — 해시 링크라 클릭하면 브라우저가 곧바로 라우트를 바꾼다.
 * 새로 생긴 기능(뭐먹지 · 미니게임)에는 NEW_UNTIL 까지 "NEW" 뱃지를 단다 — 날짜가 지나면 저절로 사라진다.
 */
import { html } from "../lib/html.js";
import { styles } from "../ui/styles.js";
import { routeHref } from "../lib/router.js";
import { BrandLogo } from "./BrandLogo.js";
import { FoodIcon, DiceIcon } from "./icons.js";

// 이 날짜가 끝날 때까지(기기 시간 기준) NEW 뱃지를 보여준다
const NEW_UNTIL = new Date(2026, 9, 31, 23, 59, 59); // 2026-10-31

const TABS = [
  { id: "settle", label: "정산", Icon: BrandLogo },
  { id: "food", label: "뭐먹지", Icon: FoodIcon, isNew: true },
  { id: "games", label: "미니게임", Icon: DiceIcon, isNew: true },
];

export const showNewBadge = (now = new Date()) => now <= NEW_UNTIL;

export function TabBar({ route }) {
  const fresh = showNewBadge();
  return html`
    <nav style=${styles.tabBar} aria-label="주요 메뉴">
      <div style=${styles.tabInner}>
        ${TABS.map((t) => {
          const active = t.id === route;
          return html`
            <a
              key=${t.id}
              href=${routeHref(t.id)}
              className="tab-item"
              style=${{ ...styles.tabItem, ...(active ? styles.tabItemActive : null) }}
              aria-current=${active ? "page" : undefined}
            >
              <span style=${styles.tabIconWrap}>
                <${t.Icon} style=${styles.tabIcon} />
                ${fresh && t.isNew && html`<span style=${styles.newBadge} aria-label="새 기능">NEW</span>`}
              </span>
              <span>${t.label}</span>
            </a>
          `;
        })}
      </div>
    </nav>
  `;
}
