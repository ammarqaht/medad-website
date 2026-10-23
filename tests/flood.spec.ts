import { test, expect } from '@playwright/test';
import { recordFlood, floodIsHidden, stubExternal, WORKS_LINK } from './helpers';

/* FR-03 ink flood between pages, NFR-06 reduced motion. */

test.beforeEach(async ({ context }) => stubExternal(context));

test('should cover, then drain the ink when going from / to /works', async ({ page }) => {
  const log = await recordFlood(page);
  await page.goto('/');
  expect(await floodIsHidden(page)).toBe(true);

  const t0 = Date.now();
  await page.locator(WORKS_LINK).click();
  await page.waitForURL('**/works');
  await expect(page.locator('html')).not.toHaveAttribute('data-flood', /.*/, { timeout: 2500 });
  await expect.poll(() => floodIsHidden(page), { timeout: 2500 }).toBe(true);
  const total = Date.now() - t0;

  expect(log.some((l) => l.startsWith('FLOOD:cover @/'))).toBe(true);
  expect(log.some((l) => l.startsWith('FLOOD:arrive-covered @/works'))).toBe(true);
  expect(log.some((l) => l.startsWith('FLOOD:recede @/works'))).toBe(true);
  // FR-03 (owner, revised): a fixed-length transition, cover 420ms + hold until 600ms
  // into the new page + drain 420ms, about 1.4s, whatever the load speed. Measured in-page.
  await expect.poll(() => log.find((l) => l.startsWith('FLOOD:done')), { timeout: 2500 }).toBeTruthy();
  const inPage = Number(/FLOOD:done (\d+)/.exec(log.find((l) => l.startsWith('FLOOD:done'))!)![1]);
  test.info().annotations.push({ type: 'flood ms', description: `in-page ${inPage}, wall-clock incl. test polling ${total}` });
  expect(inPage).toBeGreaterThan(1300);
  expect(inPage).toBeLessThan(1800);

  // Page is usable: the topmost element at the centre is page content, not ink.
  const top = await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest('.flood'));
  expect(top).toBeNull();
  await expect(page.locator('h1')).toBeVisible();
});

test('should also flood from the hero /works button and from works back to home via the logo', async ({ page }) => {
  const log = await recordFlood(page);
  await page.goto('/');
  await page.locator('main a.btn[href="/works"]').click();
  await page.waitForURL('**/works');
  await expect.poll(() => floodIsHidden(page), { timeout: 2500 }).toBe(true);
  await page.locator('a.topbar__logo').click();
  await page.waitForURL((u) => u.pathname === '/');
  await expect(page.locator('html')).not.toHaveAttribute('data-flood', /.*/, { timeout: 2500 });
  await expect.poll(() => floodIsHidden(page), { timeout: 2500 }).toBe(true);
  expect(log.filter((l) => l.startsWith('FLOOD:cover')).length).toBe(2);
});

test('should return to a usable, uncovered page with the back button', async ({ page }) => {
  await page.goto('/');
  await page.locator(WORKS_LINK).click();
  await page.waitForURL('**/works');
  await expect.poll(() => floodIsHidden(page), { timeout: 2500 }).toBe(true);

  await page.goBack();
  await page.waitForURL((u) => u.pathname === '/');
  await expect(page.locator('html')).not.toHaveAttribute('data-flood', /.*/, { timeout: 2500 });
  await expect.poll(() => floodIsHidden(page), { timeout: 2500 }).toBe(true);
  await expect(page.locator('.flood')).not.toHaveClass(/is-covering/);
  const top = await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest('.flood'));
  expect(top).toBeNull();

  // Still navigable after coming back.
  await page.locator(WORKS_LINK).click();
  await page.waitForURL('**/works');
  await expect.poll(() => floodIsHidden(page), { timeout: 2500 }).toBe(true);

  await page.goForward().catch(() => undefined);
  await page.goBack();
  await expect.poll(() => floodIsHidden(page), { timeout: 2500 }).toBe(true);
});

test('should restore the scroll position when going back', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 600 });
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(100);
  const y = await page.evaluate(() => window.scrollY);
  expect(y).toBeGreaterThan(0);
  await page.locator(WORKS_LINK).click();
  await page.waitForURL('**/works');
  await page.goBack();
  await page.waitForURL((u) => u.pathname === '/');
  // Chromium restores relative to a scroll anchor; it lands within a few px of the
  // saved offset even with JS off or reduced motion (measured 378 for 400 at 1440px),
  // so this is browser behaviour, not the flood. Assert it is restored, not reset to 0.
  await page.waitForTimeout(500);
  const back = await page.evaluate(() => window.scrollY);
  expect(Math.abs(back - y)).toBeLessThanOrEqual(30);
});

test('should not flood for same-page links or new-tab links', async ({ page, context }) => {
  const log = await recordFlood(page);
  await page.goto('/');
  // Same-page link: the hero cue to #story.
  await page.locator('a.hero__cue[href="#story"]').click();
  await page.waitForTimeout(600);
  expect(new URL(page.url()).pathname).toBe('/');
  expect(log.filter((l) => l.startsWith('FLOOD:cover'))).toEqual([]);

  // New-tab link: the footer WhatsApp link (contact lives only in the closing and footer).
  const [popup] = await Promise.all([
    context.waitForEvent('page'),
    page.locator('footer a[href^="https://wa.me"]').click(),
  ]);
  await popup.close();
  expect(log.filter((l) => l.startsWith('FLOOD:cover'))).toEqual([]);
  expect(await floodIsHidden(page)).toBe(true);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('should navigate without any ink flood', async ({ page }) => {
    const log = await recordFlood(page);
    await page.goto('/');
    await expect(page.locator('.flood')).toHaveCSS('display', 'none');
    await page.locator(WORKS_LINK).click();
    await page.waitForURL('**/works');
    await expect(page.locator('.flood')).toHaveCSS('display', 'none');
    expect(await page.locator('html').getAttribute('data-flood')).toBeNull();
    expect(log.filter((l) => /cover|arrive/.test(l))).toEqual([]);
    expect(await page.evaluate(() => sessionStorage.getItem('medad-flood'))).toBeNull();
  });

  test('should still reveal [data-pop] content with a fade', async ({ page }) => {
    await page.goto('/');
    for (const el of await page.locator('[data-pop]').all()) {
      await el.scrollIntoViewIfNeeded();
      await expect(el).toHaveCSS('opacity', '1', { timeout: 2000 });
      await expect(el).toHaveCSS('scale', /^(1|none)$/);
    }
  });
});
