import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fillTokens } from '../src/lib/tokens';

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const EMAIL = /[\w.+-]+@[\w-]+\.[a-z]{2,}/gi;
const COPY_EXAMPLES = /@(company|empresa|example)\.com$/i;

test('the public email and the production URL have one source each', () => {
  const offenders: string[] = [];
  for (const f of [...walk('src'), ...walk('apps-script')]) {
    if (f.replaceAll('\\', '/').endsWith('src/config/site.ts')) continue;
    if (!/\.(ts|astro|mjs|js|md|mdx|json|gs)$/.test(f)) continue;
    const text = readFileSync(f, 'utf8');
    for (const m of text.matchAll(EMAIL))
      if (!COPY_EXAMPLES.test(m[0])) offenders.push(`${f}: ${m[0]}`);
    if (text.includes('https://fmyers.dev')) offenders.push(`${f}: https://fmyers.dev`);
  }
  expect(offenders).toEqual([]);
});

const siteWith = (env: Record<string, string>) =>
  JSON.parse(
    execFileSync(
      process.execPath,
      ['-e', "import('./src/config/site.ts').then((m) => console.log(JSON.stringify(m.site)))"],
      { env: { ...process.env, VERCEL_PROJECT_PRODUCTION_URL: '', ...env }, encoding: 'utf8' },
    ),
  );

test('site.url follows the Vercel production domain, with a local fallback', () => {
  expect(siteWith({}).url).toBe('https://fmyers.dev');
  expect(siteWith({ VERCEL_PROJECT_PRODUCTION_URL: 'fmyers-dev.vercel.app' }).url).toBe(
    'https://fmyers-dev.vercel.app',
  );
  expect(siteWith({}).email).toBe('fmyersdev@gmail.com');
});

test('fillTokens replaces known {{tokens}} and leaves unknown ones', () => {
  expect(fillTokens('<p>Write to {{email}} now. {{other}}</p>', { email: 'a@b.co' })).toBe(
    '<p>Write to a@b.co now. {{other}}</p>',
  );
});

for (const p of [
  { url: '/en/contact', text: 'write to fmyersdev@gmail.com.' },
  { url: '/es/privacidad', text: 'Escribe a fmyersdev@gmail.com' },
  { url: '/en/privacy', text: 'Write to fmyersdev@gmail.com' },
]) {
  test(`${p.url} shows the current public address`, async ({ page }) => {
    await page.goto(p.url);
    const html = await page.content();
    expect(html).not.toContain('{{email}}');
    expect(html).not.toContain('hola@fmyers.dev');
    expect(html.replace(/\s+/g, ' ')).toContain(p.text);
  });
}
