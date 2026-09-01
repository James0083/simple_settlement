# 정산서 (Settlement App)

(Claude Code 로 만든 첫번째 바이브 코딩. LLM으로만 명령, 코드 직접 수정하지 않음.)

모임에서 각자 낸 금액을 입력하면, 최소한의 송금 횟수로 누가 누구에게 얼마를 보내야 하는지 자동으로 계산해주는 웹앱입니다. 별도의 빌드 과정 없이 `index.html` 파일 하나로 동작합니다.

## 주요 기능

- 참가자별 이름과 결제 금액 입력
- 1인당 평균 금액과 총 사용 금액 자동 계산
- 송금 관계를 계산해 결과를 보내는 사람 기준으로 그룹핑해서 표시
- 결과를 텍스트로 복사해 카카오톡 등에 바로 붙여넣기 가능
- 반응형 레이아웃, 모바일에서도 사용 가능

## 기술 스택

- **React 18** (UMD 빌드, CDN으로 로드)
- **Babel Standalone** — 브라우저에서 실시간으로 JSX를 변환해주기 때문에 별도의 번들러(Webpack, Vite 등)나 `npm install` 없이 파일 하나로 실행됩니다
- 순수 인라인 스타일 (별도 CSS 프레임워크 없음)

```html
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
```

## 정산 알고리즘

가장 핵심이 되는 부분은 "빚진 사람이 받을 사람에게 어떻게 나눠 보낼지" 계산하는 로직입니다 (`computeFairTransactions` 함수).

### 1단계 — 잔액 계산

모든 참가자의 결제 금액 평균을 구하고, 각자의 `잔액 = 낸 금액 - 평균`을 계산합니다.

- 잔액이 양수인 사람 → **채권자**(돈을 돌려받아야 함)
- 잔액이 음수인 사람 → **채무자**(돈을 보내야 함)

### 2단계 — 비례 배분

한 명의 채무자가 한 명의 채권자에게 몰아서 보내는 대신, **채권자별 받을 금액 비중에 비례**해서 나눠 보내도록 계산합니다.

```
채무자 A가 채권자 B에게 보낼 금액
  = A가 갚아야 할 총액 × (B가 받아야 할 금액 / 전체 채권 총액)
```

이렇게 하면 채무자가 여러 명일 때, 특정 한 사람에게만 자투리 송금이 몰리지 않고 모든 채무자가 비슷한 구조로 나눠 보내게 됩니다.

### 3단계 — 반올림 오차 보정 (최대 나머지법)

원화는 소수점 단위가 없기 때문에 비례 계산 결과에는 소수점이 생깁니다. 각 금액을 내림(`Math.floor`) 처리한 뒤, 버려진 나머지(remainder)가 큰 거래부터 순서대로 1원씩 보정해 실제 총액과 정확히 맞아떨어지도록 합니다.

```js
const sumFloor = entries.reduce((s, e) => s + e.floor, 0);
const diff = targetTotal - sumFloor; // 보정해야 할 원 단위 차이
// remainder가 큰 순서대로 diff개만큼 +1원씩 배분
```

### 4단계 — 그룹핑

계산된 개별 송금 내역을 "보내는 사람" 기준으로 묶어서, 한 사람이 여러 명에게 보내야 할 경우 한 번에 알아볼 수 있도록 표시합니다.

## 파일 구조

```
index.html   # CDN 기반 독립 실행형 웹앱 (배포용)
```

## 실행 방법

빌드 과정이 없으므로 `index.html`을 브라우저에서 바로 열면 됩니다.

## 배포

본 프로젝트는 GitHub Pages로 배포됨.

(별도 배포를 원할 경우 GitHub Pages, Netlify, Vercel 등 정적 파일 호스팅 서비스 어디에나 `index.html` 하나만 올리면 바로 배포됩니다.)

1. GitHub 저장소 생성 후 `index.html` 업로드
2. Settings → Pages → Source를 `main` 브랜치 `/ (root)`로 설정
3. `https://아이디.github.io/저장소이름`으로 접속

## 라이선스

개인/포트폴리오 용입니다.
