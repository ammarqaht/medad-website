import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/* NFR-15 guard: the demos must never send or store what a visitor types.
   Fails if any island grows a network call or persistent storage. */
const BANNED = /\bfetch\(|XMLHttpRequest|sendBeacon|localStorage|indexedDB|document\.cookie|new WebSocket/;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : /\.(tsx?|jsx?)$/.test(n) ? [p] : [];
  });
}

test('should keep every demo island free of network calls and persistent storage', () => {
  const offenders = files('src/islands').filter((f) => BANNED.test(readFileSync(f, 'utf8')));
  expect(offenders).toEqual([]);
});
