import type { Files } from '../../src/lib/snapshot.ts';
import {
  COLLECTIONS,
  itemsOf,
  removedItems,
  type CollectionKey,
  type Item,
} from './lib/collections';
import { go } from './route';

// Collections with a single item show a code instead of an id.
const ITEM_TAG: Record<string, string> = { site: 'S-01', texts: 'T-01' };

// Collections whose items can be added and removed, and what the button says.
const ADD: Partial<Record<CollectionKey, string>> = {
  work: '+ Agregar proyecto',
  other: '+ Agregar trabajo',
};

const count = (n: number) => `${n} ${n === 1 ? 'elemento' : 'elementos'}`;

export function Explorer({
  coll,
  working,
  current,
  draftPaths,
  onAdd,
  onRemove,
  onRestore,
}: {
  coll?: string;
  working: Files;
  current: Files;
  draftPaths: string[];
  onAdd: (key: CollectionKey) => void;
  onRemove: (key: CollectionKey, item: Item) => void;
  onRestore: (key: CollectionKey, item: Item) => void;
}) {
  const sel = COLLECTIONS.find((c) => c.key === coll) ?? COLLECTIONS[0];
  const items = itemsOf(sel.key, working);
  const removed = removedItems(sel.key, current, working);

  return (
    <div className="ad-screen">
      <h1 className="ad-h1">Contenido</h1>
      <div className="ad-two">
        <section className="ad-card ad-grow1" aria-label="Colecciones">
          <div className="ad-card-head">
            <span className="ad-mono">Colecciones</span>
          </div>
          {COLLECTIONS.map((c) => (
            <button
              key={c.key}
              type="button"
              className="ad-row ad-row-coll"
              aria-current={c.key === sel.key ? 'true' : undefined}
              onClick={() => go('content', c.key)}
            >
              <span className="ad-k">{c.id}</span>
              <span className="ad-row-main">
                <span className="ad-row-title">{c.name}</span>
                <span className="ad-row-meta">{count(itemsOf(c.key, working).length)}</span>
              </span>
              {draftPaths.some(c.owns) && <span className="ad-tag ad-hatch">Borrador</span>}
            </button>
          ))}
        </section>

        <section className="ad-card ad-grow15" aria-label={sel.name}>
          <div className="ad-card-head">
            <span className="ad-mono">
              {sel.id} · {sel.name}
            </span>
            {ADD[sel.key] && (
              <button type="button" className="ad-btn ad-add" onClick={() => onAdd(sel.key)}>
                {ADD[sel.key]}
              </button>
            )}
          </div>
          {items.map((it) => (
            <div key={it.id} className="ad-item">
              <span className="ad-k">{ITEM_TAG[it.id] ?? it.id}</span>
              <span className="ad-row-main">
                <span className="ad-item-title">
                  <span className="ad-row-title">{it.title}</span>
                  {it.paths.some((p) => draftPaths.includes(p)) && (
                    <span className="ad-tag ad-hatch">Borrador</span>
                  )}
                </span>
                <span className="ad-row-meta">{it.meta}</span>
              </span>
              <span className="ad-item-actions">
                <button
                  type="button"
                  className="ad-link"
                  onClick={() => go('content', sel.key, it.id)}
                >
                  Editar →
                </button>
                {ADD[sel.key] && (
                  <button
                    type="button"
                    className="ad-link ad-link-danger"
                    onClick={() => onRemove(sel.key, it)}
                  >
                    Quitar
                  </button>
                )}
              </span>
            </div>
          ))}
          {removed.map((it) => (
            <div key={it.id} className="ad-item ad-item-removed">
              <span className="ad-k">{it.id}</span>
              <span className="ad-row-main">
                <span className="ad-item-title">
                  <span className="ad-row-title">{it.title}</span>
                  <span className="ad-tag ad-hatch">Quitado en el borrador</span>
                </span>
                <span className="ad-row-meta">
                  Sigue publicado hasta que publiques. Puedes restaurarlo.
                </span>
              </span>
              <button type="button" className="ad-link" onClick={() => onRestore(sel.key, it)}>
                Restaurar
              </button>
            </div>
          ))}
          {ADD[sel.key] && (
            <p className="ad-p ad-pad ad-small">
              Agregar o quitar es un borrador más: el sitio no cambia hasta que publiques.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
