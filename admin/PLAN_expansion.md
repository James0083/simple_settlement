# 딱정산 확장 계획 — "오늘 뭐먹지" + "몰아주기 미니게임"

## 진행도 (2026-09-29 기준)

| 항목 | 상태 |
|---|---|
| Phase 0 — 앱 셸 (라우팅 · 명단 공유 · 넘기기) | ✅ 완료 |
| Phase 1 — 오늘 뭐먹지 (`#/food`) | ✅ 완료 |
| Phase 2 — 미니게임 5종 (룰렛·사다리·폭탄·해적·악어) | ✅ 완료 |
| Phase 3 — 수익화 준비 (entitlements, AdSlot, 유료 카드) | ✅ 완료 |
| 마무리 (sw.js · manifest · privacy · README) | ✅ 완료 |
| 실제 iOS/Android 기기 확인 (safe-area · 진동 · 효과음 · 지도 딥링크) | ❌ 미완 |
| 유료 게임 4종 구현 + 결제 수단 결정 | ❌ 미완 — 트래픽 확인 후 |

---

> **진행 상황 (2026-09-28)**: Phase 0 · 1 · 2 · 3 · 마무리 구현 완료. 남은 것: 실제 iOS/Android 기기 확인(아래 "기기 확인 필요"), 유료 게임 4종 구현 + 결제 수단 결정.
>
> **계획과 달라진 점**
> - `useRoster` 훅을 따로 두지 않고, 정산 참가자 목록(`useSettlement`의 participants)을 그대로 공유 명단으로 쓰며 저장만 붙임 — 명단이 두 곳에 생기는 동기화 문제를 피하려고
> - 게임 레지스트리는 `src/lib/games.js`가 아니라 `src/components/games/registry.js` (컴포넌트를 참조하므로)
> - 식사 시간은 걸러내기가 아니라 점수 가산으로만 씀 → 완화 단계는 가격대 → 장르 두 단계
> - 배달앱 바로 열기 링크는 넣지 않고 "메뉴명 복사"만 둠 — 앱 스킴은 기기 없이는 확인할 수 없고, 앱이 없으면 iOS에서 오류 창이 뜸
> - `entitlements.js`(유료 판정)는 게임 목록이 바로 필요로 해서 Phase 2 때 함께 만듦
>
> **2026-09-28 추가 변경 (사용자 요청)**: 결과 제목 "내기 결과", 결과 이미지 저장 제거, 정산에 추가 = 당첨자를 결제자로(참여자는 게임 참가자 전원). 폭탄·해적·악어에 순서 정하기 화면. 해적룰렛·악어이빨을 Three.js 3D 로 다시 구현(게임을 열 때만 불러옴). 폭탄 뚜껑 위치 수정, 넘기기 버튼 확대. 룰렛 7초, 사다리 그리기 2.6초.
>
> **기기 확인 필요**: safe-area(아이폰 홈 인디케이터), 진동(Android), 효과음, 네이버지도·카카오맵 앱 연결, 모바일 이미지 저장 오버레이(게임 결과)

## Context
딱정산은 지금 정산 한 가지만 하는 무빌드 정적 웹앱(React 18 + htm ESM, importmap, 인라인 스타일, PWA)입니다. 친구들 모임에서 **메뉴 정하기 → 먹기 → 누가 낼지 내기 → 정산**까지 한 앱에서 끝나도록 기능을 넓힙니다. 제약: **백엔드 없음**(정적 호스팅 + localStorage만 사용). 정한 방향:
- 위치는 **메뉴 추천 + 지도 딥링크**로 처리 (API 키·위치 권한 없음, 오프라인에서도 추천 가능)
- **하단 탭바 + 해시 라우팅** (`#/settle`, `#/food`, `#/games`) — index.html 하나, PWA 구조 그대로
- **참가자 명단 공유 + 결과 넘기기** — 게임에서 걸린 사람을 정산 회차로 바로 추가

---

## Phase 0 — 앱 셸 (라우팅 · 명단 공유 · 넘기기)

