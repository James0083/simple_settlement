/*
 * 미니게임 플레이 영상 녹화 — 인스타 릴스 · 유튜브 쇼츠용 세로 영상(1080×1920 · 30fps · mp4)과 장면 PNG.
 *
 *   npm run record -- --game=race     한 게임 (id 는 아래 SCENARIOS)
 *   npm run record -- --all           모두
 *   --headed                          창을 띄워서 녹화 (헤드리스에서 화면이 이상할 때)
 *   --swiftshader                     헤드리스에서 WebGL 을 소프트웨어로 그린다 (3D 게임용 — 지금 대상에는 없음)
 *
 * 결과 (recordings/ 는 git 에 올리지 않는다):
 *   recordings/<id>.mp4      1080×1920 · H.264 · yuv420p · 30fps · 무음 오디오 트랙 (게임 화면이 뜬 뒤부터)
 *   recordings/<id>/*.png    시작 · 진행 중 · 결과 · 정산 장면 (1080×1920)
 *
 * 영상은 Playwright 의 recordVideo 대신 Chrome 의 화면 전송(CDP Page.startScreencast)으로 프레임을 받아 ffmpeg 로 묶는다.
 * recordVideo 는 deviceScaleFactor 를 무시하고 CSS 픽셀(360×640)로만 찍어, 1080×1920 영상의 왼쪽 위 구석에만 화면이 들어간다.
 *
 * 개발 서버를 띄우고 녹화 모드(src/shared/rec.js)로 연다: ?rec=1&unlock=all&players=…&seed=…&game=<id>
 * 시드는 원하는 결과(SCENARIOS 의 want)가 나오는 값을 찾아 고정했다. 게임이 난수를 쓰는 순서가 바뀌면
 * 결과가 달라지므로, 그때는 시드를 다시 찾는다(시드를 바꿔 가며 녹화해 보고 결과를 확인).
 * 필요: 설치된 Chrome(다른 곳에 있으면 CHROME_PATH) · ffmpeg · ffprobe(PATH 에, 또는 FFMPEG_PATH · FFPROBE_PATH).
 */
import { createServer } from "vite";
import { chromium } from "playwright-core";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const OUT = join(root, "recordings");
const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const FFPROBE = process.env.FFPROBE_PATH || "ffprobe";
const VIEWPORT = { width: 360, height: 640 };
const VIDEO = { width: 1080, height: 1920 };
const PLAYERS = ["민수", "지영", "수아", "현우"];

// ── 화면 조작 도구 ─────────────────────────────────────────
function helpers(page, shotDir) {
  const pause = (ms) => page.waitForTimeout(ms);

  // 사람처럼 누른다 — 화면 밖(또는 하단 탭바 밑)이면 먼저 부드럽게 스크롤한 뒤 터치
  const tap = async (locator, after = 600) => {
    await locator.waitFor();
    const inView = await locator.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const nav = document.querySelector("[aria-label='주요 메뉴']");
      return r.top >= 0 && r.bottom <= (nav ? nav.getBoundingClientRect().top : innerHeight);
    });
    if (!inView) {
      await locator.evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "center" }));
      await pause(650);
    }
    await locator.tap();
    await pause(after);
  };

  let shotNo = 0;
  const shot = async (name) => {
    shotNo += 1;
    await page.screenshot({ path: join(shotDir, `${String(shotNo).padStart(2, "0")}-${name}.png`) });
  };

  const big = (text) => page.locator("button.settle-calc-btn", { hasText: text });
  const banner = async () => (await page.locator("[aria-live=polite] span").nth(1).innerText()).trim();

  // 요소 한가운데에 손가락이 닿은 것처럼 pointerdown 을 보낸다 — 시간 · 위치를 프레임 단위로 맞춰야 하는 게임용
  // (Playwright 의 tap 은 왕복 지연이 있어 반응속도 · 탑 쌓기에서 원하는 값을 정확히 낼 수 없다)
  const PRESS = `(el) => {
    const r = el.getBoundingClientRect();
    const init = { bubbles: true, cancelable: true, composed: true, pointerId: 1, pointerType: "touch", isPrimary: true,
      clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
    el.dispatchEvent(new PointerEvent("pointerdown", init));
    el.dispatchEvent(new PointerEvent("pointerup", init));
  }`;

  return { pause, tap, shot, big, banner, PRESS };
}

