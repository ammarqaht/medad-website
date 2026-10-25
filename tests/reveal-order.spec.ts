import { test, expect } from '@playwright/test';
import { stubExternal } from './helpers';

/* Owner decisions (2026-10-24): page reveals wait for the ink curtain to
   drain, and one pen writes the headings in turn. */

test.beforeEach(async ({ context }) => stubExternal(context));

test('should start no reveal or ink writing while the curtain covers the arriving page', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  await page.click('header a.topbar__works');
  await page.waitForURL('**/works');
  const samples: { flood: boolean; pop: number; ink: number }[] = [];
  for (let i = 0; i < 25; i++) {
    samples.push(
      await page.evaluate(() => ({
        flood: document.documentElement.hasAttribute('data-flood'),
        pop: document.querySelectorAll('[data-pop].is-in').length,
        ink: document.querySelectorAll('[data-ink].is-writing, [data-ink].is-written').length,
      })),
    );
    await page.waitForTimeout(80);
  }
  const whileCovered = samples.filter((s) => s.flood);
  expect(whileCovered.length).toBeGreaterThan(0);
  for (const s of whileCovered) expect(s.pop + s.ink).toBe(0);
  // ...and the page does come alive after the drain.
  await expect.poll(async () => page.locator('[data-pop].is-in').count(), { timeout: 4000 }).toBeGreaterThan(0);
});

test('should write the headings with one pen, one heading at a time', async ({ page }) => {
  await page.goto('/works');
  let overlaps = 0;
  let seen = 0;
  for (let i = 0; i < 60; i++) {
    const writing = await page.evaluate(() => document.querySelectorAll('[data-ink].is-writing').length);
    if (writing > 0) seen++;
    if (writing > 1) overlaps++;
    await page.waitForTimeout(50);
  }
  expect(seen).toBeGreaterThan(0);
  // A heading hands the pen on a beat before its plain text is restored: allow that blink.
  expect(overlaps).toBeLessThanOrEqual(3);
});
