/*
 * 녹화 모드 — 홍보 영상(릴스 · 쇼츠)용 플레이 장면 녹화. 개발 서버(npm run dev)에서만 켜진다.
 *   ?rec=1              녹화 모드: 광고 · 쿠팡 배너 · 소리 안내 · NEW 뱃지(게임 카드 · 탭바)를 숨기고, 누른 자리에 반투명 원을 띄운다.
 *                       효과음은 꺼진 채다(녹화 저장소가 비어 있어 소리 설정이 기본값 "끔")
 *   &unlock=all         공개일(releaseAt) 전 게임도 연다
 *   &players=민수,지영   참가자 명단. 기기 명단을 건드리지 않게 녹화 모드는 따로 저장한다("ddak-rec:")
 *   &seed=<문자열>       게임 난수를 시드 고정 난수로 바꾼다 → 같은 시드면 같은 결과
 *   &game=<id>          그 게임 화면으로 바로 간다
 * 녹화 스크립트: scripts/record-gameplay.mjs (npm run record).
 *
 * 쓰는 곳은 모두 `import.meta.env?.DEV && REC` 로 감싼다. 배포 빌드에서는 import.meta.env.DEV 가 false 로 바뀌어
 * 감싼 코드와 이 파일이 번들에서 통째로 빠진다. (?. 인 이유: 단위 테스트는 Vite 없이 Node 로 게임 모듈을 불러오는데
 * 그때는 import.meta.env 가 없다.)
 */
export const REC_PREFIX = "ddak-rec:";

// 시드 문자열 → 32비트 정수 난수열 (cyrb53 해시로 시작값을 만들고 mulberry32 로 이어 뽑는다).
// 녹화를 똑같이 다시 찍기 위한 것 — 공정성과는 상관없다(녹화 모드에서만 쓴다).
export function seededUint32(seed) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < seed.length; i++) {
    const c = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  let state = (Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)) | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  };
}

const params = import.meta.env?.DEV && typeof location !== "undefined" ? new URLSearchParams(location.search) : null;

export const REC = params?.has("rec")
  ? {
      unlock: params.get("unlock") === "all",
      players: (params.get("players") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
      rand: params.get("seed") ? seededUint32(params.get("seed")) : null,
      game: params.get("game"),
    }
  : null;

if (import.meta.env?.DEV && REC) {
  // 녹화 모드 저장소를 비우고 시작한다 — 지난 녹화의 기록(라이어 최근 제시어 등)이 결과를 바꾸지 않게
  Object.keys(localStorage)
    .filter((k) => k.startsWith(REC_PREFIX))
    .forEach((k) => localStorage.removeItem(k));
  if (REC.players.length > 0) {
    localStorage.setItem(`${REC_PREFIX}roster`, JSON.stringify(REC.players.map((name) => ({ name, account: "" }))));
  }
  if (REC.game && !location.hash) history.replaceState(null, "", `#/games/${REC.game}`);

  // 터치 표시 — 누른 자리에 반투명 원이 0.3초 보였다 사라진다 (영상에서 어디를 눌렀는지 보이게)
  document.addEventListener(
    "pointerdown",
    (e) => {
      const dot = document.createElement("div");
      Object.assign(dot.style, {
        position: "fixed",
        left: `${e.clientX - 22}px`,
        top: `${e.clientY - 22}px`,
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        background: "rgba(26, 29, 41, 0.28)",
        border: "2px solid rgba(255, 255, 255, 0.85)",
        pointerEvents: "none",
        zIndex: 9999,
      });
      document.body.appendChild(dot);
      dot.animate(
        [{ opacity: 1, transform: "scale(0.7)" }, { opacity: 0, transform: "scale(1.25)" }],
        { duration: 300, easing: "ease-out" }
      ).onfinish = () => dot.remove();
    },
    true
  );
}
