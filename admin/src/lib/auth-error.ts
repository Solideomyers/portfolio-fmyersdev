export type AuthError = { code: string; description: string };

/**
 * A failed sign-in comes back to the panel as `#error=…&error_code=…&error_description=…` (implicit
 * flow, magic links) or `?error=…` (code flow). Returns null when the URL carries no error.
 */
export function parseAuthError(search: string, hash: string): AuthError | null {
  const query = new URLSearchParams(search);
  const fragment = new URLSearchParams(hash.replace(/^#\/?/, ''));
  const get = (key: string) => fragment.get(key) ?? query.get(key);
  const error = get('error');
  if (!error) return null;
  return { code: get('error_code') ?? error, description: get('error_description') ?? error };
}

const FRIENDLY: Record<string, string> = {
  signup_disabled:
    'Esa cuenta no está registrada y los registros están cerrados. Entra con la cuenta del titular.',
  otp_expired: 'El enlace caducó o ya se usó. Pide uno nuevo.',
  access_denied: 'El acceso fue cancelado o denegado.',
};

/** What the login shows: a plain sentence for the common cases, the provider's own text otherwise. */
export const authErrorText = (e: AuthError): string => FRIENDLY[e.code] ?? e.description;
