import { expect, test, type Page } from '@playwright/test';

/* Nabda demo (FR-19, FR-20). The page clock is faked so rounds run in
   milliseconds of test time and the countdown can be checked exactly. */

async function open(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __touched: string[] };
    w.__touched = [];
    const ls = Storage.prototype.setItem;
    Storage.prototype.setItem = function (this: Storage, k: string, v: string) {
      w.__touched.push(`storage:${k}`);
      return ls.call(this, k, v);
    };
    const f = window.fetch;
    window.fetch = (...a: Parameters<typeof fetch>) => {
      w.__touched.push(`fetch:${String(a[0])}`);
      return f(...a);
    };
  });
  await page.clock.install();
  await page.goto('/works/nabda');
  const demo = page.locator('.nb');
  await demo.scrollIntoViewIfNeeded();
  await expect(demo.getByRole('button', { name: 'ابدأ الجولة' })).toBeVisible();
  // wait for hydration: the island leaves the SSR marker once interactive
  await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
  return demo;
}

const yourSecs = (page: Page) => page.locator('.nb-team.is-you .nb-team__secs .nb-sr').textContent();

test.describe('Nabda demo', () => {
  test('should play a round to its end, pause the clocks, and touch no network or storage', async ({ page }) => {
    const demo = await open(page);
    await demo.getByRole('button', { name: 'ابدأ الجولة' }).click();
    await expect(demo.locator('.nb-team')).toHaveCount(3);
    await page.clock.runFor(3200);
    await expect(demo.locator('.nb-opt')).toHaveCount(3);

    // pause: the clocks stand still
    await demo.getByRole('button', { name: 'إيقاف' }).click();
    const before = await yourSecs(page);
    await page.clock.runFor(5000);
    expect(await yourSecs(page)).toBe(before);
    await demo.getByRole('button', { name: 'استئناف' }).click();

    // answer from the keyboard
    await demo.locator('.nb-opt').first().focus();
    await page.keyboard.press('Enter');
    await expect(demo.locator('.nb-opt.is-right')).toHaveCount(1);

    // let pulses run out: someone stops and the round ends for everyone
    await page.clock.runFor(70_000);
    await expect(demo.getByRole('heading', { name: /انتهت الجولة/ })).toBeVisible();
    await expect(demo.locator('.nb-rank__row')).toHaveCount(3);
    await expect(demo.locator('.nb-rank__row.is-dead')).not.toHaveCount(0);

    const touched = await page.evaluate(() => (window as unknown as { __touched: string[] }).__touched);
    expect(touched).toEqual([]);
  });

  test('should drain your pulse by the real seconds played', async ({ page }) => {
    const demo = await open(page);
    await demo.getByRole('button', { name: 'ابدأ الجولة' }).click();
    await page.clock.runFor(3000 + 10_500);
    expect(await yourSecs(page)).toBe('١٥ ثانية');
  });

  test('should offer the three cards and say why a card cannot be bought yet', async ({ page }) => {
    const demo = await open(page);
    await demo.getByRole('button', { name: 'ابدأ الجولة' }).click();
    await page.clock.runFor(3000 + 26_000);
    await expect(demo.getByRole('heading', { name: 'متجر البطاقات' })).toBeVisible();
    const cards = demo.locator('.nb-cardx');
    await expect(cards).toHaveCount(3);
    await expect(cards.nth(0)).toContainText('وقت إضافي');
    await expect(cards.nth(1)).toContainText('تجميد');
    await expect(cards.nth(2)).toContainText('مضاعفة');
    // freeze needs a team first
    await expect(cards.nth(1).getByRole('button', { name: 'اشتر' })).toHaveAttribute('aria-disabled', 'true');
    await expect(cards.nth(1)).toContainText('اختر فريقا');

    await demo.getByRole('button', { name: 'جولة أخرى' }).click();
    await expect(demo.locator('.nb-bar__round')).toContainText('الجولة ٢');
    await demo.getByRole('button', { name: 'إعادة' }).click();
    await expect(demo.getByRole('button', { name: 'ابدأ الجولة' })).toBeVisible();
  });

  test('should fit the round in the phone screen at 375px without inner scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 760 });
    const demo = await open(page);
    await demo.getByRole('button', { name: 'ابدأ الجولة' }).click();
    await page.clock.runFor(3200);
    const [sh, ch, sw, cw] = await page.locator('[data-screen]').evaluate((s) => [s.scrollHeight, s.clientHeight, s.scrollWidth, s.clientWidth]);
    expect(sw).toBeLessThanOrEqual(cw);
    expect(sh).toBeLessThanOrEqual(ch);
  });
});
