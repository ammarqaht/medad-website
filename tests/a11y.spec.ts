import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PAGES, stubExternal } from './helpers';

/* NFR-09: automated WCAG 2.2 AA checks (axe) on each page, desktop and mobile. */

test.beforeEach(async ({ context }) => stubExternal(context));

for (const path of PAGES) {
  for (const width of [375, 1440]) {
    test(`should have no axe WCAG A/AA violations on ${path} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      // Let stamp-in content land so axe sees final colours.
      for (const el of await page.locator('[data-pop]').all()) {
        await el.scrollIntoViewIfNeeded();
        await expect(el).toHaveCSS('opacity', '1', { timeout: 2000 });
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      const r = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      const summary = r.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 5),
      }));
      expect(summary).toEqual([]);
    });
  }
}
