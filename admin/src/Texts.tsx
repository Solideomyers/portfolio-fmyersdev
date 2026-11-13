import { useEffect, useMemo, useState } from 'react';
import type { Files } from '../../src/lib/snapshot.ts';
import type { Draft } from './lib/draft';
import { flatten, setLeaf, tokenErrors } from './lib/texts';
import { go } from './route';
import type { SaveState } from './useWorking';

const EN = 'src/i18n/ui.en.json';
const ES = 'src/i18n/ui.es.json';

const sectionOf = (key: string) => key.split(/[.[]/)[0];

/**
 * One text in one language. It keeps what is typed; a change is saved only while every placeholder
 * of the published text is still in it (`tokenErrors`), so a removed {{email}} never reaches the draft.
 */
function Cell({
  lang,
  leaf,
  value,
  published,
  save,
}: {
  lang: 'ES' | 'EN';
  leaf: string;
  value: string;
  published: string;
  save: (text: string) => void;
}) {
  const [val, setVal] = useState(value);
  const [errors, setErrors] = useState<string[]>([]);
  // A change from outside (discard) replaces what is shown; typing an invalid text does not change `value`.
  useEffect(() => {
    setVal(value);
    setErrors([]);
  }, [value]);

  const change = (text: string) => {
    setVal(text);
    const e = tokenErrors(published, text);
    setErrors(e);
    if (!e.length) save(text);
  };
  const long = published.length > 60 || published.includes('\n');
  const label = `${leaf} (${lang})`;
  const missing = val.trim() === '';
  const common = {
    className: 'ad-input',
    'aria-label': label,
    'aria-invalid': errors.length > 0 || missing,
    value: val,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      change(e.target.value),
  };

  return (
    <div className="ad-text-cell">
      <span className="ad-k">{lang}</span>
      {long ? <textarea {...common} rows={3} /> : <input {...common} />}
      {errors.length > 0 && (
        <div role="alert" className="ad-cell-error">
          {errors.map((m) => (
            <span key={m}>{m}</span>
          ))}
          <span>Sin ese marcador no se guarda este texto.</span>
        </div>
      )}
      {missing && errors.length === 0 && <span className="ad-cell-error">Sin traducir</span>}
    </div>
  );
}

export function Texts({
  working,
  current,
  draft,
  save,
  edit,
  discard,
}: {
  working: Files;
  current: Files;
  draft: Draft;
  save: SaveState;
  edit: (path: string, text: string) => void;
  discard: (paths: string[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [open, setOpen] = useState<string[]>([]);

  const now = useMemo(
    () => ({ en: flatten(JSON.parse(working[EN])), es: flatten(JSON.parse(working[ES])) }),
    [working],
  );
  const pub = useMemo(
    () => ({ en: flatten(JSON.parse(current[EN])), es: flatten(JSON.parse(current[ES])) }),
    [current],
  );

  // Filtering reads the published texts, so a row does not vanish under the cursor while it is edited.
  const needle = query.trim().toLowerCase();
  const filtering = needle !== '' || onlyMissing;
  const keys = Object.keys(pub.en).filter((k) => {
    const [es, en] = [pub.es[k] ?? '', pub.en[k]];
    const hit = !needle || [k, es, en].some((s) => s.toLowerCase().includes(needle));
    return hit && (!onlyMissing || es.trim() === '' || en.trim() === '');
  });
  const sections = new Map<string, string[]>();
  for (const k of keys) sections.set(sectionOf(k), [...(sections.get(sectionOf(k)) ?? []), k]);

  const edited = [EN, ES].some((p) => p in draft);
  const total = Object.keys(pub.en).length;

  const write = (file: string, leaf: string) => (text: string) =>
    edit(file, setLeaf(working[file], leaf, text));

  return (
    <div className="ad-screen">
      <div className="ad-edit-head">
        <div className="ad-edit-title">
          <button
            type="button"
            className="ad-link ad-link-start"
            onClick={() => go('content', 'texts')}
          >
            ← Textos
          </button>
          <h1 className="ad-h1">Textos del sitio</h1>
          <span className="ad-edit-status">
            <span className={edited ? 'ad-tag ad-hatch' : 'ad-tag'}>
              {edited ? 'Borrador' : 'Publicado · sin cambios'}
            </span>
            {save === 'error' ? (
              <span role="alert" className="ad-k ad-danger">
                No se pudo guardar. Lo reintentamos con el próximo cambio.
              </span>
            ) : (
              <span className="ad-k" aria-live="polite">
                {save === 'saving'
                  ? 'Guardando…'
                  : save === 'saved'
                    ? 'Guardado en el borrador'
                    : ''}
              </span>
            )}
          </span>
        </div>
        <div className="ad-edit-actions">
          <button
            type="button"
            className="ad-btn ad-btn-danger"
            aria-disabled={!edited}
            onClick={() => edited && discard([EN, ES])}
          >
            Descartar borrador
          </button>
          <button type="button" className="ad-btn ad-btn-ink" onClick={() => go('publish')}>
            Revisar →
          </button>
        </div>
      </div>

      <div className="ad-text-tools">
        <label className="ad-text-search">
          <span className="ad-k">Buscar clave o texto</span>
          <input
            className="ad-input"
            type="search"
            name="q"
            placeholder="contact.h1, Enviar…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="ad-chips" role="group" aria-label="Filtro">
          <button
            type="button"
            className="ad-chip"
            aria-pressed={!onlyMissing}
            onClick={() => setOnlyMissing(false)}
          >
            Todas
          </button>
          <button
            type="button"
            className="ad-chip"
            aria-pressed={onlyMissing}
            onClick={() => setOnlyMissing(true)}
          >
            Sin traducir
          </button>
        </div>
      </div>

      <div className="ad-card">
        {sections.size === 0 && (
          <p className="ad-p ad-pad">
            {onlyMissing && !needle
              ? 'No hay textos sin traducir.'
              : 'Ninguna cadena coincide con la búsqueda.'}
          </p>
        )}
        {[...sections].map(([name, list]) => {
          const shown = filtering || open.includes(name);
          return (
            <div key={name}>
              <button
                type="button"
                className="ad-text-head"
                aria-expanded={shown}
                disabled={filtering}
                onClick={() =>
                  setOpen((o) => (o.includes(name) ? o.filter((x) => x !== name) : [...o, name]))
                }
              >
                <span className="ad-mono">{name}</span>
                <span className="ad-k">
                  {list.length} {list.length === 1 ? 'cadena' : 'cadenas'}
                </span>
                <span className="ad-mono ad-accent">
                  {shown ? (filtering ? '' : 'Cerrar') : 'Abrir →'}
                </span>
              </button>
              {shown &&
                list.map((k) => {
                  const changed = now.es[k] !== pub.es[k] || now.en[k] !== pub.en[k];
                  return (
                    <div key={k} className="ad-text-row">
                      <span className="ad-text-key">
                        {k}
                        {changed && <span className="ad-tag ad-hatch">Editado</span>}
                      </span>
                      <Cell
                        lang="ES"
                        leaf={k}
                        value={now.es[k] ?? ''}
                        published={pub.es[k] ?? ''}
                        save={write(ES, k)}
                      />
                      <Cell
                        lang="EN"
                        leaf={k}
                        value={now.en[k] ?? ''}
                        published={pub.en[k] ?? ''}
                        save={write(EN, k)}
                      />
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>
      <p className="ad-k">
        {total} cadenas · los marcadores como {'{{email}}'} y {'{date}'} se reemplazan al construir
        el sitio y no se pueden quitar.
      </p>
    </div>
  );
}
