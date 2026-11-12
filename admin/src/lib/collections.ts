import type { Files } from '../../../src/lib/snapshot.ts';
import type { Draft } from './draft.ts';
import { LABELS } from './fields.ts';
import { usd } from './preview.ts';
import { kindOf, readItem, twinPath } from './twins.ts';

export type CollectionKey = 'pricing' | 'work' | 'other' | 'faq' | 'texts' | 'site';

/** `editable: false` collections get their editor in a later SP10 task; they still show draft markers. */
export const COLLECTIONS: {
  key: CollectionKey;
  id: string;
  name: string;
  editable: boolean;
  owns: (path: string) => boolean;
}[] = [
  {
    key: 'pricing',
    id: 'C-01',
    name: 'Precios',
    editable: true,
    owns: (p) => p.startsWith('src/content/pricing/'),
  },
  {
    key: 'work',
    id: 'C-02',
    name: 'Proyectos',
    editable: false,
    owns: (p) => p.startsWith('src/content/work/'),
  },
  {
    key: 'other',
    id: 'C-03',
    name: 'Otros trabajos',
    editable: false,
    owns: (p) => p === 'src/content/other-work.json',
  },
  {
    key: 'faq',
    id: 'C-04',
    name: 'Preguntas frecuentes',
    editable: true,
    owns: (p) => p.startsWith('src/content/faq/'),
  },
  {
    key: 'texts',
    id: 'C-05',
    name: 'Textos',
    editable: false,
    owns: (p) => p.startsWith('src/i18n/ui.'),
  },
  {
    key: 'site',
    id: 'C-06',
    name: 'Datos del sitio',
    editable: true,
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
const FAQ_EN = 'src/content/faq/en.json';

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
  return [];
}

export type DraftRow = {
  collection: CollectionKey | null;
  id: string;
  title: string;
  what: string;
};

const changedLabels = (a: Record<string, unknown>, b: Record<string, unknown>) =>
  [...new Set([...Object.keys(a), ...Object.keys(b)])]
    .filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
    .map((k) => LABELS[k] ?? k);

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
    } else {
      const owner = COLLECTIONS.find((c) => c.owns(path));
      add({ collection: owner?.key ?? null, id: path, title: path, what: 'Archivo' }, ['Archivo']);
    }
  }
  return [...rows.values()];
}
