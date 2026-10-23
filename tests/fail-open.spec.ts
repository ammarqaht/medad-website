import { test, expect } from '@playwright/test';
import { blockPageModule, floodIsHidden, stubExternal, WORKS_LINK } from './helpers';

/* NFR-07: content never stays hidden behind motion, even if page JS fails. */

test.beforeEach(async ({ context }) => stubExternal(context));

test('should reveal every [data-pop] element on / and /works with JS on', async ({ page }) => {
  for (const path of ['/', '/works']) {
    await page.goto(path);
    const els = await page.locator('[data-pop]').all();
    expect(els.length).toBeGreaterThan(0);
    for (const el of els) {
      await el.scrollIntoViewIfNeeded();
      await expect(el).toHaveClass(/\bis-in\b/, { timeout: 2000 });
      await expect(el).toHaveCSS('opacity', '1', { timeout: 2000 });
    }
  }
});

test('should show content within 3.5s when the page module script is blocked', async ({ page }) => {
  await blockPageModule(page);
  await page.goto('/');
  // boot.js ran (html.js) but base.ts did not.
  await expect(page.locator('html')).toHaveClass(/\bjs\b/);
  const t0 = Date.now();
  for (const el of await page.locator('[data-pop]').all()) {
    await expect(el).toHaveCSS('opacity', '1', { timeout: 3500 });
  }
  expect(Date.now() - t0).toBeLessThan(3500);
  await expect(page.locator('h1')).toBeVisible();
});

test('should lift the arriving ink within 3s when the page module script is blocked', async ({ page }) => {
  await page.goto('/');
  await blockPageModule(page);
  // Simulate arriving from an ink transition.
  await page.evaluate(() => sessionStorage.setItem('medad-flood', '1'));
  const t0 = Date.now();
  await page.goto('/works');
  await expect(page.locator('html')).toHaveAttribute('data-flood', '');
  await expect(page.locator('html')).not.toHaveAttribute('data-flood', /.*/, { timeout: 3500 });
  expect(Date.now() - t0).toBeLessThan(3500);
  await expect.poll(() => floodIsHidden(page), { timeout: 500 }).toBe(true);
  for (const el of await page.locator('[data-pop]').all()) {
    await el.scrollIntoViewIfNeeded();
    await expect(el).toHaveCSS('opacity', '1', { timeout: 3500 });
  }
});

test('should ship page JS only as external /_astro modules, so aborting them falls back to visible content', async ({ page, request }) => {
  // Astro now emits the page modules as files: no inline module scripts in the HTML.
  for (const path of ['/', '/works']) {
    const html = await (await request.get(path)).text();
    expect(html, path).not.toMatch(/<script type="module">[\s\S]*?\S[\s\S]*?<\/script>/);
    expect(html, path).toMatch(/<script type="module" src="\/_astro\/[^"]+\.js">/);
  }
  await page.route('**/_astro/*.js', (r) => r.abort());
  await page.goto('/');
  // boot.js lifts .js after 3s, so every stamped element shows in its final state.
  await expect(page.locator('html')).not.toHaveClass(/\bjs\b/, { timeout: 3500 });
  for (const el of await page.locator('[data-pop]').all()) {
    await el.scrollIntoViewIfNeeded();
    await expect(el).toHaveCSS('opacity', '1');
  }
});

test.describe('JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false });

  test('should show all content in its final state and keep links working', async ({ page }) => {
    for (const path of ['/', '/works', '/404']) {
      await page.goto(path);
      await expect(page.locator('html')).not.toHaveClass(/\bjs\b/);
      for (const el of await page.locator('[data-pop]').all()) await expect(el).toHaveCSS('opacity', '1');
      expect(await floodIsHidden(page)).toBe(true);
      await expect(page.locator('h1')).toBeVisible();
    }
    await page.goto('/');
    await page.locator(WORKS_LINK).click();
    await page.waitForURL('**/works');
    await expect(page.locator('h1')).toBeVisible();
  });
});
