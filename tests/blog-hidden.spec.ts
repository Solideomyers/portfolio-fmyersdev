import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const run = (dir: string) => {
  try {
    execFileSync('node', ['scripts/check-blog-hidden.mjs', dir], { stdio: 'pipe' });
    return 0;
  } catch (e) {
    return (e as { status: number }).status;
  }
};
const site = (files: Record<string, string>) => {
  const dir = mkdtempSync(join(tmpdir(), 'blog-hidden-'));
  for (const [p, body] of Object.entries(files)) {
    mkdirSync(join(dir, p, '..'), { recursive: true });
    writeFileSync(join(dir, p), body);
  }
  return dir;
};

test('passes on a build without the blog', () => {
  expect(run(site({ 'en/index.html': '<a href="/en/work">w</a>' }))).toBe(0);
});
test('fails on a notes page, a feed, an OG image or a link to the blog', () => {
  expect(run(site({ 'en/notes/index.html': '' }))).toBe(1);
  expect(run(site({ 'es/notas/rss.xml': '' }))).toBe(1);
  expect(run(site({ 'og/notes/en/x.png': '' }))).toBe(1);
  expect(run(site({ 'en/index.html': '<a href="/es/notas">n</a>' }))).toBe(1);
});

test('also catches absolute URLs, og:image, src= and non-HTML outputs', () => {
  const abs = '<link rel="alternate" href="https://fmyers.dev/en/notes/rss.xml">';
  expect(run(site({ 'en/index.html': abs }))).toBe(1);
  expect(
    run(
      site({
        'en/a.html': '<meta property="og:image" content="https://fmyers.dev/og/notes/en/x.png">',
      }),
    ),
  ).toBe(1);
  expect(run(site({ 'en/b.html': "<img src='/og/notes/en/x.png'>" }))).toBe(1);
  expect(run(site({ 'sitemap.xml': '<loc>https://fmyers.dev/es/notas</loc>' }))).toBe(1);
  expect(run(site({ 'en/c.html': '<a href="https://fmyers.dev/en/work">w</a>' }))).toBe(0);
});

test('catches absolute URLs on any host (production runs on the Vercel domain)', () => {
  expect(run(site({ 'sitemap.xml': '<loc>https://fmyers-dev.vercel.app/en/notes</loc>' }))).toBe(1);
  expect(run(site({ 'en/a.html': '<link href="https://fmyers-dev.vercel.app/es/notas/x">' }))).toBe(
    1,
  );
});
