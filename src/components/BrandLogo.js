/* '딱정산' 로고 — 영수증 + 체크마크 (favicon.svg 와 동일한 도형) */
import { html } from "../lib/html.js";

export function BrandLogo({ style }) {
  return html`
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      style=${style}
      aria-hidden="true"
    >
      <path d="M5 19.5V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v7" />
      <path d="M5 19.5 6.6 18l1.6 1.5L9.8 18l1.6 1.5L13 19.2" />
      <path d="M8 7.5h6" />
      <path d="M8 10.75h6" />
      <path d="M8 14h4" />
      <path d="m13.3 14.7 2.6 2.6L20 11.2" />
    </svg>
  `;
}
