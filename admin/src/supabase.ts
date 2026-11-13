import { createClient } from '@supabase/supabase-js';

// Both values are public by design (project URL and anon/publishable key); RLS does the protecting.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { experimental: { passkey: true } } }, // passkeys are opt-in (experimental) in supabase-js
);

export type Provider = 'github' | 'google';

/** Redirects the browser to the provider; the session comes back on this same origin. */
export async function signIn(provider: Provider): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: location.origin },
  });
  if (error) throw error;
}

/** Sign-ups are disabled, so only an existing account (the owner) can get a link. */
export async function sendMagicLink(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: location.origin },
  });
  if (error) throw error;
}

/** Discoverable-credential sign-in: only a passkey registered from Ajustes works. The caller reloads. */
export async function signInWithPasskey(): Promise<void> {
  const { error } = await supabase.auth.signInWithPasskey();
  if (error) throw error;
}

/**
 * true only for the owner; anyone else is signed out on the spot.
 * Throws when the check itself fails (network, server), so a hiccup is never shown as "rejected".
 */
export async function requireOwner(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_owner');
  if (error) throw error;
  if (data === true) return true;
  await supabase.auth.signOut();
  return false;
}
