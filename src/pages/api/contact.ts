import type { APIRoute } from 'astro';
import { APPS_SCRIPT_KEY, APPS_SCRIPT_URL, TURNSTILE_SECRET_KEY } from 'astro:env/server';
import { handleContact } from '../../lib/contact-handler';

// The only on-demand route of the site (Vercel function).
export const prerender = false;

const env = () => ({
  turnstileSecret: TURNSTILE_SECRET_KEY,
  appsScriptUrl: APPS_SCRIPT_URL,
  appsScriptKey: APPS_SCRIPT_KEY,
  testMode: import.meta.env.DEV || process.env.CONTACT_TEST_MODE === '1',
});

export const POST: APIRoute = ({ request }) => handleContact(request, env());
export const ALL: APIRoute = ({ request }) => handleContact(request, env());
