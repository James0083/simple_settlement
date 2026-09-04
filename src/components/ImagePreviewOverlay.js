/*
 * 모바일 저장용 오버레이 — 결과 이미지를 크게 띄워 "길게 눌러 사진에 추가"
 * 하도록 안내한다. 공유가 가능한 기기에서는 공유 버튼도 함께 보여준다.
 */
import { html } from "../lib/html.js";
import { styles } from "../ui/styles.js";
import { canShareFile, shareImageFile } from "../lib/exportImage.js";

export function ImagePreviewOverlay({ preview, onClose }) {
  if (!preview) return null;
  return html`
    <div style=${styles.previewOverlay} onClick=${onClose}>
      <div style=${styles.previewBox} onClick=${(e) => e.stopPropagation()}>
        <p style=${styles.previewHint}>
          이미지를 <b>길게 눌러</b> “사진에 추가”를 선택하면 사진 앱에 저장돼요
        </p>
        <img src=${preview.url} alt="정산결과" style=${styles.previewImg} />
        <div style=${styles.previewBtnRow}>
          ${canShareFile(preview.file) &&
          html`
            <button style=${styles.previewShareBtn} onClick=${() => shareImageFile(preview.file)}>
              공유
            </button>
          `}
          <button style=${styles.previewCloseBtn} onClick=${onClose}>닫기</button>
        </div>
      </div>
    </div>
  `;
}
