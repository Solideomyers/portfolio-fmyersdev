import { test, expect } from '@playwright/test';
import { handleContact, type ContactEnv } from '../src/lib/contact-handler';

const ENV: ContactEnv = {
  turnstileSecret: 'secret-xyz',
  appsScriptUrl: 'https://script.google.test/exec',
  appsScriptKey: 'form-key-123',
  testMode: false,
};

type Call = { url: string; body: string };
function stubFetch(
  opts: { turnstile?: boolean; upstream?: unknown; upstreamThrows?: boolean } = {},
) {
  const calls: Call[] = [];
  const fn = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const body =
      init?.body instanceof URLSearchParams ? init.body.toString() : String(init?.body ?? '');
    calls.push({ url, body });
    if (url.includes('turnstile')) return Response.json({ success: opts.turnstile ?? true });
    if (opts.upstreamThrows) throw new TypeError('network');
    return Response.json(opts.upstream ?? { ok: true });
  }) as typeof fetch;
  return { fn, calls };
}

function req(fields: Record<string, string>, { json = true, method = 'POST' } = {}) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return new Request('https://fmyers.dev/api/contact', {
    method,
    body: method === 'POST' ? fd : undefined,
    headers: json ? { Accept: 'application/json' } : {},
  });
}

const valid = {
  email: 'ana@example.com',
  message: 'Hi',
  lang: 'en',
  'cf-turnstile-response': 'tok',
};

test('JS submit: verifies Turnstile, forwards without spam fields, returns ok JSON', async () => {
  const { fn, calls } = stubFetch();
  const res = await handleContact(req({ ...valid, website: '' }), ENV, fn);
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ ok: true });
  expect(calls[0].url).toContain('challenges.cloudflare.com');
  const forwarded = JSON.parse(calls[1].body);
  expect(forwarded).toEqual({
    key: 'form-key-123',
    lang: 'en',
    name: '',
    email: 'ana@example.com',
    type: '',
    budget: '',
    message: 'Hi',
    noJs: false,
  });
  expect(calls[1].body).not.toContain('tok');
});

test('honeypot: fake success, nothing forwarded', async () => {
  const { fn, calls } = stubFetch();
  const res = await handleContact(req({ ...valid, website: 'x' }), ENV, fn);
  expect(await res.json()).toEqual({ ok: true });
  expect(calls).toHaveLength(0);
});

test('invalid input: 422 with errors (JSON) or 303 to the error anchor (no JS)', async () => {
  const { fn } = stubFetch();
  const a = await handleContact(req({ ...valid, email: 'bad' }), ENV, fn);
  expect(a.status).toBe(422);
  expect(await a.json()).toEqual({ ok: false, errors: { email: 'invalid' } });
  const b = await handleContact(
    req({ ...valid, email: 'bad', lang: 'es' }, { json: false }),
    ENV,
    fn,
  );
  expect(b.status).toBe(303);
  expect(b.headers.get('location')).toBe('/es/contacto#send-error');
});

test('Turnstile failure and missing token on JSON requests are 403', async () => {
  const bad = stubFetch({ turnstile: false });
  expect((await handleContact(req(valid), ENV, bad.fn)).status).toBe(403);
  const { fn } = stubFetch();
  const noToken = { ...valid, 'cf-turnstile-response': '' };
  expect((await handleContact(req(noToken), ENV, fn)).status).toBe(403);
});

test('no-JS without token: forwarded as noJs and redirected to the sent page', async () => {
  const { fn, calls } = stubFetch();
  const noToken = { email: 'ana@example.com', message: 'Hi', lang: 'en' };
  const res = await handleContact(req(noToken, { json: false }), ENV, fn);
  expect(res.status).toBe(303);
  expect(res.headers.get('location')).toBe('/en/contact/sent');
  expect(JSON.parse(calls[0].body).noJs).toBe(true);
});

test('upstream rejection or failure: 502 / 303 error; body never echoes secrets', async () => {
  for (const opts of [{ upstream: { ok: false, reason: 'cap' } }, { upstreamThrows: true }]) {
    const { fn } = stubFetch(opts);
    const res = await handleContact(req(valid), ENV, fn);
    expect(res.status).toBe(502);
    const text = await res.text();
    for (const s of ['secret-xyz', 'form-key-123', 'script.google']) expect(text).not.toContain(s);
  }
  const { fn } = stubFetch({ upstream: { ok: false } });
  const redirect = await handleContact(req(valid, { json: false }), ENV, fn);
  expect(redirect.headers.get('location')).toBe('/en/contact#send-error');
});

test('missing configuration: 503 unless test mode supplies the Turnstile test secret', async () => {
  const { fn } = stubFetch();
  expect((await handleContact(req(valid), { ...ENV, appsScriptUrl: undefined }, fn)).status).toBe(
    503,
  );
  expect((await handleContact(req(valid), { ...ENV, turnstileSecret: undefined }, fn)).status).toBe(
    503,
  );
  const ok = await handleContact(
    req(valid),
    { ...ENV, turnstileSecret: undefined, testMode: true },
    fn,
  );
  expect(ok.status).toBe(200);
});

test('non-POST is 405', async () => {
  const res = await handleContact(req({}, { method: 'GET' }), ENV, stubFetch().fn);
  expect(res.status).toBe(405);
});
