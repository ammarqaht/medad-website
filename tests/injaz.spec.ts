import { expect, test, type Page } from '@playwright/test';

/* Injaz demo (FR-24, FR-26): submit, review, leaderboard. */

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
  await page.goto('/works/injaz');
  const demo = page.locator('.ij');
  await demo.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
  return demo;
}

const role = (demo: ReturnType<Page['locator']>, name: string) => demo.locator('.ij-roles').getByRole('button', { name, exact: true });
const ANSWER = 'قرأت كتاباً عن العادات الصغيرة: التغيير يبدأ بخطوة يومية صغيرة، وسأطبق ذلك في القراءة كل مساء.';

test.describe('Injaz demo', () => {
  test('should submit, resubmit in place, grade, and move the leaderboard', async ({ page }) => {
    const demo = await open(page);
    await expect(role(demo, 'مشارك')).toHaveAttribute('aria-pressed', 'true');
    await expect(demo.locator('.ij-stat--ink dd')).toHaveText('٤');

    // a task returned for a redo: send it again (the same record is updated)
    await demo.getByRole('button', { name: /ملخص كتاب/ }).click();
    await expect(demo.getByRole('heading', { name: 'ملخص كتاب' })).toBeFocused();
    await expect(demo.locator('.ij-task .ij-status')).toHaveText('مطلوب إعادة');
    await demo.getByLabel('إجابتك').fill(ANSWER);
    await demo.getByRole('button', { name: 'أعد التسليم' }).click();
    await expect(demo.locator('.ij-task .ij-status')).toHaveText('قيد المراجعة');
    await expect(demo.getByLabel('إجابتك')).toHaveCount(0);

    // a new task: too short, then fine
    await demo.getByRole('button', { name: 'كل المهام' }).click();
    await demo.getByRole('button', { name: /فكرة مبادرة/ }).click();
    await demo.getByLabel('إجابتك').fill('فكرة');
    await demo.getByRole('button', { name: 'سلّم' }).click();
    await expect(demo.getByText('اكتب إجابة أطول قليلاً.')).toBeVisible();
    await demo.getByLabel('إجابتك').fill('ركن للكتب المستعملة في الحي يديره طلاب الصف.');
    await demo.getByRole('button', { name: 'سلّم' }).click();
    await expect(demo.locator('.ij-task .ij-status')).toHaveText('قيد المراجعة');

    // supervisor: the queue holds one record per participant per task
    await role(demo, 'مشرف').click();
    await expect(demo.getByRole('button', { name: /قيد المراجعة/ })).toContainText('٧');
    const row = demo.locator('.ij-sub', { hasText: ANSWER });
    await expect(row).toHaveCount(1);
    await row.getByRole('button', { name: /راجع/ }).click();
    await expect(demo.getByRole('heading', { name: 'أنس رائد' })).toBeFocused();
    await demo.getByRole('button', { name: 'طلب إعادة' }).click();
    await expect(demo.getByText('اكتب ملاحظة توضح المطلوب إعادته.')).toBeVisible();
    for (let i = 0; i < 4; i++) await demo.getByRole('button', { name: 'زيادة التقييم' }).click();
    await expect(demo.getByRole('button', { name: 'زيادة التقييم' })).toBeDisabled();
    await demo.getByRole('button', { name: 'قبول وتقييم' }).click();
    await expect(demo.getByRole('button', { name: /قيد المراجعة/ })).toContainText('٦');

    // ask another participant for a redo
    await demo.locator('.ij-sub').first().getByRole('button', { name: /راجع/ }).click();
    await demo.getByLabel('ملاحظة للمشارك').fill('أضف طريقة القياس لكل هدف.');
    await demo.getByRole('button', { name: 'طلب إعادة' }).click();
    await expect(demo.getByRole('button', { name: /مطلوب إعادة/ })).toContainText('١');

    // participant: new grade, points and rank
    await role(demo, 'مشارك').click();
    await expect(demo.locator('.ij-item', { hasText: 'ملخص كتاب' })).toContainText('٢٠ من ٢٠');
    await expect(demo.locator('.ij-stat--ink dd')).toHaveText('١');
    await demo.getByRole('button', { name: 'الصدارة' }).click();
    await expect(demo.locator('.ij-board__row').first()).toHaveClass(/is-me/);
    await expect(demo.locator('.ij-board__row')).toHaveCount(7);

    // reset
    await demo.getByRole('button', { name: 'إعادة' }).click();
    await expect(demo.locator('.ij-stat--ink dd')).toHaveText('٤');

    const touched = await page.evaluate(() => (window as unknown as { __touched: string[] }).__touched);
    expect(touched).toEqual([]);
  });

  test('should show three rows plus the current participant on a phone, with no horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 760 });
    const demo = await open(page);
    await expect(demo.locator('.ij-item:visible')).toHaveCount(3);
    await demo.getByRole('button', { name: 'الصدارة' }).click();
    await expect(demo.locator('.ij-board__row:visible')).toHaveCount(4);
    await expect(demo.locator('.ij-board__row.is-me')).toBeVisible();
    const r = await page.evaluate(() => {
      const screen = document.querySelector('[data-screen]')!;
      const small = [...document.querySelectorAll('.ij *')].filter((el) => {
        const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim());
        return own && parseFloat(getComputedStyle(el).fontSize) < 14;
      });
      const tiny = [...document.querySelectorAll('.ij button')]
        .filter((el) => (el as HTMLElement).offsetHeight < 44)
        .map((el) => el.textContent);
      return { page: document.documentElement.scrollWidth - window.innerWidth, inner: screen.scrollWidth - screen.clientWidth, small: small.length, tiny };
    });
    expect(r).toEqual({ page: 0, inner: 0, small: 0, tiny: [] });
  });
});
