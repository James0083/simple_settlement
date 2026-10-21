/* 새 미니게임 5종 — 공개 전 잠금, 끝까지 하기, 정산에 추가 (반응속도 · 복불복 나눠내기 · 탑 쌓기 · 기억력 릴레이 · 라이어 게임) */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startApp, collectErrors, openWithStorage } from "./helpers.js";
import { LIAR_CATEGORIES } from "../../src/games/liarWords.js";

let app;
before(async () => {
  app = await startApp();
});
after(async () => {
  await app?.close();
});

const roster = (...names) => names.map((name) => ({ name, account: "" }));
const NAMES = ["민수", "지영", "현우"];

// 공개 전에도 해 볼 수 있게 미리 열기 권한을 켜고 게임을 연다
async function openGame(page, gameName, names = NAMES) {
  await openWithStorage(page, `${app.url}/#/games`, { roster: roster(...names), entitlements: { previewGames: true } });
  await page.locator("button.game-card", { hasText: gameName }).click();
}
const bigBtn = (page, text) => page.locator("button.settle-calc-btn", { hasText: text });
const banner = async (page) => (await page.locator("[aria-live=polite] span").nth(1).innerText()).trim();
const resultName = async (page) => (await page.getByText(/^오늘 계산은 .+님!$/).innerText()).match(/^오늘 계산은 (.+)님!$/)[1];
const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

test("공개 전에는 다섯 게임 모두 잠겨 있다", async () => {
  const page = await app.browser.newPage();
  await openWithStorage(page, `${app.url}/#/games`, { roster: roster(...NAMES) });
  const schedule = [
    ["반응속도", "2026-11-09", "11월 9일(월)"],
    ["복불복 나눠내기", "2026-11-16", "11월 16일(월)"],
    ["탑 쌓기", "2026-11-23", "11월 23일(월)"],
    ["기억력 릴레이", "2026-11-30", "11월 30일(월)"],
    ["라이어 게임", "2026-12-07", "12월 7일(월)"],
  ];
  for (const [name, date, label] of schedule) {
    if (Date.now() >= Date.parse(`${date}T00:00:00+09:00`)) continue;
    const card = page.locator("button.game-card", { hasText: name });
    assert.ok((await card.innerText()).includes(`${label} 공개`), name);
  }
  await page.close();
});

test("반응속도 — 부정 출발한 사람이 당첨", async () => {
  const page = await app.browser.newPage({ viewport: { width: 360, height: 800 } });
  const errors = collectErrors(page);
  await openGame(page, "반응속도");
  await bigBtn(page, "게임 시작").click();
  let fouled;
  for (let turn = 0; turn < NAMES.length; turn++) {
    await bigBtn(page, "준비됐어요").click();
    const who = await banner(page);
    if (turn === 0) {
      fouled = who;
      await page.locator("button", { hasText: "기다려요" }).click(); // 초록 전에 누름
      await page.getByText("부정 출발!").waitFor();
    } else {
      const go = page.locator("button", { hasText: "지금!" });
      await go.waitFor({ timeout: 8000 });
      await page.waitForTimeout(150); // 초록 뒤 50ms 안에 누르면 미리 누른 것으로 친다 — 사람처럼 조금 늦게
      await go.click();
      await page.getByText("반응 시간").waitFor();
    }
  }
  await bigBtn(page, "확인").waitFor();
  assert.equal(await page.getByText("부정 출발", { exact: true }).count(), 1);
  assert.equal(await noHScroll(page), true);
  await bigBtn(page, "확인").click();
  assert.equal(await resultName(page), fouled);
  assert.deepEqual(errors, []);
  await page.close();
});

