import type { Files } from '../../../src/lib/snapshot.ts';
import type { Draft } from './draft.ts';
import { OTHER_WORK } from './blank.ts';
import { LABELS, OPTION_LABELS } from './fields.ts';
import { usd } from './preview.ts';
import { flatten } from './texts.ts';
import { kindOf, readItem, twinPath } from './twins.ts';
import { bodyText } from './yaml-edit.ts';

export type CollectionKey = 'pricing' | 'work' | 'other' | 'faq' | 'texts' | 'site';

export const COLLECTIONS: {
  key: CollectionKey;
  id: string;
  name: string;
  /** Which files of the snapshot belong to it (for the "Borrador" markers). */
  owns: (path: string) => boolean;
}[] = [
  {
    key: 'pricing',
    id: 'C-01',
    name: 'Precios',
    owns: (p) => p.startsWith('src/content/pricing/'),
  },
  {
    key: 'work',
    id: 'C-02',
    name: 'Proyectos',
    owns: (p) => p.startsWith('src/content/work/'),
  },
  {
    key: 'other',
    id: 'C-03',
    name: 'Otros trabajos',
    owns: (p) => p === 'src/content/other-work.json',
  },
  {
    key: 'faq',
    id: 'C-04',
    name: 'Preguntas frecuentes',
    owns: (p) => p.startsWith('src/content/faq/'),
  },
  {
    key: 'texts',
    id: 'C-05',
    name: 'Textos',
    owns: (p) => p.startsWith('src/i18n/ui.'),
  },
  {
    key: 'site',
    id: 'C-06',
    name: 'Datos del sitio',
    owns: (p) => p === 'src/config/site.data.json',
  },
];

export type Item = {
  id: string;
  title: string;
  meta: string;
  /** The editable file in each language (a single entry when the item has no twin). */
  paths: string[];
};

const uiUnit = (files: Files, billing: string) =>
  String(JSON.parse(files['src/i18n/ui.es.json']).offer.units[billing]).toLowerCase();

const PRICING_EN = /^src\/content\/pricing\/en\/.+\.md$/;
const WORK_EN = /^src\/content\/work\/en\/.+\.mdx$/;
const FAQ_EN = 'src/content/faq/en.json';
const UI_EN = 'src/i18n/ui.en.json';

export function itemsOf(key: CollectionKey, files: Files): Item[] {
  if (key === 'pricing')
    return Object.keys(files)
      .filter((p) => PRICING_EN.test(p))
      .sort()
      .map((p) => {
        const it = readItem(files, p);
        return {
          id: String(it.id),
          title: String(it.name),
          meta: `${usd(Number(it.from))} · ${uiUnit(files, String(it.billing))}`,
          paths: [p, twinPath(p)],
        };
      });
  if (key === 'faq')
    return (
      JSON.parse(files[FAQ_EN]) as { id: string; q: string; page: string; order: number }[]
    ).map((q) => ({
      id: q.id,
      title: q.q,
      meta: `Página: ${q.page} · orden ${q.order}`,
      paths: [FAQ_EN, twinPath(FAQ_EN)],
    }));
  if (key === 'site')
    return [
      {
        id: 'site',
        title: 'Datos del sitio',
        meta: 'Compartido ES · EN',
        paths: ['src/config/site.data.json'],
      },
    ];
  if (key === 'work')
    return Object.keys(files)
      .filter((p) => WORK_EN.test(p))
      .sort()
      .map((p) => {
        const it = readItem(files, p);
        return {
          id: String(it.id),
          title: String(it.title || 'Sin nombre'),
          meta: `${OPTION_LABELS[String(it.status)] ?? it.status} · ${it.year}${it.draft ? ' · borrador' : ''}`,
          paths: [p, twinPath(p)],
        };
      });
  if (key === 'other')
    return (JSON.parse(files[OTHER_WORK]) as { id: string; title: string; repo: string }[]).map(
      (e) => ({
        id: e.id,
        title: e.title || 'Sin nombre',
        meta: e.repo || 'Sin repositorio',
        paths: [OTHER_WORK],
      }),
    );
  if (key === 'texts')
    return [
      {
        id: 'texts',
        title: 'Textos de la interfaz',
        meta: `${Object.keys(flatten(JSON.parse(files[UI_EN]))).length} cadenas · ES · EN`,
        paths: [UI_EN, twinPath(UI_EN)],
      },
    ];
  return [];
}

/** Published items that the draft removes (their files, or their entry in other-work.json). */
export function removedItems(key: CollectionKey, current: Files, working: Files): Item[] {
  const left = new Set(itemsOf(key, working).map((i) => i.id));
  return itemsOf(key, current).filter((i) => !left.has(i.id));
}

