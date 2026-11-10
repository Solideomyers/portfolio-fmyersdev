// Disk side of the content snapshot: Node only (scripts and tests). See snapshot.ts for the pure part.
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { isManaged, type Files } from './snapshot.ts';

const ROOTS = ['src/content', 'src/i18n', 'src/config'];

const walk = (root: string, rel: string): string[] => {
  let names: string[];
  try {
    names = readdirSync(join(root, rel));
  } catch {
    return [];
  }
  return names.flatMap((n) => {
    const p = `${rel}/${n}`;
    return statSync(join(root, p)).isDirectory() ? walk(root, p) : [p];
  });
};

const managedOnDisk = (root: string) =>
  ROOTS.flatMap((r) => walk(root, r))
    .filter(isManaged)
    .sort();

export function readFiles(root = '.'): Files {
  return Object.fromEntries(
    managedOnDisk(root).map((p) => [p, readFileSync(join(root, p), 'utf8')]),
  );
}

/** Writes every entry and deletes managed files that are not in the map. */
export function writeFiles(files: Files, root = '.'): void {
  for (const p of managedOnDisk(root)) if (!(p in files)) rmSync(join(root, p));
  for (const [p, text] of Object.entries(files)) {
    if (!isManaged(p)) throw new Error(`refusing to write unmanaged path: ${p}`);
    mkdirSync(dirname(join(root, p)), { recursive: true });
    writeFileSync(join(root, p), text);
  }
}
