import type { Files } from '../../src/lib/snapshot.ts';
import { COLLECTIONS, itemsOf } from './lib/collections';
import { go } from './route';

const count = (n: number) => `${n} ${n === 1 ? 'elemento' : 'elementos'}`;

export function Explorer({
  coll,
  working,
  draftPaths,
}: {
  coll?: string;
  working: Files;
  draftPaths: string[];
}) {
  const sel = COLLECTIONS.find((c) => c.key === coll) ?? COLLECTIONS[0];
  const items = itemsOf(sel.key, working);

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
                <span className="ad-row-meta">
                  {c.editable
                    ? count(itemsOf(c.key, working).length)
                    : 'Su editor llega en una próxima tarea'}
                </span>
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
          </div>
          {!sel.editable && (
            <p className="ad-p ad-pad">Esta colección todavía no se edita desde el panel.</p>
          )}
          {items.map((it) => (
            <div key={it.id} className="ad-item">
              <span className="ad-k">{it.id === 'site' ? 'S-01' : it.id}</span>
              <span className="ad-row-main">
                <span className="ad-item-title">
                  <span className="ad-row-title">{it.title}</span>
                  {it.paths.some((p) => draftPaths.includes(p)) && (
                    <span className="ad-tag ad-hatch">Borrador</span>
                  )}
                </span>
                <span className="ad-row-meta">{it.meta}</span>
              </span>
              <button
                type="button"
                className="ad-link"
                onClick={() => go('content', sel.key, it.id)}
              >
                Editar →
              </button>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
