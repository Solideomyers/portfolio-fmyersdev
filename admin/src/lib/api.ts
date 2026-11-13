import type { Files } from '../../../src/lib/snapshot.ts';
import { supabase } from '../supabase';
import { overlay, type Draft } from './draft';

export type Working = {
  revision: number;
  /** The published files (what the site is built from). */
  current: Files;
  /** Only the edited files; `null` deletes one. */
  draft: Draft;
  /** current with the draft laid over it: what the owner is editing. */
  working: Files;
};

export async function loadWorking(): Promise<Working> {
  const [snap, draft] = await Promise.all([
    supabase.rpc('get_current_snapshot'),
    supabase.from('draft').select('files').single(),
  ]);
  if (snap.error) throw snap.error;
  if (draft.error) throw draft.error;
  if (!snap.data) throw new Error('no published revision');
  const { revision, files: current } = snap.data as { revision: number; files: Files };
  const files = draft.data.files as Draft;
  return { revision, current, draft: files, working: overlay(current, files) };
}

/** Stores an edit in the draft; a text equal to the published one removes it (done in SQL). */
export async function saveFile(path: string, text: string | null): Promise<void> {
  const { error } = await supabase.rpc('draft_set_file', { p: path, c: text });
  if (error) throw error;
}

export async function discardDraft(): Promise<void> {
  const { error } = await supabase.rpc('draft_discard');
  if (error) throw error;
}

export type LastRevision = {
  id: number;
  created_at: string;
  kind: 'import' | 'publish' | 'restore';
  note: string | null;
  summary: string | null;
};

export async function lastRevision(): Promise<LastRevision | null> {
  const { data, error } = await supabase
    .from('revisions')
    .select('id,created_at,kind,note,summary')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Publishes the draft as a new revision (the database then fires the deploy hook); returns its REV. */
export async function publish(note?: string): Promise<number> {
  const { data, error } = await supabase.rpc('publish', { p_note: note?.trim() || null });
  if (error) throw error;
  return Number(data);
}

export { waitForLive, type LiveState } from './live';
