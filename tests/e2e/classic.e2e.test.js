/* 기존 미니게임 — 끝까지 해서 당첨자가 나오는지, 게임 도중에 나가도 오류가 없는지 (사다리 · 폭탄 · 레이스 · 터치 대결 · 악어 · 해적) */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startApp, collectErrors, openWithStorage } from "./helpers.js";

let app;
before(async () => {
  app = await startApp();
});
after(async () => {
  await app?.close();
});

const NAMES = ["민수", "지영", "현우"];
const roster = (names) => names.map((name) => ({ name, account: "" }));

async function openGame(page, gameName, names = NAMES) {
  await openWithStorage(page, `${app.url}/#/games`, { roster: roster(names), entitlements: { previewGames: true } });
  await page.locator("button.game-card", { hasText: gameName }).click();
}
const bigBtn = (page, text) => page.locator("button.settle-calc-btn", { hasText: text });
const result = (page) => page.getByText(/^(오늘 계산은 .+님!|당첨 \d+명!)$/);

// 3D 화면은 캔버스만 있으므로, 캔버스 위 여러 점을 눌러 이빨 · 구멍을 맞힌다.
// 한 바퀴 다 누르면 좌우로 밀어 돌린다(해적 통은 뒤쪽 구멍이 앞으로 와야 누를 수 있다).
async function tapAcross(page, done) {
  const view = page.locator("[data-three-view] canvas");
  await view.waitFor({ timeout: 15000 });
  for (let round = 0; round < 12 && !(await done()); round++) {
    const box = await view.boundingBox();
    if (round > 0) {
      const y = box.y + box.height * 0.5;
      await page.mouse.move(box.x + box.width * 0.75, y);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.35, y, { steps: 8 });
      await page.mouse.up();
      await page.waitForTimeout(300);
    }
    for (let y = 0.2; y <= 0.85 && !(await done()); y += 0.05) {
      for (let x = 0.1; x <= 0.9 && !(await done()); x += 0.06) {
        await page.mouse.click(box.x + box.width * x, box.y + box.height * y);
        await page.waitForTimeout(40);
      }
    }
  }
}

test("사다리 타기 — 전체 공개하면 당첨자가 나온다", async () => {
  const page = await app.browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = collectErrors(page);
  await openGame(page, "사다리 타기");
  await bigBtn(page, "사다리 만들기").click();
  await bigBtn(page, "전체 공개").click();
  await result(page).waitFor({ timeout: 15000 });
  assert.deepEqual(errors, []);
  await page.close();
});

test("폭탄 돌리기 — 넘기다 보면 터지고 들고 있던 사람이 당첨", async () => {
  const page = await app.browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = collectErrors(page);
  await openGame(page, "폭탄 돌리기");
  await bigBtn(page, "폭탄 시작").click();
  const exploded = page.getByText("터졌다!");
  for (let i = 0; i < 60 && !(await exploded.count()); i++) {
    const pass = bigBtn(page, "넘기기");
    if ((await pass.count()) && (await pass.isEnabled())) await pass.click();
    await page.waitForTimeout(900);
  }
  const holder = (await page.locator("[aria-live=polite] span").nth(1).innerText()).trim();
  await result(page).waitFor({ timeout: 10000 });
  assert.equal(await result(page).innerText(), `오늘 계산은 ${holder}님!`);
  assert.deepEqual(errors, []);
  await page.close();
});

test("동물 레이스 — 꼴찌가 당첨", async () => {
  const page = await app.browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = collectErrors(page);
  await openGame(page, "동물 레이스");
  await bigBtn(page, "레이스 시작").click();
  await result(page).waitFor({ timeout: 30000 });
  assert.deepEqual(errors, []);
  await page.close();
});

test("터치 대결 (2명) — 많이 누른 쪽이 이기고 진 사람이 당첨", async () => {
  const page = await app.browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = collectErrors(page);
  await openGame(page, "터치 대결", ["민수", "지영"]);
  await bigBtn(page, "대결 시작").click();
  await page.waitForTimeout(2300); // 3 · 2 · 1 · GO
  const bottom = page.locator('[data-duel-side="1"]');
  const bottomName = (await bottom.locator("div").nth(1).innerText()).trim();
  for (let i = 0; i < 80 && !(await page.getByText("승리!").count()); i++) await bottom.click({ force: true });
  await result(page).waitFor({ timeout: 10000 });
  assert.notEqual(await result(page).innerText(), `오늘 계산은 ${bottomName}님!`);
  assert.deepEqual(errors, []);
  await page.close();
});

test("터치 대결 (3명) — 5초 연타, 가장 적게 누른 사람이 당첨", async () => {
  const page = await app.browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = collectErrors(page);
  await openGame(page, "터치 대결");
  await page.locator("button.settle-calc-btn").first().click(); // 순서 정하기 → 시작
  const counts = {};
  for (let k = 0; k < NAMES.length; k++) {
    await bigBtn(page, "준비됐어요").click();
    await page.waitForTimeout(2300);
    const pad = page.locator("[data-relay-pad]");
    const name = (await pad.locator("div").first().innerText()).trim();
    counts[name] = (k + 1) * 6;
    for (let t = 0; t < counts[name]; t++) await pad.click({ force: true });
    await page.getByText(/번! 끝$/).waitFor({ timeout: 10000 });
  }
  const least = Object.entries(counts).sort((a, b) => a[1] - b[1])[0][0];
  await result(page).waitFor({ timeout: 10000 });
  assert.equal(await result(page).innerText(), `오늘 계산은 ${least}님!`);
  assert.deepEqual(errors, []);
  await page.close();
});

test("악어이빨 (3D) — 아픈 이빨을 누르면 입을 닫고 당첨자가 나온다", async () => {
  const page = await app.browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = collectErrors(page);
  await openGame(page, "악어이빨");
  await page.locator("button.settle-calc-btn").first().click();
  await tapAcross(page, async () => (await page.getByText("악어가 입을 닫았어요!").count()) > 0);
  await result(page).waitFor({ timeout: 15000 });
  assert.deepEqual(errors, []);
  await page.close();
});

test("해적룰렛 (3D) — 함정 구멍에 꽂으면 해적이 튀어나오고 당첨자가 나온다", async () => {
  const page = await app.browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = collectErrors(page);
  await openGame(page, "해적룰렛");
  await page.locator("button.settle-calc-btn").first().click();
  await tapAcross(page, async () => (await page.getByText("해적이 튀어나왔어요!").count()) > 0);
  await result(page).waitFor({ timeout: 15000 });
  assert.deepEqual(errors, []);
  await page.close();
});

// 게임 도중에 목록으로 나가면 걸어 둔 타이머가 모두 취소돼야 한다(나간 화면에서 상태를 바꾸거나 소리를 내지 않게)
test("게임 도중에 나가도 오류 없이 목록으로 돌아온다", async () => {
  const page = await app.browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = collectErrors(page);
  for (const [name, start] of [["폭탄 돌리기", "폭탄 시작"], ["10초 맞추기", "게임 시작"], ["반응속도", "게임 시작"]]) {
    await openGame(page, name);
    await bigBtn(page, start).click();
    if (name !== "폭탄 돌리기") await bigBtn(page, name === "반응속도" ? "준비됐어요" : "시작").click();
    await page.waitForTimeout(400);
    await page.getByRole("link", { name: "← 게임 목록" }).click();
    await page.waitForTimeout(2500);
    assert.ok(await page.locator("button.game-card").first().isVisible(), name);
  }
  assert.deepEqual(errors, []);
  await page.close();
});
