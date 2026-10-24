# Deploy runbook: medaad.tech on CranL

A human runs these steps. Nothing here is run by the release tooling.

- App id: `a71cf459-d7b0-452b-b4ed-5cd5311bc46c` (region riyadh-1)
- Preview URL: https://medad-website-gbpn4o.cranl.net
- Repo: `ammarqaht/medad-website`, branch `main` (public; CranL builds public repos only)
- Static site, no database, no migrations, no environment variables, no secrets.

```bash
export APP=a71cf459-d7b0-452b-b4ed-5cd5311bc46c
```

## 1. Pre-deploy checklist
Run from the project root. Mark each before going on.

- [ ] Working tree is what you intend to ship: `git status` and `git log --oneline -5`.
- [ ] Clean build: `npm ci && npm run build`
- [ ] Checks: `npm run check` (needs the local `.banned-words`; the output must not say "check skipped")
- [ ] Tests on a free port: `TEST_PORT=4477 npm test` (all green; see "Known test failures" in the release report before launch)
- [ ] Optional image test: `docker build -t medad-website . && docker run --rm -e PORT=8080 -p 8080:8080 medad-website`, open http://localhost:8080
- [ ] Latest security audit: SAFE TO RELEASE. SEO review: no Critical/High.
- [ ] `package.json` version and `CHANGELOG.md` agree; tag chosen (e.g. `v1.0.0`).
- [ ] Owner has confirmed the font licence for web use (Q-09) and the www/apex choice (section 4).
- [ ] No debug mode exists in a static build; confirm `dist/` has no sourcemaps: `find dist -name '*.map'` prints nothing.
- [ ] Analytics: none by design (Q-10). Error reporting: none client-side; use CranL logs (section 7).
- [ ] You can sign in to CranL: `cranl whoami`.

## 2. Deploy the app
Back-up step: there is no data to back up. The "backup" is the git history and the previous deployment. Before pushing, note the commit currently live:
```bash
cranl apps deployments list $APP        # note the current commit sha and deployment id
git tag v1.0.0 && git push origin main --tags    # human decision; tag name per CHANGELOG
cranl apps deploy $APP
cranl apps deployments list $APP
```
Known CranL quirks:
- The first deploy after a push often fails instantly with "Remote command failed". Run `cranl apps deploy $APP` again; the retry normally succeeds.
- A deployment can show "failed" while its build is still running. Before retrying, check `cranl apps deployments list $APP` and `cranl apps deployments logs $APP <deployment-id>`; wait for the build to finish to avoid two builds racing.
- If a CLI list command errors (it did on 1.7.0 with "map is not a function"), use the CranL dashboard (`cranl dashboard`) for the same information.

Smoke test the preview before touching the domain:
```bash
curl -sI https://medad-website-gbpn4o.cranl.net/ | head -20
```
Expect `200`, `x-robots-tag: noindex, nofollow` (preview only), and the security headers from section 5.

## 3. Add the domain medaad.tech
Do this only after the preview is verified and the owner approves.
```bash
cranl apps domains add $APP medaad.tech
cranl apps domains list $APP     # shows the domain and its status
```
DNS records: do not guess. The values (target host or IP, any TXT verification) come from CranL. Print them with the output of the two commands above or in the dashboard (`cranl dashboard`, app, Domains). If neither shows the records, ask CranL support for the exact records for the app and region riyadh-1. Then, at the registrar of medaad.tech:
1. Add the records CranL gave you for the apex `medaad.tech` (and `www`, section 4).
2. Remove conflicting old A/AAAA/CNAME records for the same names.
3. Wait for DNS and for CranL to issue the TLS certificate (can take minutes to hours). Check: `dig +short medaad.tech` and `dig +short www.medaad.tech`.