// 결과 화면에서 멈췄다가, 당첨자가 한 명이면 "정산에 추가" → 정산 탭에 회차가 생기는 장면까지. 당첨자 이름을 돌려준다.
async function finishAndSettle(page, h) {
  await page.getByRole("button", { name: "한 판 더" }).waitFor({ timeout: 30000 });
  const result = (await page.getByText(/^오늘 계산은 .+님!$|님이 제일 많이 내요!$/).last().innerText()).trim();
  const loser = result.match(/^(?:오늘 계산은 )?(.+?)님/)[1];
  await h.pause(800); // 결과로 스크롤이 끝나기를 기다린다
  await h.shot("result");
  await h.pause(1200);
  const add = page.getByRole("button", { name: "정산에 추가" });
  if ((await add.count()) === 0) return loser;
  await h.tap(add, 900);
  const round = page.locator("input[placeholder^='정산 이름']").last();
  await round.evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "start" }));
  await h.pause(1600);
  await h.shot("settle");
  await h.pause(800);
  return loser;
}

// ── 게임별 시나리오 ────────────────────────────────────────
const SCENARIOS = {
  race: {
    loser: "현우",
    seed: "race-15",
    want: "꼴찌 현우",
    async play(page, h) {
      await h.pause(1500);
      await h.shot("start");
      await h.tap(h.big("레이스 시작!"), 4000);
      await h.shot("racing");
    },
  },

  hideseek: {
    loser: "지영",
    seed: "hideseek-2", // 민수 선공
    players: ["민수", "지영"],
    want: "지영이 먼저 다 들킴",
    async play(page, h) {
      const cell = (i) => page.locator("[role=grid] button").nth(i);
      const HIDE = { 민수: [1, 4, 8, 15, 19, 22, 28, 33], 지영: [0, 7, 10, 14, 20, 27, 30, 35] };
      // 민수는 지영 말을 모두 맞히고, 지영은 7번 중 3번 맞힌다
      const SHOOT = { 민수: [14, 7, 27, 0, 35, 20, 10, 30], 지영: [9, 15, 2, 22, 31, 18, 33] };
      // 30초 안에 끝나도록 다른 게임보다 빠르게 누른다
      await h.pause(900);
      await h.shot("start");
      await h.tap(h.big("숨기기 시작"), 350);
      for (let k = 0; k < 2; k++) {
        await h.tap(h.big("준비됐어요"), 300);
        const who = await h.banner();
        for (const i of HIDE[who]) await h.tap(cell(i), 110);
        if (k === 1) await h.shot("hiding");
        await h.tap(page.locator("button.settle-calc-btn"), 300);
      }
      const shots = { 민수: 0, 지영: 0 };
      for (let turn = 0; turn < 20; turn++) {
        await h.tap(h.big("준비됐어요"), 200);
        const who = await h.banner();
        await h.tap(cell(SHOOT[who][shots[who]++]), 450);
        if (turn === 6) await h.shot("seeking");
        if (await page.getByText(/번 만에 모두 찾았어요/).count()) break;
        await h.tap(h.big("님 차례로"), 150);
      }
      await h.pause(1000);
    },
  },

  reaction: {
    loser: "현우",
    seed: "reaction-944", // 순서 민수 · 지영 · 수아 · 현우
    want: "현우 부정 출발로 당첨",
    async play(page, h) {
      const REACT_MS = { 민수: 250, 지영: 310, 수아: 280 }; // 현우는 초록 전에 누른다
      const LAG_MS = 5; // 초록 시각(게임 안 타이머)부터 화면에 반영될 때까지 — 이만큼 빼야 기록이 위 값에 맞는다
      await h.pause(1200);
      await h.shot("start");
      await h.tap(h.big("게임 시작"), 500);
      for (let turn = 0; turn < PLAYERS.length; turn++) {
        await h.tap(h.big("준비됐어요"), 0);
        const who = await h.banner();
        const pad = page.locator("button[aria-live=assertive]");
        if (REACT_MS[who] == null) {
          await h.pause(900);
          await h.tap(pad, 0);
        } else {
          // 초록으로 바뀐 순간(DOM 반영)부터 정해진 시간 뒤에 누른다
          await pad.evaluate(
            (el, [delay, press]) =>
              new Promise((resolve) => {
                const fire = new Function(`return ${press}`)();
                const seen = () => el.textContent.includes("지금!");
                const go = () => setTimeout(() => (fire(el), resolve()), delay);
                if (seen()) return go();
                const obs = new MutationObserver(() => seen() && (obs.disconnect(), go()));
                obs.observe(el, { subtree: true, childList: true, characterData: true });
              }),
            [REACT_MS[who] - LAG_MS, h.PRESS]
          );
        }
        if (turn === 1) await h.shot("go");
        await h.pause(1500); // 기록을 잠깐 보여주는 시간(1.4초)
      }
      await h.pause(1200);
      await h.tap(h.big("확인"), 0);
    },
  },

  splitluck: {
    loser: "지영", // 시드로 정해지는 최고 금액자
    seed: "splitluck-18", // 순서 민수 · 지영 · 수아 · 현우
    want: "가장 많이 내는 사람 공개 → 각자 금액이 든 회차",
    async play(page, h) {
      const PICK = [3, 1, 4, 2]; // 차례마다 여는 봉투 번호(1부터)
      await h.pause(1000);
      await h.tap(page.locator("#splitluck-total"), 200);
      await page.keyboard.type("100000", { delay: 130 });
      await h.pause(500);
      await h.shot("start");
      await h.tap(h.big("봉투 나누기"), 700);
      for (let turn = 0; turn < PLAYERS.length; turn++) {
        await h.tap(page.getByRole("button", { name: `봉투 ${PICK[turn]}`, exact: true }), 1100);
        if (turn === 0) await h.shot("open");
        await h.tap(h.big(turn === PLAYERS.length - 1 ? "결과 보기" : "님 차례로"), 600);
      }
      await h.pause(1300);
      await h.tap(h.big("확인"), 0);
    },
  },

  stack: {
    loser: "현우",
    seed: "stack-23", // 순서 민수 · 지영 · 수아 · 현우
    want: "현우가 놓쳐서 당첨",
    async play(page, h) {
      // 블록마다 위 블록보다 오른쪽으로 얼마나 어긋나게 놓을지 (SVG 단위 · 판 폭 300).
      // 첫 블록은 퍼펙트, 나머지는 오른쪽으로 어긋나 탑이 좁아지며 오른쪽으로 밀린다 → 현우 차례에 왼쪽 끝에서 놓치게
      const OFFSETS = [1, 14, 13, 15, 14, 14];
      await h.pause(1200);
      await h.shot("start");
      await h.tap(h.big("게임 시작"), 500);
      const pad = page.getByRole("button", { name: "블록 놓기" });
      let level = 1;
      for (let turn = 0; turn < PLAYERS.length; turn++) {
        await h.tap(h.big(turn === 0 ? "시작" : "님 준비됐어요"), 0);
        for (let b = 0; b < 2; b++, level++) {
          const offset = OFFSETS[level - 1]; // 없으면 놓친다
          await pad.evaluate(
            (el, [lv, off, press]) =>
              new Promise((resolve) => {
                const fire = new Function(`return ${press}`)();
                const yOf = (n) => 220 - 22 * (n + 1); // StackGame 의 VIEW_H · BLOCK_H
                const rectAt = (n) =>
                  [...el.querySelectorAll("rect")].find((r) => r.getAttribute("opacity") === "1" && Math.abs(+r.getAttribute("y") - yOf(n)) < 0.5);
                let prev = null;
                let turns = 0;
                const frame = () => {
                  const mv = rectAt(lv);
                  const top = rectAt(lv - 1);
                  if (mv && top) {
                    const x = +mv.getAttribute("x");
                    // 놓칠 차례: 끝까지 한 번 갔다 돌아오며 왼쪽 끝 가까이에서 (위 블록과 안 겹치는 자리)
                    const target = off == null ? Math.max(0, (+top.getAttribute("x") - +mv.getAttribute("width")) / 2) : +top.getAttribute("x") + off;
                    if (prev != null && off == null && Math.sign(x - prev.x) !== Math.sign(prev.dx) && prev.dx) turns++;
                    const ready = off != null || turns >= 1;
                    if (ready && prev != null && (prev.x - target) * (x - target) <= 0) return (fire(el), resolve());
                    prev = { x, dx: prev ? x - prev.x : 0 };
                  }
                  requestAnimationFrame(frame);
                };
                requestAnimationFrame(frame);
              }),
            [level, offset ?? null, h.PRESS]
          );
          if (offset == null) break;
          await h.pause(b === 0 ? 450 : 700);
        }
        if (turn === 2) await h.shot("stacking");
      }
      await h.pause(1500);
    },
  },

  simon: {
    loser: "현우",
    seed: "simon-65", // 순서 민수 · 지영 · 수아 · 현우
    want: "현우가 틀려서 당첨",
    async play(page, h) {
      const pad = (label) => page.getByRole("button", { name: label, exact: true });
      const TURNS = [["빨강"], ["빨강", "파랑"], ["빨강", "파랑", "초록"], ["빨강", "파랑", "노랑"]]; // 현우는 세 번째를 틀린다
      await h.pause(1200);
      await h.shot("start");
      await h.tap(h.big("게임 시작"), 500);
      for (let turn = 0; turn < TURNS.length; turn++) {
        await h.tap(h.big("준비됐어요"), 500);
        for (const label of TURNS[turn]) await h.tap(pad(label), 420);
        if (turn === 2) await h.shot("pressing");
        if (turn < TURNS.length - 1) {
          await h.pause(500);
          await h.tap(h.big("님 차례로"), 300);
        }
      }
      await h.pause(1800);
      await h.tap(h.big("확인"), 0);
    },
  },

  liar: {
    loser: "수아",
    seed: "liar-200", // 확인 순서 민수 · 지영 · 수아 · 현우, 라이어 수아, 첫 설명 민수, 제시어 피자
    want: "가장 많이 지목된 수아 당첨",
    async play(page, h) {
      await h.pause(1200);
      await h.tap(page.getByRole("button", { name: "음식", exact: true }), 500);
      await h.shot("start");
      await h.tap(h.big("제시어 정하기"), 600);
      for (let k = 0; k < PLAYERS.length; k++) {
        await h.tap(h.big("제시어 보기"), 1300);
        if (k === 0 || k === 2) await h.shot(k === 0 ? "word" : "liar");
        await h.tap(h.big("확인했어요"), 500);
      }
      await h.pause(1500);
      await h.tap(h.big("지목하러 가기"), 700);
      await h.tap(page.getByRole("radio", { name: "수아" }), 700);
      await h.tap(h.big("수아님으로 결정"), 2200);
      await h.tap(h.big("확인"), 0);
    },
  },
};

