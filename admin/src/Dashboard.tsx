import { useEffect, useState } from 'react';
import { lastRevision, type LastRevision } from './lib/api';
import type { DraftRow } from './lib/collections';
import { go } from './route';

export const revLabel = (n: number | null) =>
  n === null ? 'REV —' : `REV ${String(n).padStart(4, '0')}`;

const when = (iso: string) =>
  new Date(iso).toLocaleString('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const KIND = {
  import: 'Importación inicial',
  publish: 'Publicación',
  restore: 'Restauración',
} as const;

/**
 * Where "Editar →" for a drafted row goes: its editor, or the collection list for an item the draft
 * removes (no editor to open there, but the list offers "Restaurar") and for files without a row of
 * their own.
 */
export function rowTarget(row: DraftRow): string[] {
  return row.collection && !row.removed
    ? ['content', row.collection, row.id]
    : ['content', row.collection ?? ''];
}

export function Dashboard({
  rows,
  revision,
  onDiscardAll,
}: {
  rows: DraftRow[];
  revision: number;
  onDiscardAll: () => void;
}) {
  const [last, setLast] = useState<LastRevision | null>(null);
  const [asking, setAsking] = useState(false);
  useEffect(() => {
    lastRevision().then(setLast, () => setLast(null));
  }, []);
  const n = rows.length;

  return (
    <div className="ad-screen">
      <div className="ad-screen-head">
        <h1 className="ad-h1">
          {n === 0
            ? 'Todo está publicado.'
            : n === 1
              ? '1 borrador sin publicar.'
              : `${n} borradores sin publicar.`}
        </h1>
        {n > 0 && (
          <button type="button" className="ad-btn ad-btn-primary" onClick={() => go('publish')}>
            Revisar y publicar →
          </button>
        )}
      </div>

      <div className="ad-stats">
        <div className="ad-stat">
          <span className="ad-k">Borradores</span>
          <span className="ad-stat-v">{n}</span>
          <span className="ad-stat-note">
            {n ? 'Elementos con cambios sin publicar' : 'Nada pendiente'}
          </span>
        </div>
        <div className="ad-stat">
          <span className="ad-k">Última publicación</span>
          <span className="ad-stat-v">{revLabel(revision)}</span>
          <span className="ad-stat-note">{last ? when(last.created_at) : '—'}</span>
        </div>
      </div>

      <div className="ad-two">
        <section className="ad-card ad-grow2" aria-label="Borradores pendientes">
          <div className="ad-card-head">
            <span className="ad-mono">Borradores pendientes</span>
            {n > 0 &&
              (asking ? (
                <span className="ad-confirm">
                  <span className="ad-k">¿Descartar los {n}?</span>
                  <button
                    type="button"
                    className="ad-link ad-link-danger"
                    onClick={() => {
                      setAsking(false);
                      onDiscardAll();
                    }}
                  >
                    Sí, descartar
                  </button>
                  <button type="button" className="ad-link" onClick={() => setAsking(false)}>
                    Cancelar
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  className="ad-link ad-link-danger"
                  onClick={() => setAsking(true)}
                >
                  Descartar todos
                </button>
              ))}
          </div>
          {rows.map((r) => (
            <button
              key={`${r.collection}:${r.id}`}
              type="button"
              className="ad-row ad-row-draft"
              onClick={() => go(...rowTarget(r))}
            >
              <span className="ad-row-main">
                <span className="ad-k">{r.id}</span>
                <span className="ad-row-title">{r.title}</span>
                <span className="ad-row-meta">{r.what}</span>
              </span>
              <span className="ad-mono ad-accent">{r.removed ? 'Ver →' : 'Editar →'}</span>
            </button>
          ))}
          {n === 0 && (
            <p className="ad-p ad-pad">
              No hay borradores. El sitio coincide con lo último que publicaste.
            </p>
          )}
        </section>

        <section className="ad-card ad-grow1" aria-label="Última publicación">
          <div className="ad-card-head">
            <span className="ad-mono">Última publicación</span>
          </div>
          <div className="ad-last">
            <span className="ad-h2">{revLabel(revision)}</span>
            {last && (
              <span className="ad-last-note">
                {KIND[last.kind]}
                {last.note ? ` · ${last.note}` : ''}
              </span>
            )}
            {last?.summary && last.kind !== 'import' && (
              <span className="ad-k">{last.summary}</span>
            )}
            <button type="button" className="ad-link ad-link-start" onClick={() => go('history')}>
              Ver historial →
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
