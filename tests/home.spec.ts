import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { WHATSAPP, WA_PREFIX, blockPageModule, stubExternal, watchProblems } from './helpers';

/* Phase 2, the home page: FR-04..FR-09, NFR-05/06/07/09/10 and the owner's decisions
   (contact only at the end, the arms screens + quiz, ink-written headings, the opener). */

const HEADLINE = 'نكتب فكرتك منصة تعمل';
const QUIZ = { right: 'صحيح، هو الحبر.', wrong: 'ليس هذا، جرّب مرة أخرى.' };

declare global {
  interface Window {
    __op?: { added: number | null; removed: number | null };
  }
}

test.beforeEach(async ({ context }) => stubExternal(context));

/** Records when html.opening is added and removed (performance.now(), ms since navigation). */
async function recordOpening(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const op = (window.__op = { added: null as number | null, removed: null as number | null });
    let on = false;
    new MutationObserver(() => {
      const has = document.documentElement?.classList.contains('opening') ?? false;
      if (has && !on) op.added = performance.now();
      if (!has && on) op.removed = performance.now();
      on = has;
    }).observe(document, { attributes: true, subtree: true, attributeFilter: ['class'] });
  });
}

const opening = (page: Page) => page.evaluate(() => window.__op!);

/** Scroll the whole page down in viewport steps so every observer fires, then back to top. */
async function scrollWholePage(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.6));
    for (let y = 0; y <= document.documentElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 300));
  });
}

async function waitOpenerGone(page: Page, timeout = 6000): Promise<void> {
  await expect(page.locator('html')).not.toHaveClass(/\bopening\b/, { timeout });
}

async function expectHeroFinal(page: Page): Promise<void> {
  await expect(page.locator('html')).not.toHaveClass(/\bopening\b/);
  for (const w of await page.locator('.hero__title .w').all()) await expect(w).toHaveCSS('opacity', '1');
  await expect(page.locator('.hero__line')).toHaveCSS('opacity', '1');
  await expect(page.locator('.hero__outline')).toBeHidden();
  await expectBrandMarkVisible(page);
}

/** The brand mark on the stage is painted by at least one visible layer. */
async function expectBrandMarkVisible(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.locator('.hero__word > *').evaluateAll((els) =>
        els.some((e) => {
          const cs = getComputedStyle(e);
          const r = e.getBoundingClientRect();
          return cs.visibility === 'visible' && cs.display !== 'none' && cs.opacity !== '0' && r.width > 0 && r.height > 0;
        }),
      ),
    )
    .toBe(true);
}

/** Skip the opener the way FR-04 always allows: any key press. No-op when it is not running. */
async function skipOpener(page: Page): Promise<void> {
  await page.waitForLoadState('load');
  await page.keyboard.press('Escape');
  await waitOpenerGone(page, 1000);
}

/* ---------------- FR-04: the opener ---------------- */

