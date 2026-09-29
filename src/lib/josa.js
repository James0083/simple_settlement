/*
 * 이름 뒤 조사 — 마지막 글자에 받침이 있으면 앞의 것, 없으면 뒤의 것.
 *   josa("민수", "이/가") → "가",  josa("태현", "이/가") → "이"
 * "으로/로" 는 ㄹ 받침이면 "로". 한글이 아니면(영문·숫자) "이(가)" 처럼 둘 다 보여준다.
 */
export function josa(word, pair) {
  const [withBatchim, without] = pair.split("/");
  const last = String(word ?? "").trim().slice(-1);
  const code = last.charCodeAt(0) - 0xac00;
  if (!(code >= 0 && code <= 11171)) return `${withBatchim}(${without})`;
  const jong = code % 28;
  if (pair === "으로/로" && jong === 8) return without; // ㄹ 받침
  return jong ? withBatchim : without;
}