**새 파일**
- `src/lib/storage.js` — `load(key, fallback)` / `save(key, value)`. `ddak:` 접두사, 모든 접근을 try/catch로 감쌈 (시크릿 모드에서도 앱이 멈추지 않게)
- `src/lib/router.js` — `useHashRoute()`: `hashchange`를 구독하고 `{ route, navigate }`를 돌려줌. 기본값은 `settle`, 모르는 해시는 `settle`로 보냄
- `src/hooks/useRoster.js` — 공유 명단 `[{ id, name, account }]`을 `ddak:roster`에 저장. 세 화면이 같이 씀
- `src/components/TabBar.js` — 하단 고정 탭 3개(정산 · 뭐먹지 · 내기). `env(safe-area-inset-bottom)`를 반영하고 탭 버튼은 44px 이상
- `src/screens/SettleScreen.js` — 지금 `App.js` 본문(참가자~결과)을 그대로 옮김

**수정**
- `src/App.js` → 셸로 바꿈. `useSettlement()`를 **셸에서 호출**해 탭을 옮겨도 정산 입력이 남도록 하고(화면이 unmount돼도 상태 유지), 라우트에 따라 화면을 고르고 `TabBar`를 그림
- `src/hooks/useSettlement.js`
  - 첫 참가자 목록을 roster에서 가져옴(비어 있으면 빈 칸 3개, 지금과 같음). 참가자 이름·계좌가 바뀌면 roster에 다시 저장
  - 넘기기 API 추가: `addRoundFrom({ title, payerId?, amount?, participantIds })` — 회차 하나를 추가하고 `invalidate()`