test.describe('opener (FR-04)', () => {
  test('should run on the first visit and end in under 5s with html.opening removed', async ({ page }) => {
    await recordOpening(page);
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/\bopening\b/, { timeout: 2000 });
    await waitOpenerGone(page);
    const op = await opening(page);
    test.info().annotations.push({ type: 'opener', description: JSON.stringify(op) });
    expect(op.added).not.toBeNull();
    expect(op.removed).not.toBeNull();
    expect(op.removed!).toBeLessThan(5000);
    await expect(page.locator('[data-hero]')).toHaveClass(/\bhas-blot\b/);
    await expectHeroFinal(page);
    expect(await page.evaluate(() => sessionStorage.getItem('medad-opened'))).toBe('1');
  });

  const skips: Record<string, (page: Page) => Promise<unknown>> = {
    'a wheel': (p) => p.mouse.wheel(0, 200),
    'a key press': (p) => p.keyboard.press('Escape'),
    'a touch': (p) => p.evaluate(() => window.dispatchEvent(new Event('touchstart'))),
    'a pointer on the stage': (p) => p.locator('[data-stage]').click({ position: { x: 20, y: 20 } }),
  };
  for (const [how, skip] of Object.entries(skips)) {
    test(`should skip to the final state at once on ${how}`, async ({ page }) => {
      await recordOpening(page);
      await page.goto('/');
      await expect(page.locator('html')).toHaveClass(/\bopening\b/, { timeout: 2000 });
      const t0 = await page.evaluate(() => performance.now());
      await skip(page);
      await waitOpenerGone(page, 400);
      const op = await opening(page);
      expect(op.removed! - t0).toBeLessThan(400);
      // Skipped well before the natural end.
      expect(op.removed!).toBeLessThan(3500);
      await expectHeroFinal(page);
    });
  }

  test('should not replay the opener on a second visit in the same session', async ({ page }) => {
    await page.goto('/');
    await waitOpenerGone(page);
    await page.goto('/works');
    await recordOpening(page);
    await page.goto('/');
    await expect(page.locator('[data-hero]')).toHaveClass(/\bhas-blot\b/, { timeout: 1500 });
    const op = await opening(page);
    expect(op.added).toBeNull();
    await expectHeroFinal(page);
  });

  test('should show the h1 text in the HTML and the accessibility tree from first paint', async ({ page, request }) => {
    const raw = await (await request.get('/')).text();
    const h1 = raw.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    expect(h1).toBe(HEADLINE);
    await recordOpening(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Still opening, yet the headline is already exposed with its full text.
    expect((await opening(page)).added).not.toBeNull();
    await expect(page.getByRole('heading', { level: 1, name: HEADLINE })).toBeAttached();
    await expect(page.locator('h1')).toHaveText(HEADLINE);
  });

  test('should render the hero logo as the original logo images inside role=img named «مداد», during and after the opener', async ({ page }) => {
    await page.goto('/');
    const word = page.locator('.hero__word');
    await expect(word).toHaveAttribute('role', 'img');
    await expect(word).toHaveAttribute('aria-label', 'مداد');
    await expect(page.locator('[data-hero]').getByRole('img', { name: 'مداد', exact: true })).toHaveCount(1);
    const check = async () => {
      const imgs = word.locator('img');
      await expect(imgs).toHaveCount(2);
      expect(await imgs.evaluateAll((els) => els.map((e) => e.getAttribute('src')))).toEqual([
        '/logo/medad-mark-ink.webp',
        '/logo/medad-mark-paper.webp',
      ]);
      // Decorative inside the named role=img; loaded, not broken.
      for (const img of await imgs.all()) {
        await expect(img).toHaveAttribute('alt', '');
        await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
      }
      expect(await word.locator('.brand-word').count()).toBe(0);
      await expectBrandMarkVisible(page);
    };
    await expect(page.locator('html')).toHaveClass(/\bopening\b/, { timeout: 2000 });
    await waitOpenerGone(page);
    await check();
  });

  test.describe('reduced motion', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } });

    test('should show the final hero state immediately with no opener', async ({ page }) => {
      await recordOpening(page);
      await page.goto('/');
      await expect(page.locator('[data-hero]')).toHaveClass(/\bhas-blot\b/, { timeout: 1000 });
      expect((await opening(page)).added).toBeNull();
      await expectHeroFinal(page);
      expect(await page.locator('[data-hero]').getAttribute('class')).not.toMatch(/is-dyeing|is-burst|is-titling/);
    });

    test('should draw the story line in full and light every stamp without scrolling (FR-05)', async ({ page }) => {
      await page.goto('/');
      const path = page.locator('.story__ink');
      await expect.poll(() => path.evaluate((p) => parseFloat(getComputedStyle(p).strokeDashoffset))).toBeCloseTo(0, 0);
      for (const n of await page.locator('[data-node]').all()) await expect(n).toHaveClass(/\bis-hit\b/);
    });
  });
});

