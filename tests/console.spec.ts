import { test, expect } from '@playwright/test';
import { PAGES, stubExternal, watchProblems, WORKS_LINK } from './helpers';

/* Phase acceptance: no console errors; NFR-16: CSP (meta) blocks nothing of ours. */

test.beforeEach(async ({ context }) => stubExternal(context));

for (const path of PAGES) {
  test(`should load ${path} without console errors, CSP violations or failed requests`, async ({ page }) => {
    const p = await watchProblems(page);
    await page.goto(path, { waitUntil: 'load' });
    await page.evaluate(async () => {
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise((r) => setTimeout(r, 500));
    });
    expect(p.console).toEqual([]);
    expect(p.pageErrors).toEqual([]);
    expect(p.failed).toEqual([]);
  });
}

test('should report no console errors on an unknown route except the document 404 itself', async ({ page }) => {
  const p = await watchProblems(page);
  await page.goto('/does-not-exist');
  const other = p.console.filter((m) => !/status of 404/.test(m));
  test.info().annotations.push({ type: 'console on 404', description: JSON.stringify(p.console) });
  expect(other).toEqual([]);
  expect(p.pageErrors).toEqual([]);
  expect(p.failed).toEqual([]);
});

test('should keep the console clean across a flood transition and back', async ({ page }) => {
  const p = await watchProblems(page);
  await page.goto('/');
  await page.locator(WORKS_LINK).click();
  await page.waitForURL('**/works');
  await page.waitForTimeout(800);
  await page.goBack();
  await page.waitForTimeout(800);
  expect(p.console).toEqual([]);
  expect(p.pageErrors).toEqual([]);
});

test('should ship a CSP meta with self-only sources and no unsafe-inline/eval', async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);
    const csp = await page.locator('meta[http-equiv="content-security-policy"]').getAttribute('content');
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval|https?:\/\/|\*/);
  }
});

for (const path of PAGES) {
  test(`performance smoke: ${path} loads quickly and stays light`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'load' });
    const t = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const res = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const js = res.filter((r) => r.name.endsWith('.js')).reduce((s, r) => s + r.transferSize, 0);
      const all = res.reduce((s, r) => s + r.transferSize, 0) + nav.transferSize;
      return { dcl: nav.domContentLoadedEventEnd, load: nav.loadEventEnd, js, all };
    });
    test.info().annotations.push({ type: 'timing', description: JSON.stringify(t) });
    expect(t.dcl).toBeLessThan(1000);
    expect(t.load).toBeLessThan(2000);
    expect(t.js).toBeLessThan(50_000);
    expect(t.all).toBeLessThan(1_500_000);
  });
}
