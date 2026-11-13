import { useEffect, useMemo, useState } from 'react';
import { Brand } from './Brand';
import { Dashboard, revLabel } from './Dashboard';
import { Explorer } from './Explorer';
import { History } from './History';
import { ItemEditor } from './ItemEditor';
import { Progress } from './Progress';
import { Review } from './Review';
import { publish, restore } from './lib/api';
import { blankFor, newId, nextNumber, OTHER_WORK, restoreEntry } from './lib/blank';
import { COLLECTIONS, draftRows, type CollectionKey, type Item } from './lib/collections';
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

const EDITABLE = ['pricing', 'faq', 'site', 'work', 'other'] as const;

export function Shell({ session }: { session: string }) {
  const route = useRoute();
  const [menu, setMenu] = useState(false);
  const [theme, setThemeState] = useState<Theme>(
    () => document.documentElement.dataset.theme as Theme,
  );
  const { data, failed, save, edit, discard, discardAll, flush, reload } = useWorking();

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

  // Adding or removing a project (or an other-work entry) is one more draft: nothing is published.
  const addItem = (key: CollectionKey) => {
    if (!data || (key !== 'work' && key !== 'other')) return;
    const kind = key === 'work' ? 'work' : 'otherWork';
    const n = nextNumber(data.working, kind);
    for (const [path, text] of Object.entries(blankFor(kind, n, data.working))) edit(path, text);
    go('content', key, newId(kind, n));
  };
  const removeItem = (key: CollectionKey, item: Item) => {
    if (!data) return;
    if (key === 'work') for (const path of item.paths) edit(path, null);
    else if (key === 'other') {
      const rest = (JSON.parse(data.working[OTHER_WORK]) as { id: string }[]).filter(
        (e) => e.id !== item.id,
      );
      edit(OTHER_WORK, JSON.stringify(rest, null, 2) + '\n');
    }
  };
  const restoreItem = (key: CollectionKey, item: Item) => {
    if (!data) return;
    if (key === 'work') discard(item.paths);
    else if (key === 'other')
      edit(OTHER_WORK, restoreEntry(data.current[OTHER_WORK], data.working[OTHER_WORK], item.id));
  };

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
    if (view === 'history')
      return (
        <History
          current={data.revision}
          onRestore={async (id) => {
            const rev = await restore(id);
            await reload().catch(() => {}); // the new revision exists either way
            go('publish', 'progress', String(rev));
          }}
        />
      );
    if (view === 'publish' && coll === 'progress' && Number(id) > 0)
      return <Progress rev={Number(id)} />;
    if (view === 'publish')
      return (
        <Review
          current={data.current}
          working={data.working}
          onDiscardAll={discardAll}
          onPublish={async (note) => {
            await flush(); // edits still inside the 600 ms debounce must be in the draft first
            const rev = await publish(note);
            await reload().catch(() => {}); // the revision exists either way: show its progress
            go('publish', 'progress', String(rev));
          }}
        />
      );
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
      return (
        <Explorer
          coll={coll}
          working={data.working}
          current={data.current}
          draftPaths={Object.keys(data.draft)}
          onAdd={addItem}
          onRemove={removeItem}
          onRestore={restoreItem}
        />
      );
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
