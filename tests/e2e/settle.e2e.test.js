/* 정산 탭 — 금액 따로 입력 흐름과 결과표 (v2.8.x) */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startApp, collectErrors } from "./helpers.js";

let app;
before(async () => {
  app = await startApp();
});
after(async () => {
  await app?.close();
});

async function setupRound(page) {
  await page.goto(`${app.url}/#/settle`);
  const names = page.getByPlaceholder("이름");
  await names.nth(0).fill("A");
  await names.nth(1).fill("B");
  await names.nth(2).fill("C");
  await page.locator("select.settle-select").first().selectOption({ label: "A" });
}

test("금액 따로 입력 — 공통 금액이 줄고, 결과에 개별 + 공통 내역이 나온다", async () => {
  const page = await app.browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = collectErrors(page);
  await setupRound(page);

  const toggle = page.getByRole("button", { name: /금액 따로 입력/ });
  await toggle.click();
  // 총액이 비어 있으면 안내
  const totalWarn = page.getByText("위에 총 금액을 먼저 입력해주세요");
  assert.ok(await totalWarn.isVisible());

  await page.locator("input.settle-amount-input").first().fill("55000");
  assert.equal(await totalWarn.count(), 0);
  const common = page.getByText("공통 금액 (1/n)").locator("xpath=following-sibling::span");
  assert.equal(await common.innerText(), "55,000원");

  // + 버튼으로 메뉴 두 개 합산
  const a = page.getByLabel("A 개별 금액");
  await a.fill("9000");
  await page.getByLabel("A 메뉴 금액 더하기").click();
  assert.equal(await a.inputValue(), "9000+");
  await page.keyboard.type("4000");
  assert.ok(await page.getByText("= 13,000원").isVisible());
  await page.getByLabel("B 개별 금액").fill("12000");
  await page.getByLabel("C 개별 금액").fill("9000");
  assert.equal(await common.innerText(), "21,000원");
  assert.ok(await page.getByText("1인당 7,000원").isVisible());
  assert.match(await toggle.innerText(), /3명 입력됨/);

  // 개별 합이 총액보다 크면 경고 + 계산 버튼 꺼짐
  await page.getByLabel("C 개별 금액").fill("99000");
  assert.ok(await page.getByText(/개별 금액 합이 총액보다 .*원 많아요/).isVisible());
  assert.ok(await page.locator("button.settle-calc-btn").isDisabled());
  await page.getByLabel("C 개별 금액").fill("9000");

  await page.locator("button.settle-calc-btn").click();
  const result = page.locator("text=정산 완료").locator("xpath=ancestor::div[2]");
  const text = await result.innerText();
  assert.match(text, /부담액\(원\)/);
  assert.ok(text.includes("= 개별 13,000원 + 공통 7,000원"));
  assert.ok(text.includes("= 개별 12,000원 + 공통 7,000원"));
  assert.deepEqual(errors, []);
  await page.close();
});

test("참여자에서 빼면 그 사람의 개별 금액 칸이 사라지고, 다시 넣으면 빈 칸", async () => {
  const page = await app.browser.newPage({ viewport: { width: 390, height: 844 } });
  await setupRound(page);
  await page.locator("input.settle-amount-input").first().fill("30000");
  await page.getByRole("button", { name: /금액 따로 입력/ }).click();
  await page.getByLabel("C 개별 금액").fill("5000");
  await page.locator(".settle-chip-active", { hasText: "C" }).click();
  assert.equal(await page.getByLabel("C 개별 금액").count(), 0);
  await page.locator(".settle-chip-inactive", { hasText: "C" }).click();
  assert.equal(await page.getByLabel("C 개별 금액").inputValue(), "");
  await page.close();
});

test("좁은 화면(320px)에서는 결과표 금액을 이름 아래 줄로 내린다", async () => {
  for (const [width, stacked] of [[390, false], [320, true]]) {
    const page = await app.browser.newPage({ viewport: { width, height: 844 } });
    await setupRound(page);
    await page.locator("input.settle-amount-input").first().fill("4650000");
    await page.locator("button.settle-calc-btn").click();
    const hasHeader = await page.locator("span", { hasText: /^이름$/ }).count();
    assert.equal(hasHeader === 0, stacked, `${width}px`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}px 가로 스크롤`);
    await page.close();
  }
});