test("복불복 나눠내기 — 봉투를 다 열고, 정산에 추가하면 금액 따로 입력이 채워진다", async () => {
  const page = await app.browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = collectErrors(page);
  await openGame(page, "복불복 나눠내기");
  const total = page.locator("#splitluck-total");
  await total.fill("2500");
  assert.ok(await bigBtn(page, "봉투 나누기").isDisabled(), "3명이면 3,000원 이상");
  await total.fill("60000");
  assert.equal(await total.inputValue(), "60,000");
  await bigBtn(page, "봉투 나누기").click();

  const got = {};
  for (let turn = 0; turn < NAMES.length; turn++) {
    const who = await banner(page);
    await page.getByRole("button", { name: /^봉투 \d+$/ }).first().click();
    got[who] = Number((await page.getByText(/^[\d,]+원$/).first().innerText()).replace(/\D/g, ""));
    await bigBtn(page, turn === NAMES.length - 1 ? "결과 보기" : "님 차례로").click();
    if (turn === 0) {
      // 다음 사람 화면 — 열린 봉투에 이름과 금액이 남아 있다
      const opened = page.getByRole("button", { name: new RegExp(`^${who}님이 연 봉투`) });
      assert.match(await opened.innerText(), new RegExp(`${who}\\s+${got[who].toLocaleString("ko-KR")}원`));
    }
  }
  assert.equal(Object.values(got).reduce((s, x) => s + x, 0), 60000);
  const top = Object.entries(got).sort((a, b) => b[1] - a[1])[0][0];
  await bigBtn(page, "확인").click();
  assert.equal(await page.getByText(/님이 제일 많이 내요!$/).last().innerText(), `${top}님이 제일 많이 내요!`);

  await page.getByRole("button", { name: "정산에 추가" }).click();
  assert.match(await page.locator("input[placeholder^='정산 이름']").last().inputValue(), /복불복 나눠내기$/);
  for (const name of NAMES) {
    assert.equal(Number((await page.getByLabel(`${name} 개별 금액`).inputValue()).replace(/\D/g, "")), got[name], name);
  }
  assert.equal(await page.getByText("공통 금액 (1/n)").locator("xpath=following-sibling::span").innerText(), "0원");
  // 결제자만 고르면 계산된다
  await page.locator("select.settle-select").last().selectOption({ label: "민수" });
  await page.locator("button.settle-calc-btn").click();
  await page.getByText("정산 완료").waitFor();
  assert.deepEqual(errors, []);
  await page.close();
});

test("탑 쌓기 — 블록을 놓친 사람이 당첨", async () => {
  const page = await app.browser.newPage({ viewport: { width: 360, height: 800 } });
  const errors = collectErrors(page);
  await openGame(page, "탑 쌓기");
  await bigBtn(page, "게임 시작").click();
  await bigBtn(page, "시작").click();
  const pad = page.getByRole("button", { name: "블록 놓기" });
  const missed = page.getByText(/^놓쳤어요!/);
  let who;
  for (let i = 0; i < 40 && !(await missed.count()); i++) {
    const ready = bigBtn(page, "준비됐어요");
    if (await ready.count()) {
      // 버튼 대신 판을 눌러도 시작된다 — 시작되지 않으면 블록이 안 나와 40번 안에 끝나지 않는다
      await pad.click();
      await page.waitForTimeout(80);
    }
    who = await banner(page);
    // 나오자마자 누르면 끝에서 멈춰 금방 빗나간다
    await pad.click();
    await page.waitForTimeout(320);
  }
  assert.ok(await missed.count(), "40번 안에 놓쳐야 한다");
  assert.equal(await page.locator("p", { hasText: /층 ·$/ }).count(), 0, "층 표시 끝에 점이 남지 않는다");
  const box = await pad.boundingBox();
  assert.ok(box.width <= 360);
  assert.equal(await noHScroll(page), true);
  await page.getByText(/^오늘 계산은/).waitFor();
  assert.equal(await resultName(page), who);
  assert.deepEqual(errors, []);
  await page.close();
});

