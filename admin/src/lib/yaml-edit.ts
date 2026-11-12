import { isCollection, isScalar, parseDocument, type Scalar } from 'yaml';

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n?[\s\S]*)$/;

/**
 * Plain (unquoted) only when YAML reads it back as the same string. Inside a flow list or mapping
 * (`[a, b]`, `{ a: b }`) the characters `, [ ] { }` end a value, so there they force quotes.
 */
const isPlainSafe = (v: string, inFlow: boolean): boolean => {
  if (v === '' || v !== v.trim() || /[\n\r]/.test(v) || (inFlow && /[,[\]{}]/.test(v)))
    return false;
  try {
    const doc = parseDocument(v);
    return doc.errors.length === 0 && doc.toJS() === v;
  } catch {
    return false; // e.g. "*star" is an alias with no anchor
  }
};

/** The YAML text of one value, keeping the quote style of the scalar it replaces. */
function scalarText(value: string | number | boolean, style?: Scalar.Type, inFlow = false): string {
  if (typeof value !== 'string') return String(value);
  if (style === 'QUOTE_SINGLE' && !/[\n\r\t]/.test(value)) return `'${value.replace(/'/g, "''")}'`;
  if (style !== 'QUOTE_DOUBLE' && isPlainSafe(value, inFlow)) return value;
  return JSON.stringify(value);
}

const isPrimitive = (v: unknown): v is string | number | boolean =>
  typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';

/**
 * Sets keys in a file's YAML frontmatter; a key may be a dotted path ("service.proof", "shots.0.alt").
 *
 * A single value (text, number, boolean) that already exists is replaced where it stands: only that
 * literal changes, byte for byte the rest of the file stays as committed (Prettier's multi-line
 * lists, `{ a: b }` mappings, comments, quoting). Anything structural (a list, a new nested key)
 * is written by `yaml`, which re-serialises the frontmatter in the repo style (no padding, no
 * re-wrapping). An empty patch returns the file untouched.
 */
export function editFrontmatter(fileText: string, patch: Record<string, unknown>): string {
  const m = FRONTMATTER.exec(fileText);
  if (!m) throw new Error('file has no frontmatter');
  const entries = Object.entries(patch);
  if (!entries.length) return fileText;

  let fm = m[1];
  const doc = parseDocument(fm);
  const inPlace: [start: number, end: number, text: string][] = [];
  const appended: string[] = [];
  const rest: [string[], unknown][] = [];
  for (const [key, value] of entries) {
    const path = key.split('.');
    const node = doc.getIn(path, true);
    if (isPrimitive(value) && isScalar(node) && node.range && node.value !== null) {
      if (node.value === value) continue; // nothing to change: not even a character moves
      const parent = path.length > 1 ? doc.getIn(path.slice(0, -1), true) : doc.contents;
      const inFlow = isCollection(parent) && parent.flow === true;
      inPlace.push([node.range[0], node.range[1], scalarText(value, node.type, inFlow)]);
    } else if (isPrimitive(value) && node === undefined && path.length === 1)
      appended.push(`${key}: ${scalarText(value)}`);
    else rest.push([path, value]);
  }

  // from the end, so the positions of the earlier edits stay valid
  for (const [start, end, text] of inPlace.sort((a, b) => b[0] - a[0]))
    fm = fm.slice(0, start) + text + fm.slice(end);
  if (appended.length) fm = `${fm.trimEnd()}\n${appended.join('\n')}`;
  if (rest.length) {
    const next = parseDocument(fm);
    for (const [path, value] of rest)
      if (value === undefined) next.deleteIn(path);
      else next.setIn(path, value);
    fm = next.toString({ lineWidth: 0, flowCollectionPadding: false }).trimEnd();
  }
  return `---\n${fm}\n---${m[2]}`;
}

/** The MDX narrative of a content file, without the blank lines after the frontmatter. */
export function bodyText(fileText: string): string {
  const m = FRONTMATTER.exec(fileText);
  return m ? m[2].replace(/^\r?\n+/, '') : fileText;
}

/** Replaces the narrative; the frontmatter stays exactly as it was. */
export function setBody(fileText: string, body: string): string {
  const m = FRONTMATTER.exec(fileText);
  if (!m) throw new Error('file has no frontmatter');
  return `---\n${m[1]}\n---\n\n${body}`;
}
