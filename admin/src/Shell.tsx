import { useEffect, useMemo, useState } from 'react';
import { Brand } from './Brand';
import { Dashboard, revLabel } from './Dashboard';
import { Explorer } from './Explorer';
import { ItemEditor } from './ItemEditor';
import { COLLECTIONS, draftRows } from './lib/collections';
import { go, useRoute } from './route';
import { supabase } from './supabase';
import { Texts } from './Texts';
import { setTheme, type Theme } from './theme';
import { useWorking } from './useWorking';

const VIEWS = [
  { id: 'dashboard', label: 'Panel', title: 'Panel de control' },
  { id: 'content', label: 'Contenido', title: 'Contenido' },
  { id: 'publish', label: 'Publicar', title: 'Revisar y publicar' },
  { id: 'history', label: 'Historial', title: 'Historial' },
  { id: 'settings', label: 'Ajustes', title: 'Ajustes' },
] as const;

const today = new Date().toLocaleDateString('es', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const EDITABLE = ['pricing', 'faq', 'site'] as const;

export function Shell({ session }: { session: string }) {
  const route = useRoute();
  const [menu, setMenu] = useState(false);
  const [theme, setThemeState] = useState<Theme>(
    () => document.documentElement.dataset.theme as Theme,
  );
  const { data, failed, save, edit, discard, discardAll } = useWorking();

  const key = route.join('/');
  useEffect(() => setMenu(false), [key]);

  const rows = useMemo(
    () => (data ? draftRows(data.current, data.working, data.draft) : []),
    [data],
  );
  const drafts = rows.length;

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setThemeState(next);
  };

  const [view, coll, id] = route;
  const index = Math.max(
    0,
    VIEWS.findIndex((v) => v.id === (view ?? 'dashboard')),
  );
  const collName = COLLECTIONS.find((c) => c.key === coll)?.name;
  const editable = EDITABLE.find((c) => c === coll);

  const screen = () => {
    if (failed)
      return (
        <p role="alert" className="ad-p">
          No se pudo cargar el contenido. Recarga la página para intentarlo de nuevo.
        </p>
      );
    if (!data)
      return (
        <p role="status" className="ad-p">
          Cargando…
        </p>
      );
    if (view === undefined || view === 'dashboard')
      return <Dashboard rows={rows} revision={data.revision} onDiscardAll={discardAll} />;
    if (view === 'content' && coll === 'texts' && id)
      return (
        <Texts
          working={data.working}
          current={data.current}
          draft={data.draft}
          save={save}
          edit={edit}
          discard={discard}
        />
      );
    if (view === 'content' && editable && id)
      return (
        <ItemEditor
          key={`${editable}/${id}`}
          coll={editable}
          id={id}
          working={data.working}
          current={data.current}
          draft={data.draft}
          save={save}
          edit={edit}
          discard={discard}
        />
      );
    if (view === 'content')
      return <Explorer coll={coll} working={data.working} draftPaths={Object.keys(data.draft)} />;
    return (
      <>
        <h1 className="ad-h1">{VIEWS[index].label}</h1>
        <p className="ad-p">Esta sección llega en una de las siguientes tareas.</p>
      </>
    );
  };

  return (
    <>
      <header className="ad-header">
        <Brand theme={theme} />
        <div className="ad-header-r">
          <span className="ad-k ad-live ad-desk-only">
            <span className="ad-dot" style={{ background: data ? 'var(--ok)' : 'var(--line)' }} />
            En vivo · {revLabel(data?.revision ?? null)}
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
                aria-current={i === index ? 'page' : undefined}
                onClick={() => (v.id === 'dashboard' ? go() : go(v.id))}
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
            <span>
              {`Admin 0${index + 1} — ${VIEWS[index].title}`}
              {view === 'content' && collName ? ` · ${collName}` : ''}
            </span>
            <span>{today}</span>
          </div>
          {screen()}
        </main>
      </div>
    </>
  );
}
