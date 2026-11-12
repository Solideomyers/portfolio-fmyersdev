import type { Theme } from './theme';

export function Brand({ theme }: { theme: Theme }) {
  return (
    <span className="ad-brand">
      <img src={`/wordmark-${theme}.svg`} alt="fmyers.dev" />
      <span className="ad-tag">Admin</span>
    </span>
  );
}
