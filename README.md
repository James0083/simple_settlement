# 정산서 (Settlement App)

모임 비용을 회차별로 나눠 기록하면, 사람별 결제/부담 내역을 계산하고 최소한의 송금 구조로 누가 누구에게 얼마를 보내야 하는지 자동으로 알려주는 웹앱입니다. 별도의 빌드 과정 없이 `index.html` 파일 하나로 동작합니다.

## 주요 기능

- 참가자 이름 등록 (금액은 여기서 넣지 않습니다)
- **회차별 입력**: 회차마다 이름(예: "1차 삼겹살집"), 결제한 사람 1명, 금액, 그리고 그 회차에 참여한 사람들을 따로 지정
  - 회차마다 참여 인원이 달라도(예: 2차는 일부만 참여) 정확하게 반영됩니다
- 참가자별 낸 금액 / 부담해야 할 금액 / 차액을 표로 요약
- 차액을 기반으로 송금 관계를 계산해, 결과를 보내는 사람 기준으로 그룹핑해서 표시
- 결과를 텍스트로 복사해 카카오톡 등에 바로 붙여넣기
- **정산 결과를 PNG 이미지로 다운로드** — 사람별 결제 내역 표 + 최종 송금 결과가 담긴 이미지를 한 번에 저장
- 반응형 레이아웃, 모바일에서도 사용 가능

## 기술 스택

- **React 18** (UMD 빌드, CDN으로 로드)
- **Babel Standalone** — 브라우저에서 실시간으로 JSX를 변환해주기 때문에 별도의 번들러(Webpack, Vite 등)나 `npm install` 없이 파일 하나로 실행됩니다
- **html2canvas** — 정산 결과 DOM을 캔버스로 렌더링해 PNG로 저장하는 데 사용
- 순수 인라인 스타일 (별도 CSS 프레임워크 없음)

```html
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script src="https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
```

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

정산 결과 영역(사람별 결제 내역 표 + 송금 결과)을 하나의 `ref`로 감싸두고, 버튼 클릭 시 `html2canvas`로 해당 DOM을 캔버스에 렌더링한 뒤 PNG로 변환해 다운로드합니다.

```js
const canvas = await html2canvas(captureRef.current, {
  backgroundColor: "#FFFFFF",
  scale: 2, // 고해상도 저장
});
const link = document.createElement("a");
link.download = "정산결과.png";
link.href = canvas.toDataURL("image/png");
link.click();
```

입력 폼(이름/회차 입력 필드 등)은 캡처 영역 밖에 있어, 이미지에는 결과만 깔끔하게 담깁니다.

## 파일 구조

```
index.html            # CDN 기반 독립 실행형 웹앱 (배포용, 바로 실행 가능)
settlement-app.jsx     # 동일한 컴포넌트의 React 프로젝트용 버전 (npm install html2canvas 필요)
```

## 실행 방법

- **바로 실행**: 빌드 과정이 없으므로 `index.html`을 브라우저에서 열면 바로 동작합니다.
- **React 프로젝트에 통합**: `settlement-app.jsx`를 프로젝트에 넣고 `npm install html2canvas` 실행 후 컴포넌트로 불러와 사용하세요.

## 배포

GitHub Pages, Netlify, Vercel 등 정적 파일 호스팅 서비스 어디에나 `index.html` 하나만 올리면 바로 배포됩니다.

1. GitHub 저장소 생성 후 `index.html` 업로드
2. Settings → Pages → Source를 `main` 브랜치 `/ (root)`로 설정
3. `https://아이디.github.io/저장소이름`으로 접속

## 라이선스

개인/포트폴리오용으로 자유롭게 사용 가능합니다.
