import data from './site.data.json' with { type: 'json' };

// Vercel exposes the production domain at build time: the .vercel.app one today, the custom
// domain once it is added in Vercel. Canonical, OG, RSS and sitemap URLs follow it unchanged.
const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
// On Vercel a missing value would silently fall back to a domain that doesn't exist yet: fail loudly
// (Project Settings → Environment Variables → "Automatically expose System Environment Variables").
if (process.env.VERCEL && !production)
  throw new Error(
    'VERCEL_PROJECT_PRODUCTION_URL is not exposed to the build; enable system env vars',
  );

// rev, availableFrom, email, whatsapp, github and linkedin live in site.data.json (editable from the
// admin panel). The one public address: hola@fmyers.dev needs the domain + Cloudflare Email Routing (SP8b).
export const site = {
  ...data,
  url: production ? `https://${production}` : 'https://fmyers.dev',
  // Vercel Web Analytics (cookieless, aggregate): production deploys only, never previews or tests.
  analytics: process.env.VERCEL_ENV === 'production',
};
