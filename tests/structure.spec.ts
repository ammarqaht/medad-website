import { test, expect } from '@playwright/test';
import { PAGES, WHATSAPP, WA_PREFIX, BRAND, WORKS_LINK, stubExternal } from './helpers';

/* FR-01, FR-02, NFR-01, NFR-02, NFR-09 (targets), NFR-10 */

for (const path of PAGES) {
  test.describe(`page ${path}`, () => {
    test.beforeEach(async ({ page, context }) => {
      await stubExternal(context);
      await page.goto(path);
    });

    test('should declare lang="ar" and dir="rtl" on <html>', async ({ page }) => {
      await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    });

    test('should render the brand word only as a complete .brand-word span', async ({ page }) => {
      const words = page.locator('main .brand-word, footer .brand-word');
      expect(await words.count()).toBeGreaterThan(0);
      for (const w of await words.all()) {
        await expect(w).toHaveText(BRAND);
        await expect(w).toHaveAttribute('role', 'img');
        await expect(w).toHaveAttribute('aria-label', 'مداد');
      }
      const style = await words.first().evaluate((el) => {
        const cs = getComputedStyle(el);
        return { family: cs.fontFamily, weight: cs.fontWeight };
      });
      expect(style.family.toLowerCase()).toContain('thmanyah');
      expect(style.weight).toBe('900');
      // No visible text node spells Medad outside a .brand-word.
      const stray = await page.evaluate(() => {
        const out: string[] = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          const t = n.textContent ?? '';
          if (/مـ*داد/.test(t) && !n.parentElement?.closest('.brand-word')) out.push(t.trim());
        }
        return out;
      });
      expect(stray).toEqual([]);
    });

    test('should show a header with a home logo link, its one navigation control and no WhatsApp', async ({ page }) => {
      const header = page.locator('header.topbar');
      await expect(header).toBeVisible();
      await expect(header.locator('a.topbar__logo')).toHaveAttribute('href', '/');
      await expect(header.locator('a.topbar__logo')).toHaveAccessibleName(/مداد/);
      // Owner decision: contact lives only in the closing section and the footer.
      await expect(header.locator('a[href*="wa.me"], a.btn')).toHaveCount(0);
      await expect(header.locator('nav a')).toHaveCount(1);
    });

    test('should show the works link outside /works and a back control inside /works', async ({ page }) => {
      if (path === '/works') {
        await expect(page.locator(WORKS_LINK)).toHaveCount(0);
        const back = page.locator('header nav a.back');
        await expect(back).toBeVisible();
        // Opened directly (no referrer from this site): it follows its own href home.
        await expect(back).toHaveAttribute('href', '/');
        await expect(back).toHaveAccessibleName('العودة للرئيسية');
      } else {
        const works = page.locator(WORKS_LINK);
        await expect(works).toBeVisible();
        await expect(works).toHaveAccessibleName('أعمالنا');
        await expect(page.locator('header a.back')).toHaveCount(0);
      }
    });

    test('should keep the header stuck to the top after scrolling', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 500 });
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(200);
      const top = await page.locator('header.topbar').evaluate((el) => el.getBoundingClientRect().top);
      expect(Math.abs(top)).toBeLessThanOrEqual(1);
    });

    test('should show a footer with the paper logo, a WhatsApp link and copyright', async ({ page }) => {
      const footer = page.locator('footer.footer');
      await expect(footer.locator('img[src="/logo/medad-mark-paper.png"]')).toBeVisible();
      await expect(footer.locator(`a[href^="${WA_PREFIX}"]`)).toBeVisible();
      await expect(footer).toContainText('©');
    });

    test('should open every WhatsApp link in a new tab with rel noopener', async ({ page }) => {
      const links = page.locator('a[href*="wa.me"], a[href*="whatsapp"]');
      // Home: closing + footer. Other pages: footer only.
      expect(await links.count()).toBeGreaterThanOrEqual(path === '/' ? 2 : 1);
      for (const a of await links.all()) {
        expect((await a.getAttribute('href'))?.startsWith(WA_PREFIX)).toBe(true);
        await expect(a).toHaveAttribute('target', '_blank');
        await expect(a).toHaveAttribute('rel', /\bnoopener\b/);
      }
    });

    test('should give rel noopener to every external link', async ({ page }) => {
      const bad = await page.$$eval('a[href^="http"]', (as) =>
        as.filter((a) => !/\bnoopener\b/.test(a.getAttribute('rel') ?? '')).map((a) => a.outerHTML),
      );
      expect(bad).toEqual([]);
    });

    test('should show no email, phone number, tel/mailto link or contact form', async ({ page }) => {
      const text = await page.evaluate(() => document.body.innerText);
      const latin = text.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660));
      expect(latin).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
      expect(latin.replace(/[\s-]/g, '')).not.toMatch(/(\+?966|0)?5\d{8}/);
      expect(await page.locator('a[href^="mailto:"], a[href^="tel:"], form').count()).toBe(0);
    });

    test('should give header and footer links and buttons a 44px minimum target', async ({ page }) => {
      for (const width of [375, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        const targets = page.locator('header a, header button, footer a, footer button');
        expect(await targets.count()).toBeGreaterThan(0);
        for (const t of await targets.all()) {
          const box = await t.boundingBox();
          const label = await t.evaluate((el) => el.outerHTML.slice(0, 80));
          expect(box, label).not.toBeNull();
          expect(box!.height, `${width}px height ${label}`).toBeGreaterThanOrEqual(44);
          expect(box!.width, `${width}px width ${label}`).toBeGreaterThanOrEqual(44);
        }
      }
    });

    for (const width of [375, 768, 1440]) {
      test(`should have no horizontal scroll at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        // Let stamp-in elements land (scale 1.14 -> 1) and scroll through the page.
        await page.evaluate(async () => {
          for (let y = 0; y <= document.body.scrollHeight; y += 400) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 50));
          }
        });
        await page.waitForTimeout(800);
        const m = await page.evaluate(() => ({
          doc: [document.documentElement.scrollWidth, document.documentElement.clientWidth],
          body: [document.body.scrollWidth, document.body.clientWidth],
        }));
        expect(m.doc[0], `html scrollWidth vs clientWidth`).toBeLessThanOrEqual(m.doc[1]);
        expect(m.body[0], `body scrollWidth vs clientWidth`).toBeLessThanOrEqual(m.body[1]);
        // A programmatic sideways scroll must not move the page.
        await page.evaluate(() => window.scrollTo({ left: -500, top: 0 }));
        await page.evaluate(() => window.scrollTo({ left: 500, top: 0 }));
        expect(await page.evaluate(() => window.scrollX)).toBe(0);
      });
    }

    test('should not overlap the header logo and navigation at 375px', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      const logo = (await page.locator('a.topbar__logo').boundingBox())!;
      const nav = (await page.locator('nav.topbar__nav').boundingBox())!;
      const overlap = logo.x < nav.x + nav.width && nav.x < logo.x + logo.width;
      expect(overlap).toBe(false);
      expect(nav.x).toBeGreaterThanOrEqual(0);
      expect(logo.x + logo.width).toBeLessThanOrEqual(375);
    });
  });
}

test('should open the closing WhatsApp button in a new tab without an opener', async ({ page, context }) => {
  await stubExternal(context);
  await page.goto('/');
  const [popup] = await Promise.all([
    context.waitForEvent('page'),
    page.locator(`.closing a.btn[href^="${WA_PREFIX}"]`).click(),
  ]);
  await popup.waitForLoadState();
  expect(popup.url().startsWith(WA_PREFIX)).toBe(true);
  expect(await popup.evaluate(() => window.opener)).toBeNull();
  expect(new URL(page.url()).pathname).toBe('/');
});

test('should open the footer WhatsApp link in a new tab without an opener', async ({ page, context }) => {
  await stubExternal(context);
  await page.goto('/works');
  const [popup] = await Promise.all([
    context.waitForEvent('page'),
    page.locator(`footer a[href^="${WA_PREFIX}"]`).click(),
  ]);
  await popup.waitForLoadState();
  expect(popup.url().startsWith(WA_PREFIX)).toBe(true);
  expect(await popup.evaluate(() => window.opener)).toBeNull();
});
