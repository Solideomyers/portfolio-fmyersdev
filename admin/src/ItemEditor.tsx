import { useMemo } from 'react';
import {
  faqItemSchema,
  otherWorkSchema,
  pricingSchema,
  workSchema,
} from '../../src/lib/content-schemas.ts';
import { SITE_KEYS, validateFiles, type Files } from '../../src/lib/snapshot.ts';
import { Control, getIn } from './Fields';
import { OTHER_WORK } from './lib/blank';
import { COLLECTIONS, itemsOf } from './lib/collections';
import type { Draft } from './lib/draft';
import { blankItem, formFields, LABELS, type Field } from './lib/fields';
import { availabilityText, priceLine, usd } from './lib/preview';
import { applyEdit, BODY, readItem, SHARED_KEYS } from './lib/twins';
import { bodyText } from './lib/yaml-edit';
import { go } from './route';
import type { SaveState } from './useWorking';

type Coll = 'pricing' | 'faq' | 'site' | 'work' | 'other';
type Side = Record<string, unknown>;
type Change = [path: string, key: string, value: unknown];
type Ui = Parameters<typeof priceLine>[0];

const FIELDS: Record<Coll, Field[]> = {
  pricing: formFields(pricingSchema),
  faq: formFields(faqItemSchema),
  site: SITE_KEYS.map((key) => ({ key, type: 'text' }) as Field),
  work: formFields(workSchema),
  other: formFields(otherWorkSchema),
};
const HIDDEN = ['id', 'lang'];
// Optional text keys: an empty box removes the key instead of writing an empty value.
const OPTIONAL = ['version'];
const INPUT_TYPE: Record<string, string> = {
  email: 'email',
  whatsapp: 'tel',
  availableFrom: 'month',
};
const LANGS = ['es', 'en'] as const;

const SAVE_TEXT: Record<SaveState, string> = {
  idle: '',
  saving: 'Guardando…',
  saved: 'Guardado en el borrador',
  error: '',
};

type Ctx = {
  /** Not published yet (a project just added): there is no published text to compare or go back to. */
  isNew: boolean;
  paths: { en: string; es: string };
  work: Record<'en' | 'es', Side>;
  pub: Record<'en' | 'es', Side>;
  apply: (changes: Change[]) => void;
};

type Row = Record<string, unknown>;

