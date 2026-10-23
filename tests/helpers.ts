import type { BrowserContext, Page, Route } from '@playwright/test';

export const PAGES = ['/', '/works', '/404'] as const;
export const WHATSAPP = 'https://wa.me/966535451898';
export const BRAND = 'مـــــداد';
/** The header works link (outside /works). Inside /works the header shows a `.back` control instead. */
export const WORKS_LINK = 'header a.topbar__works[href="/works"]';

/** Never let tests reach the real WhatsApp site: answer with a stub page. */
export async function stubExternal(context: BrowserContext): Promise<void> {
  await context.route(/^https?:\/\/(?!localhost)/, (route: Route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>stub</title>' }),
  );
}

export interface Problems {
  console: string[];
  pageErrors: string[];
  failed: string[];
}

/** Collects console errors, uncaught errors, failed/4xx/5xx subresources and CSP violations. */
export async function watchProblems(page: Page): Promise<Problems> {
  const p: Problems = { console: [], pageErrors: [], failed: [] };
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      console.error(`CSP-VIOLATION ${e.violatedDirective} ${e.blockedURI}`);
    });
  });
  page.on('console', (m) => {
    if (m.type() === 'error') p.console.push(m.text());
  });
  page.on('pageerror', (e) => p.pageErrors.push(String(e)));
  page.on('requestfailed', (r) => p.failed.push(`${r.url()} ${r.failure()?.errorText}`));
  page.on('response', (r) => {
    if (r.status() >= 400 && r.request().resourceType() !== 'document') p.failed.push(`${r.status()} ${r.url()}`);
  });
  return p;
}

/** Records ink flood activity (cover on the old page, arrive-covered on the new one) via console. */
export async function recordFlood(page: Page): Promise<string[]> {
  const log: string[] = [];
  page.on('console', (m) => {
    const t = m.text();
    if (t.startsWith('FLOOD:')) log.push(`${t} @${new URL(page.url()).pathname}`);
  });
  await page.addInitScript(() => {
    // documentElement may not exist yet when init scripts run: watch the document.
    let covering = false;
    let receding = false;
    new MutationObserver((muts) => {
      const root = document.documentElement;
      for (const m of muts) {
        const el = m.target as Element;
        if (el === root && m.attributeName === 'data-flood') {
          console.log(root.hasAttribute('data-flood') ? 'FLOOD:arrive-covered' : 'FLOOD:drained');
        } else if (el.classList?.contains('flood') && m.attributeName === 'class') {
          const now = el.classList;
          if (now.contains('is-covering') && !covering) {
            console.log('FLOOD:cover');
            sessionStorage.setItem('__flood_t0', String(Date.now()));
          }
          if (now.contains('is-receding') && !receding) console.log('FLOOD:recede');
          if (!now.contains('is-receding') && receding) {
            const t0 = Number(sessionStorage.getItem('__flood_t0'));
            console.log(`FLOOD:done ${t0 ? Date.now() - t0 : -1}`);
          }
          covering = now.contains('is-covering');
          receding = now.contains('is-receding');
        }
      }
    }).observe(document, { attributes: true, subtree: true, attributeFilter: ['data-flood', 'class'] });
  });
  return log;
}

/** True when the ink overlay is not painting over the page. */
export async function floodIsHidden(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const f = document.querySelector('.flood');
    if (!f) return true;
    const cs = getComputedStyle(f);
    return cs.visibility === 'hidden' || cs.display === 'none';
  });
}

/** Replace the page's inline module script (base.ts bundle) so only boot.js runs. */
export async function blockPageModule(page: Page): Promise<void> {
  await page.route('**/_astro/*.js', (r) => r.abort());
  await page.route(
    (url) => url.origin.startsWith('http://localhost') && !/\.[a-z0-9]+$/i.test(url.pathname),
    async (route) => {
      const res = await route.fetch();
      const body = (await res.text()).replace(/<script type="module">[\s\S]*?<\/script>/g, '');
      await route.fulfill({ response: res, body });
    },
  );
}
