import { expect, test, type Page } from '@playwright/test';

/* Tahfeez demo (FR-23, FR-26): sign-up, approval, points, student balance. */

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
  await page.goto('/works/tasyeer-tahfeez');
  const demo = page.locator('.tf');
  await demo.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
  return demo;
}

const role = (demo: ReturnType<Page['locator']>, name: string) => demo.locator('.tf-roles').getByRole('button', { name, exact: true });

test.describe('Tahfeez demo', () => {
  test('should register as pending, approve, grant points, and update the student balance', async ({ page }) => {
    const demo = await open(page);
    await expect(role(demo, 'التسجيل')).toHaveAttribute('aria-pressed', 'true');

    // validation
    await demo.getByRole('button', { name: 'أرسل الطلب' }).click();
    await expect(demo.locator('.tf-err')).toHaveCount(3);
    await expect(demo.getByLabel('الاسم الثلاثي')).toBeFocused();

    await demo.getByRole('button', { name: 'املأ بمثال' }).click();
    await demo.getByRole('button', { name: 'أرسل الطلب' }).click();
    await expect(demo.locator('.tf-no__num')).toHaveText('١٠٠٧');
    await expect(demo.getByRole('heading', { name: 'وصل طلبك' })).toBeFocused();

    // the student sees the waiting page
    await demo.getByRole('button', { name: 'افتح صفحتي' }).click();
    await expect(role(demo, 'طالب')).toHaveAttribute('aria-pressed', 'true');
    await expect(demo.getByRole('heading', { name: 'بانتظار الاعتماد' })).toBeVisible();
    await expect(demo.locator('.tf-bal')).toHaveCount(0);

    // the supervisor approves it and grants points
    await role(demo, 'مشرف').click();
    const row = demo.locator('.tf-row', { hasText: 'بدر نايف سالم' });
    await expect(row).toContainText('قيد الاعتماد');
    await row.getByRole('button', { name: /اعتماد/ }).click();
    await expect(row).toContainText('مفعّل');
    await row.getByRole('button', { name: /النقاط/ }).click();
    await expect(demo.getByRole('heading', { name: 'بدر نايف سالم' })).toBeFocused();

    await demo.getByRole('button', { name: 'سجّل الحركة' }).click();
    await expect(demo.getByText('اختر المقدار.')).toBeVisible();
    await demo.getByRole('radio', { name: 'إضافة ٢٠ نقطة' }).check();
    await demo.getByRole('button', { name: 'سجّل الحركة' }).click();
    await expect(demo.getByText('اكتب سبب الحركة.')).toBeVisible();
    await demo.getByRole('button', { name: 'حضور مبكر' }).click();
    await demo.getByRole('button', { name: 'سجّل الحركة' }).click();
    await expect(demo.locator('.tf-bal__num')).toHaveText('٢٠');

    // a deduction larger than the balance is refused
    await demo.getByRole('radio', { name: 'خصم ١٠ نقاط' }).check();
    await demo.getByLabel('السبب').fill('تأخر');
    await demo.getByRole('button', { name: 'سجّل الحركة' }).click();
    await expect(demo.locator('.tf-bal__num')).toHaveText('١٠');

    // the student sees the new balance in the same session
    await role(demo, 'طالب').click();
    await expect(demo.locator('.tf-bal')).toHaveAttribute('aria-label', 'رصيدي: ١٠ نقاط');
    await expect(demo.locator('.tf-moves li')).toHaveCount(2);

    // reject a pending one
    await role(demo, 'مشرف').click();
    await demo.getByRole('button', { name: /قيد الاعتماد/ }).click();
    const pending = demo.locator('.tf-row');
    await expect(pending).toHaveCount(2);
    await pending.first().getByRole('button', { name: /رفض/ }).click();
    await expect(demo.locator('.tf-row')).toHaveCount(1);

    // reset
    await demo.getByRole('button', { name: 'إعادة' }).click();
    await expect(role(demo, 'التسجيل')).toHaveAttribute('aria-pressed', 'true');
    await role(demo, 'مشرف').click();
    await expect(demo.locator('.tf-row', { hasText: 'بدر نايف سالم' })).toHaveCount(0);

    const touched = await page.evaluate(() => (window as unknown as { __touched: string[] }).__touched);
    expect(touched).toEqual([]);
  });

  test('should refuse a deduction that the balance cannot pay', async ({ page }) => {
    const demo = await open(page);
    await role(demo, 'مشرف').click();
    await demo.locator('.tf-row', { hasText: 'نواف بسام' }).getByRole('button', { name: /النقاط/ }).click();
    for (let i = 0; i < 4; i++) {
      await demo.getByRole('radio', { name: 'خصم ١٠ نقاط' }).check();
      await demo.getByLabel('السبب').fill('تأخر');
      await demo.getByRole('button', { name: 'سجّل الحركة' }).click();
    }
    await expect(demo.getByText('الرصيد لا يكفي لهذا الخصم.')).toBeVisible();
    await expect(demo.locator('.tf-bal__num .tf-zero')).toHaveCount(1);
  });

  test('should clip long lists on a phone, with no horizontal scroll and no text under 14px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 760 });
    const demo = await open(page);
    await role(demo, 'مشرف').click();
    await expect(demo.locator('.tf-row:visible')).toHaveCount(3);
    await demo.getByRole('button', { name: 'عرض الكل' }).click();
    await expect(demo.locator('.tf-row:visible')).toHaveCount(6);
    const r = await page.evaluate(() => {
      const screen = document.querySelector('[data-screen]')!;
      const small = [...document.querySelectorAll('.tf *')].filter((el) => {
        const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim());
        return own && parseFloat(getComputedStyle(el).fontSize) < 14;
      });
      const tiny = [...document.querySelectorAll('.tf button, .tf .tf-opt > span')]
        .filter((el) => (el as HTMLElement).offsetHeight < 44)
        .map((el) => `${el.className}:${el.textContent}:${(el as HTMLElement).offsetHeight}`);
      return { page: document.documentElement.scrollWidth - window.innerWidth, inner: screen.scrollWidth - screen.clientWidth, small: small.length, tiny };
    });
    expect(r).toEqual({ page: 0, inner: 0, small: 0, tiny: [] });
  });
});
