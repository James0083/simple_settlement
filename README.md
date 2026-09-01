# 딱정산 (Settlement App)

모임 비용을 회차별로 나눠 기록하면, 사람별 결제/부담 내역을 계산하고 최소한의 송금 구조로 누가 누구에게 얼마를 보내야 하는지 자동으로 알려주는 웹앱입니다. 별도의 빌드 과정이 없으며, `index.html`을 브라우저에서 바로 열 수 있습니다. (PWA로 배포할 때는 매니페스트·서비스 워커·아이콘 파일을 함께 올립니다 — "PWA" 섹션 참고.)

## 주요 기능

- 참가자 이름 등록 (금액은 여기서 넣지 않습니다)
- **회차별 입력**: 회차마다 이름(예: "1차 삼겹살집"), 결제한 사람 1명, 금액, 그리고 그 회차에 참여한 사람들을 따로 지정
  - 회차마다 참여 인원이 달라도(예: 2차는 일부만 참여) 정확하게 반영됩니다
- 참가자별 낸 금액 / 부담해야 할 금액 / 차액을 표로 요약
- 차액을 기반으로 송금 관계를 계산해, 결과를 보내는 사람 기준으로 그룹핑해서 표시
- 결과를 텍스트로 복사해 카카오톡 등에 바로 붙여넣기
- **정산 결과를 PNG 이미지로 다운로드** — 사람별 결제 내역 표 + 최종 송금 결과가 담긴 이미지를 한 번에 저장
  - 모바일에서는 시스템 공유 시트를 통해 사진 앱에 바로 저장됩니다
- 하단에 개인정보처리방침·이용약관·문의하기 링크 제공
- 반응형 레이아웃, 모바일에서도 사용 가능
- **PWA 지원** — 홈 화면에 설치 가능하고, 서비스 워커로 오프라인에서도 동작

## 기술 스택

- **React 18** (UMD 빌드, CDN으로 로드)
- **Babel Standalone** — 브라우저에서 실시간으로 JSX를 변환해주기 때문에 별도의 번들러(Webpack, Vite 등)나 `npm install` 없이 파일 하나로 실행됩니다
- **html2canvas** — 정산 결과 DOM을 캔버스로 렌더링해 PNG로 저장하는 데 사용
- **Web Share API** (`navigator.share`) — 모바일에서 결과 이미지를 시스템 공유로 저장할 수 있도록 지원. 모바일에서는 기본적으로 결과 이미지를 큰 오버레이로 띄워 "길게 눌러 사진에 추가"로 저장하도록 안내하고, 공유가 가능하면 오버레이 안에 공유 버튼도 함께 제공합니다.
- **Pretendard** (헤드라인/본문), **Space Grotesk** (금액 숫자 전용) — `index.html`의 `<head>`에서 `<link rel="stylesheet">`로만 로드. 두 서체 모두 `0`에 사선·점이 없어 금액 표기가 깔끔합니다. 숫자에는 `font-variant-numeric: tabular-nums`로 자릿수를 정렬합니다.
- **PWA** — `manifest.webmanifest` + `sw.js`(서비스 워커)로 홈 화면 설치와 오프라인 실행 지원
- 순수 인라인 스타일 (별도 CSS 프레임워크 없음), 카드·버튼·입력창 등 사각형 요소는 4px 라운드 처리

```html
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script src="https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
```

`index.html`의 `<head>`에는 폰트도 `<link rel="stylesheet">`로 함께 로드합니다. 처음에는 컴포넌트 내부 CSS `@import`로만 폰트를 불러왔는데, 로딩 시점이 늦어 일부 환경에서 폰트가 적용되지 않는 경우가 있어 `<head>` 레벨 `<link>`로 옮겼습니다.

```html
<link rel="stylesheet" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
<link rel="stylesheet" crossorigin href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" />
```

두 `<link>` 모두 `crossorigin`을 붙였습니다. 안 붙이면 `html2canvas`가 결과 이미지를 만들 때 교차 출처 스타일시트의 `cssRules`에 접근하다 `SecurityError`가 나고, 저장된 이미지의 숫자가 대체 폰트로 렌더됩니다.

## 데이터 구조

```js
// 참가자: 이름만 가짐
{ id, name }

// 회차: 결제자 1명 + 금액 + 참여자 목록(N명)
{ id, title, payerId, amount, participantIds: [id, id, ...] }
```

모든 계산은 참가자 목록과 회차 목록, 이 두 가지 상태로부터 파생됩니다.

## 정산 알고리즘

### 1단계 — 회차별로 결제/부담 집계

각 회차마다 결제자의 `paid`에 금액을 더하고, 그 회차의 참여자 각각에게 `금액 ÷ 참여 인원`만큼 `share`를 더합니다. 모든 회차를 순회하면 참가자별 누적 `paid`, `share`가 완성됩니다.