// ── 녹화 ──────────────────────────────────────────────────
// 화면이 바뀔 때마다 Chrome 이 보내는 프레임(기기 픽셀 1080×1920)을 파일로 받아 둔다. stop() → 프레임 목록과 끝난 시각.
async function startScreencast(page, dir) {
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
    const file = join(dir, `f${String(frames.length).padStart(5, "0")}.jpg`);
    writeFileSync(file, Buffer.from(data, "base64"));
    frames.push({ file, ts: metadata.timestamp });
    cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 95, maxWidth: VIDEO.width, maxHeight: VIDEO.height });
  return async () => {
    await cdp.send("Page.stopScreencast");
    return { frames, endTs: Date.now() / 1000 };
  };
}

// 프레임마다 다음 프레임까지 보여 주는 시간을 적은 목록(concat) → 30fps mp4. 화면 전송에는 소리가 없어 무음 트랙을 붙인다.
function encode({ frames, endTs }, dir, mp4) {
  const list = frames.map((f, i) => {
    const until = i + 1 < frames.length ? frames[i + 1].ts : endTs;
    return `file '${f.file}'\nduration ${Math.max(0.001, until - f.ts).toFixed(4)}`;
  });
  list.push(`file '${frames.at(-1).file}'`); // concat 은 마지막 duration 을 쓰려면 마지막 파일을 한 번 더 적어야 한다
  const listFile = join(dir, "frames.txt");
  writeFileSync(listFile, list.join("\n"));
  execFileSync(FFMPEG, [
    "-y", "-loglevel", "error",
    "-f", "concat", "-safe", "0", "-i", listFile,
    "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
    "-map", "0:v", "-map", "1:a", "-shortest",
    "-vf", `fps=30,scale=${VIDEO.width}:${VIDEO.height}:flags=lanczos,format=yuv420p`,
    "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-profile:v", "high",
    "-c:a", "aac", "-b:a", "128k",
    "-movflags", "+faststart",
    mp4,
  ]);
  return Number(execFileSync(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4]).toString());
}

