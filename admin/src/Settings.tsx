import { useEffect, useState } from 'react';
import { lastRevision } from './lib/api';
import { supabase } from './supabase';

const REPO = 'Solideomyers/portfolio-fmyersdev';
const when = (iso: string) =>
  new Date(iso).toLocaleString('es', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

type Passkey = { id: string; friendly_name?: string; created_at: string; last_used_at?: string };
const PROVIDER: Record<string, string> = { github: 'GitHub', google: 'Google', email: 'Correo' };

/** Last commit date of the nightly backup branch; null when the branch does not exist yet. */
async function lastBackup(): Promise<string | null> {
  const r = await fetch(
    `https://api.github.com/repos/${REPO}/commits?sha=content-backup&per_page=1`,
  );
  if (r.status === 404 || r.status === 409) return null;
  if (!r.ok) throw new Error(String(r.status));
  const [c] = (await r.json()) as { commit: { committer: { date: string } } }[];
  return c?.commit.committer.date ?? null;
}

export function Settings() {
  const [email, setEmail] = useState('');
  const [provider, setProvider] = useState('');
  const [keys, setKeys] = useState<Passkey[] | 'error' | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [rev, setRev] = useState<string | null | 'error'>(null);
  const [backup, setBackup] = useState<string | null | 'none' | 'error'>(null);

  const loadKeys = () =>
    supabase.auth.passkey
      .list()
      .then(({ data, error }) => setKeys(error ? 'error' : (data as Passkey[])));

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? '');
      setProvider(PROVIDER[data.user?.app_metadata.provider ?? ''] ?? '');
    });
    loadKeys();
    lastRevision().then(
      (r) => setRev(r?.created_at ?? null),
      () => setRev('error'),
    );
    lastBackup().then(
      (d) => setBackup(d ?? 'none'),
      () => setBackup('error'),
    );
  }, []);

  const register = async () => {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.registerPasskey();
    setBusy(false);
    if (error)
      setMsg({
        ok: false,
        text: 'No se pudo registrar la passkey (¿la cancelaste?). Inténtalo de nuevo.',
      });
    else {
      setMsg({ ok: true, text: 'Passkey registrada.' });
      loadKeys();
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.auth.passkey.delete({ passkeyId: id });
    if (error) setMsg({ ok: false, text: 'No se pudo eliminar la passkey.' });
    else loadKeys();
  };

  return (
    <>
      <h1 className="ad-h1">Ajustes</h1>

      <section className="ad-card" aria-label="Cuenta">
        <div className="ad-card-head">
          <span className="ad-k">Cuenta</span>
        </div>
        <div className="ad-p">
          <p>{email || '—'}</p>
          <p className="ad-k">Proveedor · {provider || '—'}</p>
          <button type="button" className="ad-link" onClick={() => supabase.auth.signOut()}>
            Cerrar sesión
          </button>
        </div>
      </section>

      <section className="ad-card" aria-label="Passkeys">
        <div className="ad-card-head">
          <span className="ad-k">Passkeys</span>
          <button type="button" className="ad-btn" aria-disabled={busy} onClick={register}>
            + Registrar passkey
          </button>
        </div>
        <div className="ad-p">
          {msg && (
            <p role={msg.ok ? 'status' : 'alert'} className={`ad-k${msg.ok ? '' : ' ad-danger'}`}>
              {msg.text}
            </p>
          )}
          {keys === 'error' && <p className="ad-k">No se pudieron cargar las passkeys.</p>}
          {Array.isArray(keys) && keys.length === 0 && <p className="ad-k">Aún no hay passkeys.</p>}
          {Array.isArray(keys) &&
            keys.map((k) => (
              <p key={k.id}>
                {k.friendly_name ?? 'Passkey'} · {when(k.created_at)}
                {k.last_used_at ? ` · usada ${when(k.last_used_at)}` : ''}{' '}
                <button
                  type="button"
                  className="ad-link ad-link-danger"
                  onClick={() => remove(k.id)}
                >
                  Eliminar
                </button>
              </p>
            ))}
        </div>
      </section>

      <section className="ad-card" aria-label="Respaldo">
        <div className="ad-card-head">
          <span className="ad-k">Respaldo y actividad</span>
        </div>
        <div className="ad-p">
          <p>Última revisión · {rev === 'error' ? 'no disponible' : rev ? when(rev) : '—'}</p>
          <p>
            Último respaldo ·{' '}
            {backup === 'error'
              ? 'no disponible'
              : backup === 'none'
                ? 'aún sin respaldo'
                : backup
                  ? when(backup)
                  : '—'}
          </p>
        </div>
      </section>
    </>
  );
}
