import { errorUrl, isSpam, parseBrief, sentUrl } from './contact';
import type { Lang } from '../i18n/routes';

export interface ContactEnv {
  turnstileSecret?: string;
  appsScriptUrl?: string;
  appsScriptKey?: string;
  /** dev/test only: allows Cloudflare's always-pass test secret when none is configured */
  testMode: boolean;
}

const TEST_SECRET = '1x0000000000000000000000000000000AA';
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
const redirect = (location: string) =>
  new Response(null, { status: 303, headers: { Location: location, 'Cache-Control': 'no-store' } });
const reply = (wantsJson: boolean, status: number, lang: Lang, ok: boolean) =>
  wantsJson ? json(status, { ok }) : redirect(ok ? sentUrl(lang) : errorUrl(lang));

async function verifyTurnstile(
  fetchFn: typeof fetch,
  secret: string,
  token: string,
  ip: string | null,
) {
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set('remoteip', ip.split(',')[0].trim());
    const res = await fetchFn(SITEVERIFY, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(5000),
    });
    const out = (await res.json()) as { success?: boolean };
    return out.success === true;
  } catch {
    return false;
  }
}

/**
 * POST /api/contact. JSON in/out for the enhanced form (Accept: application/json); 303 redirects
 * for native (no-JS) posts. Never echoes secrets or upstream bodies.
 */
export async function handleContact(
  request: Request,
  env: ContactEnv,
  fetchFn: typeof fetch = fetch,
): Promise<Response> {
  if (request.method !== 'POST')
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply(wantsJson, 400, 'en', false);
  }
  const lang: Lang = form.get('lang') === 'es' ? 'es' : 'en';

  if (isSpam(form)) return reply(wantsJson, 200, lang, true);

  const parsed = parseBrief(form);
  if (!parsed.ok)
    return wantsJson ? json(422, { ok: false, errors: parsed.errors }) : redirect(errorUrl(lang));

  const secret = env.turnstileSecret ?? (env.testMode ? TEST_SECRET : undefined);
  if (!secret || !env.appsScriptUrl || !env.appsScriptKey) {
    console.error('contact: missing configuration');
    return reply(wantsJson, 503, lang, false);
  }

  // Turnstile needs JS: a token means the enhanced form, no token means a native post.
  const token = form.get('cf-turnstile-response');
  let noJs = false;
  if (typeof token === 'string' && token) {
    const ip = request.headers.get('x-forwarded-for');
    if (!(await verifyTurnstile(fetchFn, secret, token, ip)))
      return reply(wantsJson, 403, lang, false);
  } else if (wantsJson) {
    return reply(true, 403, lang, false);
  } else {
    noJs = true;
  }

  try {
    const res = await fetchFn(env.appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: env.appsScriptKey, ...parsed.data, noJs }),
      redirect: 'follow',
      signal: AbortSignal.timeout(10_000),
    });
    const out = (await res.json()) as { ok?: boolean; reason?: string };
    if (!res.ok || out.ok !== true) {
      console.error('contact: upstream rejected', res.status, out.reason ?? '');
      return reply(wantsJson, 502, lang, false);
    }
  } catch (e) {
    console.error('contact: upstream error', (e as Error).name);
    return reply(wantsJson, 502, lang, false);
  }
  return reply(wantsJson, 200, lang, true);
}