async function record(browser, url, id) {
  const sc = SCENARIOS[id];
  const players = sc.players ?? PLAYERS;
  const shotDir = join(OUT, id);
  const frameDir = join(OUT, `.frames-${id}`);
  for (const d of [shotDir, frameDir]) {
    rmSync(d, { recursive: true, force: true });
    mkdirSync(d, { recursive: true });
  }

  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  const q = new URLSearchParams({ rec: "1", unlock: "all", players: players.join(","), seed: sc.seed, game: id });
  await page.goto(`${url}/?${q}`);
  await page.locator("button.settle-calc-btn").first().waitFor();
  await page.evaluate(() => document.fonts.ready);

  const stop = await startScreencast(page, frameDir);
  const h = helpers(page, shotDir);
  await sc.play(page, h);
  const loser = await finishAndSettle(page, h);
  const capture = await stop();
  await context.close();

  const secs = encode(capture, frameDir, join(OUT, `${id}.mp4`));
  rmSync(frameDir, { recursive: true, force: true });
  if (errors.length) throw new Error(`${id}: 페이지 오류\n${errors.join("\n")}`);
  if (loser !== sc.loser) throw new Error(`${id}: 당첨자가 ${sc.loser} 가 아니라 ${loser} — 시드를 다시 찾아야 한다`);
  return { secs, loser, fps: capture.frames.length / secs };
}

async function main() {
  const args = process.argv.slice(2);
  const all = args.includes("--all");
  const one = args.find((a) => a.startsWith("--game="))?.slice(7);
  const ids = all ? Object.keys(SCENARIOS) : one ? [one] : [];
  if (ids.length === 0 || ids.some((id) => !SCENARIOS[id])) {
    console.error(`사용법: npm run record -- --game=<id> | --all   (id: ${Object.keys(SCENARIOS).join(", ")})`);
    process.exit(1);
  }
  mkdirSync(OUT, { recursive: true });

  const server = await createServer({ root, logLevel: "silent", server: { port: 0, strictPort: false } });
  await server.listen();
  const url = `http://localhost:${server.httpServer.address().port}`;
  const browser = await chromium.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" }),
    headless: !args.includes("--headed"),
    args: args.includes("--swiftshader") ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] : [],
  });
  try {
    for (const id of ids) {
      process.stdout.write(`● ${id} (${SCENARIOS[id].want}) … `);
      const { secs, loser, fps } = await record(browser, url, id);
      console.log(`당첨 ${loser} · recordings/${id}.mp4 ${secs.toFixed(1)}초 (받은 프레임 초당 ${fps.toFixed(0)}장)`);
    }
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
