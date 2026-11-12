import { useCallback, useEffect, useRef, useState } from 'react';
import { discardDraft, loadWorking, saveFile, type Working } from './lib/api';
import { withDraft } from './lib/draft';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const DEBOUNCE_MS = 600;

/**
 * The published files plus the draft, kept in memory while the owner edits. Edits show at once
 * and are written to the draft 600 ms after the last keystroke. Last write wins across tabs.
 */
export function useWorking() {
  const [data, setData] = useState<Working | null>(null);
  const [failed, setFailed] = useState(false);
  const [save, setSave] = useState<SaveState>('idle');
  // null = the file is removed in the draft
  const pending = useRef(new Map<string, string | null>());
  const timer = useRef(0);

  useEffect(() => {
    loadWorking().then(setData, () => setFailed(true));
  }, []);

  // Edits that never reached the draft (a failed save, or the tab closed inside the debounce) warn.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (pending.current.size) e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const flush = useCallback(async () => {
    window.clearTimeout(timer.current);
    const batch = [...pending.current];
    pending.current.clear();
    if (!batch.length) return;
    try {
      for (const [path, text] of batch) await saveFile(path, text);
      setSave('saved');
    } catch {
      // keep them for the next flush unless a newer edit already replaced them
      for (const [path, text] of batch)
        if (!pending.current.has(path)) pending.current.set(path, text);
      setSave('error');
    }
  }, []);

  /** Writes a file into the draft; `null` removes it (a project taken out, a new one put back). */
  const edit = useCallback(
    (path: string, text: string | null) => {
      setData((d) => {
        if (!d) return d;
        const working = { ...d.working };
        if (text === null) delete working[path];
        else working[path] = text;
        return { ...d, working, draft: withDraft(d.draft, d.current, path, text) };
      });
      pending.current.set(path, text);
      setSave('saving');
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, DEBOUNCE_MS);
    },
    [flush],
  );

  /** Puts the published text back for these files and drops them from the draft. */
  const discard = useCallback(
    async (paths: string[]) => {
      for (const p of paths) pending.current.delete(p);
      setData((d) => {
        if (!d) return d;
        const working = { ...d.working };
        let draft = d.draft;
        for (const p of paths) {
          // a file that was never published (a new project) disappears; a removed one comes back
          if (p in d.current) working[p] = d.current[p];
          else delete working[p];
          draft = withDraft(draft, d.current, p, d.current[p] ?? null);
        }
        return { ...d, working, draft };
      });
      try {
        for (const p of paths) await saveFile(p, data?.current[p] ?? null);
        setSave('saved');
      } catch {
        setSave('error');
      }
    },
    [data?.current],
  );

  const discardAll = useCallback(async () => {
    pending.current.clear();
    try {
      await discardDraft();
      setData(await loadWorking());
      setSave('idle');
    } catch {
      setSave('error');
    }
  }, []);

  return { data, failed, save, edit, discard, discardAll };
}