- `index.html` — `viewport-fit=cover`, 탭바·게임용 `:hover`/`@keyframes`(wheelSpin 대신 transition, pirateJump, crocSnap, shake). `prefers-reduced-motion`이면 애니메이션을 줄임
- `src/ui/styles.js` — `page`에 `paddingBottom`(탭바 높이 + safe-area), `tabBar`/`tabItem` 스타일. 기존 토큰(#1A1D29, #E8503A, #0F9D64, 4px 라운드, Space Grotesk 숫자)을 그대로 씀

---

## Phase 1 — 오늘 뭐먹지 (`#/food`)

**데이터** `src/lib/foodData.js` — 메뉴 80개 안팎. 가게가 아니라 **메뉴 단위**로 둠
```js
{ id, name: "마라탕", emoji, genre: "chinese",
  price: [10000, 15000],           // 1인 기준
  delivery: true, dineIn: true,
  group: [1, 6],                    // 어울리는 인원
  meals: ["lunch","dinner","late"],
  tags: ["spicy","soup"] }          // spicy / raw / meat / soup / light / share / drink
```
장르: 한식 · 중식 · 일식 · 양식 · 분식 · 아시안 · 고기/구이 · 패스트푸드 · 술안주

**입력 UI** `src/screens/FoodScreen.js` (+ `src/components/food/*`)
- 인원(스테퍼, 기본값 = roster 인원) · 장르(칩 여러 개 선택, 안 고르면 전체) · 1인 가격대(~1만 / 1–2만 / 2–3만 / 3만+) · 배달 / 매장 · 제외(매운 것, 날것) · 식사 시간(지금 시각으로 자동, 바꿀 수 있음)

**알고리즘** `src/lib/food.js` (순수 함수, React 의존 없음)
1. **걸러내기**: 장르, 배달/매장, 가격 범위 겹침, 제외 태그
2. **점수 매기기**: 인원이 `group` 범위 안이면 +, 4명 이상이면 `share` 태그 +, 식사 시간이 맞으면 +, **최근 추천 기록**(`ddak:foodHistory`, 최근 10개)에 있으면 −
3. **가중 랜덤**: 상위 N개 중에서 점수 비례로 뽑음 → 1순위 + 대안 2개. "다시 뽑기"하면 방금 나온 것은 뺌
4. **결과가 0개면 조건을 차례로 완화**(가격 → 식사 시간 → 장르). 무엇을 풀었는지 문구로 알려줌 ("가격대를 넓혀서 찾았어요")
- `recommend(input, data, rng)`처럼 rng를 주입받아 테스트할 수 있게 함

**결과 카드 동작**
- 매장: "근처에서 찾기" → 네이버지도 `https://map.naver.com/p/search/{근처 메뉴}` · 카카오맵 `https://map.kakao.com/?q={메뉴}` (새 탭)
- 배달: "메뉴명 복사" + 배달앱 열기 링크(동작하는 스킴은 구현할 때 기기에서 확인하고, 안 되면 복사만 남김)
- "정산에 회차로 추가" → `addRoundFrom({ title: "1차 마라탕", participantIds: 전원 })` 후 `#/settle`로 이동

---

## Phase 2 — 몰아주기 미니게임 (`#/games`)

**공통 구조**
- `src/lib/random.js` — `crypto.getRandomValues` 기반 `randInt(n)` (공정성)
- `src/lib/games.js` — **게임 레지스트리** `[{ id, name, emoji, desc, minPlayers, tier: "free" | "premium", component }]`. 이후 게임 추가 = 한 줄 등록
- `src/screens/GamesScreen.js` — ① 게임 고르기 카드 → ② 플레이어 확인(roster, 2–10명, 이 게임에서만 빼기 가능) → ③ 플레이 → ④ 결과
- `src/components/games/GameResult.js` — "💸 {이름} 당첨!" 도장 연출(기존 `stampIn` 재사용), **다시하기**, **이미지 공유**(`src/lib/exportImage.js`의 `captureToPng` · `ImagePreviewOverlay` 재사용), **정산에 추가**
  - 정산에 추가 = `addRoundFrom({ title: "N차 몰아주기(룰렛)", payerId: 당첨자, participantIds: 게임 참가자 전원 })` → 금액만 넣으면 됨 (2026-09-28 사용자 요청으로 변경)
- 결과는 **게임 시작 시점에 확정**(함정 위치 / 당첨 칸)하고, 애니메이션은 그 결과를 보여주기만 함. 끝나면 함정 위치를 공개
- 폰 한 대를 돌려 쓰는 턴제. 화면 상단에 "지금 차례: {이름}". 진동(`navigator.vibrate`, 지원 기기만)
- 사운드는 WebAudio 짧은 효과음, 기본 꺼짐, 음소거 토글

**무료 게임 5종**
1. **룰렛** `RouletteGame.js` — SVG 원판(이름 수만큼 조각, 기존 팔레트 순환). 당첨 인덱스를 먼저 정하고 `rotate(5바퀴 + 목표 각도)`를 cubic-bezier로 4초간 돌림. 턴 없이 한 번에 끝남
2. **해적룰렛** `PirateGame.js` — 통에 구멍 16–24개(인원에 맞춰 조절), 함정 1개. 차례대로 구멍을 탭해 칼을 꽂음 → 함정이면 해적이 튀어나옴(`pirateJump` + 흔들림) → 그 사람 당첨
3. **악어이빨** `CrocodileGame.js` — 이빨 10–12개, 나쁜 이빨 1개. 차례대로 누름 → 걸리면 입이 닫힘(`crocSnap`) + 진동 → 당첨
4. **폭탄 돌리기** `BombGame.js` — 시작하면 숨은 폭발 시간(15–45초, 시작 때 확정)이 정해짐. 화면에 "지금 폭탄: {이름}"과 큰 **넘기기** 버튼. 누르면 다음 사람에게 넘어가고 폰도 넘김. 째깍 소리·흔들림이 갈수록 빨라짐(남은 시간은 숨김) → 폭발 순간 들고 있던 사람 당첨. 넘기기 연타를 막으려고 받은 뒤 0.8초 동안은 넘길 수 없음
5. **사다리 타기** `LadderGame.js` — 위에 이름 N개, 아래 결과 N칸(기본 "당첨" 1 + "통과" N−1, 결과 문구는 바꿀 수 있음: 예 "커피", "2차 계산"). 가로줄을 무작위로 만들고, 결과를 가린 채 이름을 탭하면 경로를 SVG path로 따라 그림. "전체 공개" 버튼 제공. 당첨이 1명일 때만 "정산에 추가" 버튼이 켜짐
- 그림은 전부 인라인 SVG + CSS로 그림 (이미지 파일·라이브러리 추가 없음 → 오프라인 캐시 부담 없음)

---

## Phase 3 — 수익화 준비 (결제는 아직 구현 안 함)
- `src/lib/entitlements.js` — `isPremium()`, `isAdFree()`, `canPlay(game)`. 지금은 항상 free만 열림. localStorage 플래그 한 곳에서 결정하므로 나중에 결제 수단만 붙이면 됨
- 게임 선택 화면에 **유료 게임 4종을 "곧 출시 🔒" 카드로 등록**(레지스트리 `tier: "premium"`, `component: null`). 카드를 누르면 "곧 열려요" 안내만 띄움. 수요 확인용
  1. **손가락 룰렛** — 모두 화면에 손가락을 올리면(멀티터치 `pointerdown`/`pointerup`) 3초간 변화가 없을 때 1명을 선택. 손가락을 떼면 다시 3초를 기다림. 등록된 명단이 필요 없음(정산에 넘길 때만 이름을 고름)
  2. **업다운 숫자폭탄** — 1~100 중 숨은 숫자 하나. 차례로 숫자 입력 → 범위가 좁혀짐(업/다운) → 숨은 숫자를 부른 사람 당첨
  3. **10초 맞추기** — 차례로 시작/정지. 초시계는 3초 뒤에 가려짐. 10.00초와의 차이가 가장 큰 사람 당첨. `performance.now()`로 잼
  4. **동물 레이스** — 각자 동물 하나. 순위를 시작 때 확정하고 속도에 무작위 흔들림을 줘 역전 연출 → 꼴찌 당첨
- 이 4종은 게임 모듈 규격(`{ players, rng, onFinish(loserId) }`)만 맞추면 되므로, 결제 기능을 붙일 때 하나씩 구현해 `component`만 연결함
- `src/components/AdSlot.js` — 결과 화면 아래 광고 자리. 지금은 아무것도 그리지 않음(`isAdFree()`일 때도 숨김). 나중에 AdSense 등을 넣을 지점
- 결제 수단은 나중에 따로 정함: 백엔드 없이 가능한 선택지는 ① TWA/Capacitor로 스토어에 올려 인앱결제, ② 서버리스 함수 1개 + 토스페이먼츠 결제 승인. 이번 범위에서는 인터페이스만 만듦

---

## 공통 마무리
- `sw.js` — `CACHE`를 `ddakjeongsan-v5`로 올리고, 새로 만든 `src/` 파일을 전부 `CORE`에 추가
- `manifest.webmanifest` — `description`에 새 기능 반영, `categories`에 `food`, `entertainment` 추가, `shortcuts` 3개(정산/뭐먹지/내기 → 각 해시 라우트)
- `privacy.html` — "참가자 이름·계좌, 최근 추천 메뉴를 **기기 안(localStorage)에만** 저장하고 서버로 보내지 않음" 문구 추가, 삭제 방법 안내
- `README.md` — 기능, 데이터 구조, 파일 구조, 추천 알고리즘 설명 갱신
- 정산 탭의 헤더·로고는 그대로 두고, 다른 탭은 같은 영수증 카드 레이아웃에 각자 제목을 둠

## 구현 순서
Phase 0 → 1 → 2(룰렛 → 사다리 → 폭탄 → 해적 → 악어) → 3 → 마무리. 단계마다 동작하는 상태로 끝냄.

## 검증
- `python3 -m http.server 8000` → Chrome에서 `#/settle`, `#/food`, `#/games`
- **정산이 그대로 되는지**: 기존 흐름(참가자 → 회차 → 계산 → 복사 / 이미지 저장). 탭을 옮겼다 와도 입력이 남는지. 새로고침 후 명단이 남는지
- **추천 알고리즘**: `node --input-type=module -e "import('./src/lib/food.js')…"`로 조건 조합별 결과 확인 — 걸러내기 위반 0건, 결과 0개 시 완화 동작, 다시 뽑기 중복 없음
- **공정성**: `randInt(n)` 10만 회 돌려 분포가 균등한지 확인
- **게임**: 인원 2 / 5 / 10명으로 무료 5종 끝까지 진행(사다리는 가로줄이 경로를 1:1로 대응시키는지, 폭탄은 폭발 시간이 범위 안인지 확인). 유료 카드 4개가 잠겨 보이는지 확인 → 결과 → "정산에 추가" → 정산 탭에 회차가 생기고 결제자·금액을 넣어 송금 결과 확인
- **모바일**: Chrome headless 390px 폭 스크린샷(탭바가 겹치지 않는지, 가로 스크롤 없음). 실제 iOS / Android에서 safe-area, 진동, 지도 딥링크 확인
- **PWA**: DevTools → Application에서 SW v5 활성화 → 오프라인으로 새로고침해 세 탭 모두 동작하는지 확인
