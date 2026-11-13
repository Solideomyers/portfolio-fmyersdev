import { useMemo, useState } from 'react';
import { splitFrontmatter, validateFiles, type Files } from '../../src/lib/snapshot.ts';
import { diffFiles } from './lib/diff';
import { priceLine, type Lang } from './lib/preview';
import { go } from './route';

const LANGS: Lang[] = ['es', 'en'];
const KIND = { changed: 'Modificado', added: 'Nuevo', removed: 'Quitado' } as const;

type Faq = { q: string; a: string }[];

/** One price card and one FAQ entry from the working files; the first edited one, else the first. */
function previewOf(current: Files, working: Files, lang: Lang) {
  const pick = (re: RegExp) => {
    const all = Object.keys(working)
      .filter((p) => re.test(p))
      .sort();
    return all.find((p) => working[p] !== current[p]) ?? all[0];
  };
  try {
    const ui = JSON.parse(working[`src/i18n/ui.${lang}.json`]);
    const pp = pick(new RegExp(`^src/content/pricing/${lang}/`));
    const fm = pp ? (splitFrontmatter(working[pp]).data as Record<string, unknown>) : null;
    const faq = JSON.parse(working[`src/content/faq/${lang}.json`] ?? '[]') as Faq;
    const old = new Set(
      (JSON.parse(current[`src/content/faq/${lang}.json`] ?? '[]') as Faq).map((x) => x.q + x.a),
    );
    return {
      price: fm
        ? { name: String(fm.name), ...priceLine(ui, Number(fm.from), String(fm.billing)) }
        : null,
      faq: faq.find((x) => !old.has(x.q + x.a)) ?? faq[0] ?? null,
    };
  } catch {
    return null; // a broken file is already listed under "Validación"
  }
}

export function Review({
  current,
  working,
  onPublish,
  onDiscardAll,
}: {
  current: Files;
  working: Files;
  onPublish: (note: string) => Promise<void>;
  onDiscardAll: () => void;
}) {
  const diffs = useMemo(() => diffFiles(current, working), [current, working]);
  const errors = useMemo(() => validateFiles(working), [working]);
  const [lang, setLang] = useState<Lang>('es');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const pv = useMemo(() => previewOf(current, working, lang), [current, working, lang]);
  const n = diffs.length;

  if (n === 0)
    return (
      <div className="ad-screen">
        <h1 className="ad-h1">No hay nada que publicar.</h1>
        <div className="ad-card ad-pad ad-stack">
          <p className="ad-p">El sitio coincide con lo último que publicaste.</p>
          <button type="button" className="ad-btn" onClick={() => go('content')}>
            Ir al contenido →
          </button>
        </div>
      </div>
    );

  const blocked = errors.length > 0 || busy;
  const label = errors.length
    ? `Corrige ${errors.length} ${errors.length === 1 ? 'error' : 'errores'} para publicar`
    : `Publicar ${n} ${n === 1 ? 'archivo' : 'archivos'} →`;
  const publish = async () => {
    if (blocked) return;
    setBusy(true);
    setFailed(false);
    try {
      await onPublish(note);
    } catch {
      setBusy(false);
      setFailed(true);
    }
  };

  return (
    <div className="ad-screen">
      <h1 className="ad-h1">
        {n === 1
          ? 'Revisa 1 archivo antes de publicar.'
          : `Revisa ${n} archivos antes de publicar.`}
      </h1>
      <div className="ad-review">
        <div className="ad-review-main">
          <section className="ad-card" aria-label="Diferencias">
            {diffs.map((d) => (
              <div key={d.path} className="ad-diff">
                <div className="ad-diff-head">
                  <span className="ad-mono ad-wrap">{d.path}</span>
                  <span className="ad-k">{KIND[d.kind]}</span>
                </div>
                {d.removed.map((l, i) => (
                  <div key={`r${i}`} className="ad-diff-line ad-diff-old">
                    <span className="ad-mono" aria-label="Antes">
                      −
                    </span>
                    <span>{l}</span>
                  </div>
                ))}
                {d.added.map((l, i) => (
                  <div key={`a${i}`} className="ad-diff-line ad-diff-new">
                    <span className="ad-mono" aria-label="Ahora">
                      +
                    </span>
                    <span>{l}</span>
                  </div>
                ))}
              </div>
            ))}
          </section>

          <section className="ad-card" aria-label="Vista previa simplificada">
            <div className="ad-card-head">
              <span className="ad-mono">Vista previa simplificada</span>
              <div className="ad-chips">
                {LANGS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    className="ad-chip"
                    aria-pressed={lang === l}
                    onClick={() => setLang(l)}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="ad-pv">
              {pv?.price && (
                <div className="ad-pv-card">
                  <span className="ad-pv-name">{pv.price.name}</span>
                  <span className="ad-preview-line">
                    <span className="ad-k">{pv.price.from}</span>
                    <span className="ad-preview-price">{pv.price.price}</span>
                    <span className="ad-k">{pv.price.unit}</span>
                  </span>
                </div>
              )}
              {pv?.faq && (
                <div className="ad-pv-faq">
                  <span className="ad-pv-q">{pv.faq.q}</span>
                  <span className="ad-row-meta">{pv.faq.a}</span>
                </div>
              )}
              <span className="ad-k">Solo contenido. El sitio real aplica el diseño completo.</span>
            </div>
          </section>
        </div>

        <aside className="ad-card ad-review-side">
          <div className="ad-card-head">
            <span className="ad-mono">Validación</span>
          </div>
          {errors.length === 0 ? (
            <p className="ad-p ad-pad">
              <span aria-hidden="true">✓ </span>Todo en orden: 0 errores.
            </p>
          ) : (
            <div role="alert" className="ad-errors">
              <ul>
                {errors.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="ad-pad ad-stack">
            <label className="ad-k" htmlFor="ad-note">
              Nota (opcional)
            </label>
            <input
              id="ad-note"
              className="ad-input"
              value={note}
              maxLength={120}
              onChange={(e) => setNote(e.target.value)}
            />
            <button
              type="button"
              className="ad-btn ad-btn-primary ad-publish"
              aria-disabled={blocked}
              onClick={publish}
            >
              {busy ? 'Publicando…' : label}
            </button>
            <span className="ad-small">
              {errors.length
                ? 'Nada se publica mientras haya errores.'
                : 'Se guarda como una versión nueva y el sitio se reconstruye.'}
            </span>
            {failed && (
              <span role="alert" className="ad-danger ad-small">
                No se pudo publicar. Revisa tu conexión e inténtalo de nuevo.
              </span>
            )}
            <button
              type="button"
              className="ad-link ad-link-danger ad-link-start"
              onClick={onDiscardAll}
            >
              Descartar todos los borradores
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
