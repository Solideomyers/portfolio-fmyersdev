import { useEffect, useState } from 'react';

/** "#/content/pricing/P-01" → ["content", "pricing", "P-01"]. The hash keeps reload and Back working. */
export function useRoute(): string[] {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const on = () => setHash(location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
}

export const href = (...parts: string[]) => '#/' + parts.map(encodeURIComponent).join('/');

export const go = (...parts: string[]) => {
  location.hash = href(...parts);
};
