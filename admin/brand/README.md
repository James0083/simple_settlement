# admin/brand — 딱정산 컬러 팔레트 (홍보 · 브랜드 디자인용)

딱정산 앱에 실제로 쓰인 색을 홍보물 · 브랜드 디자인에 쓰기 좋게 여러 파일 형식으로 뽑아 둔 폴더입니다.
배포되지 않습니다(`admin/` 은 `vite.config.js` 의 `STATIC` 에 없음).

## 한 줄 요약

- **원본은 앱 코드**다: `src/shared/styles.js`(`C_RED` 등 브랜드 · 회색 · 상태 색)와 `src/games/palette.js`(미니게임 플레이어 15색).
- 이 README 를 뺀 파일은 모두 **`build-palette.mjs` 하나가 만든다.** 결과 파일을 손으로 고치지 않는다.
- 앱 색을 바꾸면 → `build-palette.mjs` 맨 위 데이터(`CORE` · `GROUPS` · `PLAYERS`)도 같은 값으로 고치고 → 다시 실행한다.

```sh
# settlement_app/ 에서
node admin/brand/build-palette.mjs
```

PDF · PNG 는 브라우저 테스트와 같은 방식으로 설치된 Chrome 을 `playwright-core` 로 열어 만든다(Chrome 이 다른 곳에 있으면 `CHROME_PATH=/경로/chrome`).
글꼴(Noto Sans KR · Space Grotesk)을 Google Fonts 에서 받아 그리므로 인터넷이 연결돼 있어야 PDF · PNG 글꼴이 맞게 나온다.

## 파일

| 파일 | 형식 | 쓰는 곳 |
|---|---|---|
| `ddakjeongsan-palette.html` | 웹 페이지 | 브라우저로 여는 안내 페이지. 색 코드를 누르면 복사. 인터넷 없이도 열림(글꼴만 기기 기본 글꼴) |
| `ddakjeongsan-palette.pdf` | PDF (A4 6쪽) | 인쇄 · 메일 · 공유. HTML 의 인쇄 화면(`@media print`)과 같다 |
| `ddakjeongsan-palette.md` | Markdown | 노션 · GitHub · 문서. 맨 위에 PNG 를 넣었다 |
| `ddakjeongsan-palette.png` | 이미지 (2400px) | 슬라이드 · 메신저 · SNS 작업에 그대로 |
| `ddakjeongsan-palette.svg` | 벡터 이미지 | Figma · Illustrator 에 끌어다 놓으면 색 면을 그대로 쓸 수 있다 |
| `ddakjeongsan.ase` | Adobe Swatch Exchange | Photoshop · Illustrator · InDesign 의 스와치 패널 → "스와치 불러오기" |
| `ddakjeongsan.gpl` | GIMP Palette | GIMP · Inkscape · Krita 의 팔레트 |
| `ddakjeongsan-tokens.json` | 디자인 토큰 (W3C DTCG) | Figma Tokens Studio · Style Dictionary 같은 토큰 도구 |
| `ddakjeongsan-colors.css` | CSS 변수 | 웹 작업 (`var(--ddak-core-red)` …) |
| `build-palette.mjs` | Node 스크립트 | 위 파일 전부를 만드는 생성기 (데이터 + 형식별 출력) |

## 팔레트 구성

- **코어 5색** — 딱정산 레드 `#E8503A` · 잉크 네이비 `#1A1D29` · 영수증 회색 `#EEF1F4` · 화이트 `#FFFFFF` · 정산 그린 `#0F9D64`
- **글자 5단계 · 면/선 5단계 · 상태 틴트 7색** — 앱 화면의 회색 계열과 경고(레드) · 완료(그린) · 안내(옐로) 조합
- **미니게임 플레이어 15색** — 참가자 순서대로 쓰는 보조 팔레트(바탕 + 이름 글씨 색 짝). 게임 · 이벤트 홍보에만
- **쓰는 비율**(회색 45 · 흰색 35 · 네이비 12 · 레드 6 · 그린 2%)은 앱 화면을 보고 어림한 값이다 — 측정치가 아니다
- **글자 대비**는 스크립트가 WCAG 공식으로 계산한다. 흰 글씨 + 레드는 3.72 : 1 → 큰 글씨에만

## 형식별 메모 (스크립트를 고칠 때)

- **.ase** — Adobe 바이너리 형식. 빅 엔디언. `"ASEF"` · 버전 1.0 · 블록 수 → 그룹 시작(`0xC001`) · 색(`0x0001`) · 그룹 끝(`0xC002`).
  이름은 UTF-16BE(끝에 NUL), 색은 `"RGB "` + float32 세 개(0~1) + 종류(2 = normal). 5개 그룹 · 37색.
  다시 읽어서 값이 맞는지 확인했지만(2026-10-22), 실제 Adobe 앱에서 열어 본 적은 아직 없다.
- **.gpl** — 텍스트. 첫 줄 `GIMP Palette`, `Name:` · `Columns:` 뒤에 줄마다 `R G B<탭>이름`.
- **tokens.json** — W3C Design Tokens Community Group 형식(`$type: "color"` · `$value` · `$description`). 경로 예: `core.red`, `text.dim`, `player.4.background`.
- **PNG** 는 SVG 를 Chrome 으로 2배 크기로 찍은 것이다. SVG 의 글꼴은 보는 기기에 깔린 글꼴로 그려진다(Pretendard → Noto Sans KR → 기본 글꼴).
- 같은 색이 여러 묶음에 있으면(예: 잉크 네이비는 코어 · 글자 · 플레이어 2번) 파일마다 묶음별로 따로 들어간다.

## 관련 문서

- 앱 쪽 색 사용 규칙: 루트 `README.md` "코드 컨벤션"(브랜드 색은 `C_*` 상수로)
- 로고 · 앱 아이콘: 루트 `favicon.svg`(영수증 + 체크 도형) · `icons/` · `apple-touch-icon.png` — 네이비 바탕 + 흰 선
- 앱인토스 등록용 로고 PNG 는 저장소 밖 `../앱인토스_등록자료/` 에 있다
