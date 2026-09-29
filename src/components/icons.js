/* 탭·화면 헤더 아이콘 — BrandLogo 와 같은 선 굵기의 24px 스트로크 아이콘 */
import { html } from "../lib/html.js";

const Svg = ({ style, children }) => html`
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
    ${children}
  </svg>
`;

// 포크 + 나이프
export function FoodIcon({ style }) {
  return html`
    <${Svg} style=${style}>
      <path d="M7 3v8" />
      <path d="M4.5 3v4.5a2.5 2.5 0 0 0 5 0V3" />
      <path d="M7 11v10" />
      <path d="M17 21V3c-2.2 1.2-3.5 3.6-3.5 7v3.5H17" />
    <//>
  `;
}

// 주사위
export function DiceIcon({ style }) {
  return html`
    <${Svg} style=${style}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <circle cx="8.5" cy="8.5" r="0.6" fill="currentColor" />
      <circle cx="15.5" cy="8.5" r="0.6" fill="currentColor" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
      <circle cx="8.5" cy="15.5" r="0.6" fill="currentColor" />
      <circle cx="15.5" cy="15.5" r="0.6" fill="currentColor" />
    <//>
  `;
}
