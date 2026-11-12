import { parseAuthError } from './lib/auth-error';

// Imported first by main.tsx, so it reads the URL before supabase-js (created when ./supabase loads)
// can consume it. The error is cleared from the address bar so a reload does not show it again.
export const urlAuthError = parseAuthError(location.search, location.hash);
if (urlAuthError) history.replaceState(null, '', location.pathname);