test("기억력 릴레이 — 순서를 다시 보여주고, 틀린 사람이 당첨", async () => {
  const page = await app.browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = collectErrors(page);
  await openGame(page, "기억력 릴레이");
  await page.getByRole("button", { name: "보여줌 (쉬움)" }).click();
  await bigBtn(page, "게임 시작").click();

  const pads = ["빨강", "파랑", "초록", "노랑"];
  const press = async (label) => {
    await page.getByRole("button", { name: label, exact: true }).click();
    await page.waitForTimeout(160); // 두 번 눌림 방지 시간
  };
  const seq = [];
  // 네 차례는 맞게 누르고 하나씩 더한다
  for (let turn = 0; turn < 4; turn++) {
    await bigBtn(page, "준비됐어요").click();
    if (seq.length) await page.getByText(/1 \/ \d+번째/).waitFor({ timeout: 8000 }); // 다시 보여주기가 끝나면 입력
    for (const p of seq) await press(p);
    const add = pads[turn % 4];
    await press(add);
    seq.push(add);
    await page.getByText(`통과! 이제 ${seq.length}개`).waitFor();
    await bigBtn(page, "님 차례로").click();
  }
  // 다섯째 차례: 첫 번째를 틀리게
  await bigBtn(page, "준비됐어요").click();
  const loser = await banner(page);
  await page.getByText(/1 \/ 4번째/).waitFor({ timeout: 8000 });
  await press("노랑");
  assert.equal(await page.getByText(`${loser}님 틀렸어요!`).count(), 1);
  assert.ok(await page.getByText("1번째는 빨강인데 노랑을 눌렀어요").isVisible());
  await bigBtn(page, "확인").click();
  assert.equal(await resultName(page), loser);
  assert.deepEqual(errors, []);
  await page.close();
});

test("라이어 게임 — 2명·11명은 못 하고, 엉뚱한 사람/라이어를 지목하면 지목된 사람이 당첨", async () => {
  const page = await app.browser.newPage({ viewport: { width: 360, height: 800 } });
  const errors = collectErrors(page);

  await openGame(page, "라이어 게임", ["민수", "지영"]);
  assert.equal(await page.locator("[role=status]").innerText(), "라이어 게임은 3명 이상 필요해요 (지금 2명)");
  const eleven = Array.from({ length: 11 }, (_, i) => `P${i + 1}`);
  await openGame(page, "라이어 게임", eleven);
  assert.equal(await page.locator("[role=status]").innerText(), "라이어 게임은 최대 10명까지 할 수 있어요 (지금 11명)");

  await openGame(page, "라이어 게임");
  const foods = LIAR_CATEGORIES.find((c) => c.id === "food").words;
  for (const catchLiar of [false, true]) {
    await page.getByRole("button", { name: "음식", exact: true }).click();
    await bigBtn(page, "제시어 정하기").click();
    let liar;
    const seen = new Set();
    for (let k = 0; k < NAMES.length; k++) {
      await bigBtn(page, "제시어 보기").click();
      const who = await banner(page);
      // 화면에 보이는 문단 중 음식 제시어와 똑같은 것
      const words = await page.evaluate(
        (list) => [...document.querySelectorAll("p")].map((p) => p.textContent.trim()).filter((t) => list.includes(t)),
        foods
      );
      if (await page.getByText("당신은 라이어예요").count()) {
        assert.equal(liar, undefined, "라이어는 한 명");
        assert.deepEqual(words, [], "라이어에게는 제시어가 안 보인다");
        liar = who;
      } else {
        assert.equal(words.length, 1, `${who}: ${words}`);
        seen.add(words[0]);
      }
      await bigBtn(page, "확인했어요").click();
    }
    assert.ok(NAMES.includes(liar));
    assert.equal(seen.size, 1, "라이어가 아닌 사람은 모두 같은 제시어");
    const firstSpeaker = (await page.locator("span", { hasText: /^설명 시작$/ }).locator("xpath=following-sibling::span").innerText()).trim();
    assert.notEqual(firstSpeaker, liar, "라이어는 첫 설명자가 아니다");
    await bigBtn(page, "지목하러 가기").click();
    const target = catchLiar ? liar : NAMES.find((n) => n !== liar);
    await page.getByRole("radio", { name: target }).click();
    await bigBtn(page, `${target}님으로 결정`).click();
    await page.getByText(catchLiar ? "라이어를 잡았어요!" : `${target}님은 라이어가 아니었어요!`).waitFor();
    await bigBtn(page, "확인").click();
    assert.equal(await resultName(page), target);
    if (!catchLiar) await page.getByRole("button", { name: "한 판 더" }).click();
  }
  assert.deepEqual(errors, []);
  await page.close();
});

