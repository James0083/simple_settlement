/* 하단 링크 — 개인정보처리방침 · 이용약관 · 문의하기 (+ 눈에 안 띄는 실험 링크) */
import { html } from "../lib/html.js";
import { styles } from "../ui/styles.js";

export function SiteFooter() {
  return html`
    <div style=${styles.footerWrap}>
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
      <!-- 검토 중인 기능: 영수증 사진 인식 프로토타입. 일반 사용자에게는 노출하지 않음. -->
      <a
        className="settle-footer-link"
        href="prototype/receipt-ocr.html"
        style=${styles.footerLab}
      >
        영수증 인식 실험
      </a>
    </div>
  `;
}
