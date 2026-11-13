import { urlAuthError } from './urlError'; // keep first: it must read the URL before ./supabase loads
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Session } from '@supabase/supabase-js';
import { authErrorText } from './lib/auth-error';
import { Login } from './Login';
import { Shell } from './Shell';
import { requireOwner, supabase } from './supabase';
import { initTheme, type Theme } from './theme';
import './admin.css';

initTheme();

type State =
  | { status: 'loading' }
  | { status: 'out'; rejectedVia?: string; verifyFailed?: boolean; providerError?: string }
  | { status: 'in'; session: string };

const PROVIDER: Record<string, { name: string; via: string }> = {
  github: { name: 'GitHub', via: 'una cuenta de GitHub' },
  google: { name: 'Google', via: 'una cuenta de Google' },
};
const info = (s: Session) =>
  PROVIDER[s.user.app_metadata.provider ?? ''] ?? { name: 'Correo', via: 'un correo' };

const who = (s: Session) =>
  `${s.user.user_metadata.user_name ?? s.user.email ?? 'Titular'} · ${info(s).name}`;

// A sign-in (OAuth or magic link) always returns to this page, so who is signed in is decided once
// per page load. React StrictMode runs effects twice in development: sharing one promise keeps the
// owner check, and the sign-out it triggers for a non-owner, from running twice (the second run
// would call is_owner with a session that no longer exists: session_not_found).
const initial: Promise<State> = (async () => {
  if (urlAuthError) return { status: 'out', providerError: authErrorText(urlAuthError) };
  // getSession() waits for the URL session of an OAuth or magic-link return before resolving.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { status: 'out' };
  try {
    return (await requireOwner())
      ? { status: 'in', session: who(session) }
      : { status: 'out', rejectedVia: info(session).via };
  } catch {
    return { status: 'out', verifyFailed: true };
  }
})();

function App() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    initial.then(setState);
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
          providerError={state.providerError}
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
