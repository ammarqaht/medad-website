/// <reference types="node" />
import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/* NFR-16 + phase 1 task 10, validated statically: Docker and nginx are not
   available on the test machine, so the config files are read and asserted. */

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');
const conf = read('deploy/default.conf.template');
const headers = read('deploy/headers.conf');
const dockerfile = read('Dockerfile');
const strip = (s: string) => s.replace(/#.*$/gm, '');

test.describe('nginx security headers (deploy/headers.conf)', () => {
  const h = strip(headers);
  const required: [string, RegExp][] = [
    ['Content-Security-Policy', /add_header\s+Content-Security-Policy\s+"[^"]*frame-ancestors 'none'[^"]*"\s+always;/],
    ['X-Frame-Options', /add_header\s+X-Frame-Options\s+"DENY"\s+always;/],
    ['X-Content-Type-Options', /add_header\s+X-Content-Type-Options\s+"nosniff"\s+always;/],
    ['Referrer-Policy', /add_header\s+Referrer-Policy\s+"[a-z-]+"\s+always;/],
    ['Permissions-Policy', /add_header\s+Permissions-Policy\s+"[^"]*camera=\(\)[^"]*"\s+always;/],
  ];
  for (const [name, re] of required) {
    test(`should set ${name} with always`, () => expect(h).toMatch(re));
  }
});

test.describe('nginx server (deploy/default.conf.template)', () => {
  const c = strip(conf);
  const locations = [...c.matchAll(/location\s+([^{]+)\{([^}]*)\}/g)].map((m) => ({ match: m[1].trim(), body: m[2] }));

  test('should listen on $PORT (CranL) for IPv4 and IPv6', () => {
    expect(c).toMatch(/listen\s+\$\{PORT\};/);
    expect(c).toMatch(/listen\s+\[::\]:\$\{PORT\};/);
  });

  test('should include the security headers in every location (add_header does not inherit)', () => {
    expect(locations.length).toBeGreaterThanOrEqual(3);
    for (const l of locations) expect(l.body, `location ${l.match}`).toContain('include /etc/nginx/snippets/headers.conf;');
    // A server-level add_header would be silently dropped in locations that add their own.
    const serverLevel = c.replace(/location\s+[^{]+\{[^}]*\}/g, '');
    expect(serverLevel).not.toMatch(/add_header/);
  });

  test('should serve the branded 404 page with a real 404 status', () => {
    expect(c).toMatch(/error_page\s+404\s+\/404\.html;/);
    const page = locations.find((l) => l.match === '= /404.html');
    expect(page?.body).toContain('internal;');
    const root = locations.find((l) => l.match === '/');
    expect(root?.body).toMatch(/try_files\s+\$uri\s+\$uri\/index\.html\s+=404;/);
  });

  test('should hide the nginx version and enable gzip with JS and CSS types', () => {
    expect(c).toMatch(/server_tokens\s+off;/);
    expect(c).toMatch(/gzip\s+on;/);
    expect(c).toMatch(/gzip_types[^;]*text\/css/);
    expect(c).toMatch(/gzip_types[^;]*javascript/);
  });

  test('should cache hashed /_astro assets as immutable and revalidate pages', () => {
    const astro = locations.find((l) => l.match === '^~ /_astro/');
    expect(astro?.body).toMatch(/Cache-Control\s+"public, max-age=31536000, immutable"/);
    const root = locations.find((l) => l.match === '/');
    expect(root?.body).toMatch(/Cache-Control\s+"no-cache"/);
  });

  test('should keep nginx variables out of the envsubst template step', () => {
    // The nginx image only substitutes defined env vars, so $uri survives; only ${PORT} is templated.
    const templated = [...conf.matchAll(/\$\{(\w+)\}/g)].map((m) => m[1]);
    expect([...new Set(templated)]).toEqual(['PORT']);
  });
});

test.describe('Dockerfile', () => {
  test('should be multi-stage: Node build then nginx serving dist', () => {
    expect(dockerfile).toMatch(/FROM node:[\w.-]+ AS build/);
    expect(dockerfile).toMatch(/RUN npm ci/);
    expect(dockerfile).toMatch(/RUN npm run build/);
    expect(dockerfile).toMatch(/FROM nginx:[\w.-]+/);
    expect(dockerfile).toMatch(/COPY deploy\/default\.conf\.template \/etc\/nginx\/templates\/default\.conf\.template/);
    expect(dockerfile).toMatch(/COPY deploy\/headers\.conf \/etc\/nginx\/snippets\/headers\.conf/);
    expect(dockerfile).toMatch(/COPY --from=build \/app\/dist \/usr\/share\/nginx\/html/);
  });

  test('should copy every file the build needs (public, src, configs)', () => {
    for (const p of ['astro.config.mjs', 'tsconfig.json', 'src', 'public', 'package-lock.json']) {
      expect(dockerfile).toContain(p);
      expect(existsSync(join(ROOT, p))).toBe(true);
    }
  });

  test('should keep local-only and secret files out of the image context', () => {
    const ignore = read('.dockerignore');
    test.info().annotations.push({ type: '.dockerignore', description: ignore.replace(/\n/g, ' | ') });
    for (const p of ['node_modules', 'dist']) expect(ignore).toContain(p);
  });
});
