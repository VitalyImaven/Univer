import { expect, test, type Page } from '@playwright/test';

async function createLearner(page: Page, name = 'דני') {
  await page.goto('./');
  await page.locator('.profile-form input').fill(name);
  await page.locator('.profile-form button[type=submit]').click();
  await expect(page.locator('.hero h1')).toContainText(name);
}
async function typeAnswer(page: Page, value: string) {
  for (const ch of value) await page.locator(`.key:text-is("${ch}")`).click();
  await page.getByRole('button', { name: 'בדיקה' }).click();
}
/** Polls, because entrance animations may briefly extend past the edge. */
async function noHorizontalOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), { timeout: 4000, message: 'page: ' + page.url() }).toBeLessThanOrEqual(0);
}

test('full learner flow: lesson, hint, wrong and right answers, summary, persistence', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await createLearner(page);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

  await page.goto('./#/lesson/mul-meaning');
  await expect(page.locator('.steps li')).toHaveCount(3);
  await page.getByRole('button', { name: 'מגלים פתרון' }).first().click();
  await expect(page.locator('.sample-solution')).toBeVisible();
  await page.getByRole('button', { name: 'מתחילים לתרגל' }).first().click();

  // Question 1: hint, wrong twice -> solution shown.
  await page.getByRole('button', { name: 'רמז' }).click();
  await expect(page.locator('.bubble')).toContainText('רמז');
  await typeAnswer(page, '1');
  await expect(page.locator('.bubble')).toContainText('נסו שוב');
  await typeAnswer(page, '1');
  await expect(page.locator('.solution-answer')).toBeVisible();
  await page.locator('.solution .btn').click();

  // Question 2: correct on the first try (arithmetic is rendered left-to-right).
  const expression = await page.locator('.expression').innerText();
  const [, a, b] = expression.replace(/\s+/g, ' ').match(/(\d+) × (\d+)/)!;
  await expect(page.locator('.question-head .mx')).toHaveAttribute('dir', 'ltr');
  await typeAnswer(page, String(Number(a) * Number(b)));
  await expect(page.locator('.solution-correct')).toBeVisible();
  await expect(page.locator('.score-chip')).toContainText('1');

  await page.getByRole('button', { name: 'סיום' }).click();
  await expect(page.locator('.result-numbers')).toContainText('1/2');
  await expect(page.locator('.mistake')).toHaveCount(1);

  // Each answer is recorded exactly once: 10 points for the right one, 2 for the wrong one.
  await page.reload();
  await expect(page.locator('.points')).toContainText('12');
  expect(errors).toEqual([]);
});

test('a fixed-length session ends on its own and a long session does not crash', async ({ page }) => {
  await createLearner(page);
  await page.goto('./#/practice/num-1000');
  for (let i = 0; i < 10; i++) {
    await expect(page.locator('.practice-count')).toContainText(`שאלה ${i + 1} מתוך 10`);
    await page.locator('.option').first().click();
    await page.getByRole('button', { name: 'בדיקה' }).click();
    if (await page.locator('.bubble-retry').count()) { await page.locator('.option:not([disabled])').first().click(); await page.getByRole('button', { name: 'בדיקה' }).click(); }
    await page.locator('.solution .btn').click();
  }
  await expect(page.locator('.result')).toBeVisible();
  await expect(page.locator('.result-numbers')).toContainText('/10');
});

test('every lesson page and visual exercise type renders', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await createLearner(page);
  let tiles = 0;
  for (const book of ['9', '10', '11', '12', 'cross']) {
    await page.goto(`./#/lessons/${book}`);
    await expect(page.locator('.lesson-tile').first()).toBeVisible();
    tiles += await page.locator('.lesson-tile').count();
  }
  expect(tiles).toBe(78);
  for (const id of ['clock-advanced', 'time-elapsed', 'data-bars', 'data-double', 'data-table', 'data-pictogram', 'number-line', 'tri-sides', 'tri-angles', 'angle-types', 'angle-compare', 'box-net', 'place-10000', 'area-compare', 'perimeter-triangle']) {
    await page.goto(`./#/lesson/${id}`);
    await expect(page.locator('.lesson-hero h1')).toBeVisible();
    await page.goto(`./#/practice/${id}`);
    await expect(page.locator('.question-card .math-visual')).toBeVisible();
    await noHorizontalOverflow(page);
  }
  expect(errors).toEqual([]);
});

test('parent area: gate, report, backup and restore', async ({ page }) => {
  await createLearner(page);
  await page.goto('./#/practice/mul-meaning');
  await typeAnswer(page, '1');
  await page.goto('./#/parent');
  const gate = await page.locator('.gate .expression').innerText();
  const [, a, b] = gate.replace(/\s+/g, ' ').match(/(\d+) × (\d+)/)!;
  await page.locator('.gate input').fill(String(Number(a) * Number(b)));
  await page.locator('.gate button[type=submit]').click();
  await expect(page.locator('.parent')).toContainText('שאלות שנענו');
  await noHorizontalOverflow(page);

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'שמירת גיבוי' }).click();
  const file = await (await download).path();

  page.once('dialog', d => d.accept());
  await page.getByRole('button', { name: 'איפוס ההתקדמות' }).click();
  await expect(page.locator('.points')).toContainText('0');

  page.once('dialog', d => d.accept());
  await page.locator('input[type=file]').setInputFiles(file);
  await expect(page.locator('.points')).toContainText('2');
});

test('home, rewards, times table and profiles fit the screen', async ({ page }) => {
  await createLearner(page);
  for (const route of ['', 'lessons/9', 'lesson/mul-meaning', 'daily', 'rewards', 'table', 'profiles']) {
    await page.goto(`./#/${route}`);
    await expect(page.locator('main')).toBeVisible();
    await noHorizontalOverflow(page);
  }
  await page.goto('./#/table');
  await page.getByRole('gridcell', { name: '7 כפול 8' }).click();
  await expect(page.locator('.table-side .expression')).toContainText('56');
});
