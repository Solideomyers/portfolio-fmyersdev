import { useEffect, useState } from 'react';
import { revLabel } from './Dashboard';
import { waitForLive, type LiveState } from './lib/api';
import { go } from './route';

const SITE = (import.meta.env.VITE_SITE_URL ?? 'https://fmyers-dev.vercel.app').replace(/\/$/, '');
const VERCEL = 'https://vercel.com/dashboard';

const STEPS = [
  ['Validar', 'Sin errores'],
  ['Guardar versión', 'Versión guardada'],
  ['Marcar como actual', 'Es la versión actual'],
  ['Reconstruir el sitio', 'Genera las páginas en ES y EN'],
  ['En vivo', 'El sitio sirve la versión nueva'],
] as const;

/** S5b. The first three steps finished inside publish(); the rest is read from the site's rev.json. */
export function Progress({ rev }: { rev: number }) {
  const [state, setState] = useState<LiveState>('building');
  useEffect(() => {
    let stop = false;
    (async () => {
      for await (const s of waitForLive(rev, SITE)) if (!stop) setState(s);
    })();
    return () => {
      stop = true;
    };
  }, [rev]);

  const done = state === 'live' ? 5 : 3;
  const h =
    state === 'live'
      ? 'El cambio está en vivo.'
      : state === 'timeout'
        ? 'La reconstrucción no se inició.'
        : `Publicando ${revLabel(rev)}…`;

  return (
    <div className="ad-screen ad-narrow">
      <h1 className="ad-h1" aria-live="polite">
        {h}
      </h1>
      <ol className="ad-card ad-steps">
        {STEPS.map(([title, detail], i) => {
          const ok = i < done;
          const active = i === done && state === 'building';
          const bad = i === done && state === 'timeout';
          return (
            <li
              key={title}
              className="ad-step"
              data-state={ok ? 'ok' : bad ? 'bad' : active ? 'run' : 'wait'}
            >
              <span className="ad-step-g" aria-hidden="true">
                {ok ? '✓' : bad ? '+' : i + 1}
              </span>
              <span className="ad-stack">
                <span className="ad-step-t">{title}</span>
                <span className="ad-small">{detail}</span>
                {active && (
                  <span
                    className="ad-run"
                    role="progressbar"
                    aria-label="Reconstrucción en curso"
                  />
                )}
              </span>
            </li>
          );
        })}
      </ol>
      {state === 'building' && (
        <p className="ad-p">
          Puedes cerrar esta pantalla. La publicación sigue; el panel muestra «En vivo» arriba
          cuando el sitio la sirva.
        </p>
      )}
      {state === 'timeout' && (
        <div role="alert" className="ad-errors">
          <span>
            Pasaron 5 minutos y el sitio no muestra {revLabel(rev)}. El sitio anterior sigue en
            línea y tu versión guardada queda intacta.
          </span>
          <a className="ad-link" href={VERCEL} target="_blank" rel="noreferrer">
            Abrir Vercel ↗
          </a>
        </div>
      )}
      {state === 'live' && (
        <div className="ad-card ad-pad ad-stack">
          <span>
            <span className="ad-dot" style={{ background: 'var(--ok)' }} /> El sitio ya muestra{' '}
            {revLabel(rev)}.
          </span>
          <a className="ad-btn" href={SITE} target="_blank" rel="noreferrer">
            Ver el sitio ↗
          </a>
        </div>
      )}
      <button type="button" className="ad-link ad-link-start" onClick={() => go()}>
        Volver al panel →
      </button>
    </div>
  );
}
