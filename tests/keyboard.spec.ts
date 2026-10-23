import { test, expect } from '@playwright/test';
import { PAGES, stubExternal } from './helpers';

/* NFR-09 keyboard access and focus ring; Button pressed state. */

test.beforeEach(async ({ context }) => stubExternal(context));

for (const path of PAGES) {
  test(`should reach the skip link first with Tab and jump to main on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.keyboard.press('Tab');
    const skip = page.locator('a.skip');
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await expect(skip).toHaveAttribute('href', '#content');
    await page.keyboard.press('Enter');
    await expect(page.locator('main#content')).toBeFocused();
    // Next Tab continues into the page, after the header.
    await page.keyboard.press('Tab');
    const inHeader = await page.evaluate(() => !!document.activeElement?.closest('header'));
    expect(inHeader).toBe(false);
  });

  test(`should show a visible 3px focus ring on every focusable element on ${path}`, async ({ page }) => {
    await page.goto(path);
    const seen: string[] = [];
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return {
          id: el.outerHTML.slice(0, 70),
          style: cs.outlineStyle,
          width: cs.outlineWidth,
          visible: r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight,
        };
      });
      if (!info || seen.includes(info.id)) break;
      seen.push(info.id);
      expect(info.style, info.id).toBe('solid');
      expect(info.width, info.id).toBe('3px');
      expect(info.visible, info.id).toBe(true);
    }
    expect(seen.length).toBeGreaterThanOrEqual(4);
  });
}

test('should add .is-pressed on Enter keydown on a .btn and remove it on keyup', async ({ page, context }) => {
  await page.goto('/');
  const btn = page.locator('header a.btn');
  await btn.focus();
  const popup = context.waitForEvent('page');
  await page.keyboard.down('Enter');
  await expect(btn).toHaveClass(/\bis-pressed\b/);
  await (await popup).close();
  await page.bringToFront();
  await page.keyboard.up('Enter');
  await expect(btn).not.toHaveClass(/\bis-pressed\b/);
});

test('should add .is-pressed on Space keydown on a .btn', async ({ page }) => {
  await page.goto('/404');
  const btn = page.locator('main a.btn').first();
  await btn.focus();
  await page.keyboard.down(' ');
  await expect(btn).toHaveClass(/\bis-pressed\b/);
  await page.keyboard.up(' ');
  await expect(btn).not.toHaveClass(/\bis-pressed\b/);
});

test('should navigate with the ink flood from a keyboard Enter on an internal button', async ({ page }) => {
  await page.goto('/');
  await page.locator('main a.btn[href="/works"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForURL('**/works');
  await expect(page.locator('h1')).toBeVisible();
});
