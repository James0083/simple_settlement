/* 영수증 모양 카드 (지그재그 위아래) + 화면 헤더. 모든 탭이 같은 틀을 쓴다. */
import { html } from "./html.js";
import { styles } from "./styles.js";

export function ReceiptCard({ children }) {
  return html`
    <div style=${styles.receipt}>
      <div style=${styles.zigzagTop} aria-hidden="true"></div>
      <div style=${styles.inner}>${children}</div>
      <div style=${styles.zigzagBottom} aria-hidden="true"></div>
    </div>
  `;
}

export function ScreenHeader({ Icon, title, subtitle }) {
  return html`
    <header style=${styles.header}>
      <${Icon} style=${styles.logo} />
      <h1 style=${styles.title}>${title}</h1>
      <p style=${styles.subtitle}>${subtitle}</p>
    </header>
  `;
}