export type DraftRow = {
  collection: CollectionKey | null;
  id: string;
  title: string;
  what: string;
  /** The item is removed in the draft, so there is no editor to open: the list offers "Restaurar". */
  removed?: boolean;
};

type Obj = Record<string, unknown>;

const changedLabels = (a: Record<string, unknown>, b: Record<string, unknown>) =>
  [...new Set([...Object.keys(a), ...Object.keys(b)])]
    .filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
    .map((k) => LABELS[k] ?? k);

/** How many texts differ from the published ones, in both languages together. */
const changedTexts = (current: Files, working: Files) =>
  [UI_EN, twinPath(UI_EN)].reduce((n, p) => {
    const was = flatten(JSON.parse(current[p]));
    const now = flatten(JSON.parse(working[p]));
    return n + Object.keys(now).filter((k) => was[k] !== now[k]).length;
  }, 0);

/** One row per edited item (the ES and EN files of an item are one row). */
export function draftRows(current: Files, working: Files, draft: Draft): DraftRow[] {
  const rows = new Map<string, DraftRow>();
  const add = (r: DraftRow, what: string[]) => {
    const prev = rows.get(`${r.collection}:${r.id}`);
    const all = [...new Set([...(prev?.what ? prev.what.split(', ') : []), ...what])];
    rows.set(`${r.collection}:${r.id}`, { ...r, what: all.join(', ') });
  };
  for (const path of Object.keys(draft)) {
    const kind = kindOf(path);
    if (kind === 'pricing' && path in current && path in working) {
      const it = readItem(working, path);
      add(
        {
          collection: 'pricing',
          id: String(it.id),
          title: String(readItem(working, path.replace('/es/', '/en/')).name),
          what: '',
        },
        changedLabels(readItem(current, path), it),
      );
    } else if (kind === 'faq' && path in current && path in working) {
      const was = JSON.parse(current[path]) as { id: string }[];
      for (const q of JSON.parse(working[path]) as { id: string; q: string }[]) {
        const old = was.find((x) => x.id === q.id);
        if (JSON.stringify(old) !== JSON.stringify(q))
          add({ collection: 'faq', id: q.id, title: q.q, what: '' }, changedLabels(old ?? {}, q));
      }
    } else if (kind === 'site') {
      add(
        { collection: 'site', id: 'site', title: 'Datos del sitio', what: '' },
        changedLabels(JSON.parse(current[path]), JSON.parse(working[path])),
      );
    } else if (kind === 'work') {
      const front = (files: Files, p: string) => (p in files ? readItem(files, p) : undefined);
      const en = path.replace('/work/es/', '/work/en/');
      const [was, now] = [front(current, path), front(working, path)];
      const id = String((now ?? was)?.id);
      const row = {
        collection: 'work' as const,
        id,
        title: String(front(working, en)?.title || front(current, en)?.title || id),
        what: '',
      };
      if (!was) add(row, ['Nuevo']);
      else if (!now) add({ ...row, removed: true }, ['Quitado']);
      else
        add(row, [
          ...changedLabels(was, now),
          ...(bodyText(current[path]) !== bodyText(working[path]) ? ['Narrativa'] : []),
        ]);
    } else if (kind === 'other') {
      const was = JSON.parse(current[path] ?? '[]') as Obj[];
      const now = JSON.parse(working[path] ?? '[]') as Obj[];
      const row = (e: Obj) => ({
        collection: 'other' as const,
        id: String(e.id),
        title: String(e.title || e.id),
        what: '',
      });
      for (const e of now) {
        const old = was.find((x) => x.id === e.id);
        if (!old) add(row(e), ['Nuevo']);
        else if (JSON.stringify(old) !== JSON.stringify(e)) add(row(e), changedLabels(old, e));
      }
      for (const old of was)
        if (!now.some((x) => x.id === old.id)) add({ ...row(old), removed: true }, ['Quitado']);
    } else if (kind === 'texts') {
      if (rows.has('texts:texts')) continue; // the ES and EN files are one row
      const n = changedTexts(current, working);
      add({ collection: 'texts', id: 'texts', title: 'Textos de la interfaz', what: '' }, [
        n === 1 ? '1 cadena' : `${n} cadenas`,
      ]);
    } else {
      const owner = COLLECTIONS.find((c) => c.owns(path));
      add({ collection: owner?.key ?? null, id: path, title: path, what: 'Archivo' }, ['Archivo']);
    }
  }
  return [...rows.values()];
}
