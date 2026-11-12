import { useEffect, useState } from 'react';
import { Brand } from './Brand';
import { supabase } from './supabase';
import { setTheme, type Theme } from './theme';

const VIEWS = [
  { id: 'dashboard', label: 'Panel', title: 'Panel de control' },
  { id: 'content', label: 'Contenido', title: 'Contenido' },
  { id: 'publish', label: 'Publicar', title: 'Revisar y publicar' },
  { id: 'history', label: 'Historial', title: 'Historial' },
  { id: 'settings', label: 'Ajustes', title: 'Ajustes' },
] as const;
type View = (typeof VIEWS)[number]['id'];

const rev = (n: number | null) => (n === null ? 'REV —' : `REV ${String(n).padStart(4, '0')}`);
const today = new Date().toLocaleDateString('es', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function Shell({ session }: { session: string }) {
  const [view, setView] = useState<View>('dashboard');
  const [menu, setMenu] = useState(false);
  const [theme, setThemeState] = useState<Theme>(
    () => document.documentElement.dataset.theme as Theme,
  );
  const [live, setLive] = useState<number | null>(null);
  const [drafts, setDrafts] = useState(0);

  useEffect(() => {
    let off = false;
    (async () => {
      const [snap, draft] = await Promise.all([
        supabase.rpc('get_current_snapshot'),
        supabase.from('draft').select('files').maybeSingle(),
      ]);
      if (off) return;
      setLive(snap.data?.revision ?? null);
      setDrafts(draft.data ? Object.keys(draft.data.files).length : 0);
    })();
    return () => {
      off = true;
    };
  }, []);

  const go = (id: View) => {
    setView(id);
    setMenu(false);
  };
  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setThemeState(next);
  };

  const current = VIEWS.findIndex((v) => v.id === view);

  return (
    <>
      <header className="ad-header">
        <Brand theme={theme} />
        <div className="ad-header-r">
          <span className="ad-k ad-live ad-desk-only">
            <span
              className="ad-dot"
              style={{ background: live === null ? 'var(--line)' : 'var(--ok)' }}
            />
            En vivo · {rev(live)}
          </span>
          <button
            type="button"
            className={`ad-btn ad-pub${drafts ? ' ad-btn-ink' : ''}`}
            onClick={() => go('publish')}
          >
            {drafts ? `Publicar · ${drafts}` : 'Sin borradores'}
          </button>
          <button
            type="button"
            className="ad-btn ad-icon-btn ad-desk-only"
            aria-label="Cambiar tema"
            onClick={toggleTheme}
          >
            ◐
          </button>
          <button
            type="button"
            className="ad-btn ad-menu-btn"
            aria-expanded={menu}
            aria-controls="ad-sidebar"
            onClick={() => setMenu(!menu)}
          >
            MENÚ
          </button>
        </div>
      </header>

      <div className="ad-body" data-menu={menu}>
        <nav id="ad-sidebar" className="ad-sidebar" aria-label="Secciones del panel">
          <div>
            {VIEWS.map((v, i) => (
              <button
                key={v.id}
                type="button"
                className="ad-nav"
                aria-current={i === current ? 'page' : undefined}
                onClick={() => go(v.id)}
              >
                <span className="ad-nav-id">{`0${i + 1}`}</span>
                <span>{v.label}</span>
                <span>{v.id === 'publish' && drafts ? drafts : ''}</span>
              </button>
            ))}
          </div>
          <div className="ad-session">
            <span className="ad-k">Sesión</span>
            <span>{session}</span>
            <button type="button" className="ad-link" onClick={() => supabase.auth.signOut()}>
              Cerrar sesión
            </button>
          </div>
        </nav>

        <main className="ad-main">
          <div className="ad-mono ad-sheet">
            <span>{`Admin 0${current + 1} — ${VIEWS[current].title}`}</span>
            <span>{today}</span>
          </div>
          <h1 className="ad-h1">{VIEWS[current].label}</h1>
          <p className="ad-p">Esta sección llega en una de las siguientes tareas.</p>
        </main>
      </div>
    </>
  );
}
