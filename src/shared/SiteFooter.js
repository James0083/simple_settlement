/*
 * 하단 링크 — 안내 글(사용 가이드 · 계산 방식)은 테두리 칩으로 조금 더 보이게, 그 아래 법적·기타 링크는 흐린 글자로.
 * (+ 눈에 안 띄는 실험 링크)
 */
import { html } from "./html.js";
import { styles } from "./styles.js";

export function SiteFooter() {
  return html`
    <div style=${styles.footerWrap}>
      <nav style=${styles.footerGuides} aria-label="안내">
        <a className="footer-guide-link" href="guide.html" style=${styles.footerGuide}>사용 가이드</a>
        <a className="footer-guide-link" href="how-it-works.html" style=${styles.footerGuide}>정산 계산 방식</a>
      </nav>
      <footer style=${styles.footer}>
        <a className="settle-footer-link" href="privacy.html" style=${styles.footerLink}>
          개인정보처리방침
        </a>
        <span style=${styles.footerDot}>·</span>
        <a className="settle-footer-link" href="terms.html" style=${styles.footerLink}>
          이용약관
        </a>
        <span style=${styles.footerDot}>·</span>
        <a className="settle-footer-link" href="release-notes.html" style=${styles.footerLink}>
          버전정보
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
