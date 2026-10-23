import { expect, test, type Page } from '@playwright/test';

/* Tasjeel demo (FR-22, FR-26): intro, form with Arabic validation, membership number. */

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
  await page.goto('/works/tasyeer-tasjeel');
  const demo = page.locator('.tj');
  await demo.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
  return demo;
}

test.describe('Tasjeel demo', () => {
  test('should walk intro, validate in Arabic, and confirm with a membership number', async ({ page }) => {
    const demo = await open(page);
    await expect(demo.locator('.tj-step[aria-current="step"]')).toContainText('التعريف');
    await demo.getByRole('button', { name: 'سجّل', exact: true }).click();
    await expect(demo.getByRole('heading', { name: 'تسجيل طالب' })).toBeFocused();

    // empty submit: Arabic messages, focus on the first error
    await demo.getByRole('button', { name: 'إتمام التسجيل' }).click();
    await expect(demo.locator('.tj-err')).toHaveCount(6);
    await expect(demo.getByLabel('اسم الطالب الرباعي')).toBeFocused();
    await expect(demo.getByText('اكتب اسم الطالب.')).toBeVisible();

    // bad values
    await demo.getByLabel('اسم الطالب الرباعي').fill('سامي فهد');
    await demo.getByLabel('رقم الهوية').fill('٣١١١١١١١١١');
    await demo.getByLabel('جوال ولي الأمر').fill('١٢٣');
    await expect(demo.getByText('اكتب الاسم رباعياً: أربعة أسماء.')).toBeVisible();
    await expect(demo.getByText('رقم الهوية يبدأ بواحد أو اثنين.')).toBeVisible();
    await expect(demo.getByText('الجوال تسعة أرقام تبدأ بخمسة.')).toBeVisible();

    // stage drives grade
    await expect(demo.getByText('اختر المرحلة أولاً.')).toBeVisible();
    await demo.getByLabel('ابتدائي').check();
    await expect(demo.getByLabel('الرابع')).toBeVisible();
    await demo.getByLabel('ثانوي').check();
    await expect(demo.getByLabel('الرابع')).toHaveCount(0);

    // conditional question
    await demo.getByLabel('نعم').check();
    await expect(demo.getByLabel('ما هو؟')).toBeVisible();
    await demo.getByLabel('لا', { exact: true }).check();
    await expect(demo.getByLabel('ما هو؟')).toHaveCount(0);

    await demo.getByRole('button', { name: 'املأ بمثال' }).click();
    await expect(demo.locator('.tj-err')).toHaveCount(0);
    await demo.getByRole('button', { name: 'إتمام التسجيل' }).click();
    await expect(demo.getByRole('heading', { name: 'تم التسجيل' })).toBeFocused();
    await expect(demo.locator('.tj-member__num')).toHaveText('٢٤٦١');
    await expect(demo.locator('.tj-step[aria-current="step"]')).toContainText('الاعتماد');

    // another student: clean form, next number
    await demo.getByRole('button', { name: 'تسجيل طالب آخر' }).click();
    await expect(demo.getByLabel('اسم الطالب الرباعي')).toHaveValue('');
    await demo.getByRole('button', { name: 'املأ بمثال' }).click();
    await demo.getByRole('button', { name: 'إتمام التسجيل' }).click();
    await expect(demo.locator('.tj-member__num')).toHaveText('٢٤٦٢');

    // reset
    await demo.getByRole('button', { name: 'إعادة' }).click();
    await expect(demo.locator('.tj-step[aria-current="step"]')).toContainText('التعريف');

    const touched = await page.evaluate(() => (window as unknown as { __touched: string[] }).__touched);
    expect(touched).toEqual([]);
  });

  test('should fit a phone without horizontal scroll and keep text at 14px or more', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 760 });
    const demo = await open(page);
    await demo.getByRole('button', { name: 'سجّل', exact: true }).click();
    await demo.getByRole('button', { name: 'إتمام التسجيل' }).click();
    const r = await page.evaluate(() => {
      const screen = document.querySelector('[data-screen]')!;
      const small = [...document.querySelectorAll('.tj *')].filter((el) => {
        const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim());
        return own && parseFloat(getComputedStyle(el).fontSize) < 14;
      });
      return {
        page: document.documentElement.scrollWidth - window.innerWidth,
        inner: screen.scrollWidth - screen.clientWidth,
        small: small.length,
      };
    });
    expect(r).toEqual({ page: 0, inner: 0, small: 0 });
    if (process.env.SHOTS) await demo.screenshot({ path: `${process.env.SHOTS}/tasjeel-form.png` });
  });
});
