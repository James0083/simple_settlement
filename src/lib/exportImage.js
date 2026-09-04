/*
 * 정산 결과 DOM → PNG 캡처 / 공유.
 */
import html2canvas from "html2canvas";

const canvasToBlob = (canvas) =>
  new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));

// 캡처 영역을 고해상도 PNG 로 만든다. { dataUrl, blob, file } 반환.
export async function captureToPng(element) {
  const canvas = await html2canvas(element, { backgroundColor: "#FFFFFF", scale: 2 });
  const dataUrl = canvas.toDataURL("image/png");
  const blob = await canvasToBlob(canvas);
  const file = blob ? new File([blob], "정산결과.png", { type: "image/png" }) : null;
  return { dataUrl, blob, file };
}

export const canShareFile = (file) =>
  !!file &&
  typeof navigator !== "undefined" &&
  !!navigator.canShare &&
  navigator.canShare({ files: [file] });

// 데스크톱: <a download> 로 파일 저장
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

export async function shareImageFile(file) {
  if (!canShareFile(file)) return;
  try {
    // iOS 에서는 files 만 넘겨야 공유 시트에 "이미지 저장" 항목이 나타난다.
    // title/text 를 함께 넘기면 텍스트 공유로 인식돼 "이미지 저장"이 사라진다.
    await navigator.share({ files: [file] });
  } catch (shareErr) {
    // 사용자가 취소한 경우 등은 무시
  }
}
