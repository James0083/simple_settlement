# 미니게임 "숨바꼭질" 구현 계획 (2인용 — 졸라맨 숨기기 대결)

## 진행도

| 항목 | 상태 |
|---|---|
| 계획 작성 | ✅ 완료 (2026-10-21) |
| Phase 0 — 게임판에 "정원 고정" 지원 추가 | ✅ 완료 — `playersOkFor` 는 인원 상수 옆 `registry.js` 에 둠 |
| Phase 1 — 게임 모듈(`HideSeekGame.js`) | ✅ 완료 — `intro`(선공 무작위 공개) → `gate`/`place` ×2 → `attackGate`/`attack`/`feedback` 반복 → `done` |
| Phase 2 — 보드 그리드 스타일 | ✅ 완료 — `bs*` 스타일, 전용 아이콘 `HideSeekIcon` 추가 |
| Phase 3 — 등록·문서 | ✅ 완료 — `releaseAt: "2026-11-02"`, guide · APP_INFO · README · 버전정보 v2.9.0 |

검증(2026-10-21, 360·390px 브라우저 자동 테스트 16항목 통과): 3명 진입 차단 안내, 숨기기 토글 · 8개 초과 불가 · 미달 시 완료 비활성, 중복 공격 차단, 전멸까지 완주, 양쪽 판 공개, "정산에 추가"로 진 사람이 결제자인 회차 생성, 칸 46px(390px) · 가로 스크롤 없음.

## Context
사용자가 공유한 릴스(2인 카페 놀이) 규칙을 디지털 미니게임으로 옮기는 계획. 원작은 종이 기반:

1. **준비하기** — 종이를 반으로 접어 각자 자기 구역에 졸라맨(사람 모양) 10명을 원하는 위치에 자유롭게 그림
2. **공격하기** — 종이를 접은 채 상대 졸라맨이 있을 법한 위치를 예상해 자기 구역에 틴트(립틴트)로 점을 찍음
3. **확인하기** — 종이를 반으로 접어 틴트를 반대편에 묻힌 뒤 펼쳐서 상대 졸라맨이 틴트에 명중했는지 확인
4. **승리하기** — 한 턴씩 번갈아 공격을 주고받고, 상대 졸라맨을 먼저 전멸시키는 사람이 승리

즉 본질은 **배틀쉽(전함 게임)**과 같은 구조 — 자기 말을 숨기고, 서로 번갈아 상대 말의 위치를 추측해 맞히는 게임. 종이의 "자유 배치 + 틴트 전사"는 아날로그 특유의 방식이라, 디지털로 옮길 때는 좌표가 있는 **격자(그리드)** 로 바꾸고 전사 과정 없이 공격 즉시 명중/빗나감을 판정하면 된다.

이 저장소는 이미 미니게임 탭(`src/games/`)에 10종이 들어 있는 레지스트리 기반 프레임워크가 있고(`src/games/registry.js`), 게임 컴포넌트 규격 `({ players: [{id,name}], onFinish(loserId|loserIds[]), onTie? })` 에 맞추면 참가자 선택 · 결과 화면 · "정산에 추가" · "한 판 더"가 전부 `GamesScreen.js`/`GameResult.js`에서 공통으로 처리된다. 가장 가까운 기존 패턴 두 가지를 그대로 재사용한다:

- **`TapBattleGame.js`**: `players.length === 2`일 때 완전히 다른 전용 UI(`Duel`)로 분기하는 전례 — 이번 게임도 2인 전용 로직을 게임 컴포넌트 안에 그대로 넣으면 됨
- **`UpDownGame.js`**: "다른 분들은 화면을 보지 않도록 해주세요" + `TurnBanner` + "준비됐어요" 버튼으로 막았다가 공개하는 **비공개 입력 패턴** — 말 배치와 공격 모두 상대가 보면 안 되므로 그대로 재사용

