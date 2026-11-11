import { test, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFiles } from '../src/lib/snapshot-fs';

// `node scripts/content.mjs pull <root>` is the real entry point, so the tests run it as a process.
const run = (root: string, env: Record<string, string> = {}) =>
  new Promise<{ code: number | null; stderr: string }>((resolve) => {
    const p = spawn('node', ['scripts/content.mjs', 'pull', root], {
      env: { ...process.env, CONTENT_SOURCE: 'fixture', ...env },
    });
    let stderr = '';
    p.stderr.on('data', (d) => (stderr += d));
    p.on('close', (code) => resolve({ code, stderr }));
  });

const fixture = JSON.parse(readFileSync('tests/fixtures/content.snapshot.json', 'utf8'));
const tmpRoot = () => mkdtempSync(join(tmpdir(), 'pull-'));

/** Local stand-in for Supabase: answers every request with `status` and `body`. */
const stub = async (status: number, body: unknown) => {
  const seen: { url?: string; apikey?: string | string[] } = {};
  const server: Server = createServer((req, res) => {
    seen.url = req.url;
    seen.apikey = req.headers.apikey;
    res.writeHead(status, { 'content-type': 'application/json' }).end(JSON.stringify(body));
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return { url, seen, close: () => server.close() };
};

const live = (url: string) => ({
  CONTENT_SOURCE: 'live',
  SUPABASE_URL: url,
  SUPABASE_ANON_KEY: 'anon-test-key',
});

test('fixture pull writes exactly the committed files', async () => {
  const root = tmpRoot();
  const { code } = await run(root);
  expect(code).toBe(0);
  expect(readFiles(root)).toEqual(readFiles('.'));
  expect(JSON.parse(readFileSync(join(root, 'public/rev.json'), 'utf8'))).toEqual({ rev: 0 });
});

test('live pull writes the snapshot and its revision', async () => {
  const s = await stub(200, { revision: 7, files: fixture.files });
  const root = tmpRoot();
  const { code } = await run(root, live(s.url));
  s.close();
  expect(code).toBe(0);
  expect(s.seen.url).toBe('/rest/v1/rpc/get_current_snapshot');
  expect(s.seen.apikey).toBe('anon-test-key');
  expect(readFiles(root)).toEqual(fixture.files);
  expect(JSON.parse(readFileSync(join(root, 'public/rev.json'), 'utf8'))).toEqual({ rev: 7 });
});

test('live pull with a failing fetch exits non-zero and writes nothing', async () => {
  const s = await stub(500, { message: 'boom' });
  const root = tmpRoot();
  const { code, stderr } = await run(root, live(s.url));
  s.close();
  expect(code).not.toBe(0);
  expect(stderr).toContain('500');
  expect(readFiles(root)).toEqual({});
  expect(existsSync(join(root, 'public'))).toBe(false);
});

test('live pull with an invalid snapshot writes nothing', async () => {
  const bad = { ...fixture.files, 'src/config/site.data.json': 'not json' };
  const s = await stub(200, { revision: 8, files: bad });
  const root = tmpRoot();
  const { code, stderr } = await run(root, live(s.url));
  s.close();
  expect(code).not.toBe(0);
  expect(stderr).toContain('site.data.json');
  expect(readFiles(root)).toEqual({});
  expect(existsSync(join(root, 'public'))).toBe(false);
});
