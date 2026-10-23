import { test, expect } from '@playwright/test';

/* FR-25: unknown route shows the branded 404 page. The preview server
   (astro preview) answers unknown routes with dist/404.html and status 404;
   production status comes from nginx `error_page 404 /404.html` (see deploy-config.spec.ts). */

for (const path of ['/does-not-exist', '/works/unknown-work']) {
  test(`should serve the branded 404 page with status 404 for ${path}`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(404);
    await expect(page.locator('h1')).toHaveText('لم يصل الحبر إلى هنا');
    await expect(page.locator('header.topbar')).toBeVisible();
    await expect(page.locator('footer.footer')).toBeVisible();
    await expect(page.locator('main a.btn[href="/"]')).toBeVisible();
    await expect(page.locator('main a.btn[href="/works"]')).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    await expect(page).toHaveTitle(/لم يصل الحبر/);
  });
}

test('should take the visitor home from the 404 page', async ({ page }) => {
  await page.goto('/does-not-exist');
  await page.locator('main a.btn[href="/"]').click();
  await page.waitForURL((u) => u.pathname === '/');
  await expect(page.locator('h1')).toBeVisible();
});

test('should take the visitor to works from the 404 page', async ({ page }) => {
  await page.goto('/does-not-exist');
  await page.locator('main a.btn[href="/works"]').click();
  await page.waitForURL('**/works');
  await expect(page.locator('h1')).toBeVisible();
});
