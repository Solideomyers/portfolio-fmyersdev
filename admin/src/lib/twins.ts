import { splitFrontmatter, type Files } from '../../../src/lib/snapshot.ts';
import { setLeaf } from './texts.ts';
import { editFrontmatter, setBody } from './yaml-edit.ts';

/**
 * Keys that must be identical in the ES and EN file of an item. Editing one writes both, so the
 * panel cannot create the mismatch that validateFiles refuses (pricing: TWIN_KEYS in snapshot.ts).
 * `work`: the keys that are the same in every case study (name, slug, status, year, stack...);
 * summary, client, role, timeline, cover, shots and metrics are written per language.
 */
export const SHARED_KEYS = {
  pricing: ['id', 'order', 'from', 'billing', 'featured'],
  faq: ['id', 'page', 'order'],
  work: ['id', 'slug', 'title', 'stack', 'status', 'version', 'year', 'featured', 'order', 'draft'],
} as const;

export type Kind = keyof typeof SHARED_KEYS | 'site' | 'texts' | 'other';

/** The key that stands for the MDX narrative in `applyEdit` (the body is not frontmatter). */
export const BODY = '$body';

export const kindOf = (path: string): Kind | null =>
  /^src\/content\/pricing\/(en|es)\/.+\.md$/.test(path)
    ? 'pricing'
    : /^src\/content\/faq\/(en|es)\.json$/.test(path)
      ? 'faq'
      : /^src\/content\/work\/(en|es)\/.+\.mdx$/.test(path)
        ? 'work'
        : path === 'src/content/other-work.json'
          ? 'other' // one file, no twin
          : path === 'src/config/site.data.json'
            ? 'site'
            : /^src\/i18n\/ui\.(en|es)\.json$/.test(path)
              ? 'texts' // each language is edited on its own (lib/texts.ts setLeaf), nothing is shared
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

const isMarkdown = (path: string) => /\.mdx?$/.test(path);

/** `id` picks one element of a JSON array file (FAQ, other work); markdown and JSON objects need none. */
const itemOf = (
  path: string,
  text: string,
  id?: string,
): { root: unknown; item: Obj; index?: number } => {
  const root: unknown = JSON.parse(text);
  if (!id) return { root, item: root as Obj };
  const index = (root as Obj[]).findIndex((x) => x.id === id);
  if (index < 0) throw new Error(`${path}: no item ${id}`);
  return { root, item: (root as Obj[])[index], index };
};

/** The editable values of one item as a plain object. */
export function readItem(files: Files, path: string, id?: string): Obj {
  const text = files[path];
  if (isMarkdown(path)) return splitFrontmatter(text).data as Obj;
  return itemOf(path, text, id).item;
}

const write = (text: string, path: string, key: string, value: unknown, id?: string): string => {
  if (isMarkdown(path))
    return key === BODY ? setBody(text, String(value)) : editFrontmatter(text, { [key]: value });
  const { root, item, index } = itemOf(path, text, id);
  const keys = key.split('.');
  const old = keys.reduce<unknown>((o, k) => (o as Obj | undefined)?.[k], item);
  // a text that already exists is replaced where it stands, so the file keeps its layout
  if (typeof value === 'string' && typeof old === 'string')
    return setLeaf(text, `${index === undefined ? '' : `[${index}].`}${key}`, value);
  setIn(item, keys, value);
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
    (kind === 'pricing' || kind === 'faq' || kind === 'work') &&
    (SHARED_KEYS[kind] as readonly string[]).includes(key);
  const next = { ...files };
  for (const p of shared ? [path, twinPath(path)] : [path])
    next[p] = write(files[p], p, key, value, id);
  return next;
}
