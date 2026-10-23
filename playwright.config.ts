/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

/* Tests run against the built static site served by `astro preview`
   (local only, never production). `--ignore-lock` keeps preview in the
   foreground: Astro 7 auto-backgrounds it when it detects an agent shell. nginx headers are checked statically in
   tests/deploy-config.spec.ts because Docker/nginx are not available locally. */
const PORT = Number(process.env.TEST_PORT ?? 4400);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    locale: 'ar-SA',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npx astro preview --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
