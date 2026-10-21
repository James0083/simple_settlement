/* 미니게임 숨바꼭질(2명 전용) — 진입 제한, 숨기기, 번갈아 공격, 결과, 정산에 추가 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startApp, collectErrors, openWithStorage } from "./helpers.js";
import { FIGURE_COUNT, GRID_SIZE } from "../../src/games/HideSeekGame.js";

let app;
before(async () => {
  app = await startApp();
});
after(async () => {
  await app?.close();
});

const roster = (...names) => names.map((name) => ({ name, account: "" }));

async function openGames(page, names) {
  // 공개 전에도 해 볼 수 있게 미리 열기 권한을 켠다
  await openWithStorage(page, `${app.url}/#/games`, { roster: roster(...names), entitlements: { previewGames: true } });
}

test("공개 전에는 잠겨 있다", async () => {
  const page = await app.browser.newPage();
  await openWithStorage(page, `${app.url}/#/games`, { roster: roster("민수", "지영") });
  const card = page.locator("button.game-card", { hasText: "숨바꼭질" });
  if (Date.now() < Date.parse("2026-11-02T00:00:00+09:00")) {
    assert.match(await card.innerText(), /11월 2일\(월\) 공개/);
    await card.click();
    assert.match(await page.locator("[role=status]").innerText(), /공개돼요/);
  }
  await page.close();
});

test("3명이면 들어갈 수 없다", async () => {
  const page = await app.browser.newPage();
  await openGames(page, ["민수", "지영", "현우"]);
  await page.locator("button.game-card", { hasText: "숨바꼭질" }).click();
  assert.equal(await page.locator("[role=status]").innerText(), "숨바꼭질은 정확히 2명이 필요해요 (지금 3명)");
  assert.equal(await page.getByText("숨기기 시작").count(), 0);
  await page.close();
});

for (const width of [390, 360]) {
  test(`2명이 끝까지 하고 정산에 추가한다 (${width}px)`, async () => {
    const page = await app.browser.newPage({ viewport: { width, height: 844 } });
    const errors = collectErrors(page);
    await openGames(page, ["민수", "지영"]);
    await page.locator("button.game-card", { hasText: "숨바꼭질" }).click();
    await page.getByRole("button", { name: "숨기기 시작" }).click();

    const banner = async () => (await page.locator("[aria-live=polite] span").nth(1).innerText()).trim();
    const cell = (i) => page.locator("[role=grid] button").nth(i);
    const doneBtn = page.locator("button.settle-calc-btn");
    const last = GRID_SIZE * GRID_SIZE - 1;
    const placed = {};

    // 숨기기 — 민수는 앞쪽 칸, 지영은 뒤쪽 칸
    for (let k = 0; k < 2; k++) {
      await page.getByRole("button", { name: "준비됐어요" }).click();
      const who = await banner();
      const cells = Array.from({ length: FIGURE_COUNT }, (_, i) => (who === "민수" ? i : last - i));
      placed[who] = cells;
      const spare = who === "민수" ? last : 0;
      await cell(spare).click();
      await cell(spare).click(); // 다시 누르면 해제
      assert.equal((await cell(spare).innerText()).trim(), "");
      for (const i of cells.slice(0, -1)) await cell(i).click();
      assert.ok(await doneBtn.isDisabled(), "말이 모자라면 완료 버튼이 꺼진다");
      await cell(cells.at(-1)).click();
      await cell(spare).click(); // 다 숨긴 뒤에는 더 못 놓는다
      assert.equal((await cell(spare).innerText()).trim(), "");
      if (k === 0) {
        const box = await cell(0).boundingBox();
        assert.ok(box.width >= 40, `칸 ${Math.round(box.width)}px`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      }
      await doneBtn.click();
    }

    // 공격 — 민수는 지영 말만 맞히고, 지영은 빈 칸만 쏜다
    const emptyOfMinsu = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i).filter((i) => !placed["민수"].includes(i));
    let mi = 0;
    let ji = 0;
    const finished = () => page.getByText(/번 만에 모두 찾았어요/).count();
    for (let turn = 0; turn < 2 * FIGURE_COUNT + 2 && !(await finished()); turn++) {
      await page.getByRole("button", { name: "준비됐어요" }).click();
      const who = await banner();
      if (who === "민수") {
        if (mi === 1) assert.ok(await cell(placed["지영"][0]).isDisabled(), "이미 공격한 칸은 다시 못 누른다");
        await cell(placed["지영"][mi++]).click();
      } else {
        await cell(emptyOfMinsu[ji++]).click();
      }
      if (await finished()) break;
      await page.locator("button.settle-calc-btn", { hasText: "님 차례로" }).click();
    }

    assert.match(await page.getByText(/번 만에 모두 찾았어요/).innerText(), /^민수님이 \d+번 만에 모두 찾았어요!$/);
    const captions = (await page.locator("p", { hasText: "님의 판 ·" }).allInnerTexts()).join(" / ");
    assert.ok(captions.includes(`지영님의 판 · ${FIGURE_COUNT}/${FIGURE_COUNT} 들킴`), captions);
    assert.ok(captions.includes(`민수님의 판 · 0/${FIGURE_COUNT} 들킴`), captions);

    await page.getByRole("button", { name: "정산에 추가" }).click();
    const payer = await page.locator("select.settle-select").last().evaluate((s) => s.options[s.selectedIndex].text);
    const title = await page.locator("input[placeholder^='정산 이름']").last().inputValue();
    assert.equal(payer, "지영");
    assert.match(title, /숨바꼭질 게임$/);
    assert.deepEqual(errors, []);
    await page.close();
  });
}
