export type Theme = 'light' | 'dark';

const KEY = 'ad-theme';

/** Saved choice, else the OS preference. Sets <html data-theme> so the site's tokens switch. */
export function initTheme(): Theme {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(KEY);
  } catch {
    /* storage blocked: fall back to the OS preference */
  }
  const theme: Theme =
    saved === 'light' || saved === 'dark'
      ? saved
      : matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
  document.documentElement.dataset.theme = theme;
  return theme;
}

export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* storage blocked: the choice just lasts for this visit */
  }
}
