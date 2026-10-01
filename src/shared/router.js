/*
 * 해시 라우터 — #/settle · #/food · #/games (+ #/games/roulette 같은 하위 경로).
 * index.html 하나로 동작하고 뒤로가기도 브라우저 기본 동작을 그대로 쓴다.
 * 해시가 없으면 경로(/food, /games/roulette)로 첫 화면을 고른다 — 앱인토스 "주요 기능" 주소
 * (intoss://ddakjeongsan/food)는 해시가 아닌 경로로 들어오기 때문. 주소는 바꾸지 않고 읽기만 한다.
 */
import { useState, useEffect } from "react";

export const ROUTES = ["settle", "food", "games"];
const DEFAULT_ROUTE = "settle";

function parse(path) {
  const [route, sub = ""] = path.split("/");
  return ROUTES.includes(route) ? { route, sub } : null;
}

function parseHash() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (hash) return parse(hash) ?? { route: DEFAULT_ROUTE, sub: "" };
  // 경로 끝의 /food, /games/roulette 등 (앞에 다른 경로가 붙어도 된다)
  const segs = window.location.pathname.split("/").filter((s) => s && !s.includes("."));
  for (let i = 0; i < segs.length; i++) {
    const loc = parse(segs.slice(i).join("/"));
    if (loc) return loc;
  }
  return { route: DEFAULT_ROUTE, sub: "" };
}

export const routeHref = (route, sub) => `#/${route}${sub ? `/${sub}` : ""}`;

export function navigate(route, sub) {
  window.location.hash = routeHref(route, sub).slice(1);
}

export function useHashRoute() {
  const [loc, setLoc] = useState(parseHash);
  useEffect(() => {
    const onChange = () => setLoc(parseHash());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return loc;
}