/* ---------------- Ink-written headings ---------------- */

test('should end every ink-written heading as its full original text, plain and visible', async ({ page, request }) => {
  const raw = await (await request.get('/')).text();
  const originals = await page.evaluate((html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return Array.from(doc.querySelectorAll('[data-ink]')).map((e) => (e.textContent || '').trim());
  }, raw);
  expect(originals.length).toBeGreaterThanOrEqual(4);

  await page.goto('/');
  await waitOpenerGone(page);
  const els = await page.locator('[data-ink]').all();
  expect(els.length).toBe(originals.length);
  for (const [i, el] of els.entries()) {
    await el.scrollIntoViewIfNeeded();
    await expect(el, `heading ${i}: ${originals[i]}`).toHaveClass(/\bis-written\b/, { timeout: 7000 });
    await expect(el).not.toHaveClass(/\bis-writing\b/);
    expect((await el.textContent())?.trim()).toBe(originals[i]);
    expect(await el.locator('.ink-line, .ink-run, .ink-nib').count()).toBe(0);
    await expect(el).toHaveCSS('clip-path', 'none');
    await expect(el).toHaveCSS('opacity', '1');
    await expect(el).toBeVisible();
  }
});

/* ---------------- FR-05: the story ink line ---------------- */

test('should write the story line as you scroll down, hit each node, and take it back on scroll up', async ({ page }) => {
  await page.goto('/');
  await skipOpener(page);
  const top = await page.locator('[data-story]').evaluate((s) => s.getBoundingClientRect().top + window.scrollY);
  const height = await page.locator('[data-story]').evaluate((s) => s.getBoundingClientRect().height);
  const vh = page.viewportSize()!.height;

  const sample = async (y: number) => {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
    await page.waitForTimeout(150);
    return page.evaluate(() => ({
      offset: parseFloat(getComputedStyle(document.querySelector('.story__ink')!).strokeDashoffset),
      hits: document.querySelectorAll('[data-node].is-hit').length,
    }));
  };

  const ys = [0, 0.25, 0.5, 0.75, 1, 1.2].map((f) => Math.max(0, Math.round(top - vh + f * height)));
  const samples = [];
  for (const y of ys) samples.push(await sample(y));
  test.info().annotations.push({ type: 'samples', description: JSON.stringify(samples) });

  for (let i = 1; i < samples.length; i++) {
    expect(samples[i].offset).toBeLessThanOrEqual(samples[i - 1].offset);
    expect(samples[i].hits).toBeGreaterThanOrEqual(samples[i - 1].hits);
  }
  expect(samples.at(-1)!.offset).toBeLessThan(samples[0].offset);
  expect(samples.at(-1)!.offset).toBeCloseTo(0, 0);
  const nodes = await page.locator('[data-node]').count();
  expect(samples[0].hits).toBeLessThan(nodes);
  expect(samples.at(-1)!.hits).toBe(nodes);

  const back = await sample(ys[1]);
  expect(back.offset).toBeGreaterThan(samples.at(-1)!.offset);
});

/* ---------------- FR-07: the arms (screens + quiz) ---------------- */

const pressedIndex = (page: Page) =>
  page.locator('[data-screens] .screen').evaluateAll((s) => s.findIndex((b) => b.getAttribute('aria-pressed') === 'true'));
const pressedCount = (page: Page) => page.locator('[data-screens] .screen[aria-pressed="true"]').count();

