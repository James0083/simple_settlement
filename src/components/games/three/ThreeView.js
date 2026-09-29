/*
 * 3D 장면을 담는 칸. build(THREE, 요소) 가 돌려준 handle(dispose 포함)을 onReady 로 넘기고,
 * 화면에서 사라지면 정리한다. 불러오는 중·실패(오프라인, WebGL 미지원) 상태를 보여준다.
 * handle 에 zoomBy 가 있으면 오른쪽 아래에 확대/축소 버튼(＋/－)을 띄운다 — 한 손으로도 확대할 수 있게.
 */
import { useEffect, useRef, useState } from "react";
import { html } from "../../../lib/html.js";
import { styles } from "../../../ui/styles.js";
import { loadThree } from "./stage.js";

export function ThreeView({ build, onReady, height = 380, label }) {
  const ref = useRef(null);
  const handleRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    let handle = null;
    let cancelled = false;
    loadThree()
      .then((THREE) => {
        if (cancelled) return;
        handle = build(THREE, ref.current);
        ref.current.__scene = handle; // 자동 테스트가 구멍·이빨의 화면 위치를 찾을 때 쓴다
        handleRef.current = handle;
        setStatus("ready");
        onReady?.(handle);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      handle?.dispose();
    };
  }, []);

  return html`
    <div style=${{ ...styles.threeWrap, height }}>
      <div ref=${ref} style=${styles.threeCanvas} role="img" aria-label=${label} data-three-view=""></div>
      ${status === "loading" && html`<div style=${styles.threeOverlay}>3D 불러오는 중...</div>`}
      ${status === "ready" &&
      handleRef.current?.zoomBy &&
      html`
        <div style=${styles.zoomBtns}>
          <button type="button" className="settle-step-btn" style=${styles.zoomBtn} onClick=${() => handleRef.current.zoomBy(0.82)} aria-label="확대">＋</button>
          <button type="button" className="settle-step-btn" style=${styles.zoomBtn} onClick=${() => handleRef.current.zoomBy(1.22)} aria-label="축소">－</button>
        </div>
      `}
      ${status === "error" &&
      html`<div style=${styles.threeOverlay}>3D를 불러오지 못했어요.<br />인터넷 연결을 확인하고 다시 열어 주세요.</div>`}
    </div>
  `;
}
