import { useState, type FormEvent } from 'react';
import { Brand } from './Brand';
import { sendMagicLink, signIn, signInWithPasskey, type Provider } from './supabase';
import type { Theme } from './theme';

type Props = {
  theme: Theme;
  /** Set when the account that just signed in is not the owner, e.g. "una cuenta de Google". */
  rejectedVia?: string;
  /** Set when the owner check itself failed. */
  verifyFailed?: boolean;
  /** The provider (or the magic link) sent the browser back with an error; already worded for the owner. */
  providerError?: string;
};

const PROVIDERS: { id: Provider; label: string }[] = [
  { id: 'github', label: 'Continuar con GitHub' },
  { id: 'google', label: 'Continuar con Google' },
];

export function Login({ theme, rejectedVia, verifyFailed, providerError }: Props) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [email, setEmail] = useState('');
  const [mail, setMail] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const go = async (provider: Provider) => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await signIn(provider);
    } catch {
      setFailed(true);
      setBusy(false);
    }
  };

  // The session lands in storage; reloading re-runs the one-time owner check in main.tsx.
  const passkey = async () => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await signInWithPasskey();
      location.reload();
    } catch {
      setFailed(true);
      setBusy(false);
    }
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (mail === 'sending') return;
    setMail('sending');
    try {
      await sendMagicLink(email.trim());
      setMail('sent');
    } catch {
      setMail('error');
    }
  };

  const alert = rejectedVia
    ? {
        title: 'Err · Cuenta no autorizada',
        body: `Entraste con ${rejectedVia} que no está en la lista. Cerramos esa sesión. Prueba con la cuenta del titular.`,
      }
    : verifyFailed
      ? {
          title: 'Err · No pudimos verificar tu cuenta',
          body: 'Revisa tu conexión y recarga la página para volver a intentarlo.',
        }
      : providerError
        ? { title: 'Err · No se pudo iniciar sesión', body: providerError }
        : failed
          ? {
              title: 'Err · No se pudo iniciar sesión',
              body: 'El proveedor no respondió. Inténtalo de nuevo en un momento.',
            }
          : null;

  return (
    <div className="ad-login">
      <div className="ad-login-top">
        <Brand theme={theme} />
        <span className="ad-k">Acceso de 1 cuenta</span>
      </div>

      <div className="ad-login-main">
        <div className="ad-login-copy">
          <span className="ad-mono ad-accent">Admin 00 — Acceso</span>
          <h1 className="ad-h1">Entra a tu panel.</h1>
          <p className="ad-p">
            Solo tu cuenta está en la lista autorizada. Si entras con otra, el acceso se rechaza y
            no se crea nada.
          </p>
        </div>

        <div className="ad-login-card">
          {alert && (
            <div role="alert" className="ad-alert">
              <span className="ad-mono">{alert.title}</span>
              <span>{alert.body}</span>
            </div>
          )}

          <div className="ad-providers">
            <span className="ad-k">Proveedor</span>
            {PROVIDERS.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className={`ad-btn ad-provider${i === 0 ? ' ad-btn-primary' : ''}`}
                aria-disabled={busy}
                onClick={() => go(p.id)}
              >
                <span>{p.label}</span>
                <span aria-hidden="true">→</span>
              </button>
            ))}
            <button
              type="button"
              className="ad-btn ad-provider"
              aria-disabled={busy}
              onClick={passkey}
            >
              <span>Entrar con passkey</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>

          <form className="ad-mail" onSubmit={send}>
            <label>
              <span className="ad-k">O recibe un enlace por correo</span>
              <input
                className="ad-input"
                type="email"
                name="email"
                placeholder="tu@correo.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <button type="submit" className="ad-btn ad-mail-btn" aria-disabled={mail === 'sending'}>
              Enviar enlace →
            </button>
            {mail === 'sent' && (
              <p role="status" className="ad-k">
                Enlace enviado. Revisa tu correo.
              </p>
            )}
            {mail === 'error' && (
              <p role="alert" className="ad-k ad-danger">
                No pudimos enviar el enlace. Revisa el correo e inténtalo de nuevo.
              </p>
            )}
          </form>

          <div aria-hidden="true" className="ad-corner" />
        </div>
      </div>

      <div className="ad-k ad-login-foot">
        <span>fmyers.dev · Admin</span>
      </div>
    </div>
  );
}
