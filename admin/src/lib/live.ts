export type LiveState = 'building' | 'live' | 'timeout';

/**
 * Polls `${siteUrl}/rev.json` until it shows `rev` (or a newer one). Yields 'building' per poll that
 * does not, then 'live' or 'timeout'. `fetchFn`/`sleep` are injectable for tests.
 */
export async function* waitForLive(
  rev: number,
  siteUrl: string,
  opts: {
    timeoutMs?: number;
    intervalMs?: number;
    fetchFn?: typeof fetch;
    sleep?: (ms: number) => Promise<void>;
  } = {},
): AsyncGenerator<LiveState> {
  const { timeoutMs = 300_000, intervalMs = 5_000, fetchFn = fetch } = opts;
  const sleep = opts.sleep ?? ((ms) => new Promise<void>((r) => setTimeout(r, ms)));
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    try {
      const res = await fetchFn(`${siteUrl}/rev.json?t=${Date.now()}`, { cache: 'no-store' });
      const body = (await res.json()) as { rev?: number };
      if (res.ok && typeof body.rev === 'number' && body.rev >= rev) {
        yield 'live';
        return;
      }
    } catch {
      // site momentarily unreachable or not JSON: keep waiting
    }
    yield 'building';
    await sleep(intervalMs);
  }
  yield 'timeout';
}
