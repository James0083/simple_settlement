# 딱정산 (Settlement App)

모임 비용을 회차별로 나눠 기록하면, 사람별 결제/부담 내역을 계산하고 최소한의 송금 구조로 누가 누구에게 얼마를 보내야 하는지 자동으로 알려주는 웹앱입니다.
친구 모임의 **메뉴 정하기(오늘 뭐먹지) → 누가 낼지 정하기(미니게임) → 정산**까지 한 앱에서 이어집니다. 서버 없이 브라우저 안에서만 동작합니다.

**빌드 과정이 없습니다.** 앱 소스는 `src/` 아래 표준 ES 모듈(`import`/`export`)로 나뉘어 있고, `index.html`은 진입점 `src/main.js` 하나만 `<script type="module">`로 로드합니다. 나머지 파일은 브라우저 네이티브 모듈 로더가 해석하고, vendor(React·htm·html2canvas)는 `<script type="importmap">`이 jsdelivr의 ESM 빌드로 매핑합니다. JSX 대신 [htm](https://github.com/developit/htm)(태그드 템플릿 리터럴)을 쓰므로 트랜스파일러(Babel 등)가 필요 없습니다.

번들러나 `npm install`은 필요 없지만, 모듈이 `fetch`로 로드되므로 **로컬 정적 서버**를 통해 열어야 합니다(아래 "실행 방법"). GitHub Pages 등 HTTP 호스팅에 올리면 그대로 동작합니다. (PWA로 배포할 때는 매니페스트·서비스 워커·아이콘 파일을 함께 올립니다 — "PWA" 섹션 참고.)

## 주요 기능

하단 탭 3개 — **정산**(`#/settle`) · **뭐먹지**(`#/food`) · **미니게임**(`#/games`). 참가자 명단은 세 탭이 함께 씁니다.

### 정산

- 참가자 이름 등록 (금액은 여기서 넣지 않습니다)
- **정산받을 계좌(선택)**: 참가자 이름 옆 "+ 계좌"를 누르면 입력칸이 나타납니다. 그 사람이 돈을 받는 쪽(채권자)일 때 정산 결과·복사 텍스트·저장 이미지에 계좌가 함께 표시됩니다
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
- **명단 기억** — 참가자 이름·계좌를 기기(localStorage)에 저장해 다음 방문 때 다시 채움. 회차·금액은 저장하지 않음

### 오늘 뭐먹지

- 인원 · 매장/배달 · 장르(여러 개) · 1인 가격대 · 빼고 싶은 것(매운 것·날것) · 식사 시간(지금 시각으로 자동)을 고르면 메뉴를 추천
- 1순위 + 대안 2개. 대안을 누르면 1순위로 올라오고, "다시 뽑기"는 이미 보여준 메뉴를 빼고 뽑음
- 매장: 네이버지도 · 카카오맵 검색으로 연결 (API 키·위치 권한 없이, 지도 앱이 현재 위치 주변을 검색) / 배달: 메뉴명 복사
- "정산에 회차로 추가" → 정산 탭에 `2차 마라탕` 같은 회차가 생김

### 미니게임

- 무료 게임 5종: **룰렛 · 사다리 타기 · 폭탄 돌리기 · 해적룰렛(3D) · 악어이빨(3D)**. 폰 한 대를 돌려가며 하는 2~10명용 단판 게임
- 차례가 있는 게임(폭탄 · 해적 · 악어)은 시작 전에 **순서를 보여주고** 위/아래 · 섞기로 바꿀 수 있음. 게임 중에도 순서 줄에 지금 차례가 표시됨
- 사다리 타기: 당첨 칸 개수(1 ~ 인원-1)를 정함. 도착 칸에 도착한 사람 이름이 표시되고, 당첨 칸이 모두 밝혀지면 결과. 당첨이 여러 명이면 결과에 모두 표시하고 "정산에 추가"는 숨김. 인원과 상관없이 화면에서 같은 크기로 보임
- 해적룰렛: 나무 통을 좌우로 밀어 돌리고 구멍에 칼을 꽂음. 함정이면 해적(삼각모자 · 안대 · 수염 · 줄무늬 옷 · 갈고리 손)이 움츠렸다 튀어올라 한 바퀴 돌고 통 옆에 떨어짐. 결과는 착지가 끝난 뒤에 나옴. 칼은 가드까지 구멍에 꽂혀 손잡이만 밖으로 보임
- 악어이빨: 매끈한 초록 장난감 악어(둥근 돔 턱 · 빨간 입안 · 잇몸에 박힌 네모난 이빨 · 큰 눈). 이빨 수는 인원에 따라 13(~4명) · 16(~7명) · 18(~10명)개. 이빨은 앞쪽 ±115° 안에만 둬서(경첩 쪽 어금니 없음) 모두 잘 보이고 누르기 쉬움. 아래턱은 바닥에 닿는 받침이라 눌린 이빨이 밖으로 비치지 않음. 아픈 이빨이면 입을 더 크게 벌렸다가 쾅 닫히며 머리가 앞으로 튀어나오고, 표정이 사나워짐(찡그린 눈꺼풀 · 세로로 가늘어진 노란 눈 · 내려온 눈썹 · 벌름거리는 콧구멍 · 입 밖으로 드러난 지그재그 송곳니) + 화면 가장자리 빨간 번쩍임. 살짝 벌려 아픈 이빨(노랑)을 보여준 뒤 결과. 악어는 좌우로 밀어 ±70° 돌릴 수 있고(가려진 이빨은 눌리지 않음), 눈은 늘 보는 사람을 쳐다봄
- 3D 게임(해적 · 악어)은 두 손가락 핀치 · 마우스 휠 · ＋/－ 버튼으로 확대/축소
- 소리(기본 꺼짐, 게임 화면의 안내 버튼이나 🔊 토글로 켬 — 모두 WebAudio 합성음, 음원 파일 없음). 모든 소리가 마스터 볼륨 하나를 거쳐서 게임 중간에 켜고 꺼도 바로 반영됨: 룰렛 구분선이 바늘을 치는 "딱딱" 소리(원판이 느려지는 만큼 간격이 벌어짐) + 멈추면 "띵!", 폭탄 시계 "똑딱"(막판에 빨라지고 폭탄이 빨갛게 깜빡임) + 폭발 "펑!", 악어 심장박동·낮은 울림(이빨이 줄수록 빨라짐) + 이빨 누를 때 "딸깍"(배경음과 따로) + 물 때 플라스틱 턱이 맞부딪히는 "딱!", 사다리는 타는 동안만 실로폰 멜로디 + 통과 "띵동"/당첨 "빰빠밤", 해적 칼 "스으윽-턱" + 튀어나올 때 "펑!"과 굵고 낮은 아저씨 목소리 "으아악!"
- `sound-test.html` — 개발용 소리 테스트 페이지(모든 효과음을 버튼으로 재생, 오프라인 캐시에는 넣지 않음)
- 플레이가 시작되면 차례 표시가 화면 위에 오게 스크롤하고, 결과는 화면 아래쪽에서 시작해 마지막 장면(바늘 · 해적 · 악어 · 도착 칸)이 가려지지 않음
- 유료 게임 **터치 대결**(⚡, 구현 완료 · 결제 전까지 잠김): 2명이면 화면을 위아래로 나눠 마주 보고 누르는 땅따먹기(내 영역을 누를수록 넓어져 화면을 다 채우면 승리, 밀려난 사람이 당첨). 3명 이상이면 한 명씩 5초 연타해 가장 적게 누른 사람이 당첨(꼴찌 동점이면 그 사람끼리 재대결). 플레이 중에는 화면 전체를 덮는 판을 띄우고, 3·2·1 카운트다운 중 터치는 세지 않음
- 로컬 개발 서버(localhost)에서는 구현된 유료 게임을 결제 없이 열어 볼 수 있음(`entitlements.js`의 `devUnlock`) — 배포 사이트에서는 잠김
- 유료 예정 4종(🔒 곧 출시): 손가락 룰렛 · 업다운 숫자폭탄 · 10초 맞추기 · 동물 레이스
- **미니게임 결과** → **정산에 추가**: 게임 참가자 전원이 참여하고 당첨자가 결제한 회차(`N차 룰렛 게임`)가 생김 (금액만 넣으면 됨)
- 효과음(기본 꺼짐)·진동(지원 기기)

## 기술 스택

- **React 18** — `import`/`export`로 사용. `<script type="importmap">`이 `react` / `react-dom/client`를 jsdelivr ESM(`https://cdn.jsdelivr.net/npm/react@18.3.1/+esm` 등)으로 매핑합니다.
- **htm** — JSX를 대체하는 태그드 템플릿 리터럴. `htm.bind(React.createElement)`로 묶어 `src/lib/html.js`에서 내보냅니다. 브라우저에서 바로 실행되므로 트랜스파일러(Babel·Vite 등)와 `npm install`이 필요 없습니다. 문법은 JSX와 거의 같습니다: `html\`<div className=${styles.box}>${child}</div>\``, 컴포넌트는 `html\`<${Child} prop=${value} />\``.
- **html2canvas** — 정산 결과 DOM을 캔버스로 렌더링해 PNG로 저장하는 데 사용 (importmap으로 ESM 로드)
- **Three.js** — 해적룰렛·악어이빨 3D 장면. importmap 의 `three` 로 jsdelivr `+esm`(의존성 없는 단일 파일)을 가리키고, 두 게임을 열 때만 동적 `import("three")` 로 불러옴. 서비스 워커가 미리 캐시해 오프라인에서도 동작
- **Web Share API** (`navigator.share`) — 모바일에서 결과 이미지를 시스템 공유로 저장할 수 있도록 지원. 모바일에서는 기본적으로 결과 이미지를 큰 오버레이로 띄워 "길게 눌러 사진에 추가"로 저장하도록 안내하고, 공유가 가능하면 오버레이 안에 공유 버튼도 함께 제공합니다.
- **Pretendard** (헤드라인/본문), **Space Grotesk** (금액 숫자 전용) — `index.html`의 `<head>`에서 `<link rel="stylesheet">`로만 로드. 두 서체 모두 `0`에 사선·점이 없어 금액 표기가 깔끔합니다. 숫자에는 `font-variant-numeric: tabular-nums`로 자릿수를 정렬합니다.
- **PWA** — `manifest.webmanifest` + `sw.js`(서비스 워커)로 홈 화면 설치와 오프라인 실행 지원
- 순수 인라인 스타일 (별도 CSS 프레임워크 없음), 카드·버튼·입력창 등 사각형 요소는 4px 라운드 처리

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

`account`는 계산에는 쓰이지 않고, 정산 결과에서 그 사람이 돈을 받는 쪽(채권자)일 때만 수신자 이름 아래 표시됩니다. `showAccount`는 참가자 입력 목록에서 계좌 입력칸을 펼쳤는지 여부(UI 전용). 이름이 같은 참가자가 여러 명이어도 `computeFairTransactions`가 이름이 아니라 참가자 객체를 그대로 참조해 계좌를 붙이므로 서로 엇갈리지 않습니다.

모든 계산은 참가자 목록과 회차 목록, 이 두 가지 상태로부터 파생됩니다. 상태와 이벤트 핸들러, 파생 값은 `src/hooks/useSettlement.js`에, 아래 정산 알고리즘(순수 함수)은 `src/lib/settlement.js`에 있습니다.

`useSettlement`는 셸(`App.js`)에서 호출하므로 탭을 옮겨도 입력이 남고, 다른 탭은 `addRoundFrom({ title, payerId, amount, participantIds })`으로 회차를 넘깁니다. 아무것도 입력하지 않은 회차 하나만 있으면 그 회차를 대체합니다.

localStorage 키 (모두 `ddak:` 접두사, 접근 실패 시 저장 없이 동작): `roster`(명단) · `foodHistory`(최근 고른 메뉴 10개) · `sound`(효과음) · `entitlements`(유료 기능, 지금은 비어 있음)

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

## 오늘 뭐먹지 — 추천 알고리즘

메뉴 데이터(`src/lib/foodData.js`, 309개)는 가게가 아니라 **메뉴 단위**입니다. 메뉴마다 1인 가격대, 배달/매장 여부, 어울리는 인원, 식사 시간, 태그(매운·날것·국물·나눠먹기 등)를 가집니다. **4명 이상**이면 `PAIRS`(메인 → 곁들임)에서 어울리는 메뉴를 하나 골라 "이런 메뉴를 함께 먹으면 더 맛있어요"로 함께 추천합니다(치킨+피자/떡볶이, 삼겹살+냉면, 짜장면+탕수육, 족발+막국수 등 — 배달/매장 · 제외 태그를 지킴). 곁들임은 복사·정산 회차 이름(`1차 치킨 + 떡볶이`)에도 함께 들어갑니다. 알고리즘(`src/lib/food.js`)은 React 의존이 없는 순수 함수입니다.

1. **걸러내기** — 배달/매장과 제외 태그는 항상 지킴. 가격대(범위가 겹치는지)와 장르도 거름
2. **완화** — 결과가 0개면 가격대 → 장르 순으로 조건을 풀고, 무엇을 풀었는지 화면에 알림
3. **점수** — 인원이 어울리면 +2(아니면 −0.8), 4명 이상이면 나눠먹기 메뉴 +1, 식사 시간이 맞으면 +1.5, 최근에 고른 메뉴(최근 10개)는 −1.5
4. **가중 랜덤** — 점수 상위 절반(최소 8개) 안에서 점수²에 비례해 뽑음. 같은 조건이어도 매번 같은 답이 나오지 않음

"최근에 고른 메뉴"는 지도 열기·복사·정산 추가처럼 실제로 고른 경우에만 기록합니다.

## 미니게임 — 공정성

- 난수는 `crypto.getRandomValues` + 거절 샘플링(`src/lib/random.js`)으로 모듈로 편향이 없음
- 결과(당첨 칸·함정 구멍·아픈 이빨·폭발 시각)와 처음 순서는 **게임을 시작할 때 확정**하고, 애니메이션은 그 결과를 보여주기만 함. 3D 장면은 어느 구멍·이빨이 함정인지 모름
- 사다리는 같은 높이에서 가로줄이 이웃끼리 붙지 않아 항상 1:1로 도착. 사다리 자체는 출발 위치 근처에 도착하기 쉽지만, 💸 칸 위치를 따로 균등하게 섞으므로 누가 어느 이름을 골라도 당첨 확률은 1/n
- 폭탄은 15~45초 중 숨은 시각에 터지고(범위는 화면에 알리지 않음), 받은 뒤 0.8초는 넘기기가 잠김(연타 방지)

새 게임은 `({ players, onFinish(loserId) })` 규격의 컴포넌트를 만들어 `src/components/games/registry.js`에 한 줄 등록하면 됩니다.

## 유료화 준비

결제는 아직 붙이지 않았고, 붙일 자리만 만들어 두었습니다.

- `src/lib/entitlements.js` — `isPremium()` · `isAdFree()` · `canPlay(game)`. 유료 여부는 이 파일 한 곳에서만 판정
- `src/components/AdSlot.js` — 광고 자리 4곳(정산 결과 · 뭐먹지 결과 · 게임 목록 · 미니게임 결과 아래, 크기는 `AD_SLOTS`). 지금은 꺼져 있어 아무것도 그리지 않음. 주소에 `?adpreview`를 붙이면 자리만 점선으로 보여 배치를 확인할 수 있음. 광고 위치 검토와 배너·전면·보상형 광고를 넣는 조건은 `ADS_PLAN.md` 참고 (광고를 켜면 `privacy.html`의 "쿠키 및 추적"도 함께 고칠 것)
- 하단 탭바의 **NEW 뱃지**(뭐먹지 · 미니게임)는 `TabBar.js`의 `NEW_UNTIL`(2026-10-31)까지 보이고 그 뒤 저절로 사라짐
- 결제 수단 후보: ① TWA/Capacitor로 스토어에 올려 인앱결제 ② 서버리스 함수 1개 + 결제 승인. 둘 다 결제 뒤 `entitlements`만 기록하면 됨

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
- **`sw.js`** — 서비스 워커. 캐시 이름 `ddakjeongsan-v19`.
  - 설치 시: 같은 출처 파일(HTML 4종 + 매니페스트 + 아이콘·스크린샷 + `src/`의 앱 소스 전부)과 CDN(React·ReactDOM·scheduler·htm·html2canvas의 ESM + Pretendard·Space Grotesk CSS)을 캐시. CDN은 하나쯤 실패해도 설치가 진행됩니다.
  - 요청 처리: 페이지 이동과 우리 앱 파일(같은 주소의 `src/` JS·아이콘 등)은 네트워크 우선(실패 시 캐시 — 오프라인), 외부 CDN(버전이 URL에 고정)은 캐시 우선 + 백그라운드 갱신(stale-while-revalidate). 앱 파일을 캐시 우선으로 주면 고친 뒤 첫 실행에서 옛 파일과 새 파일이 섞여 모듈이 깨질 수 있어서 네트워크 우선으로 둔다.
  - **자원(HTML·`src/` JS·아이콘·매니페스트)을 바꾸면** `sw.js`의 `CACHE` 값을 `ddakjeongsan-v19`처럼 올려야 사용자 기기에서 새로 받습니다. `src/`·아이콘·스크린샷을 추가·삭제하면 `sw.js`의 `CORE` 목록도 함께 맞추고, vendor 버전을 바꾸면 `index.html`의 import map과 `sw.js`의 `VENDOR`를 함께 고쳐야 합니다.
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

## 법적 페이지 & 문의하기

푸터에 개인정보처리방침(`privacy.html`), 이용약관(`terms.html`), 문의하기(`contact.html`) 링크를 두었습니다. 문의하기는 Google 설문지로 연결됩니다. 다른 설문지로 바꾸고 싶다면 `contact.html` 안의 버튼 `href` 값만 교체하면 됩니다.

## 파일 구조

```
index.html                       # 앱 셸 — <head> 메타·폰트·전역 CSS(게임 키프레임 포함) + import map + <script type=module src=src/main.js>
src/
  main.js                        # 진입점 — createRoot 로 <App/> 마운트
  App.js                         # 앱 셸 — 해시 라우트로 화면 선택 + 하단 탭바. useSettlement 를 여기서 호출
  screens/
    SettleScreen.js              # 정산 탭
    FoodScreen.js                # 오늘 뭐먹지 탭
    GamesScreen.js               # 미니게임 탭 (게임 목록 · 플레이)
  lib/
    html.js                      # html = htm.bind(React.createElement)  (JSX 대체)
    util.js                      # won(금액 표기) · uid · makeParticipant · isMobileDevice
    settlement.js                # 정산 알고리즘 (순수 함수): computeStats · computeFairTransactions
                                 #                            · groupTransactions · buildResultText
    exportImage.js               # 결과 DOM → PNG 캡처(html2canvas) · 공유 · 다운로드
    storage.js                   # localStorage 래퍼 (ddak: 접두사, 실패해도 동작)
    router.js                    # 해시 라우터 (#/settle · #/food · #/games[/게임id])
    foodData.js                  # 메뉴 데이터 · 장르
    food.js                      # 메뉴 추천 알고리즘 (순수 함수) · 지도 검색 링크
    random.js                    # crypto 기반 randInt · randomFloat
    sfx.js                       # 효과음 · 게임별 소리(드럼롤 · 똑딱 · 으르렁 · 사다리 노래 · 칼 · 웃음, WebAudio 합성) · 진동 · 소리 설정
    josa.js                      # 이름 뒤 조사(이/가 · 은/는 …)
    entitlements.js              # 유료 기능 판정 (isPremium · isAdFree · canPlay)
  ui/
    styles.js                    # 인라인 스타일 객체 (styles)
  components/
    BrandLogo.js                 # 로고 SVG
    ParticipantsSection.js       # 참가자 이름 입력 목록
    RoundsSection.js             # 회차 입력 카드 목록 (+ 내부 RoundCard)
    SummarySection.js            # 계산 전 요약 (인원 · 회차 · 총액)
    ResultReceipt.js             # 이미지로 캡처되는 결과 영역 (forwardRef)
    ImagePreviewOverlay.js       # 모바일 저장용 오버레이
    SiteFooter.js                # 하단 링크
    TabBar.js                    # 하단 고정 탭바
    ReceiptCard.js               # 영수증 카드 틀 + 화면 헤더
    icons.js                     # 탭·헤더 아이콘 (포크·나이프, 주사위)
    ChipGroup.js                 # 칩 선택 (단일/여러 개)
    AdSlot.js                    # 광고 자리 (지금은 꺼짐) — 계획은 ADS_PLAN.md
    food/                        # FoodForm(조건 입력) · FoodResult(추천 결과)
    games/
      registry.js                # 게임 목록 (무료 5 · 유료 예정 4)
      RouletteGame.js · LadderGame.js · BombGame.js · PirateGame.js · CrocodileGame.js
      TurnOrder.js               # 차례 정하기(위/아래 · 섞기) · 게임 중 순서 줄
      GameResult.js              # 미니게임 결과 · 정산에 추가
      three/
        stage.js                 # Three.js 지연 로딩 · 조명/그림자 · 탭/드래그 · 카메라 흔들림/이동 · 트윈
        ThreeView.js             # 3D 장면 칸 (불러오는 중 · 실패 표시, 사라질 때 정리)
        pirateScene.js           # 해적 통 · 칼 · 해적 모델과 발사 연출
        crocScene.js             # 악어 모델 · 이빨 누르기 · 입 닫기 연출
      common.js · palette.js     # 차례 표시 · 큰 버튼 · 플레이어 색
  hooks/
    useSettlement.js             # 모든 상태 · 파생 값 · 이벤트 핸들러
privacy.html                     # 개인정보처리방침
terms.html                       # 이용약관
contact.html                     # 문의하기 (Google 설문지로 연결)
manifest.webmanifest             # PWA 매니페스트
sw.js                            # 서비스 워커 (오프라인 캐시)
favicon.svg                      # 브라우저 탭 아이콘 (영수증 + 체크 로고)
apple-touch-icon.png             # iOS 홈 화면 아이콘 (180px)
icons/                           # PWA 아이콘 (any 192·512 / maskable 192·512)
screenshots/                     # 매니페스트 screenshots (설치 UI용, narrow)
prototype/receipt-ocr.html       # 영수증 OCR 검토용 프로토타입 (앱 본체와 분리)
```

`src/`는 표준 ES 모듈이라 `import`/`export`로 서로를 참조하고, 브라우저 모듈 로더가 `src/main.js`에서 시작해 그래프 전체를 해석합니다.

## 실행 방법

- **로컬 실행**: 빌드는 없지만 모듈이 `fetch`로 로드되므로 정적 서버가 필요합니다. 프로젝트 폴더에서:
  ```sh
  python3 -m http.server 8000      # 또는:  npx serve
  ```
  그 다음 `http://localhost:8000` 접속. (`index.html`을 `file://`로 바로 열면 모듈이 로드되지 않아 화면이 비어 있습니다.)
- **React 프로젝트에 통합**: `src/`가 이미 표준 ES 모듈이므로 그대로 가져다 쓸 수 있습니다. 번들러 환경에서는 `src/lib/html.js`를 프로젝트의 `htm` + `react`로 바꾸거나, htm 대신 JSX로 다시 쓰면 됩니다. `src/lib/settlement.js`(순수 함수)는 아무 의존성 없이 재사용 가능합니다.

## 배포

GitHub Pages, Netlify, Vercel 등 정적 파일 호스팅 서비스 어디에나 폴더 전체(HTML 4종 + `src/` + `manifest.webmanifest` + `sw.js` + `favicon.svg` + `apple-touch-icon.png` + `icons/`)를 그대로 올리면 바로 배포됩니다. 폴더 구조를 유지해야 상대 경로가 맞습니다. (호스팅은 HTTP로 서빙하므로 로컬과 달리 별도 서버 준비가 필요 없습니다.)

1. GitHub 저장소 생성 후 위 파일들을 폴더 구조 그대로 업로드 (필요하면 `contact.html`의 설문지 `href`를 원하는 링크로 교체)
2. Settings → Pages → Source를 `main` 브랜치 `/ (root)`로 설정
3. `https://아이디.github.io/저장소이름`으로 접속
4. **HTTPS 필수**: 서비스 워커와 Web Share API는 보안 컨텍스트에서만 동작합니다. GitHub Pages·Netlify·Vercel은 HTTPS를 기본 제공하므로 추가 설정이 없습니다.
5. 확인: 배포 URL을 크롬으로 열고 DevTools → Application 탭에서 Manifest·Service Workers·Cache Storage가 잡히는지, Lighthouse의 PWA 항목이 통과하는지 봅니다. 모바일에서는 브라우저 메뉴의 "홈 화면에 추가"로 설치해 standalone 실행을 확인합니다.

## 라이선스

개인/포트폴리오용으로 자유롭게 사용 가능합니다.