test.describe('arms (FR-07)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await skipOpener(page);
    await page.locator('[data-screens]').scrollIntoViewIfNeeded();
  });

  test('should show the section title «ماذا نكتب؟» with no links into the archive (owner: two ways into the works only)', async ({ page }) => {
    await expect(page.locator('#arms-title')).toHaveText('ماذا نكتب؟', { timeout: 5000 });
    await expect(page.locator('.arms a[href^="/works"]')).toHaveCount(0);
  });

  test('should offer exactly two ways into the works on the home page: the header link and «كل الأعمال»', async ({ page }) => {
    const links = page.locator('a[href="/works"]');
    await expect(links).toHaveCount(2);
    await expect(page.locator('header a.topbar__works')).toHaveAccessibleName('أعمالنا');
    await expect(page.locator('.glimpse__cta a[href="/works"]')).toHaveText(/كل الأعمال/);
  });

  test('should open exactly the clicked screen (aria-pressed) on click', async ({ page }) => {
    const screens = page.locator('[data-screens] .screen');
    expect(await screens.count()).toBe(3);
    for (const i of [0, 2, 1]) {
      await screens.nth(i).click();
      await expect(screens.nth(i)).toHaveAttribute('aria-pressed', 'true');
      expect(await pressedCount(page)).toBe(1);
    }
    // Clicking stops the cycle.
    await page.mouse.move(0, 0);
    const held = await pressedIndex(page);
    await page.waitForTimeout(5200);
    expect(await pressedIndex(page)).toBe(held);
  });

  test('should cycle the screens on its own, and stop cycling once a screen gets keyboard focus', async ({ page }) => {
    const first = await pressedIndex(page);
    await expect.poll(() => pressedIndex(page), { timeout: 4000 }).not.toBe(first);
    expect(await pressedCount(page)).toBe(1);
    await page.locator('[data-screens] .screen').first().focus();
    const held = await pressedIndex(page);
    await page.waitForTimeout(5200);
    expect(await pressedIndex(page)).toBe(held);
  });

  test('should answer a wrong quiz option with feedback, then lock in the right answer «الحبر»', async ({ page }) => {
    const quiz = page.locator('[data-quiz]');
    const say = quiz.locator('.quiz__say');
    await expect(say).toHaveAttribute('aria-live', 'polite');
    await quiz.scrollIntoViewIfNeeded();

    await quiz.getByRole('button', { name: 'القلم' }).click();
    await expect(say).toHaveText(QUIZ.wrong);
    await expect(quiz).not.toHaveClass(/\bis-solved\b/);
    for (const b of await quiz.locator('.quiz__opt').all()) await expect(b).toBeEnabled();

    const right = quiz.getByRole('button', { name: 'الحبر' });
    await right.click();
    await expect(say).toHaveText(QUIZ.right);
    await expect(quiz).toHaveClass(/\bis-solved\b/);
    await expect(right).toHaveClass(/\bis-right\b/);
    await expect(right).toHaveAttribute('aria-pressed', 'true');
    await expect(quiz.getByRole('button', { name: 'القلم' })).toBeDisabled();
    await expect(quiz.getByRole('button', { name: 'الورق' })).toBeDisabled();
    await expect(right).toBeEnabled();
  });
});

/* ---------------- FR-08: the archive glimpse ---------------- */

test('should link the three glimpse files to their works pages', async ({ page }) => {
  const expected = ['/works/halqah', '/works/nabda', '/works/tasyeer-tasjeel'];
  await page.goto('/');
  await skipOpener(page);
  const links = page.locator('.glimpse .files a');
  expect(await links.evaluateAll((as) => as.map((a) => a.getAttribute('href')))).toEqual(expected);
  await expect(page.locator('.glimpse a.btn[href="/works"]')).toBeVisible();
  for (const [i, href] of expected.entries()) {
    await page.goto('/');
    const link = page.locator('.glimpse .files a').nth(i);
    await link.scrollIntoViewIfNeeded();
    await link.click();
    await page.waitForURL(`**${href}`);
    const res = await page.request.get(href);
    expect(res.status()).toBe(200);
  }
});

/* ---------------- FR-09 + owner decision: contact only at the end ---------------- */