/** A list of objects (shots, metrics): each language has its own list, with add and remove. */
function ItemsLoc({ field, ctx }: { field: Extract<Field, { type: 'items' }>; ctx: Ctx }) {
  const name = field.key.split('.').pop()!;
  const label = LABELS[name] ?? name;
  const edited =
    !ctx.isNew &&
    LANGS.some(
      (l) =>
        JSON.stringify(getIn(ctx.work[l], field.key)) !==
        JSON.stringify(getIn(ctx.pub[l], field.key)),
    );
  return (
    <div className="ad-loc">
      <div className="ad-loc-head">
        <span className="ad-mono">{label}</span>
        {edited && (
          <span className="ad-edited">
            <span className="ad-tag ad-hatch">Editado</span>
            <button
              type="button"
              className="ad-link"
              onClick={() =>
                ctx.apply(
                  LANGS.map((l) => [ctx.paths[l], field.key, getIn(ctx.pub[l], field.key) ?? []]),
                )
              }
            >
              Volver al publicado
            </button>
          </span>
        )}
      </div>
      <div className="ad-loc-cols">
        {LANGS.map((l) => {
          const path = ctx.paths[l];
          const list = (getIn(ctx.work[l], field.key) as Row[] | undefined) ?? [];
          const published = (getIn(ctx.pub[l], field.key) as Row[] | undefined) ?? [];
          return (
            <div key={l} className="ad-loc-col">
              <span className="ad-k">{l.toUpperCase()}</span>
              {list.map((row, i) => (
                <fieldset key={i} className="ad-item-card">
                  <legend className="ad-k">
                    {label} {i + 1}
                  </legend>
                  {field.fields.map((f) => {
                    const fl = LABELS[f.key] ?? f.key;
                    return (
                      <label key={f.key} className="ad-loc-col">
                        <span className="ad-k">{fl}</span>
                        <Control
                          field={f}
                          label={`${label} ${i + 1} · ${fl} (${l.toUpperCase()})`}
                          value={row[f.key]}
                          published={published[i]?.[f.key]}
                          onChange={(v) => ctx.apply([[path, `${field.key}.${i}.${f.key}`, v]])}
                        />
                      </label>
                    );
                  })}
                  <button
                    type="button"
                    className="ad-link ad-link-danger"
                    onClick={() => ctx.apply([[path, field.key, list.filter((_, j) => j !== i)]])}
                  >
                    Quitar
                  </button>
                </fieldset>
              ))}
              <button
                type="button"
                className="ad-btn ad-add"
                onClick={() => ctx.apply([[path, field.key, [...list, blankItem(field.fields)]]])}
              >
                + Agregar
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** The MDX narrative of a case study, a plain textarea per language. The frontmatter is not touched. */
function Narrative({ ctx, files, current }: { ctx: Ctx; files: Files; current: Files }) {
  const read = (f: Files, p: string) => (p in f ? bodyText(f[p]) : '');
  const edited =
    !ctx.isNew && LANGS.some((l) => read(files, ctx.paths[l]) !== read(current, ctx.paths[l]));
  return (
    <div className="ad-loc">
      <div className="ad-loc-head">
        <span className="ad-mono">Narrativa</span>
        <span className="ad-edited">
          <span className="ad-k">MDX</span>
          {edited && (
            <>
              <span className="ad-tag ad-hatch">Editado</span>
              <button
                type="button"
                className="ad-link"
                onClick={() =>
                  ctx.apply(LANGS.map((l) => [ctx.paths[l], BODY, read(current, ctx.paths[l])]))
                }
              >
                Volver al publicado
              </button>
            </>
          )}
        </span>
      </div>
      <div className="ad-loc-cols">
        {LANGS.map((l) => (
          <label key={l} className="ad-loc-col">
            <span className="ad-k">{l.toUpperCase()}</span>
            <textarea
              className="ad-input ad-code"
              rows={16}
              spellCheck={false}
              aria-label={`Narrativa (${l.toUpperCase()})`}
              value={read(files, ctx.paths[l])}
              onChange={(e) => ctx.apply([[ctx.paths[l], BODY, e.target.value]])}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

/** One localized field: ES and EN side by side. A group (service, compare) recurses. */
function Loc({ field, ctx }: { field: Field; ctx: Ctx }) {
  if (field.type === 'unsupported') return null;
  if (field.type === 'items') return <ItemsLoc field={field} ctx={ctx} />;
  const name = field.key.split('.').pop()!;
  const label = LABELS[name] ?? name;
  if (field.type === 'group')
    return (
      <div className="ad-group">
        <span className="ad-mono">{label}</span>
        {field.fields.map((f) => (
          <Loc key={f.key} field={{ ...f, key: `${field.key}.${f.key}` }} ctx={ctx} />
        ))}
      </div>
    );
  const edited =
    !ctx.isNew &&
    LANGS.some(
      (l) =>
        JSON.stringify(getIn(ctx.work[l], field.key)) !==
        JSON.stringify(getIn(ctx.pub[l], field.key)),
    );
  return (
    <div className="ad-loc">
      <div className="ad-loc-head">
        <span className="ad-mono">{label}</span>
        {edited && (
          <span className="ad-edited">
            <span className="ad-tag ad-hatch">Editado</span>
            <button
              type="button"
              className="ad-link"
              onClick={() =>
                ctx.apply(LANGS.map((l) => [ctx.paths[l], field.key, getIn(ctx.pub[l], field.key)]))
              }
            >
              Volver al publicado
            </button>
          </span>
        )}
      </div>
      <div className="ad-loc-cols">
        {LANGS.map((l) => (
          <label key={l} className="ad-loc-col">
            <span className="ad-k">{l.toUpperCase()}</span>
            <Control
              field={field}
              label={`${label} (${l.toUpperCase()})`}
              value={getIn(ctx.work[l], field.key)}
              published={getIn(ctx.pub[l], field.key)}
              onChange={(v) => ctx.apply([[ctx.paths[l], field.key, v]])}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

/** A value that is the same in both languages: written once, applyEdit puts it in both files. */
function Shared({ field, ctx, type }: { field: Field; ctx: Ctx; type?: string }) {
  const label = LABELS[field.key] ?? field.key;
  return (
    <div className="ad-shared-field">
      <span className="ad-k">{label}</span>
      <Control
        field={field}
        label={label}
        type={type}
        value={ctx.work.en[field.key]}
        published={ctx.pub.en[field.key]}
        onChange={(v) =>
          ctx.apply([
            [ctx.paths.en, field.key, v === '' && OPTIONAL.includes(field.key) ? undefined : v],
          ])
        }
      />
    </div>
  );
}

function Price({ ctx, ui }: { ctx: Ctx; ui: Record<'en' | 'es', Ui> }) {
  const from = Number(ctx.work.en.from);
  const billing = String(ctx.work.en.billing);
  const pubFrom = Number(ctx.pub.en.from);
  const pubBilling = String(ctx.pub.en.billing);
  const edited = from !== pubFrom || billing !== pubBilling;
  const fromField = FIELDS.pricing.find((f) => f.key === 'from')!;
  const billingField = FIELDS.pricing.find((f) => f.key === 'billing')!;
  return (
    <div className="ad-price">
      <div className="ad-loc-head">
        <span className="ad-mono">Precio y cobro · se escriben una vez</span>
        {edited && (
          <span className="ad-edited">
            <span className="ad-tag ad-hatch">Editado · antes {usd(pubFrom)}</span>
            <button
              type="button"
              className="ad-link"
              onClick={() =>
                ctx.apply([
                  [ctx.paths.en, 'from', pubFrom],
                  [ctx.paths.en, 'billing', pubBilling],
                ])
              }
            >
              Volver al publicado
            </button>
          </span>
        )}
      </div>
      <div className="ad-price-controls">
        <div className="ad-price-field">
          <span className="ad-k">Precio · USD</span>
          <span className="ad-price-input">
            <span className="ad-price-sign" aria-hidden="true">
              $
            </span>
            <Control
              field={fromField}
              label="Precio en USD"
              value={from}
              published={pubFrom}
              onChange={(v) => ctx.apply([[ctx.paths.en, 'from', v]])}
            />
          </span>
        </div>
        <div className="ad-price-field">
          <span className="ad-k">Tipo de cobro</span>
          <Control
            field={billingField}
            label="Tipo de cobro"
            value={billing}
            published={pubBilling}
            onChange={(v) => ctx.apply([[ctx.paths.en, 'billing', v]])}
          />
        </div>
      </div>
      <div className="ad-preview">
        {LANGS.map((l) => {
          const p = priceLine(ui[l], from, billing);
          return (
            <div key={l} className="ad-preview-cell">
              <span className="ad-k">Así se ve · {l.toUpperCase()}</span>
              <span className="ad-preview-line">
                <span className="ad-k">{p.from}</span>
                <span className="ad-preview-price">{p.price}</span>
                <span className="ad-k">{p.unit}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SiteFacts({ ctx, ui }: { ctx: Ctx; ui: Record<'en' | 'es', Ui & { months: string[] }> }) {
  const site = ctx.work.en;
  const from = String(site.availableFrom ?? '');
  return (
    <div className="ad-two">
      <div className="ad-card ad-grow14">
        <div className="ad-site-grid">
          {FIELDS.site.map((f) => (
            <Shared key={f.key} field={f} ctx={ctx} type={INPUT_TYPE[f.key]} />
          ))}
        </div>
        <p className="ad-p ad-pad ad-small">
          Se escribe una vez. El sitio arma la frase de disponibilidad en cada idioma.
        </p>
      </div>
      <div className="ad-card ad-grow1">
        <div className="ad-card-head">
          <span className="ad-mono">Así se ve</span>
        </div>
        {LANGS.map((l) => (
          <div key={l} className="ad-preview-block">
            <span className="ad-k">
              {l.toUpperCase()} · {l === 'es' ? 'Inicio y Contacto' : 'Home and Contact'}
            </span>
            <span className="ad-avail">
              <span className="ad-dot" style={{ background: 'var(--ok)' }} />
              {availabilityText(ui[l], from, l)}
            </span>
          </div>
        ))}
        <div className="ad-preview-block">
          <span className="ad-k">Pie de página</span>
          <span className="ad-wrap">
            {String(site.email)} · {String(site.whatsapp)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ItemEditor({
  coll,
  id,
  working,
  current,
  draft,
  save,
  edit,
  discard,
}: {
  coll: Coll;
  id: string;
  working: Files;
  current: Files;
  draft: Draft;
  save: SaveState;
  edit: (path: string, text: string | null) => void;
  discard: (paths: string[]) => void;
}) {
  const item = itemsOf(coll, working).find((i) => i.id === id);
  const uiEs = working['src/i18n/ui.es.json'];
  const uiEn = working['src/i18n/ui.en.json'];
  const ui = useMemo(() => ({ es: JSON.parse(uiEs), en: JSON.parse(uiEn) }), [uiEs, uiEn]);
  const name = COLLECTIONS.find((c) => c.key === coll)!.name;

  if (!item)
    return (
      <div className="ad-screen">
        <button type="button" className="ad-link ad-link-start" onClick={() => go('content', coll)}>
          ← {name}
        </button>
        <p role="alert" className="ad-p">
          No encontramos «{id}» en {name}.
        </p>
      </div>
    );

  const [enPath, esPath = enPath] = item.paths;
  const jsonId = coll === 'faq' || coll === 'other' ? id : undefined;
  // What is published may not have this item at all (a project or entry that was just added).
  const read = (files: Files, p: string): Side => {
    try {
      return (p in files && readItem(files, p, jsonId)) || {};
    } catch {
      return {};
    }
  };
  const ctx: Ctx = {
    isNew: !(enPath in current) || (coll === 'other' && !read(current, enPath).id),
    paths: { en: enPath, es: esPath },
    work: { en: read(working, enPath), es: read(working, esPath) },
    pub: { en: read(current, enPath), es: read(current, esPath) },
    // Chained on one map, so several changes in a click (a revert) do not overwrite each other.
    apply: (changes) => {
      let next = working;
      for (const [p, key, value] of changes) next = applyEdit(next, p, key, value, jsonId);
      for (const p of Object.keys(next)) if (next[p] !== working[p]) edit(p, next[p]);
    },
  };

  const edited = item.paths.some((p) => p in draft);
  // other-work.json holds every entry: only the messages about this one belong here
  const entry =
    coll === 'other'
      ? (JSON.parse(working[OTHER_WORK]) as { id: string }[]).findIndex((e) => e.id === id)
      : -1;
  const errors = validateFiles(working).filter((m) =>
    coll === 'other'
      ? m.startsWith(`${OTHER_WORK}[${entry}]`)
      : item.paths.some((p) => m.startsWith(`${p}:`)),
  );
  const shared: readonly string[] = coll === 'site' || coll === 'other' ? [] : SHARED_KEYS[coll];
  const fields = FIELDS[coll].filter((f) => !HIDDEN.includes(f.key));
  const sharedFields = fields.filter(
    (f) => shared.includes(f.key) && !(coll === 'pricing' && ['from', 'billing'].includes(f.key)),
  );
  const localized = fields.filter((f) => !shared.includes(f.key));
  const sharedBlock = sharedFields.length > 0 && (
    <div className="ad-shared">
      <span className="ad-mono">Compartido · igual en ES y EN</span>
      <div className="ad-shared-row">
        {sharedFields.map((f) => (
          <Shared key={f.key} field={f} ctx={ctx} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="ad-screen">
      <div className="ad-edit-head">
        <div className="ad-edit-title">
          <button
            type="button"
            className="ad-link ad-link-start"
            onClick={() => go('content', coll)}
          >
            ← {name}
          </button>
          <h1 className="ad-h1">{item.title}</h1>
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
                {SAVE_TEXT[save]}
              </span>
            )}
          </span>
        </div>
        <div className="ad-edit-actions">
          <button
            type="button"
            className="ad-btn ad-btn-danger"
            aria-disabled={!edited}
            onClick={() => edited && discard(item.paths)}
          >
            Descartar borrador
          </button>
          <button type="button" className="ad-btn ad-btn-ink" onClick={() => go('publish')}>
            Revisar →
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div role="alert" className="ad-errors">
          <span className="ad-mono">Corrige esto antes de publicar</span>
          <ul>
            {errors.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      {coll === 'site' ? (
        <SiteFacts ctx={ctx} ui={ui} />
      ) : coll === 'other' ? (
        <div className="ad-card">
          <div className="ad-site-grid">
            {fields.map((f) => (
              <Shared key={f.key} field={f} ctx={ctx} />
            ))}
          </div>
        </div>
      ) : (
        <div className="ad-card">
          {coll === 'work' && sharedBlock}
          {coll === 'pricing' && <Price ctx={ctx} ui={ui} />}
          {localized.map((f) => (
            <Loc key={f.key} field={f} ctx={ctx} />
          ))}
          {coll === 'work' && <Narrative ctx={ctx} files={working} current={current} />}
          {coll !== 'work' && sharedBlock}
        </div>
      )}
    </div>
  );
}
