/* Checks the built site (dist/) against the copy and confidentiality rules:
   NFR-01 lang/dir, NFR-03 forbidden dashes, FR-02 no email or visible phone,
   NFR-04 banned words (client names, kept locally in .banned-words, one per
   line, never committed). Exit code 1 on any failure. */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const files = [];
const allPaths = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    allPaths.push(p);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(html|js|css|svg|json|xml|txt)$/.test(name)) files.push(p);
  }
})(DIST);

const banned = existsSync('.banned-words')
  ? readFileSync('.banned-words', 'utf8').split('\n').map((s) => s.trim()).filter(Boolean)
  : [];
if (!banned.length) console.warn('! .banned-words is missing or empty: client-name check skipped');

const problems = [];
const lower = banned.map((w) => w.toLowerCase());
const hasBanned = (s) => lower.filter((w) => s.toLowerCase().includes(w));

// Text a visitor can see or hear: element text plus alt, title, aria-label
// and meta content attributes.
const visibleText = (html) => {
  const attrs = [...html.matchAll(/\s(?:alt|title|aria-label|content)="([^"]*)"/gi)].map((m) => m[1]);
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ');
  return `${body} ${attrs.join(' ')}`;
};

for (const p of allPaths) for (const w of hasBanned(p)) problems.push(`${p}: banned word «${w}» in a file name`);

for (const f of files) {
  const src = readFileSync(f, 'utf8');
  for (const w of hasBanned(src)) problems.push(`${f}: banned word «${w}»`);
  if (!f.endsWith('.html')) continue;

  if (!/<html[^>]*\blang="ar"/.test(src) || !/<html[^>]*\bdir="rtl"/.test(src)) problems.push(`${f}: missing lang="ar" dir="rtl"`);
  // The CSP meta holds base64 hashes, not visitor text.
  const text = visibleText(src.replace(/<meta http-equiv="content-security-policy"[^>]*>/i, ''));
  if (/[—–]|--/.test(text)) problems.push(`${f}: em/en dash or "--" in visible text`);
  if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(text)) problems.push(`${f}: email address in visible text`);
  const digits = text.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660));
  if (/0?5\d{8}|9665\d{8}/.test(digits)) problems.push(`${f}: phone number in visible text`);
  if (/\sstyle="/.test(src)) problems.push(`${f}: inline style attribute (blocked by CSP)`);
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`✓ ${files.length} files checked`);
