/*
 * 하단 링크 — 안내 글(사용 가이드 + 지금 탭의 가이드)은 테두리 칩으로 조금 더 보이게, 그 아래 법적·기타 링크는 흐린 글자로.
 * (+ 눈에 안 띄는 실험 링크)
 * 앱인토스: 가이드·버전정보·실험 링크는 빼고, 정책·문의만 ddakjeongsan.com 을 기기 브라우저로 연다
 * (정적 페이지는 앱인토스 번들에 없고, 외부 링크는 법적 고지 등 필수 용도만 허용).
 */
import { html } from "./html.js";
import { styles } from "./styles.js";
import { IS_AIT, externalLink } from "#platform";

const SITE = "https://ddakjeongsan.com";

function AitFooter() {
  const links = [
    ["privacy", "개인정보처리방침"],
    ["terms", "이용약관"],
    ["contact", "문의하기"],
  ];
  return html`
    <div style=${styles.footerWrap}>
      <footer style=${styles.footer}>
        ${links.flatMap(([path, label], i) => [
          i > 0 && html`<span key=${`dot-${path}`} style=${styles.footerDot}>·</span>`,
          html`<a key=${path} className="settle-footer-link" style=${styles.footerLink} ...${externalLink(`${SITE}/${path}`)}>${label}</a>`,
        ])}
      </footer>
    </div>
  `;
}

// 탭마다 사용 가이드 옆에 그 탭의 가이드를 둔다
const TAB_GUIDES = {
  settle: { href: "guide/settle.html", label: "정산 계산 방식" },
  food: { href: "guide/food.html", label: "뭐먹지 가이드" },
  games: { href: "guide/games.html", label: "미니게임 가이드" },
};

export function SiteFooter({ route }) {
  if (IS_AIT) return html`<${AitFooter} />`;
  const tabGuide = TAB_GUIDES[route] ?? TAB_GUIDES.settle;
  return html`
    <div style=${styles.footerWrap}>
      <nav style=${styles.footerGuides} aria-label="안내">
        <a className="footer-guide-link" href="guide.html" style=${styles.footerGuide}>사용 가이드</a>
        <a className="footer-guide-link" href=${tabGuide.href} style=${styles.footerGuide}>${tabGuide.label}</a>
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
