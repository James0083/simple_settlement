/* 하단 링크 — 개인정보처리방침 · 이용약관 · 문의하기 */
import { html } from "../lib/html.js";
import { styles } from "../ui/styles.js";

export function SiteFooter() {
  return html`
    <footer style=${styles.footer}>
      <a className="settle-footer-link" href="privacy.html" style=${styles.footerLink}>
        개인정보처리방침
      </a>
      <span style=${styles.footerDot}>·</span>
      <a className="settle-footer-link" href="terms.html" style=${styles.footerLink}>
        이용약관
      </a>
      <span style=${styles.footerDot}>·</span>
      <a className="settle-footer-link" href="contact.html" style=${styles.footerLink}>
        문의하기
      </a>
    </footer>
  `;
}