test('should offer WhatsApp only in the closing section and footer, with the right link', async ({ page }) => {
  await page.goto('/');
  const cta = page.locator('.closing a.btn');
  await expect(cta).toHaveAttribute('href', new RegExp('^' + WA_PREFIX.replace(/[.?]/g, '\\$&')));
  await expect(cta).toHaveAttribute('target', '_blank');
  await expect(cta).toHaveAttribute('rel', /noopener/);
  const places = await page.locator('a[href*="wa.me"]').evaluateAll((as) =>
    as.map((a) => (a.closest('.closing') ? 'closing' : a.closest('footer') ? 'footer' : a.closest('header') ? 'header' : 'other')),
  );
  expect(places).toContain('closing');
  expect(places).toContain('footer');
  expect(places.filter((p) => p !== 'closing' && p !== 'footer')).toEqual([]);
  for (const href of await page.locator('a[href*="wa.me"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')))) {
    expect(href?.startsWith(WA_PREFIX)).toBe(true);
  }
  await expect(page.locator('header a[href="/works"]')).toHaveCount(1);
  const [popup] = await Promise.all([page.waitForEvent('popup'), cta.click()]);
  expect(popup.url().startsWith(WHATSAPP)).toBe(true);
});

/* ---------------- NFR-10: no horizontal scroll ---------------- */

for (const width of [375, 768, 1440]) {
  test(`should have no horizontal scroll on / at ${width}px after scrolling the whole page`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await waitOpenerGone(page);
    await scrollWholePage(page);
    const m = await page.evaluate(() => {
      window.scrollBy({ left: -2000, behavior: 'instant' });
      const a = window.scrollX;
      window.scrollBy({ left: 2000, behavior: 'instant' });
      return {
        html: [document.documentElement.scrollWidth, document.documentElement.clientWidth],
        body: [document.body.scrollWidth, document.body.clientWidth],
        scrollX: [a, window.scrollX],
      };
    });
    test.info().annotations.push({ type: 'widths', description: JSON.stringify(m) });
    expect(m.html[0]).toBeLessThanOrEqual(m.html[1]);
    expect(m.body[0]).toBeLessThanOrEqual(m.body[1]);
    expect(m.scrollX).toEqual([0, 0]);
  });
}

/* ---------------- Console / CSP ---------------- */

test('should keep the console clean (no errors, CSP violations or failed requests) through the opener, scroll and interactions', async ({ page }) => {
  const p = await watchProblems(page);
  await page.goto('/');
  await waitOpenerGone(page);
  await scrollWholePage(page);
  await page.locator('[data-screens] .screen').first().click();
  await page.locator('[data-quiz]').getByRole('button', { name: 'الورق' }).click();
  await page.locator('[data-quiz]').getByRole('button', { name: 'الحبر' }).click();
  await page.waitForTimeout(500);
  expect(p.console).toEqual([]);
  expect(p.pageErrors).toEqual([]);
  expect(p.failed).toEqual([]);
});

/* ---------------- NFR-05: no numbers as claims ---------------- */

test('should show no digits as claims in the visible home copy (NFR-05)', async ({ page }) => {
  await page.goto('/');
  const text = await page.locator('main').evaluate((m) => (m as HTMLElement).innerText);
  // Western and Arabic-Indic digits, and percentages. Story stamps use numerals by design: report them.
  const hits = text.match(/[0-9٠-٩۰-۹]+%?|٪/g) ?? [];
  test.info().annotations.push({ type: 'digits in main', description: JSON.stringify(hits) });
  expect(text).not.toMatch(/[%٪]/);
});

/* ---------------- NFR-09: axe after the opener ---------------- */

for (const width of [375, 1440]) {
  test(`should have no axe WCAG A/AA violations on / at ${width}px after the opener`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await waitOpenerGone(page);
    await scrollWholePage(page);
    for (const el of await page.locator('[data-ink]').all()) {
      await el.scrollIntoViewIfNeeded();
      await expect(el).toHaveClass(/\bis-written\b/, { timeout: 7000 });
    }
    for (const el of await page.locator('[data-pop]').all()) await expect(el).toHaveCSS('opacity', '1');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(300);
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    const summary = r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 5) }));
    expect(summary).toEqual([]);
  });
}

