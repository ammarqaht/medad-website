import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

export default defineConfig({
  site: 'https://medaad.tech',
  output: 'static',
  trailingSlash: 'never',
  integrations: [preact()],
  build: { format: 'directory', inlineStylesheets: 'never' },
  devToolbar: { enabled: false },
  markdown: { syntaxHighlight: false },
  // CSP ships as a <meta> with hashes for every inline script/style Astro emits
  // (island bootstraps included). nginx adds frame-ancestors, which a meta cannot.
  security: {
    csp: {
      algorithm: 'SHA-256',
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "base-uri 'self'",
        "form-action 'none'",
        "object-src 'none'",
      ],
      scriptDirective: { resources: ["'self'"] },
      styleDirective: { resources: ["'self'"] },
    },
  },
});