```js
rounds.forEach((r) => {
  payer.paid += amount;
  const share = amount / participantIds.length;
  participantIds.forEach((id) => stats[id].share += share);
});
```

한 사람이 특정 회차에 빠졌다면 그 회차의 `share` 계산에서 자동으로 제외되므로, 회차마다 참여 인원이 달라도 정확히 반영됩니다.

### 2단계 — 잔액 계산

```
잔액(balance) = 낸 금액(paid) - 부담해야 할 금액(share)
```

- 잔액이 양수 → **채권자**(돈을 돌려받아야 함)
- 잔액이 음수 → **채무자**(돈을 보내야 함)

### 3단계 — 비례 배분

한 명의 채무자가 한 명의 채권자에게 몰아서 보내는 대신, **채권자별 받을 금액 비중에 비례**해서 나눠 보내도록 계산합니다.

```
채무자 A가 채권자 B에게 보낼 금액
  = A가 갚아야 할 총액 × (B가 받아야 할 금액 / 전체 채권 총액)
```

이렇게 하면 채무자가 여러 명일 때, 특정 한 사람에게만 자투리 송금이 몰리지 않고 모든 채무자가 비슷한 구조로 나눠 보내게 됩니다.

### 4단계 — 반올림 오차 보정 (최대 나머지법)

원화는 소수점 단위가 없기 때문에 비례 계산 결과에는 소수점이 생깁니다. 각 금액을 내림(`Math.floor`) 처리한 뒤, 버려진 나머지(remainder)가 큰 거래부터 순서대로 1원씩 보정해 실제 총액과 정확히 맞아떨어지도록 합니다.

```js
const sumFloor = entries.reduce((s, e) => s + e.floor, 0);
const diff = targetTotal - sumFloor; // 보정해야 할 원 단위 차이
// remainder가 큰 순서대로 diff개만큼 +1원씩 배분
```

### 5단계 — 그룹핑

계산된 개별 송금 내역을 "보내는 사람" 기준으로 묶어서, 한 사람이 여러 명에게 보내야 할 경우 한 번에 알아볼 수 있도록 표시합니다.

## 이미지 다운로드 구현

정산 결과 영역(사람별 결제 내역 표 + 송금 결과)을 하나의 `ref`로 감싸두고, 버튼 클릭 시 `html2canvas`로 해당 DOM을 캔버스에 렌더링한 뒤 PNG로 변환해 저장합니다. 캡처 영역에는 여백(padding)을 넉넉히 둬서, 회전된 "정산 완료" 도장 같은 요소가 잘리지 않도록 했습니다.

```js
const canvas = await html2canvas(captureRef.current, {
  backgroundColor: "#FFFFFF",
  scale: 2, // 고해상도 저장
});
const blob = await canvasToBlob(canvas);
const file = new File([blob], "정산결과.png", { type: "image/png" });
```

이후 저장 방식은 환경에 따라 분기됩니다.

- **모바일·태블릿**(`isMobileDevice()` — iPhone/iPad/Android UA, 그리고 터치 지원 iPadOS Safari): 모바일 브라우저는 이미지 파일 다운로드를 막는 경우가 많아, 결과 이미지를 전체화면 오버레이로 크게 띄웁니다. 사용자가 이미지를 **길게 눌러** iOS는 "사진에 추가", Android는 "이미지 다운로드"로 저장합니다. `navigator.canShare({ files })`가 가능하면 오버레이 안에 "공유" 버튼도 함께 보여줍니다.
- **데스크톱(맥·윈도우)**: 곧바로 `<a download>` 링크로 파일을 내려받습니다.

```js
function isMobileDevice() {
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod|Android/i.test(ua)) return true;
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return true; // iPadOS Safari
  return false;
}

// 공유 시 files 만 넘긴다. title/text 를 같이 넘기면 iOS 공유 시트에서
// "이미지 저장" 항목이 사라지기 때문.
await navigator.share({ files: [file] });
```

입력 폼(이름/회차 입력 필드 등)은 캡처 영역 밖에 있어, 이미지에는 결과만 깔끔하게 담깁니다. Web Share API와 서비스 워커는 HTTPS(보안 컨텍스트)에서만 동작하는데, GitHub Pages는 기본적으로 HTTPS를 제공하므로 별도 설정이 필요 없습니다.

## PWA (홈 화면 설치 · 오프라인)

정적 파일 3개를 추가해 PWA로 동작합니다.