/* ---------------- NFR-07: fail-open without the page modules ---------------- */

test('should lift html.opening within ~5.5s and show the content when the page modules are stripped', async ({ page }) => {
  await blockPageModule(page);
  await recordOpening(page);
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/\bjs\b/);
  expect((await opening(page)).added).not.toBeNull();
  await waitOpenerGone(page, 6000);
  const op = await opening(page);
  test.info().annotations.push({ type: 'fail-open opener', description: JSON.stringify(op) });
  expect(op.removed!).toBeLessThan(5500);
  for (const w of await page.locator('.hero__title .w').all()) await expect(w).toHaveCSS('opacity', '1');
  await expectBrandMarkVisible(page);
  await expect(page.locator('h1')).toHaveText(HEADLINE);
  // boot.js lifts .js at 3s, so stamped and ink-written content shows in its final state.
  await expect(page.locator('html')).not.toHaveClass(/\bjs\b/);
  for (const el of await page.locator('[data-ink], [data-pop]').all()) {
    await el.scrollIntoViewIfNeeded();
    await expect(el).toHaveCSS('opacity', '1');
    await expect(el).toHaveCSS('clip-path', 'none');
  }
});

/* ---------------- Mobile (375px, touch) ---------------- */

test.describe('mobile 375px touch', () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

  test('should end the opener in under 5s and skip it on a tap on the stage', async ({ page, context }) => {
    await recordOpening(page);
    await page.goto('/');
    await waitOpenerGone(page);
    expect((await opening(page)).removed!).toBeLessThan(5000);
    const fresh = await context.browser()!.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
    try {
      const p2 = await fresh.newPage();
      await p2.goto(page.url());
      await expect(p2.locator('html')).toHaveClass(/\bopening\b/, { timeout: 2000 });
      await p2.locator('[data-stage]').tap({ position: { x: 20, y: 20 } });
      await expect(p2.locator('html')).not.toHaveClass(/\bopening\b/, { timeout: 400 });
    } finally {
      await fresh.close();
    }
  });

  test('should write the story line with the scroll and hit every node', async ({ page }) => {
    await page.goto('/');
    await skipOpener(page);
    const offset = () => page.locator('.story__ink').evaluate((p) => parseFloat(getComputedStyle(p).strokeDashoffset));
    await page.locator('[data-story]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    const before = await offset();
    await page.evaluate(() => {
      const s = document.querySelector('[data-story]')!;
      window.scrollTo({ top: s.getBoundingClientRect().bottom + window.scrollY, behavior: 'instant' });
    });
    await expect.poll(offset).toBeLessThan(before);
    await expect.poll(offset).toBeCloseTo(0, 0);
    for (const n of await page.locator('[data-node]').all()) await expect(n).toHaveClass(/\bis-hit\b/);
  });

  test('should toggle screens on tap and solve the quiz by tap', async ({ page }) => {
    await page.goto('/');
    await skipOpener(page);
    const screens = page.locator('[data-screens] .screen');
    await screens.nth(0).scrollIntoViewIfNeeded();
    await screens.nth(0).tap();
    await expect(screens.nth(0)).toHaveAttribute('aria-pressed', 'true');
    expect(await pressedCount(page)).toBe(1);
    const quiz = page.locator('[data-quiz]');
    await quiz.getByRole('button', { name: 'الورق' }).tap();
    await expect(quiz.locator('.quiz__say')).toHaveText(QUIZ.wrong);
    await quiz.getByRole('button', { name: 'الحبر' }).tap();
    await expect(quiz.locator('.quiz__say')).toHaveText(QUIZ.right);
    await expect(quiz.getByRole('button', { name: 'القلم' })).toBeDisabled();
  });
});
