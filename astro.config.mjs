// @ts-check
import { defineConfig, envField } from 'astro/config';
import mdx from '@astrojs/mdx';
import vercel from '@astrojs/vercel';

// Static site; the only on-demand route is src/pages/api/contact.ts (prerender = false).
export default defineConfig({
  integrations: [mdx()],
  adapter: vercel(),
  env: {
    schema: {
      // Cloudflare's always-pass test key by default; production sets the real one.
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({
        context: 'client',
        access: 'public',
        default: '1x00000000000000000000AA',
      }),
      TURNSTILE_SECRET_KEY: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      APPS_SCRIPT_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      APPS_SCRIPT_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
});
