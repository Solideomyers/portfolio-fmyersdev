import { splitFrontmatter, type Files } from '../../../src/lib/snapshot.ts';
import { editFrontmatter } from './yaml-edit.ts';

/**
 * Keys that must be identical in the ES and EN file of an item. Editing one writes both, so the
 * panel cannot create the mismatch that validateFiles refuses (pricing: TWIN_KEYS in snapshot.ts).
 * `work` joins in the project editor task.
 */
export const SHARED_KEYS = {
  pricing: ['id', 'order', 'from', 'billing', 'featured'],
  faq: ['id', 'page', 'order'],
} as const;

export type Kind = keyof typeof SHARED_KEYS | 'site';

export const kindOf = (path: string): Kind | null =>
  /^src\/content\/pricing\/(en|es)\/.+\.md$/.test(path)
    ? 'pricing'
    : /^src\/content\/faq\/(en|es)\.json$/.test(path)
      ? 'faq'
      : path === 'src/config/site.data.json'
        ? 'site'
        : null;

const other = (l: string) => (l === 'en' ? 'es' : 'en');

/** The same item in the other language: `/en/` ↔ `/es/` and `en.json` ↔ `es.json`. */
export const twinPath = (path: string): string =>
  path
    .replace(/\/(en|es)\//, (_, l) => `/${other(l)}/`)
    .replace(/(^|[./])(en|es)\.json$/, (_, pre, l) => `${pre}${other(l)}.json`);

type Obj = Record<string, unknown>;

const setIn = (obj: Obj, path: string[], value: unknown) => {
  let o = obj;
  for (const k of path.slice(0, -1)) o = o[k] as Obj;
  o[path[path.length - 1]] = value;
};

/** `id` picks one element of a JSON array file (the FAQ); markdown and JSON objects need none. */
const itemOf = (path: string, text: string, id?: string): { root: unknown; item: Obj } => {
  const root: unknown = JSON.parse(text);
  const item = id ? (root as Obj[]).find((x) => x.id === id) : (root as Obj);
  if (!item) throw new Error(`${path}: no item ${id}`);
  return { root, item };
};

/** The editable values of one item as a plain object. */
export function readItem(files: Files, path: string, id?: string): Obj {
  const text = files[path];
  if (path.endsWith('.md')) return splitFrontmatter(text).data as Obj;
  return itemOf(path, text, id).item;
}

const write = (text: string, path: string, key: string, value: unknown, id?: string): string => {
  if (path.endsWith('.md')) return editFrontmatter(text, { [key]: value });
  const { root, item } = itemOf(path, text, id);
  setIn(item, key.split('.'), value);
  return JSON.stringify(root, null, 2) + '\n';
};

/** A shared key writes both twins, any other key writes only `path`. Returns a new file map. */
export function applyEdit(
  files: Files,
  path: string,
  key: string,
  value: unknown,
  id?: string,
): Files {
  const kind = kindOf(path);
  const shared =
    kind !== null && kind !== 'site' && (SHARED_KEYS[kind] as readonly string[]).includes(key);
  const next = { ...files };
  for (const p of shared ? [path, twinPath(path)] : [path])
    next[p] = write(files[p], p, key, value, id);
  return next;
}
