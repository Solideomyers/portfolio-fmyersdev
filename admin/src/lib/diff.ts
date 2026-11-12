import type { Files } from '../../../src/lib/snapshot.ts';

export type FileDiff = {
  path: string;
  kind: 'changed' | 'added' | 'removed';
  /** Lines only in the published file. */
  removed: string[];
  /** Lines only in the working file. */
  added: string[];
};

// Lines present in `a` but not in `b`, counting repeats. ponytail: no line order or moves, so a
// reordered block shows nothing; upgrade to an LCS diff if that ever matters for these small files.
function only(a: string[], b: string[]): string[] {
  const left = new Map<string, number>();
  for (const l of b) left.set(l, (left.get(l) ?? 0) + 1);
  return a.filter((l) => {
    const n = left.get(l) ?? 0;
    if (n) left.set(l, n - 1);
    return !n;
  });
}

const lines = (t: string) => t.replace(/\r?\n$/, '').split(/\r?\n/);

/** The files the working set changes against the published one, with only the lines that differ. */
export function diffFiles(current: Files, working: Files): FileDiff[] {
  const out: FileDiff[] = [];
  for (const path of [...new Set([...Object.keys(current), ...Object.keys(working)])].sort()) {
    const a = current[path];
    const b = working[path];
    if (a === b) continue;
    if (a === undefined) out.push({ path, kind: 'added', removed: [], added: lines(b) });
    else if (b === undefined) out.push({ path, kind: 'removed', removed: lines(a), added: [] });
    else
      out.push({
        path,
        kind: 'changed',
        removed: only(lines(a), lines(b)),
        added: only(lines(b), lines(a)),
      });
  }
  return out;
}