// 작은 화면(375×667)에서도 차례마다 무대가 화면 맨 위로 올라와 버튼이 하단 탭바에 가리지 않는다
test("기억력 릴레이 — 375×667 에서 차례마다 버튼 4개가 모두 탭바 위에 보인다", async () => {
  const page = await app.browser.newPage({ viewport: { width: 375, height: 667 } });
  await openGame(page, "기억력 릴레이");
  await bigBtn(page, "게임 시작").click();
  const tabBarTop = await page.getByRole("navigation", { name: "주요 메뉴" }).evaluate((n) => n.getBoundingClientRect().top);
  const allVisible = async () => {
    await page.waitForTimeout(700); // 부드러운 스크롤이 끝나기를 기다린다
    for (const label of ["빨강", "파랑", "초록", "노랑"]) {
      const b = await page.getByRole("button", { name: label, exact: true }).boundingBox();
      assert.ok(b.y >= 0 && b.y + b.height <= tabBarTop, `${label} ${Math.round(b.y)}~${Math.round(b.y + b.height)} / 탭바 ${tabBarTop}`);
    }
  };
  for (let turn = 0; turn < 3; turn++) {
    await bigBtn(page, "준비됐어요").click();
    await allVisible();
    for (let k = 0; k <= turn; k++) {
      await page.getByRole("button", { name: "빨강", exact: true }).click();
      await page.waitForTimeout(160);
    }
    await bigBtn(page, "님 차례로").click();
  }
  await page.close();
});

test("게임 목록 — ★ 로 맨 앞에 고정하고 기기에 남는다, NEW 뱃지, 잠긴 게임은 맨 뒤", async () => {
  const page = await app.browser.newPage({ viewport: { width: 375, height: 667 } });
  const errors = collectErrors(page);
  await openWithStorage(page, `${app.url}/#/games`, { roster: roster(...NAMES) });
  const names = () => page.locator("button.game-card").evaluateAll((cards) => cards.map((c) => c.querySelector("span:nth-child(2)").firstChild.textContent.trim()));
  const lockedFlags = () => page.locator("button.game-card").evaluateAll((cards) => cards.map((c) => c.classList.contains("game-card-locked")));

  const flags = await lockedFlags();
  const firstLocked = flags.indexOf(true);
  if (firstLocked >= 0) assert.ok(flags.slice(firstLocked).every(Boolean), "잠긴 게임은 모두 맨 뒤");
  assert.equal(await page.getByRole("button", { name: "기본 순서로" }).count(), 0);
  assert.equal(await page.getByRole("button", { name: /맨 앞에 고정$/ }).count(), flags.filter((f) => !f).length, "잠긴 게임에는 ★ 가 없다");

  // 10초 맞추기(10/19 공개)는 11/2 까지 NEW
  if (Date.now() < Date.parse("2026-11-02T00:00:00+09:00")) {
    assert.ok((await page.locator("button.game-card", { hasText: "10초 맞추기" }).innerText()).includes("NEW"));
  }
  assert.equal((await page.locator("button.game-card", { hasText: "룰렛" }).first().innerText()).includes("NEW"), false);

  await page.getByRole("button", { name: "악어이빨 맨 앞에 고정" }).click();
  await page.getByRole("button", { name: "사다리 타기 맨 앞에 고정" }).click();
  assert.deepEqual((await names()).slice(0, 2), ["악어이빨", "사다리 타기"]);
  assert.equal(await page.getByRole("button", { name: "악어이빨 맨 앞에 고정" }).getAttribute("aria-pressed"), "true");

  await page.reload();
  assert.deepEqual((await names()).slice(0, 2), ["악어이빨", "사다리 타기"], "새로고침 뒤에도 유지");

  await page.getByRole("button", { name: "악어이빨 맨 앞에 고정" }).click(); // 다시 누르면 빠진다
  assert.equal((await names())[0], "사다리 타기");
  await page.getByRole("button", { name: "기본 순서로" }).click();
  assert.equal((await names())[0], "룰렛");
  assert.equal(await noHScroll(page), true);
  assert.deepEqual(errors, []);
  await page.close();
});
