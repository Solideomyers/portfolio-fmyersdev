import type { Files } from '../../../src/lib/snapshot.ts';

/** The draft overlay: only the edited files; `null` deletes a file (see draft_set_file). */
export type Draft = Record<string, string | null>;

/** The files as the owner sees them: the published files with the draft laid over them. */
export function overlay(current: Files, draft: Draft): Files {
  const out = { ...current };
  for (const [path, text] of Object.entries(draft)) {
    if (text === null) delete out[path];
    else out[path] = text;
  }
  return out;
}

/** Mirrors draft_set_file: a text equal to the published one drops out of the draft. */
export function withDraft(draft: Draft, current: Files, path: string, text: string | null): Draft {
  const next = { ...draft };
  if (text === (current[path] ?? null)) delete next[path];
  else next[path] = text;
  return next;
}
