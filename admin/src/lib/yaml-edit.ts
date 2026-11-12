import { parseDocument } from 'yaml';

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n?[\s\S]*)$/;

/**
 * Sets keys in a file's YAML frontmatter and leaves everything else as it was: comments, key
 * order, quoting of untouched values and the body. A key may be a dotted path ("service.proof").
 * `yaml` quotes a new string only when it needs it (`a: b`, `- x`, `# c`, `*x`, "true", ...).
 */
export function editFrontmatter(fileText: string, patch: Record<string, unknown>): string {
  const m = FRONTMATTER.exec(fileText);
  if (!m) throw new Error('file has no frontmatter');
  const doc = parseDocument(m[1]);
  for (const [key, value] of Object.entries(patch)) doc.setIn(key.split('.'), value);
  // Same style as the committed files (Prettier): no re-wrapping of long lines (lineWidth 0) and
  // flow lists written ['a', 'b'], not [ 'a', 'b' ]. Untouched values must not show up in a diff.
  return `---\n${doc.toString({ lineWidth: 0, flowCollectionPadding: false }).trimEnd()}\n---${m[2]}`;
}
