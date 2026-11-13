import { useEffect, useState } from 'react';
import { revLabel } from './Dashboard';
import { listRevisions, type Revision } from './lib/api';

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

/** "Vuelve a REV 0006" for a restore; otherwise the note, else the files it changed. */
const text = (r: Revision) =>
  r.kind === 'restore' && r.restored_from !== null
    ? `Vuelve a ${revLabel(r.restored_from)}${r.note ? ` · ${r.note}` : ''}`
    : r.note || (r.kind === 'import' ? KIND.import : r.summary) || KIND[r.kind];

/** S6. `current` is the revision the site is built from; restoring it would change nothing. */
export function History({
  current,
  onRestore,
}: {
  current: number;
  onRestore: (id: number) => Promise<void>;
}) {
  const [revs, setRevs] = useState<Revision[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [asking, setAsking] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [restoreFailed, setRestoreFailed] = useState(false);

  useEffect(() => {
    listRevisions().then(setRevs, () => setFailed(true));
  }, []);

  if (failed)
    return (
      <p role="alert" className="ad-p">
        No se pudo cargar el historial. Recarga la página para intentarlo de nuevo.
      </p>
    );
  if (!revs)
    return (
      <p role="status" className="ad-p">
        Cargando…
      </p>
    );

  const restore = async (id: number) => {
    setBusy(true);
    setRestoreFailed(false);
    try {
      await onRestore(id);
    } catch {
      setBusy(false);
      setRestoreFailed(true);
    }
  };

  return (
    <div className="ad-screen">
      <h1 className="ad-h1">Historial</h1>
      <p className="ad-p ad-narrow">
        Cada publicación guarda una versión completa. Restaurar republica esa versión y la registra
        como una entrada nueva.
      </p>
      <div className="ad-card">
        {revs.map((r) => (
          <div key={r.id}>
            <div className="ad-rev" data-current={r.id === current}>
              <span className="ad-rev-id">
                <span className="ad-mono">{revLabel(r.id)}</span>
                {r.id === current && (
                  <span className="ad-tag">
                    <span className="ad-dot" style={{ background: 'var(--ok)' }} />
                    Actual
                  </span>
                )}
                {r.kind === 'restore' && <span className="ad-tag ad-hatch">Restauración</span>}
              </span>
              <span className="ad-k">{when(r.created_at)}</span>
              <span className="ad-rev-sum">{text(r)}</span>
              <span className="ad-rev-act">
                {r.id !== current && (
                  <button
                    type="button"
                    className="ad-btn"
                    aria-expanded={asking === r.id}
                    onClick={() => setAsking(asking === r.id ? null : r.id)}
                  >
                    Restaurar
                  </button>
                )}
              </span>
            </div>
            {asking === r.id && (
              <div role="alertdialog" aria-label="Confirmar restauración" className="ad-ask">
                <span className="ad-h2">¿Volver a {revLabel(r.id)}?</span>
                <span className="ad-p">
                  El sitio se republica tal como estaba el {when(r.created_at)}. Queda registrado
                  como una versión nueva, así que también se puede deshacer. Tus borradores no se
                  tocan.
                </span>
                {restoreFailed && (
                  <span role="alert" className="ad-danger ad-small">
                    No se pudo restaurar. Revisa tu conexión e inténtalo de nuevo.
                  </span>
                )}
                <div className="ad-ask-actions">
                  <button
                    type="button"
                    className="ad-btn ad-btn-primary"
                    aria-disabled={busy}
                    onClick={() => !busy && restore(r.id)}
                  >
                    {busy ? 'Restaurando…' : 'Restaurar y republicar'}
                  </button>
                  <button type="button" className="ad-btn" onClick={() => setAsking(null)}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
