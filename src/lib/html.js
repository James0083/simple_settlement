/*
 * 마크업 태그 함수. htm 을 우리가 쓰는 React 의 createElement 에 바인딩한다.
 * (htm/react 서브패키지는 자체적으로 react 를 import 하는데, jsdelivr 에서 별도 버전으로
 *  해석돼 React 사본이 둘 생기므로 쓰지 않는다.)
 *
 * JSX 대신 태그드 템플릿 리터럴을 쓴다 — 번들러 없이 브라우저 네이티브 ES 모듈로 동작:
 *
 *   html`<div className=${styles.box}>${child}</div>`
 *   html`<${Child} prop=${value} />`
 */
import htm from "htm";
import { createElement } from "react";

export const html = htm.bind(createElement);
