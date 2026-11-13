import assert from 'node:assert/strict';
import { test } from 'node:test';

const load = async () => import('./live.ts');

const reply = (rev: number) => async () => new Response(JSON.stringify({ rev }), { status: 200 });
const nap = async () => {};

test('building twice, then live', async () => {
  const { waitForLive } = await load();
  const seq = [1, 1, 2];
  const out: string[] = [];
  for await (const s of waitForLive(2, 'https://x', {
    fetchFn: (() => reply(seq.shift()!)()) as typeof fetch,
    sleep: nap,
  }))
    out.push(s);
  assert.deepEqual(out, ['building', 'building', 'live']);
});

test('never matching ends in timeout', async () => {
  const { waitForLive } = await load();
  const out: string[] = [];
  for await (const s of waitForLive(2, 'https://x', {
    timeoutMs: 30,
    intervalMs: 10,
    fetchFn: reply(1) as typeof fetch,
  }))
    out.push(s);
  assert.equal(out.at(-1), 'timeout');
  assert.ok(out.slice(0, -1).every((s) => s === 'building'));
});
