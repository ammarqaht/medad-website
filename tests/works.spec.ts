import { expect, test } from '@playwright/test';

const SLUGS = ['halqah', 'tasyeer-tasjeel', 'tasyeer-tahfeez', 'injaz', 'nabda', 'malamih'];

test.describe('works gallery', () => {
  test('should list the five works, each linking to its page', async ({ page }) => {
    await page.goto('/works');
    const links = page.locator('a[data-sheet]');
    await expect(links).toHaveCount(SLUGS.length);
    for (const slug of SLUGS) await expect(page.locator(`a[data-sheet][href="/works/${slug}"]`)).toHaveCount(1);
  });

  test('should preselect an arm from ?arm= and return to all when pressed again', async ({ page }) => {
    await page.goto('/works?arm=live');
    await expect(page.locator('[data-arm="digital"]')).toBeHidden();
    await expect(page.locator('[data-arm="live"]')).toBeVisible();
    const live = page.locator('[data-filter="live"]');
    await expect(live).toHaveAttribute('aria-pressed', 'true');
    await live.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-arm="digital"]')).toBeVisible();
    await expect(page.locator('[data-filter="all"]')).toHaveAttribute('aria-pressed', 'true');
    expect(new URL(page.url()).search).toBe('');
  });

  test('should open a work page from a sheet', async ({ page }) => {
    await page.goto('/works');
    await page.locator('a[data-sheet][href="/works/nabda"]').click();
    await page.waitForURL('**/works/nabda');
    await expect(page.locator('h1')).toContainText('نبضة');
  });

  test('should not load the Halqah island on / or /works', async ({ page }) => {
    for (const path of ['/', '/works']) {
      const scripts: string[] = [];
      page.on('request', (r) => scripts.push(r.url()));
      await page.goto(path, { waitUntil: 'networkidle' });
      expect(scripts.some((u) => /HalqahDemo/.test(u))).toBe(false);
      await expect(page.locator('astro-island')).toHaveCount(0);
    }
  });
});

test.describe('work pages', () => {
  for (const width of [375, 768, 1440]) {
    test(`should not scroll sideways at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ['/works', ...SLUGS.map((s) => `/works/${s}`)]) {
        await page.goto(path);
        const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
        expect(sw, path).toBeLessThanOrEqual(cw);
      }
    });
  }

  test('should show the pending sheet with a way back on works without a demo', async ({ page }) => {
    await page.goto('/works/malamih');
    await expect(page.locator('.pend a[href="/works"]')).toBeVisible();
    await expect(page.locator('astro-island')).toHaveCount(0);
  });
});

test.describe('Halqah demo', () => {
  test('should share what the teacher saves with the supervisor and the student, with no network or storage', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __touched: string[] };
      w.__touched = [];
      const ls = Storage.prototype.setItem;
      Storage.prototype.setItem = function (this: Storage, k: string, v: string) {
        if (this === window.localStorage) w.__touched.push(`localStorage:${k}`);
        return ls.call(this, k, v);
      };
      const f = window.fetch;
      window.fetch = (...a: Parameters<typeof fetch>) => {
        w.__touched.push(`fetch:${String(a[0])}`);
        return f(...a);
      };
    });
    await page.goto('/works/halqah');
    const demo = page.locator('.hq');
    await demo.scrollIntoViewIfNeeded();
    await expect(demo.getByRole('button', { name: 'مشرف', exact: true })).toHaveAttribute('aria-pressed', 'true');

    await demo.getByRole('button', { name: 'معلم', exact: true }).click();
    // Future days are refused.
    await demo.getByRole('button', { name: /الخميس/ }).click();
    await expect(demo.locator('.hq-alert')).toBeVisible();

    const card = demo.locator('.hq-card').first();
    await card.getByRole('radio', { name: 'متأخر' }).check();
    await card.getByRole('button', { name: /التسميع/ }).click();
    await card.locator('.hq-check input').nth(2).check();
    await card.locator('.hq-field input').nth(2).fill('ملاحظة تجريبية');
    await card.getByRole('button', { name: /حفظ/ }).click();
    await expect(card.locator('.hq-stamp')).toBeVisible();

    await demo.getByRole('button', { name: 'مشرف', exact: true }).click();
    await demo.locator('.hq-circle').first().getByRole('button').click();
    await expect(demo.locator('.hq-row').first()).toContainText('متأخر');

    await demo.getByRole('button', { name: 'طالب', exact: true }).click();
    await expect(demo.locator('.hq-dayview')).toContainText('ملاحظة تجريبية');

    await demo.getByRole('button', { name: 'إعادة' }).click();
    await demo.getByRole('button', { name: 'طالب', exact: true }).click();
    await expect(demo.locator('.hq-dayview')).not.toContainText('ملاحظة تجريبية');

    const touched = await page.evaluate(() => (window as unknown as { __touched: string[] }).__touched);
    expect(touched).toEqual([]);
  });
});

test.describe('works accessibility', () => {
  for (const path of ['/works', '/works/halqah', '/works/nabda']) {
    test(`should have no serious axe violations on ${path}`, async ({ page }) => {
      const { default: AxeBuilder } = await import('@axe-core/playwright');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(path);
      await page.locator('main').evaluate((m) => m.scrollIntoView());
      await page.waitForTimeout(800);
      const r = await new AxeBuilder({ page }).include('main').analyze();
      const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
    });
  }
});
