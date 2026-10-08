# 딱정산 (Settlement App)

모임 비용을 회차별로 나눠 기록하면, 사람별 결제/부담 내역을 계산하고 최소한의 송금 구조로 누가 누구에게 얼마를 보내야 하는지 자동으로 알려주는 웹앱입니다.
친구 모임의 **메뉴 정하기(오늘 뭐먹지) → 누가 낼지 정하기(미니게임) → 정산**까지 한 앱에서 이어집니다. 서버 없이 브라우저 안에서만 동작합니다. 배포 주소: https://ddakjeongsan.com

> 기능·게임 규칙·공개 일정 등 **앱 소개는 [APP_INFO.md](APP_INFO.md)** 에 정리했습니다. 이 문서는 개발자용입니다.

**Vite 로 빌드합니다.** 앱 소스는 `src/` 아래 표준 ES 모듈(`import`/`export`)이고, `index.html`은 진입점 `src/main.js` 하나만 로드합니다. vendor(React·htm·html2canvas·Three.js)는 npm 패키지로 설치해 함께 번들합니다(외부 CDN 은 폰트만). JSX 대신 [htm](https://github.com/developit/htm)(태그드 템플릿 리터럴)을 쓰므로 Babel·JSX 변환은 없습니다.

`npm install` 후 `npm run dev`(개발 서버) / `npm run build`(`dist/` 생성)로 씁니다(아래 "실행 방법"). 같은 코드에서 웹(ddakjeongsan.com)과 앱인토스 번들을 빌드 시점 환경 변수로 나눠 만듭니다.

## 주요 기능

하단 탭 3개 — **정산**(`#/settle`) · **뭐먹지**(`#/food`) · **미니게임**(`#/games`). 참가자 명단은 세 탭이 함께 씁니다(`useSettlement`의 참가자 목록을 그대로 공유).

### 정산

- 참가자 이름 + 정산받을 계좌(선택). 계좌는 그 사람이 받는 쪽(채권자)일 때만 결과·복사 텍스트·이미지에 표시
- 회차마다 이름 · 결제자 1명 · 금액 · 참여자 목록. 회차마다 참여 인원이 달라도 정확히 반영
- 금액 따로 입력(선택): 참여자별 개별 금액(`13000+4000` 처럼 + 합산 가능)을 적으면 총액에서 뺀 나머지(공통 금액)만 1/n
- 사람별 낸 금액 / 부담 금액 / 차액 표(개별 금액이 있으면 "개별 + 공통" 내역) + 보내는 사람 기준으로 묶은 송금 목록
- 결과 표는 좁은 폰에서도 금액이 줄바꿈되지 않게 배치(아래 [결과 표 배치](#결과-표-배치))
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

- **React 18** — npm 패키지(`react@18.3.1`·`react-dom@18.3.1`). 버전은 `package.json` 에 고정합니다.
- **htm** — JSX를 대체하는 태그드 템플릿 리터럴. `htm.bind(React.createElement)`로 묶어 `src/shared/html.js`에서 내보냅니다. 문법은 JSX와 거의 같습니다: `` html`<div style=${styles.box}>${child}</div>` ``, 컴포넌트는 `` html`<${Child} prop=${value} />` ``.
- **html2canvas** — 정산 결과 DOM을 캔버스로 렌더링해 PNG로 저장하는 데 사용. "이미지로 저장"을 누를 때만 동적 `import("html2canvas")` 로 불러와 첫 로딩 번들에서 뺍니다.
- **Three.js** — 해적룰렛·악어이빨 3D 장면. 두 게임을 열 때만 동적 `import("three")` 로 불러옴(별도 청크). 서비스 워커가 미리 캐시해 오프라인에서도 동작
- **Vite** — 개발 서버와 프로덕션 번들. 설정은 `vite.config.js` (아래 "실행 방법", "PWA")
- **Web Share API** (`navigator.share`) — 모바일에서 결과 이미지를 시스템 공유로 저장할 수 있도록 지원. 모바일에서는 기본적으로 결과 이미지를 큰 오버레이로 띄워 "길게 눌러 사진에 추가"로 저장하도록 안내하고, 공유가 가능하면 오버레이 안에 공유 버튼도 함께 제공합니다.
- **Pretendard** (헤드라인/본문), **Space Grotesk** (금액 숫자 전용) — `index.html`의 `<head>`에서 `<link rel="stylesheet">`로만 로드. 두 서체 모두 `0`에 사선·점이 없어 금액 표기가 깔끔합니다. 숫자에는 `font-variant-numeric: tabular-nums`로 자릿수를 정렬합니다.
- **PWA** — `manifest.webmanifest` + `sw.js`(서비스 워커)로 홈 화면 설치와 오프라인 실행 지원
- 순수 인라인 스타일 (별도 CSS 프레임워크 없음) — 스타일 객체는 `src/shared/styles.js` 한 곳에 모음(아래 "코드 컨벤션"). 카드·버튼·입력창 등 사각형 요소는 4px 라운드

`index.html`의 `<head>`에는 폰트도 `<link rel="stylesheet">`로 함께 로드합니다. 처음에는 컴포넌트 내부 CSS `@import`로만 폰트를 불러왔는데, 로딩 시점이 늦어 일부 환경에서 폰트가 적용되지 않는 경우가 있어 `<head>` 레벨 `<link>`로 옮겼습니다.

```html
<link rel="stylesheet" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.min.css" />
<link rel="stylesheet" crossorigin href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" />
```

두 `<link>` 모두 `crossorigin`을 붙였습니다. 안 붙이면 `html2canvas`가 결과 이미지를 만들 때 교차 출처 스타일시트의 `cssRules`에 접근하다 `SecurityError`가 나고, 저장된 이미지의 숫자가 대체 폰트로 렌더됩니다.

## 데이터 구조

```js
// 참가자: 이름 + 정산받을 계좌(선택). 이름·계좌는 localStorage "ddak:roster" 에도 저장
{ id, name, account, showAccount }

// 회차: 결제자 1명 + 금액 + 참여자 목록(N명) + 참여자별 개별 금액(선택)
{ id, title, payerId, amount, participantIds: [id, id, ...], customAmounts: { [id]: "13000+4000" } }
```

`customAmounts`는 입력한 사람만 키가 있고, 값은 숫자를 `+`로 이은 문자열입니다(`parseAmount`로 합산). 공통 금액(`총액 − 참여 중인 사람의 개별 금액 합`)은 저장하지 않고 `splitRound`로 매번 계산합니다. 참여자에서 빠지면 그 사람의 개별 금액도 지웁니다.

`account`는 계산에는 쓰이지 않고, 정산 결과에서 그 사람이 돈을 받는 쪽(채권자)일 때만 수신자 이름 아래 표시됩니다. `showAccount`는 참가자 입력 목록에서 계좌 입력칸을 펼쳤는지 여부(UI 전용). 이름이 같은 참가자가 여러 명이어도 `computeFairTransactions`가 이름이 아니라 id·참가자 객체로 계산해 계좌를 붙이므로 서로 엇갈리지 않습니다.

모든 계산은 참가자 목록과 회차 목록, 이 두 가지 상태로부터 파생됩니다. 상태와 이벤트 핸들러, 파생 값은 `src/settlement/useSettlement.js`에, 아래 정산 알고리즘(순수 함수)은 `src/settlement/settlement.js`에 있습니다.

`useSettlement`는 셸(`App.js`)에서 호출하므로 탭을 옮겨도 입력이 남고, 다른 탭은 `addRoundFrom({ title, payerId, amount, participantIds })`으로 회차를 넘깁니다. 아무것도 입력하지 않은 회차 하나만 있으면 그 회차를 대체합니다.

localStorage 키 (모두 `ddak:` 접두사, `src/shared/storage.js`의 `load`/`save`로만 접근, 실패 시 저장 없이 동작): `roster`(명단) · `foodHistory`(최근 고른 메뉴 10개) · `sound`(효과음) · `entitlements`(`previewGames` — 공개 전 게임 미리 열기, `adFree`) · `coupangWeights`(쿠팡 배너 가중치, 개발·테스트용)

## 정산 알고리즘

### 1단계 — 회차별로 결제/부담 집계

각 회차마다 결제자의 `paid`에 금액을 더하고, 그 회차의 참여자 각각에게 `개별 금액 + 공통 금액 ÷ 참여 인원`만큼 `share`를 더합니다(개별 금액이 없으면 `금액 ÷ 참여 인원`). 개별 금액 몫은 `custom`에도 따로 모아 결과에 "개별 + 공통" 내역으로 보여줍니다. 모든 회차를 순회하면 참가자별 누적 `paid`, `share`, `custom`이 완성됩니다.

```js
rounds.forEach((r) => {
  const { activeIds, common } = splitRound(r, validIdSet); // common = 총액 - 개별 금액 합
  payer.paid += amount;
  activeIds.forEach((id) => {
    const own = parseAmount(r.customAmounts[id]);
    stats[id].share += own + common / activeIds.length;
    stats[id].custom += own;
  });
});
```

개별 금액 합이 총액보다 크면(`common < 0`) `isRoundValid`가 그 회차를 계산에서 뺍니다.

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
- 해적룰렛·악어이빨은 함정 위치만 정해져 있고 누가 걸릴지는 고르는 곳에 달려 있습니다. 함정은 몇 번째 고르기에서 나올 확률이 모두 같으므로, 칸 수를 **인원의 배수**로 맞춰(`common.js`의 `equalTurnCount` — 가장 가까운 배수, 해적 최대 30·악어 최대 20) 모두 같은 횟수를 고르게 해야 순서와 상관없이 확률이 1/n 이 됩니다. 해적 통은 20개 이하 2줄, 넘으면 3줄로 줄마다 고르게 나눕니다.
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

## 결과 표 배치

`src/settlement/ResultReceipt.js` 의 사람별 결제 내역 표는 좁은 폰(375px 이하)에서도 금액이 두 줄로 꺾이지 않도록 아래 순서로 버팁니다.

1. **한 그리드** — 머리글과 모든 행이 하나의 CSS 그리드(`56px repeat(3, minmax(max-content, 1fr))`)라 열 경계가 항상 맞습니다. 이름 칸은 한글 네 글자가 들어가는 고정 폭(더 긴 이름은 줄바꿈), 금액 칸 셋은 남는 폭을 똑같이 나누되 가장 긴 금액보다 좁아지지 않습니다. "개별 + 공통" 내역 줄과 행 구분선은 한 줄 전체(`1 / -1`)를 차지합니다.
2. **단위는 머리글에** — 칸에는 숫자만, "원"은 `낸 금액(원)`처럼 머리글에 적습니다. (복사 텍스트와 내역 줄에는 "원"을 그대로 씁니다.)
3. **7자리면 글자 축소** — 100만 원 이상 금액이 하나라도 있으면 금액 글자를 12px → 10px. 데이터로 정하므로 이미지도 화면과 같습니다.
4. **좁은 화면만 여백 축소** — 캡처 영역 좌우 여백 `clamp(16px, 6.4vw, 24px)` (375px 이상은 24px 그대로, 미니게임 결과 카드도 같은 스타일).
5. **그래도 넘치면 아래로 내림** — 그린 표가 실제로 넘치는지(`scrollWidth > clientWidth`) `useLayoutEffect` 로 재서, 넘치면 "1줄: 이름 · 차액 / 2줄: 낸 금액 · 부담액 / 3줄: 내역" 배치로 바꿉니다. 폭(회전)이나 금액이 바뀌면 표로 다시 그려 보고 또 잽니다. 화면에 그려지기 전에 정해져 깜빡이지 않고, 저장 이미지도 같은 배치입니다.

결과: 360px 이상은 7자리까지 표 한 줄, 320px 은 아래로 내린 배치.

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
- **`sw.js`** — 서비스 워커 템플릿. `npm run build` 가 `dist/` 결과물 목록(해시 파일명 포함)을 `CORE` 에, 결과물 내용 해시를 `CACHE` 이름에 넣어 `dist/sw.js` 를 만듭니다. **손으로 `CORE` 목록이나 `CACHE` 버전을 고치지 않습니다.** 개발 서버(`npm run dev`)에서는 등록하지 않습니다(`src/main.js`).
  - 설치 시: 같은 출처 결과물 전부(크롤러·호스팅 설정 파일과 `docs/`·`prototype/` 제외) + 폰트 CSS(CDN, 하나쯤 실패해도 설치 진행)를 캐시.
  - 요청 처리: `assets/` 아래 해시 파일은 캐시 우선(내용이 바뀌면 이름이 바뀜). 페이지 이동과 나머지 같은 출처 파일은 네트워크 우선(실패 시 캐시 — 오프라인). 외부 폰트는 캐시 우선 + 백그라운드 갱신(stale-while-revalidate).
- **`_headers`** — Cloudflare Pages 응답 헤더. `assets/*` 는 1년 immutable 캐시, `sw.js` 는 `no-cache`.
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

**검색 노출 규칙**: Cloudflare Pages 는 `/guide.html` 을 `/guide` 로 308 리디렉션하므로 `sitemap.xml` 의 `<loc>` 와 각 페이지 `canonical` 은 **`.html` 없는 최종 주소**로 적습니다. 내부 링크도 같은 최종 주소로 적어 리디렉션을 거치지 않게 합니다 — 정적 페이지는 `href="guide/settle"` · `href="../"`(홈), Vite 개발·미리보기 서버도 `.html` 없는 주소를 열고, 오프라인에서는 서비스 워커가 `경로.html` 캐시로 찾습니다. 새 페이지에는 `title` · `description` · `canonical` · OG 태그(`screenshots/og.png`, 1200×630)를 넣습니다. 없는 주소는 `404.html`(noindex)이 404 상태로 응답합니다. 홈에는 JSON-LD(`WebSite` · `WebApplication`), 가이드 페이지에는 `BreadcrumbList` · `Article`(`datePublished` · `dateModified`)이 있습니다 — 글을 고치면 `dateModified` 와 `sitemap.xml` 의 `lastmod` 를 같이 고칩니다. 웹 폰트는 Pretendard **dynamic-subset** CSS(쓰인 글자 조각만 받음, 첫 화면 폰트 약 3.8MB → 0.3MB).

**네이버 대응**(서치어드바이저 가이드 기준): 네이버 로봇(Yeti)은 자바스크립트를 실행하지 않을 수 있어 `index.html` 의 `#root` 안에 소개문 · 가이드 링크를 HTML 로 넣어 둡니다(앱이 뜨면 React 가 바꿔 그림, 앱인토스 빌드에서는 web-only 로 빠짐). 빌드가 가이드 · 버전정보 본문 전체로 **`rss.xml`** 을 만듭니다(`vite.config.js` 의 `buildRss`, 날짜는 `sitemap.xml` lastmod) — 서치어드바이저 "요청 → RSS 제출"에 등록. 가이드마다 고유 OG 이미지 `screenshots/og-{guide,settle,cases,food,games}.png`(1200×630, 앱인토스 등록용 스크린샷으로 제작)를 쓰고 — 네이버는 여러 페이지에 반복되는 이미지를 썸네일로 잘 쓰지 않음 — 서비스 워커 미리 저장에서는 뺍니다. `/favicon.ico`(16·32·48px)도 둡니다. 옛 GitHub Pages 안내 페이지(`docs/index.html`)는 옛 PWA 사용자 안내용으로 남기되 `noindex` 입니다.


푸터에 개인정보처리방침(`privacy.html`), 이용약관(`terms.html`), 문의하기(`contact.html`) 링크를 두었습니다. 문의하기는 Google 설문지로 연결됩니다. 다른 설문지로 바꾸고 싶다면 `contact.html` 안의 버튼 `href` 값만 교체하면 됩니다.

## 파일 구조

기능(탭)별 폴더 + 공용 `shared/`로 나눕니다.

```
index.html                  # 앱 셸 — <head> 메타·폰트·전역 CSS(키프레임) + src/main.js
package.json · vite.config.js  # 의존성 · Vite 설정(웹/앱인토스 분기, 정적 파일 복사 + sw.js 생성)
apps-in-toss.config.ts      # 앱인토스 설정 (appName · 권한 · 내비게이션 바 · webBundleDir)
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
  platform/                 # 웹/앱인토스 차이를 모은 곳 — 앱 코드는 "#platform" 으로 import
    web.js · ait.js         #   같은 이름을 export (클립보드 · 진동 · 외부 링크 · 이미지 저장 · 분석)
    fonts.ait.css           #   앱인토스 번들용 로컬 폰트
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
guide/settle.html · cases.html · food.html · games.html  # 정산 계산 방식 · 상황별 정산 방법 · 뭐먹지 가이드 · 미니게임 가이드 (/guide/settle 등, JS 없이 읽히는 정적 글 — 검색·애드센스 심사용)
_redirects                  # Cloudflare Pages 301 (옛 /how-it-works → /guide/settle)
_headers                    # Cloudflare Pages 캐시 헤더
ads.txt                     # 애드센스 판매자 인증 (pub-3948983509562369)
privacy.html · terms.html · contact.html
manifest.webmanifest · sw.js · favicon.svg · apple-touch-icon.png · icons/ · screenshots/
admin/                      # 내부 문서(ADS_PLAN · PLAN_expansion) · 소리 테스트 페이지 (배포 안 함 — npm run dev 에서 /admin/sound-test.html)
docs/index.html             # 옛 GitHub Pages 주소 → 새 도메인 안내
prototype/receipt-ocr.html  # 영수증 OCR 검토용 프로토타입 (앱 본체와 분리)
```

## 코드 컨벤션

- **모듈**: 파일 맨 위에 한두 줄 한국어 머리말(무엇을·왜), 그 다음 `import`. 상수는 `UPPER_SNAKE`, 컴포넌트는 `PascalCase` 함수 컴포넌트 + named export(`export function X`)
- **마크업**: `` html`...` `` (htm). 속성은 JSX와 같게 `className` · `style=${객체}` · `onClick`
- **스타일**: 정적 스타일은 `src/shared/styles.js`의 `styles`에 이름을 붙여 두고 `style=${styles.x}`로 씀. 값이 상태에 따라 바뀌는 부분만 `{ ...styles.x, background: bg }`처럼 덮어씀. 브랜드 색은 `C_RED` 등 상수로
- **플랫폼 차이**: 클립보드 · 진동 · 외부 링크 · 이미지 저장처럼 웹과 토스 앱에서 다르게 동작하는 것은 `#platform`(`src/platform/web.js` · `ait.js`)을 거침. `navigator.*`·`window.open` 을 화면 코드에서 직접 부르지 않음. 앱인토스에서 빼야 하는 UI 는 `IS_AIT` 로 분기
- **저장소**: `localStorage`를 직접 부르지 않고 `shared/storage.js`의 `load`/`save`(키 앞에 `ddak:`)
- **게임**: 결과(또는 함정 위치)는 시작할 때 `random.js`로 확정, 차례로 고르는 게임은 칸 수를 인원의 배수로, `onFinish`는 한 번만. 타이머는 `useRef`에 모아 언마운트 때 정리
- **주석**: 코드를 되풀이하지 말고 이유·제약을 한국어로 짧게
- 루트에 새 정적 파일·페이지를 추가하면 `vite.config.js`의 `STATIC` 목록에도 넣음 (`src/` 모듈·오디오는 번들이 알아서 처리)

## 실행 방법

Node 22 이상(`.node-version`)이 필요합니다.

```sh
npm install
npm run dev        # 개발 서버 — http://localhost:5173 (파일을 고치면 바로 반영)
npm run build      # 프로덕션 번들 → dist/
npm run preview    # dist/ 를 로컬에서 확인 (서비스 워커 포함)
```

- **폰에서 테스트**: `npm run dev -- --host` 로 띄우고 같은 Wi-Fi에서 `http://<Mac의 IP>:5173`(IP는 `ipconfig getifaddr en0`). 서비스 워커·공유 기능까지 확인하려면 `npm run build && npm run preview -- --host` 후 HTTPS 터널을 씁니다: `cloudflared tunnel --url http://localhost:4173`
- `src/settlement/settlement.js`(순수 함수)는 아무 의존성 없이 재사용 가능합니다.

## 배포

**Cloudflare Pages** 가 GitHub 저장소를 빌드해 배포합니다 (https://ddakjeongsan.com).

| 설정 | 값 |
|---|---|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node 버전 | `.node-version` (22) |

- `dist/` 에는 번들된 앱 + `vite.config.js` 의 `STATIC` 목록(정적 페이지·아이콘·`_redirects`·`_headers`·`ads.txt`·`sitemap.xml` 등)만 들어갑니다. `admin/`·`*.md` 는 배포되지 않습니다.
- 확인: 배포 URL을 크롬으로 열고 DevTools → Application 탭에서 Manifest·Service Workers·Cache Storage가 잡히는지, Network 탭에서 외부 요청이 폰트뿐인지 봅니다. 모바일에서는 "홈 화면에 추가"로 설치해 standalone 실행을 확인합니다.

## 앱인토스 (토스 미니앱) 빌드

같은 코드에서 빌드 모드로 나눕니다. 별도 브랜치는 쓰지 않습니다.

```sh
npm run dev:ait     # 앱인토스 모드 개발 서버 — SDK 는 @apps-in-toss/devtools mock, 우하단 AIT 버튼으로 패널
npm run build:ait   # dist-ait/ 빌드 → ait build → ddakjeongsan.ait (콘솔 업로드용)
```

- `--mode ait` 이면 `#platform` 이 `src/platform/ait.js`(토스 SDK `@apps-in-toss/web-framework` 3.x)로 연결됩니다. 웹 번들에는 SDK 가 들어가지 않습니다.
- 앱인토스 번들에서 빠지는 것: `index.html` 의 `<!-- web-only -->` 구간(SEO 메타 · PWA · CDN 폰트 · 애드센스), 서비스 워커, 쿠팡 배너, 애드센스 광고 자리, 푸터의 가이드 · 버전정보 링크. 폰트는 번들에 포함(`fonts.ait.css`), 외부 요청 0.
- 토스 앱에서 바뀌는 동작: 복사 → `Clipboard.setText`, 진동 → `Device.triggerHaptic`(iOS 포함), 지도 · 정책 링크 → `Device.openURL`(기기 브라우저), 정산 이미지 → `File.saveBase64`(미지원 버전이면 미리보기 오버레이), 화면 진입 → `Analytics.screen`.
- 주소: 해시(`#/food`)가 없으면 경로(`/food`, `/games/roulette`)로 첫 화면을 고릅니다 — 콘솔 "주요 기능" 주소 `intoss://ddakjeongsan/food` 용. 그래서 앱인토스 빌드는 `base: "/"`(절대 경로)입니다.
- 분석: `trackEvent`·`trackScreen`(#platform) → `Analytics.click`·`Analytics.screen`. 웹은 아무것도 하지 않습니다. 이벤트 이름은 `settle_calculate`·`food_recommend`·`game_finish` 등(`grep -rn trackEvent src`).
- devtools 는 Node 24 이상이 필요해 앱인토스 모드에서만 불러옵니다(웹 빌드 · Cloudflare 는 Node 22).
- `ait init` 은 쓰지 않습니다 — 웹 `build` 스크립트 뒤에 `ait build` 를 붙이기 때문.

## 라이선스

개인/포트폴리오용으로 자유롭게 사용 가능합니다.
