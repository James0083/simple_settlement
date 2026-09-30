# 딱정산 (Settlement App)

모임 비용을 회차별로 나눠 기록하면, 사람별 결제/부담 내역을 계산하고 최소한의 송금 구조로 누가 누구에게 얼마를 보내야 하는지 자동으로 알려주는 웹앱입니다.
친구 모임의 **메뉴 정하기(오늘 뭐먹지) → 누가 낼지 정하기(미니게임) → 정산**까지 한 앱에서 이어집니다. 서버 없이 브라우저 안에서만 동작합니다. 배포 주소: https://ddakjeongsan.com

> 기능·게임 규칙·공개 일정 등 **앱 소개는 [APP_INFO.md](APP_INFO.md)** 에 정리했습니다. 이 문서는 개발자용입니다.

**빌드 과정이 없습니다.** 앱 소스는 `src/` 아래 표준 ES 모듈(`import`/`export`)로 나뉘어 있고, `index.html`은 진입점 `src/main.js` 하나만 `<script type="module">`로 로드합니다. 나머지 파일은 브라우저 네이티브 모듈 로더가 해석하고, vendor(React·htm·html2canvas·Three.js)는 `<script type="importmap">`이 jsdelivr의 ESM 빌드로 매핑합니다. JSX 대신 [htm](https://github.com/developit/htm)(태그드 템플릿 리터럴)을 쓰므로 트랜스파일러(Babel 등)가 필요 없습니다.

번들러나 `npm install`은 필요 없지만, 모듈이 `fetch`로 로드되므로 **로컬 정적 서버**를 통해 열어야 합니다(아래 "실행 방법").

## 주요 기능

하단 탭 3개 — **정산**(`#/settle`) · **뭐먹지**(`#/food`) · **미니게임**(`#/games`). 참가자 명단은 세 탭이 함께 씁니다(`useSettlement`의 참가자 목록을 그대로 공유).

### 정산

- 참가자 이름 + 정산받을 계좌(선택). 계좌는 그 사람이 받는 쪽(채권자)일 때만 결과·복사 텍스트·이미지에 표시
- 회차마다 이름 · 결제자 1명 · 금액 · 참여자 목록. 회차마다 참여 인원이 달라도 정확히 반영
- 사람별 낸 금액 / 부담 금액 / 차액 표 + 보내는 사람 기준으로 묶은 송금 목록
- 결과 텍스트 복사, PNG 이미지 저장(모바일은 오버레이 + 길게 눌러 저장, 공유 시트)
- 명단(이름·계좌)은 기기에 저장해 다음 방문 때 다시 채움. 회차·금액은 저장하지 않음

### 오늘 뭐먹지

- 인원(1~15) · 매장/배달 · 장르 · 못 먹는 메뉴(직접 입력) · 1인 가격대 · 제외(매운 것·날것) · 식사 시간으로 메뉴 추천
- 못 먹는 메뉴: 적은 말이 이름에 들어간 메뉴를 뺌("짜장" → 짜장면·간짜장…). ▾로 빠지는 메뉴를 보고 `−`로 그 메뉴만 되살림
- 4명당 메뉴 1개(15명이면 4개) + 대안 3개. 4명 이상이면 곁들임 메뉴도 함께 추천
- 매장: 네이버지도·카카오맵 검색 링크 / 배달: 메뉴명 복사. "정산에 회차로 추가"로 정산 탭에 회차 생성
- 음식 전체 목록(장르 탭), 결과 아래 쿠팡 파트너스 배너

### 미니게임

- 2~15명, 폰 한 대를 돌려가며 하는 게임 10종: 룰렛 · 사다리 타기 · 폭탄 돌리기 · 해적룰렛(3D) · 악어이빨(3D) · 터치 대결 · 손가락 룰렛 · 숫자 맞추기 · 10초 맞추기 · 동물 레이스
- 뒤의 4종은 `registry.js`의 `releaseAt`으로 **2026-10-05부터 매주 월요일 하나씩** 자동 공개(한국 시간 0시). 공개 전에는 카드에 공개일 표시
- 차례가 있는 게임은 시작 전에 순서를 보여주고 위/아래 · 섞기로 바꿀 수 있음
- 결과 → **정산에 추가**: 게임 참가자 전원이 참여하고 당첨자가 결제한 회차(`N차 룰렛 게임`)를 만듦(당첨자 1명일 때)
- 동점(숫자 맞추기): 동점자끼리 같은 게임 재대결, 또는 동점자만 선택된 채 게임 목록으로 이동
- 효과음(기본 꺼짐, WebAudio 합성 + 해적 비명 `audio/scream.mp3`) · 진동(지원 기기)
- `admin/sound-test.html` — 개발용 소리 테스트 페이지(모든 효과음을 버튼으로 재생)

게임별 규칙은 [APP_INFO.md](APP_INFO.md#미니게임) 참고.

## 기술 스택

- **React 18** — `import`/`export`로 사용. `<script type="importmap">`이 `react` / `react-dom/client`를 jsdelivr ESM(`https://cdn.jsdelivr.net/npm/react@18.3.1/+esm` 등)으로 매핑합니다.
- **htm** — JSX를 대체하는 태그드 템플릿 리터럴. `htm.bind(React.createElement)`로 묶어 `src/shared/html.js`에서 내보냅니다. 브라우저에서 바로 실행되므로 트랜스파일러(Babel·Vite 등)와 `npm install`이 필요 없습니다. 문법은 JSX와 거의 같습니다: `` html`<div style=${styles.box}>${child}</div>` ``, 컴포넌트는 `` html`<${Child} prop=${value} />` ``.
- **html2canvas** — 정산 결과 DOM을 캔버스로 렌더링해 PNG로 저장하는 데 사용 (importmap으로 ESM 로드)
- **Three.js** — 해적룰렛·악어이빨 3D 장면. importmap 의 `three` 로 jsdelivr `+esm`(의존성 없는 단일 파일)을 가리키고, 두 게임을 열 때만 동적 `import("three")` 로 불러옴. 서비스 워커가 미리 캐시해 오프라인에서도 동작
- **Web Share API** (`navigator.share`) — 모바일에서 결과 이미지를 시스템 공유로 저장할 수 있도록 지원. 모바일에서는 기본적으로 결과 이미지를 큰 오버레이로 띄워 "길게 눌러 사진에 추가"로 저장하도록 안내하고, 공유가 가능하면 오버레이 안에 공유 버튼도 함께 제공합니다.
- **Pretendard** (헤드라인/본문), **Space Grotesk** (금액 숫자 전용) — `index.html`의 `<head>`에서 `<link rel="stylesheet">`로만 로드. 두 서체 모두 `0`에 사선·점이 없어 금액 표기가 깔끔합니다. 숫자에는 `font-variant-numeric: tabular-nums`로 자릿수를 정렬합니다.
- **PWA** — `manifest.webmanifest` + `sw.js`(서비스 워커)로 홈 화면 설치와 오프라인 실행 지원
- 순수 인라인 스타일 (별도 CSS 프레임워크 없음) — 스타일 객체는 `src/shared/styles.js` 한 곳에 모음(아래 "코드 컨벤션"). 카드·버튼·입력창 등 사각형 요소는 4px 라운드

```html
<script type="importmap">
{
  "imports": {
    "react": "https://cdn.jsdelivr.net/npm/react@18.3.1/+esm",
    "react-dom/client": "https://cdn.jsdelivr.net/npm/react-dom@18.3.1/client/+esm",
    "htm": "https://cdn.jsdelivr.net/npm/htm@3.1.1/+esm",
    "html2canvas": "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm",
    "three": "https://cdn.jsdelivr.net/npm/three@0.186.1/+esm"
  }
}
</script>
<script type="module" src="src/main.js"></script>
```

`index.html`의 `<head>`에는 폰트도 `<link rel="stylesheet">`로 함께 로드합니다. 처음에는 컴포넌트 내부 CSS `@import`로만 폰트를 불러왔는데, 로딩 시점이 늦어 일부 환경에서 폰트가 적용되지 않는 경우가 있어 `<head>` 레벨 `<link>`로 옮겼습니다.

```html
<link rel="stylesheet" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
<link rel="stylesheet" crossorigin href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" />
```

두 `<link>` 모두 `crossorigin`을 붙였습니다. 안 붙이면 `html2canvas`가 결과 이미지를 만들 때 교차 출처 스타일시트의 `cssRules`에 접근하다 `SecurityError`가 나고, 저장된 이미지의 숫자가 대체 폰트로 렌더됩니다.

## 데이터 구조

```js
// 참가자: 이름 + 정산받을 계좌(선택). 이름·계좌는 localStorage "ddak:roster" 에도 저장
{ id, name, account, showAccount }

// 회차: 결제자 1명 + 금액 + 참여자 목록(N명)
{ id, title, payerId, amount, participantIds: [id, id, ...] }
```

`account`는 계산에는 쓰이지 않고, 정산 결과에서 그 사람이 돈을 받는 쪽(채권자)일 때만 수신자 이름 아래 표시됩니다. `showAccount`는 참가자 입력 목록에서 계좌 입력칸을 펼쳤는지 여부(UI 전용). 이름이 같은 참가자가 여러 명이어도 `computeFairTransactions`가 이름이 아니라 id·참가자 객체로 계산해 계좌를 붙이므로 서로 엇갈리지 않습니다.

모든 계산은 참가자 목록과 회차 목록, 이 두 가지 상태로부터 파생됩니다. 상태와 이벤트 핸들러, 파생 값은 `src/settlement/useSettlement.js`에, 아래 정산 알고리즘(순수 함수)은 `src/settlement/settlement.js`에 있습니다.

`useSettlement`는 셸(`App.js`)에서 호출하므로 탭을 옮겨도 입력이 남고, 다른 탭은 `addRoundFrom({ title, payerId, amount, participantIds })`으로 회차를 넘깁니다. 아무것도 입력하지 않은 회차 하나만 있으면 그 회차를 대체합니다.

localStorage 키 (모두 `ddak:` 접두사, `src/shared/storage.js`의 `load`/`save`로만 접근, 실패 시 저장 없이 동작): `roster`(명단) · `foodHistory`(최근 고른 메뉴 10개) · `sound`(효과음) · `entitlements`(`previewGames` — 공개 전 게임 미리 열기, `adFree`) · `coupangWeights`(쿠팡 배너 가중치, 개발·테스트용)

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

### 3단계 — 잔액을 원 단위로 (최대 나머지법)

회차 몫에 소수점이 생기므로(10,000원 ÷ 3명), 잔액의 소수점을 버린 뒤 모자라는 원을 버려진 소수점이 큰 사람부터 1원씩 더해 **정수 잔액의 합이 정확히 0**이 되게 합니다.

### 4단계 — 송금 횟수 최소화 (합이 0인 무리로 나누기)

차액이 있는 사람이 n명일 때, 차액 합이 0인 무리 k개로 나누면 무리마다 (인원 − 1)번이면 되므로 전체 송금은 **n − k번**입니다. 그래서 k를 최대로 만드는 분할을 부분집합 DP로 정확히 구합니다.

```js
// dp[mask] = mask 에서 한 명씩 빼 나갈 때 거치는 "합이 0 인 집합"의 최대 개수
dp[mask] = max(dp[mask ^ bit] for bit in mask) + (sum[mask] === 0 ? 1 : 0);
// 송금 횟수 = n - dp[full]. 그 경로를 되짚으면 무리가 나온다.
```

O(2ⁿ·n)이라 차액 있는 사람이 18명(`EXACT_MAX_PEOPLE`)까지는 정확히 풀고(수 ms), 그보다 많으면 금액이 딱 맞는 짝부터 묶는 욕심쟁이 방식으로 넘어갑니다.

### 5단계 — 무리 안에서 누가 누구에게 (공평한 송금 횟수)

무리 안에서는 보내는 사람·받는 사람을 어떤 순서로 세워 앞에서부터 채우느냐(북서 모서리)에 따라 누가 몇 번 보내는지가 달라집니다. 가능한 순서를 모두 따져(`ORDER_SEARCH_LIMIT` 이내) 아래 점수가 가장 작은 것을 고릅니다.

1. 송금 횟수
2. 한 사람이 가장 많이 보내는 횟수 — 고르게
3. **결제한 사람**(`paid > 0`)이 더 보내는 횟수 — 더 보내야 하면 결제하지 않은 사람이 먼저
4. 보내는 횟수의 쏠림(제곱합), 한 사람이 가장 많이 받는 횟수

### 6단계 — 그룹핑

송금 내역을 "보내는 사람" 기준으로 묶어서 보여주고, 결제하지 않은 사람 → 보낼 총액이 큰 사람 순으로 정렬합니다.

## 오늘 뭐먹지 — 추천 알고리즘

메뉴 데이터(`src/food/foodData.js`, 510개 · 곁들임 조합 134개, id·이름은 겹치지 않게)는 가게가 아니라 **메뉴 단위**입니다. 메뉴마다 1인 가격대, 배달/매장 여부, 어울리는 인원, 식사 시간, 태그(매운·날것·국물·나눠먹기 등)를 가집니다. **4명 이상**이면 `PAIRS`(메인 → 곁들임)에서 어울리는 메뉴를 하나 골라 "이런 메뉴를 함께 먹으면 더 맛있어요"로 함께 추천합니다(치킨+피자/떡볶이, 삼겹살+냉면, 짜장면+탕수육, 족발+막국수 등 — 배달/매장 · 제외 태그를 지킴). 곁들임은 복사·정산 회차 이름(`1차 치킨 + 떡볶이`)에도 함께 들어갑니다. 알고리즘(`src/food/food.js`)은 React 의존이 없는 순수 함수입니다. 인원 4명당 메뉴 1개 + 대안 3개를 뽑습니다.

1. **걸러내기** — 배달/매장, 제외 태그, 못 먹는 메뉴(`input.blocked` — 공백을 뺀 이름·검색어에 적은 말이 들어 있으면 제외, `allow`에 든 id 는 예외, `matchesBlocked`)는 항상 지킴(곁들임에도 적용). 가격대(범위가 겹치는지)와 장르도 거름
2. **완화** — 결과가 0개면 가격대 → 장르 순으로 조건을 풀고, 무엇을 풀었는지 화면에 알림
3. **점수** — 인원이 어울리면 +2(아니면 −0.8), 4명 이상이면 나눠먹기 메뉴 +1, 식사 시간이 맞으면 +1.5, 최근에 고른 메뉴(최근 10개)는 −1.5
4. **가중 랜덤** — 점수 상위 절반(최소 8개) 안에서 점수²에 비례해 뽑음. 같은 조건이어도 매번 같은 답이 나오지 않음

"최근에 고른 메뉴"는 지도 열기·복사·정산 추가처럼 실제로 고른 경우에만 기록합니다.

## 미니게임 — 공정성 · 게임 추가

- 결과를 정하는 난수는 모두 `src/games/random.js`(`crypto.getRandomValues` + 거절 샘플링, 모듈로 편향 없음)의 `randInt` · `randomFloat` · `shuffle`을 씁니다. `Math.random`은 연출(흔들림·질감·소리)에만 씁니다.
- 결과(당첨 칸·함정 구멍·아픈 이빨·폭발 시각·비밀 숫자)와 처음 순서는 **게임을 시작할 때 확정**하고, 애니메이션은 그 결과를 보여주기만 합니다. 3D 장면은 어느 구멍·이빨이 함정인지 모릅니다.
- 사다리는 같은 높이에서 가로줄이 이웃끼리 붙지 않아 항상 1:1로 도착하고, 💸 칸 위치를 따로 균등하게 섞으므로 누가 어느 이름을 골라도 당첨 확률은 (당첨 개수)/n.
- 폭탄은 15~45초 중 숨은 시각에 터지고(범위는 화면에 알리지 않음), 받은 뒤 0.8초는 넘기기가 잠김(연타 방지).

**새 게임 추가**: 아래 규격의 컴포넌트를 만들고 `src/games/registry.js`의 `GAMES`에 한 줄 등록합니다. 아이콘은 `gameIcons.js`, 새 파일은 `sw.js`의 `CORE`에도 추가합니다.

```js
// players: [{ id, name }] — 2 ~ MAX_PLAYERS(15)명
function MyGame({ players, onFinish, onTie }) {
  // 연출이 끝나면 한 번만: onFinish(당첨자 id) 또는 onFinish([id, ...])(당첨 여러 명)
  // 결판이 안 나면(동점): onTie([동점자 id, ...]) — 재대결/다른 게임 선택 화면이 뜸
}

{ id: "my", name: "내 게임", emoji: "🎲", icon: MyIcon, desc: "한 줄 설명", component: MyGame,
  releaseAt: "2026-11-02" } // 선택 — 그날 0시(KST)부터 열림
```

## 수익화 · 공개 설정

- `src/shared/entitlements.js` — 기능 판정은 이 파일 한 곳에서만: `canPlay(game)`(구현됐고 공개일이 지났는지) · `isReleased` · `releaseLabel`("10월 5일(월) 공개") · `isAdFree()`. 공개 전 게임은 콘솔에서 `localStorage.setItem("ddak:entitlements", '{"previewGames":true}')`로 그 기기에서만 미리 열 수 있음
- `src/shared/AdSlot.js` — 구글 애드센스 자리 8곳(크기는 `AD_SLOTS`). 지금은 `AD_ENABLED = false`라 아무것도 그리지 않음. 주소에 `?adpreview`를 붙이면 자리만 점선으로 보임. 켜는 순서는 파일 머리말, 배치 검토는 `admin/ADS_PLAN.md` 참고 (광고를 켜면 `privacy.html`의 "쿠키 및 추적"도 함께 고칠 것)
- `src/food/coupang.js` — 쿠팡 파트너스 배너 3종 가중치 랜덤 노출(뭐먹지 결과 아래)
- 하단 탭바의 **NEW 뱃지**(뭐먹지 · 미니게임)는 `TabBar.js`의 `NEW_UNTIL`(2026-10-31)까지 보이고 그 뒤 저절로 사라짐

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

정적 파일(매니페스트 · 서비스 워커 · 아이콘 · 스크린샷)을 추가해 PWA로 동작합니다.

- **`manifest.webmanifest`** — `id`, `name`/`short_name`, `description`, `start_url`·`scope`(상대 경로 `./` — 하위 경로 배포도 동작), `display: standalone` + `display_override`, 테마/배경색(`#EEF1F4`), `categories`, `prefer_related_applications: false`, 아이콘 4종(any 192·512 + maskable 192·512), `screenshots`(`screenshots/home.png`, narrow). `id`·`screenshots`·maskable 아이콘은 Android WebAPK 품질 분류를 높이고, 지문(fingerprint)이 바뀌면 Chrome 이 WebAPK 를 최신 target SDK 로 다시 발급한다 — Play Protect 의 "이전 버전 앱" 경고 대응(아래 참고).
- **`sw.js`** — 서비스 워커. 캐시 이름 `ddakjeongsan-v2.6.0`(앱 버전과 맞춤).
  - 설치 시: 같은 출처 파일(HTML + 매니페스트 + 아이콘·스크린샷 + `audio/scream.mp3` + `src/`의 앱 소스 전부)과 CDN(React·ReactDOM·scheduler·htm·html2canvas·three의 ESM + Pretendard·Space Grotesk CSS)을 캐시. CDN은 하나쯤 실패해도 설치가 진행됩니다.
  - 요청 처리: 페이지 이동과 우리 앱 파일(같은 주소의 `src/` JS·아이콘 등)은 네트워크 우선(실패 시 캐시 — 오프라인), 외부 CDN(버전이 URL에 고정)은 캐시 우선 + 백그라운드 갱신(stale-while-revalidate). 앱 파일을 캐시 우선으로 주면 고친 뒤 첫 실행에서 옛 파일과 새 파일이 섞여 모듈이 깨질 수 있어서 네트워크 우선으로 둔다.
  - **자원(HTML·`src/` JS·아이콘·매니페스트)을 바꾸면** `sw.js`의 `CACHE` 값을 `ddakjeongsan-v2.6.1`처럼 올려야 사용자 기기에서 새로 받습니다. `src/`·아이콘·스크린샷을 추가·삭제하면 `sw.js`의 `CORE` 목록도 함께 맞추고, vendor 버전을 바꾸면 `index.html`의 import map과 `sw.js`의 `VENDOR`를 함께 고쳐야 합니다.
- **아이콘** — `favicon.svg`(브라우저 탭), `apple-touch-icon.png`(iOS 홈 화면 180px), `icons/icon-192.png`·`icons/icon-512.png`(any), `icons/icon-maskable-192.png`·`icons/icon-maskable-512.png`(Android 어댑티브). 모두 `favicon.svg`의 영수증·체크 도형을 `#1A1D29` 배경 + 흰색 선으로 렌더한 것으로, 로고를 바꾸면 `favicon.svg` 수정 후 아이콘 PNG를 다시 만들면 됩니다. maskable 192 는 512 를 `sips -z 192 192` 로 축소.

### Google Play Protect "안전하지 않은 앱 / 이전 버전" 경고

Android 에서 PWA 를 설치하면 Chrome/삼성인터넷이 **WebAPK**(구글 발급)를 만든다. 이 APK 의 `targetSdkVersion` 은 개발자가 못 정하고 구글 발급 서버가 정하는데, 오래전 발급된 WebAPK 는 target SDK 가 낮아 Play Protect 가 "이전 버전 앱" 경고를 띄운다. 대응:

1. **매니페스트를 실질적으로 바꿔 재발급을 유도** — `id`·`icons`·`screenshots` 등 지문 필드가 바뀌면 Chrome 이 다음 방문 때 WebAPK 를 최신 target SDK 로 다시 발급한다. (본 저장소는 위 매니페스트 보강으로 적용됨.)
2. **기기에서**: Chrome·"Google Play Services for WebAPKs" 최신화 → PWA 삭제 후 재설치.
3. **커스텀 도메인**(예: `ddakjeongsan.com`) — `*.github.io` 는 공용 서브도메인이라 Safe Browsing 평판이 뒤섞여 신규 경로가 불이익을 받는다. 전용 도메인은 자체 평판을 쌓는다.
4. **시간 + 색인** — Google Search Console 등록, 트래픽·색인이 쌓이면 신규 사이트 페널티가 풀리는 경우가 있다.
5. Lighthouse PWA 감사로 설치 가능성 경고를 남기지 말 것.

각 HTML `<head>`에 `<link rel="manifest">`·`theme-color`·`apple-touch-icon`·`apple-mobile-web-app-*` 메타를, `</body>` 직전에 서비스 워커 등록 스크립트를 넣었습니다.

```js
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
}
```

> 서비스 워커는 **HTTPS(또는 localhost)** 에서만 등록됩니다. `file://`로 열면 `src/` 스크립트 자체가 로드되지 않으므로, 로컬에서도 정적 서버(localhost)로 열어야 합니다.

## 정적 페이지 · 법적 페이지 & 문의하기

앱(`index.html`)은 자바스크립트로 그려지므로, 검색엔진·애드센스 심사가 읽을 수 있게 **정적 글 페이지** — 허브 `guide.html`(`/guide`)과 탭별 가이드 `guide/settle.html` · `guide/food.html` · `guide/games.html`(`/guide/settle` 등)를 두고, `index.html`에는 `<noscript>` 소개문과 링크를 넣었습니다. 새 정적 페이지를 만들면 `sitemap.xml`, `sw.js`의 `CORE`, 앱 푸터(`SiteFooter.js`), `guide.html` 허브에 함께 추가합니다. 주소 규칙: **`#` 없는 주소는 설명 글, `#` 있는 주소는 앱**(`/guide/food` 설명 ↔ `/#/food` 앱). `guide/` 안 페이지는 자원·링크를 `../` 로 참조하고, 주소를 옮기면 `_redirects` 에 301 을 남깁니다.

**검색 노출 규칙**: Cloudflare Pages 는 `/guide.html` 을 `/guide` 로 308 리디렉션하므로 `sitemap.xml` 의 `<loc>` 와 각 페이지 `canonical` 은 **`.html` 없는 최종 주소**로 적습니다(내부 링크는 로컬 서버·오프라인 캐시 때문에 `.html` 유지). 새 페이지에는 `title` · `description` · `canonical` · OG 태그(`screenshots/og.png`, 1200×630)를 넣습니다. 없는 주소는 `404.html`(noindex)이 404 상태로 응답합니다. 홈에는 JSON-LD(`WebSite` · `WebApplication`)가 있습니다. 옛 GitHub Pages 안내 페이지(`docs/index.html`)는 옛 PWA 사용자 안내용으로 남기되 `noindex` 입니다.


푸터에 개인정보처리방침(`privacy.html`), 이용약관(`terms.html`), 문의하기(`contact.html`) 링크를 두었습니다. 문의하기는 Google 설문지로 연결됩니다. 다른 설문지로 바꾸고 싶다면 `contact.html` 안의 버튼 `href` 값만 교체하면 됩니다.

## 파일 구조

기능(탭)별 폴더 + 공용 `shared/`로 나눕니다.

```
index.html                  # 앱 셸 — <head> 메타·폰트·전역 CSS(키프레임) + import map + src/main.js
src/
  main.js                   # 진입점 — createRoot 로 <App/> 마운트
  App.js                    # 해시 라우트로 화면 선택 + 하단 탭바. useSettlement 를 여기서 호출
  settlement/               # 정산 탭
    SettleScreen.js         #   화면 (참가자 · 회차 입력 → 계산 → 결과)
    useSettlement.js        #   모든 상태 · 파생 값 · 이벤트 핸들러 (명단 저장 포함)
    settlement.js           #   정산 알고리즘 (순수 함수)
    ParticipantsSection.js · RoundsSection.js · SummarySection.js · ResultReceipt.js
    exportImage.js          #   결과 DOM → PNG (html2canvas) · 공유 · 다운로드
    ImagePreviewOverlay.js  #   모바일 저장용 오버레이
  food/                     # 오늘 뭐먹지 탭
    FoodScreen.js           #   화면 (조건 입력 ↔ 결과 ↔ 전체 목록)
    FoodForm.js · FoodResult.js · FoodListScreen.js
    food.js                 #   추천 알고리즘 (순수 함수) · 지도 검색 링크
    foodData.js             #   메뉴 510개 · 장르 · 곁들임(PAIRS)
    coupang.js              #   쿠팡 파트너스 배너 선택
  games/                    # 미니게임 탭
    GamesScreen.js          #   참가자 · 게임 목록 · 플레이(GamePlay) · 동점 처리(TieResult)
    registry.js             #   게임 목록 (MIN/MAX_PLAYERS, releaseAt)
    *Game.js                #   게임 10종
    GameResult.js           #   결과 카드 · 정산에 추가
    TurnOrder.js · common.js · palette.js   # 순서 정하기 · 차례 표시/큰 버튼 · 플레이어 색 15개
    gameIcons.js            #   게임 카드 아이콘 · 레이스 동물 15종 (SVG)
    random.js · wheel.js · josa.js · sfx.js # 공정한 난수 · 룰렛 곡선 · 조사 · 효과음/진동
    three/                  #   Three.js 무대(stage) · 3D 칸(ThreeView) · 해적/악어 장면
  shared/                   # 여러 탭이 함께 쓰는 것
    html.js                 #   html = htm.bind(React.createElement)
    styles.js               #   색 상수(C_*) + 모든 인라인 스타일 객체
    storage.js · router.js · util.js · entitlements.js
    ReceiptCard.js · TabBar.js · SiteFooter.js · ChipGroup.js · AdSlot.js · BrandLogo.js · icons.js
    tokens.css              #   CSS 변수 (정적 페이지와 공유)
audio/scream.mp3            # 해적룰렛 비명
release-notes.html          # 버전정보 (사용자용)
404.html                    # 없는 주소 안내 (Cloudflare Pages 가 404 상태로 응답, noindex)
guide.html                  # 사용 가이드 (/guide) — 아래 세 가이드로 가는 허브
guide/settle.html · food.html · games.html  # 정산 계산 방식 · 뭐먹지 가이드 · 미니게임 가이드 (/guide/settle 등, JS 없이 읽히는 정적 글 — 검색·애드센스 심사용)
_redirects                  # Cloudflare Pages 301 (옛 /how-it-works → /guide/settle)
ads.txt                     # 애드센스 판매자 인증 (pub-3948983509562369)
privacy.html · terms.html · contact.html
manifest.webmanifest · sw.js · favicon.svg · apple-touch-icon.png · icons/ · screenshots/
admin/                      # 내부 문서(ADS_PLAN · PLAN_expansion) · 소리 테스트 페이지
docs/index.html             # 옛 GitHub Pages 주소 → 새 도메인 안내
prototype/receipt-ocr.html  # 영수증 OCR 검토용 프로토타입 (앱 본체와 분리)
```

## 코드 컨벤션

- **모듈**: 파일 맨 위에 한두 줄 한국어 머리말(무엇을·왜), 그 다음 `import`. 상수는 `UPPER_SNAKE`, 컴포넌트는 `PascalCase` 함수 컴포넌트 + named export(`export function X`)
- **마크업**: `` html`...` `` (htm). 속성은 JSX와 같게 `className` · `style=${객체}` · `onClick`
- **스타일**: 정적 스타일은 `src/shared/styles.js`의 `styles`에 이름을 붙여 두고 `style=${styles.x}`로 씀. 값이 상태에 따라 바뀌는 부분만 `{ ...styles.x, background: bg }`처럼 덮어씀. 브랜드 색은 `C_RED` 등 상수로
- **저장소**: `localStorage`를 직접 부르지 않고 `shared/storage.js`의 `load`/`save`(키 앞에 `ddak:`)
- **게임**: 결과는 시작할 때 `random.js`로 확정, `onFinish`는 한 번만. 타이머는 `useRef`에 모아 언마운트 때 정리
- **주석**: 코드를 되풀이하지 말고 이유·제약을 한국어로 짧게
- 자원(`src/`·아이콘·오디오)을 추가·삭제하면 `sw.js`의 `CORE`와 `CACHE` 버전을 함께 고침

## 실행 방법

- **로컬 실행**: 빌드는 없지만 모듈이 `fetch`로 로드되므로 정적 서버가 필요합니다. 프로젝트 폴더에서:
  ```sh
  python3 -m http.server 8000      # 또는:  npx serve
  ```
  그 다음 `http://localhost:8000` 접속. (`index.html`을 `file://`로 바로 열면 모듈이 로드되지 않아 화면이 비어 있습니다.)
- **폰에서 테스트**: 같은 Wi-Fi면 `http://<Mac의 IP>:8000`(IP는 `ipconfig getifaddr en0`). 다른 네트워크에서 보거나 서비스 워커·공유 기능까지 확인하려면 HTTPS 터널을 씁니다: `cloudflared tunnel --url http://localhost:8000`
- **React 프로젝트에 통합**: `src/`가 이미 표준 ES 모듈이므로 그대로 가져다 쓸 수 있습니다. 번들러 환경에서는 `src/shared/html.js`를 프로젝트의 `htm` + `react`로 바꾸거나, htm 대신 JSX로 다시 쓰면 됩니다. `src/settlement/settlement.js`(순수 함수)는 아무 의존성 없이 재사용 가능합니다.

## 배포

GitHub Pages, Netlify, Vercel 등 정적 파일 호스팅 서비스 어디에나 폴더 전체(HTML + `src/` + `audio/` + `manifest.webmanifest` + `sw.js` + `favicon.svg` + `apple-touch-icon.png` + `icons/` + `screenshots/`)를 그대로 올리면 바로 배포됩니다. 폴더 구조를 유지해야 상대 경로가 맞습니다. (호스팅은 HTTP로 서빙하므로 로컬과 달리 별도 서버 준비가 필요 없습니다.)

1. GitHub 저장소 생성 후 위 파일들을 폴더 구조 그대로 업로드 (필요하면 `contact.html`의 설문지 `href`를 원하는 링크로 교체)
2. Settings → Pages → Source를 `main` 브랜치 `/ (root)`로 설정
3. `https://아이디.github.io/저장소이름`으로 접속
4. **HTTPS 필수**: 서비스 워커와 Web Share API는 보안 컨텍스트에서만 동작합니다. GitHub Pages·Netlify·Vercel은 HTTPS를 기본 제공하므로 추가 설정이 없습니다.
5. 확인: 배포 URL을 크롬으로 열고 DevTools → Application 탭에서 Manifest·Service Workers·Cache Storage가 잡히는지, Lighthouse의 PWA 항목이 통과하는지 봅니다. 모바일에서는 브라우저 메뉴의 "홈 화면에 추가"로 설치해 standalone 실행을 확인합니다.

## 라이선스

개인/포트폴리오용으로 자유롭게 사용 가능합니다.