## 4. Decision: www or apex
Recommendation: apex `https://medaad.tech` is the canonical address. The site already says so: canonical tags, Open Graph URLs, sitemap and robots all use `https://medaad.tech`. So:
- `www.medaad.tech` must redirect (301) to `https://medaad.tech`.
- `http://` must redirect to `https://` (CranL's edge does this; verify below).

The nginx config has no www redirect (`server_name _`). Options, in order of preference:
1. If CranL offers a redirect for an extra domain, use it (check the dashboard after `cranl apps domains add $APP www.medaad.tech`).
2. Registrar-level URL redirect for `www` to `https://medaad.tech` (works only if the registrar can also serve HTTPS for www).
3. A small code change in `deploy/default.conf.template`, made by a developer through the normal review gate, then redeployed: a first `server` block matching `server_name www.medaad.tech;` that returns `301 https://medaad.tech$request_uri;`. Without TLS for www at the edge this still shows a certificate warning first, so confirm CranL issues a certificate for www.

If the owner prefers www as canonical, the opposite redirect is needed AND `site` in `astro.config.mjs`, `public/robots.txt` and the OG tags must change (a code change and a rebuild). Do not launch with both addresses serving the site without a redirect: it splits search ranking.

## 5. Verify after the domain is live
```bash
# HTTP -> HTTPS
curl -sI http://medaad.tech/ | grep -iE '^(HTTP|location)'
# HTTPS answers, headers present
curl -sI https://medaad.tech/ | grep -iE '^(HTTP|strict-transport|content-security|x-frame|x-content-type|referrer-policy|permissions-policy|cross-origin-opener|x-robots|cache-control)'
# www redirect
curl -sI https://www.medaad.tech/ | grep -iE '^(HTTP|location)'
# SEO files
curl -s https://medaad.tech/robots.txt
curl -sI https://medaad.tech/sitemap-index.xml | head -1
curl -sI https://medaad.tech/og/medad-og.png | head -1
# pages and 404
for p in / /works /works/halqah /works/nabda /works/tasyeer-tasjeel /works/tasyeer-tahfeez /works/injaz /works/malamih; do printf '%s ' $p; curl -s -o /dev/null -w '%{http_code}\n' https://medaad.tech$p; done
curl -s -o /dev/null -w '404 page: %{http_code}\n' https://medaad.tech/no-such-page
```
Expected on `medaad.tech`:
- `strict-transport-security: max-age=31536000` present.
- `content-security-policy: frame-ancestors 'none'`, `x-frame-options: DENY`, `x-content-type-options: nosniff`, `referrer-policy`, `permissions-policy`, `cross-origin-opener-policy: same-origin`.
- NO `x-robots-tag` header (the `noindex` is only for `*.cranl.net`). If it appears on medaad.tech the site will vanish from search: fix immediately.
- Pages `no-cache`; `/_astro/*` immutable one year.
- Every page returns 200; unknown path returns 404.

Then in a browser: home opener plays, page transition works, each demo opens, WhatsApp button opens the right chat, no console errors, no horizontal scroll on a phone. Optionally submit `https://medaad.tech/sitemap-index.xml` in Google Search Console.

## 6. Rollback
The CranL CLI (1.7.0) has no `rollback` command. Use git:
```bash
git log --oneline -10                          # find the bad commit
git revert <bad-sha>                           # or several: git revert <old>..<new>
git push origin main
cranl apps deploy $APP                          # retry once if "Remote command failed"
```
Alternative if the dashboard lists earlier deployments with a redeploy option, redeploy the previous successful one (the sha you noted in section 2). A static site redeploys in a few minutes. Never force-push `main`.

Domain emergency (wrong DNS or certificate problem): remove the domain from the app in the dashboard, or restore the previous DNS records at the registrar; the cranl.net preview keeps working as a fallback.

## 7. Monitoring
```bash
cranl apps logs $APP                # nginx runtime logs (errors, 404s)
cranl apps monitoring $APP          # CPU / memory / disk
cranl apps deployments list $APP
```
Also set an external uptime check on `https://medaad.tech/` (any free monitor). Renew: domain at the registrar, and the CranL plan.

## 8. After launch: the cranl.net preview
It keeps serving the same site with `noindex, nofollow`, so it will not compete in search. Options:
- Keep it as a staging address (recommended while the project is maintained).
- Or remove it once the domain is stable. Do not publish the preview URL anywhere (it is not canonical).
