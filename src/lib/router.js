/*
 * 해시 라우터 — #/settle · #/food · #/games (+ #/games/roulette 같은 하위 경로).
 * index.html 하나로 동작하고 뒤로가기도 브라우저 기본 동작을 그대로 쓴다.
 */
import { useState, useEffect } from "react";

export const ROUTES = ["settle", "food", "games"];
const DEFAULT_ROUTE = "settle";

function parseHash() {
  const [route, sub = ""] = window.location.hash.replace(/^#\/?/, "").split("/");
  return ROUTES.includes(route) ? { route, sub } : { route: DEFAULT_ROUTE, sub: "" };
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
