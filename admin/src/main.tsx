import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Session } from '@supabase/supabase-js';
import { Login } from './Login';
import { Shell } from './Shell';
import { requireOwner, supabase } from './supabase';
import { initTheme, type Theme } from './theme';
import './admin.css';

initTheme();

type State =
  | { status: 'loading' }
  | { status: 'out'; rejectedVia?: string; verifyFailed?: boolean }
  | { status: 'in'; session: string };

const PROVIDER: Record<string, { name: string; via: string }> = {
  github: { name: 'GitHub', via: 'una cuenta de GitHub' },
  google: { name: 'Google', via: 'una cuenta de Google' },
};
const info = (s: Session) =>
  PROVIDER[s.user.app_metadata.provider ?? ''] ?? { name: 'Correo', via: 'un correo' };

const who = (s: Session) =>
  `${s.user.user_metadata.user_name ?? s.user.email ?? 'Titular'} · ${info(s).name}`;

function App() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    // getSession() waits for the URL session of an OAuth or magic-link return before resolving.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return setState({ status: 'out' });
      try {
        setState(
          (await requireOwner())
            ? { status: 'in', session: who(session) }
            : { status: 'out', rejectedVia: info(session).via },
        );
      } catch {
        setState({ status: 'out', verifyFailed: true });
      }
    });
    // Only an owner session reaches 'in', so a sign-out there means "back to the login".
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setState((s) => (s.status === 'in' ? { status: 'out' } : s));
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (state.status === 'loading') return null;
  return (
    <div className="ad">
      {state.status === 'in' ? (
        <Shell session={state.session} />
      ) : (
        <Login
          theme={document.documentElement.dataset.theme as Theme}
          rejectedVia={state.rejectedVia}
          verifyFailed={state.verifyFailed}
        />
      )}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