- **`manifest.webmanifest`** — 앱 이름("딱정산"), 시작 URL, `display: standalone`, 테마 색(`#EEF1F4`), 아이콘 3종. `start_url`·`scope`를 상대 경로(`./`)로 둬서 하위 경로(`도메인/딱정산/`)에 배포해도 동작합니다.
- **`sw.js`** — 서비스 워커. 캐시 이름 `ddakjeongsan-v1`.
  - 설치 시: 같은 출처 파일(HTML 4종 + 매니페스트 + 아이콘)과 CDN 6종(React·ReactDOM·Babel standalone·html2canvas·Pretendard·Space Grotesk)을 캐시. CDN은 하나쯤 실패해도 설치가 진행됩니다.
  - 요청 처리: 페이지 이동은 네트워크 우선(실패 시 캐시된 `index.html`), 그 외 자원은 캐시 우선 + 백그라운드 갱신(stale-while-revalidate).
  - **자원을 바꾸면** `sw.js`의 `CACHE` 값을 `ddakjeongsan-v2`처럼 올려야 사용자 기기에서 새로 받습니다.
- **아이콘** — `favicon.svg`(브라우저 탭), `apple-touch-icon.png`(iOS 홈 화면 180px), `icons/icon-192.png`·`icons/icon-512.png`(any), `icons/icon-maskable-512.png`(Android 어댑티브). 모두 `favicon.svg`의 영수증·체크 도형을 `#1A1D29` 배경 + 흰색 선으로 렌더한 것으로, 로고를 바꾸면 `favicon.svg` 수정 후 아이콘 PNG를 다시 만들면 됩니다.

각 HTML `<head>`에 `<link rel="manifest">`·`theme-color`·`apple-touch-icon`·`apple-mobile-web-app-*` 메타를, `</body>` 직전에 서비스 워커 등록 스크립트를 넣었습니다.

```js
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
}
```

> 서비스 워커는 **HTTPS(또는 localhost)** 에서만 등록됩니다. `file://`로 열면 PWA 기능은 동작하지 않고 일반 웹앱으로만 실행됩니다.

## 법적 페이지 & 문의하기

푸터에 개인정보처리방침(`privacy.html`), 이용약관(`terms.html`), 문의하기(`contact.html`) 링크를 두었습니다. 문의하기는 Google 설문지로 연결됩니다. 다른 설문지로 바꾸고 싶다면 `contact.html` 안의 버튼 `href` 값만 교체하면 됩니다.

## 파일 구조

```
index.html             # CDN 기반 독립 실행형 웹앱 (배포용, 바로 실행 가능)
settlement-app.jsx     # 동일한 컴포넌트의 React 프로젝트용 버전 (npm install html2canvas 필요)
privacy.html           # 개인정보처리방침
terms.html             # 이용약관
contact.html           # 문의하기 (Google 설문지로 연결)
manifest.webmanifest   # PWA 매니페스트
sw.js                  # 서비스 워커 (오프라인 캐시)
favicon.svg            # 브라우저 탭 아이콘 (영수증 + 체크 로고)
apple-touch-icon.png   # iOS 홈 화면 아이콘 (180px)
icons/                 # PWA 아이콘 (192 / 512 / maskable-512)
```

## 실행 방법

- **바로 실행**: 빌드 과정이 없으므로 `index.html`을 브라우저에서 열면 바로 동작합니다.
- **React 프로젝트에 통합**: `settlement-app.jsx`를 프로젝트에 넣고 `npm install html2canvas` 실행 후 컴포넌트로 불러와 사용하세요.

## 배포

GitHub Pages, Netlify, Vercel 등 정적 파일 호스팅 서비스 어디에나 폴더 전체(HTML 4종 + `manifest.webmanifest` + `sw.js` + `favicon.svg` + `apple-touch-icon.png` + `icons/`)를 그대로 올리면 바로 배포됩니다. 폴더 구조를 유지해야 상대 경로가 맞습니다.

1. GitHub 저장소 생성 후 위 파일들을 폴더 구조 그대로 업로드 (필요하면 `contact.html`의 설문지 `href`를 원하는 링크로 교체)
2. Settings → Pages → Source를 `main` 브랜치 `/ (root)`로 설정
3. `https://아이디.github.io/저장소이름`으로 접속
4. **HTTPS 필수**: 서비스 워커와 Web Share API는 보안 컨텍스트에서만 동작합니다. GitHub Pages·Netlify·Vercel은 HTTPS를 기본 제공하므로 추가 설정이 없습니다.
5. 확인: 배포 URL을 크롬으로 열고 DevTools → Application 탭에서 Manifest·Service Workers·Cache Storage가 잡히는지, Lighthouse의 PWA 항목이 통과하는지 봅니다. 모바일에서는 브라우저 메뉴의 "홈 화면에 추가"로 설치해 standalone 실행을 확인합니다.

## 라이선스

개인/포트폴리오용으로 자유롭게 사용 가능합니다.
