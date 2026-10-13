import { BLOG_ENABLED } from 'astro:env/server';

// Separate from site.ts: astro:env only resolves inside Astro, and site.ts is also imported by
// Node-side tests. Turn the blog on with BLOG_ENABLED=true (Vercel env) and a redeploy.
export const blogEnabled = BLOG_ENABLED;