(원격 최신 상태 확인: `git fetch` 결과 `origin/master`는 `39faaba`(SEO 가이드 보강)까지 올라와 있고, Vite 빌드 전환(v2.7.0)·앱인토스 빌드(#platform 분기)·정산 v2.8.1까지 반영된 상태. 이 계획은 그 위에서 진행한다.)

## 디지털 변환 설계

### 그리드·말 개수 (조정 가능한 상수로 둠)
- `GRID_SIZE = 6` (6×6 = 36칸), `FIGURE_COUNT = 8` 을 시작값으로 제안. 원작은 10명이지만, 10×10 배틀쉽처럼 넓은 보드가 아니라 손바닥만한 모바일 화면이라 칸이 너무 작아지면(390px 폭 ÷ 7 ≈ 55px, ÷ 8 ≈ 48px) 탭 오차가 커진다. 6×6·8개(밀도 22%)면 44px 이상의 탭 타깃을 유지하면서도 원작처럼 "꽤 빽빽하게 숨긴다"는 긴장감이 남는다.
- 두 값 모두 `src/games/HideSeekGame.js` 상단에 이름 붙은 상수로 둬서, 실제 기기로 확인하면서(검증 항목 참고) 쉽게 조정한다.

### 상태 모델
```
boards  = { 0: Set("r,c"), 1: Set("r,c") }        // 플레이어별 자기 말 위치 (배치 단계에서 채움)
guesses = { 0: Map("r,c" -> "hit"|"miss"), 1: ... } // 플레이어별 "내가 상대에게 쏜" 공격 기록
```
공격한 칸의 좌표가 상대 `boards`에 있으면 hit, 없으면 miss. 한쪽의 hit 개수가 `FIGURE_COUNT`에 닿으면 그 보드의 주인이 패배(`onFinish`의 대상).

## Phase 0 — 게임판에 "정원 2명 고정" 지원 추가
지금 프레임워크는 모든 게임이 `MIN_PLAYERS=2`~`MAX_PLAYERS=15`(`src/games/registry.js`)를 공유한다. `TapBattleGame`처럼 인원별 분기는 컴포넌트 안에서 하지만, 숨바꼭질은 3명 이상이면 게임 자체가 성립하지 않으므로(상대가 2명 이상이면 "누구 보드를 공격 중인지" 구조가 아예 달라짐) **정확히 2명**으로 아예 막아야 한다.

- `registry.js`: 해당 게임 항목에 `exactPlayers: 2` 필드 추가(다른 게임은 생략하면 기존과 동일하게 동작)
- `src/games/GamesScreen.js`:
  - `countOk` 단일 불리언(현재 `players.length >= MIN_PLAYERS && <= MAX_PLAYERS`)을 게임별로 판정하는 `playersOkFor(game, list)` 헬퍼로 교체
    ```js
    const playersOkFor = (g, list) =>
      g.exactPlayers ? list.length === g.exactPlayers
                     : list.length >= MIN_PLAYERS && list.length <= MAX_PLAYERS;
    ```
  - 두 사용처만 고치면 됨: (1) 상단 라우트 가드 `if (game && canPlay(game) && game.component && countOk)` → `playersOkFor(game, players)`로, (2) `openGame(g)` 안의 안내 문구 분기 → 인원이 안 맞으면 `"이 게임은 정확히 2명이 필요해요 (현재 ${players.length}명)"` 같은 전용 메시지 추가

## Phase 1 — 게임 모듈 `src/games/HideSeekGame.js`
`phase` 상태 기계로 구성 (다른 게임들과 동일한 스타일):

`order`(선공 정하기) → `placeP1`(배치) → `placeP2`(배치) → `attack`(번갈아 공격, 내부적으로 현재 턴 플레이어만 바뀜) → `done`

- **선공 정하기**: 2명뿐이라 `TurnOrderSetup` 전체는 과함 — `shuffle([0,1])`로 조용히 정하거나, 간단한 동전 던지기 연출(기존 `randInt`/`shuffle` 재사용, `src/games/random.js`) 정도로 충분
- **배치 단계** (플레이어마다 한 번씩): `TurnBanner` + `styles.privacyNote`("다른 분은 보지 마세요") + "준비됐어요" 버튼(`BigButton`)으로 게이트 → 누르면 빈 `GRID_SIZE × GRID_SIZE` 그리드 노출. 칸을 탭하면 내 말 토글(이미 찍었으면 해제), `FIGURE_COUNT`개를 다 채워야 "배치 완료" 버튼이 활성화. 완료하면 폰을 다음 사람에게 넘기라는 안내와 함께 다음 phase로
- **공격 단계**: 마찬가지로 `TurnBanner` + `privacyNote` + "준비됐어요" 게이트 → 공개되는 건 **상대 보드가 아니라 "내가 상대에게 쏜 공격 기록" 그리드**(이미 공격한 칸은 명중/빗나감 표시, 나머지는 빈칸이라 탭 가능) → 칸 탭 → 판정 → `UpDownGame`의 feedback 화면 패턴 재사용(이모지 + "명중!"/"빗나감" 문구 + 상태 줄 `"상대 말 N개 중 M개 찾음 · 내 말 N개 중 K개 들킴"` + "다음 차례로" 버튼) → 차례를 상대로 넘김
- **종료 판정**: 공격 직후 상대 보드의 hit 개수가 `FIGURE_COUNT`에 도달하면 그 즉시 `done`으로 — 동점이 날 수 없는 구조라 `onTie`는 불필요
- **결과 화면**(`done`): 양쪽 보드를 전부 공개(말 위치 + 명중/빗나감 전부 표시)하고 "O번 만에 전멸" 같은 요약 한 줄 → `GAME_FINISH_MS` 뒤 `onFinish(패배자.id)`(다른 게임과 동일하게 결과 연출 후 한 번만 호출)

## Phase 2 — 보드 그리드 스타일
`src/shared/styles.js`에 새 토큰 추가 — 이미 있는 `foodListGrid`/`fingerSheetGrid`(CSS Grid `repeat(N, 1fr)`) 패턴을 그대로 따름:
- `bsBoard`: `display: grid; grid-template-columns: repeat(GRID_SIZE, 1fr); gap: 4px` (칸 수는 인라인으로 주입)
- `bsCell` / `bsCellPlaced`(배치 단계에서 내 말) / `bsCellHit`(명중, `C_RED` 계열) / `bsCellMiss`(빗나감, `C_MUTED` 계열 점) / `bsCellEmpty`
- 말 표시는 이모지로 충분(예: 배치 중엔 🧍, 명중엔 💥, 빗나감엔 가운데 점) — 새 이미지 자산 불필요, 오프라인 캐시 부담 없음(다른 게임들의 "그림은 인라인 SVG/이모지로" 원칙과 동일)
- `src/games/gameIcons.js`에 전용 아이콘을 추가할지는 선택 사항 — 생략하면 레지스트리의 `emoji`(예: `🕵️`)가 카드에 그대로 쓰임

## Phase 3 — 등록 및 마무리
- `src/games/registry.js`에 등록 (이름·공개 시점은 제안값, 확정 전 확인 필요):
  ```js
  { id: "hideseek", name: "숨바꼭질", emoji: "🕵️", desc: "말을 숨기고 상대 말을 먼저 다 찾으면 승리",
    component: HideSeekGame, exactPlayers: 2 }
  ```
  기존 게임들처럼 `releaseAt`으로 다음 월요일 주간 공개에 태울지, 바로 열어둘지는 선택 사항(지금 레지스트리는 `race`까지 10/26 공개가 예약되어 있어, 이어서 넣으려면 그 다음 월요일로)
- `guide/games.html`에 규칙 설명 추가 (다른 9종과 같은 형식)
- `README.md` 주요 기능 목록의 게임 개수(현재 "10종")와 `APP_INFO.md`를 갱신, `release-notes.html`에 새 버전 항목 추가
- `sw.js`의 `CORE`/`CACHE`는 Vite 빌드가 자동 생성하므로(v2.7.0 이후) 손으로 건드릴 파일이 아님 — 새 파일을 추가해도 `npm run build`만 다시 돌리면 반영됨

## 구현 순서
Phase 0 → Phase 1(그리드 크기는 2×2 같은 더미 값으로 먼저 상태 흐름·승리 판정부터 검증) → 실제 `GRID_SIZE`/`FIGURE_COUNT`로 Phase 2 스타일 적용 → Phase 3

## 검증
- `npm run dev`로 로컬 구동, 참가자 2명으로 "숨바꼭질" 선택 → 배치 2회(각자 비공개로) → 공격 번갈아 진행 → 한쪽 전멸까지 완주 → 결과 화면에서 양쪽 보드가 맞게 공개되는지, "정산에 추가"로 패배자가 결제자인 회차가 생기는지 확인
- 참가자 3명 이상을 고르고 이 게임 카드를 누르면 "정확히 2명이 필요해요" 안내가 뜨고 진입이 막히는지 확인(Phase 0 검증)
- 모바일 폭(360px·390px) 스크린샷으로 그리드가 가로 스크롤 없이 들어가는지, 셀 탭 타깃이 44px 안팎인지 확인 — 좁으면 `GRID_SIZE`를 낮추는 쪽으로 재조정
- 배치 단계에서 같은 칸을 다시 탭하면 토글(해제)되는지, `FIGURE_COUNT` 미만일 때 "배치 완료" 버튼이 비활성인지 확인
- 공격 단계에서 이미 공격한 칸은 다시 탭해도 무시되는지(중복 공격 방지) 확인
