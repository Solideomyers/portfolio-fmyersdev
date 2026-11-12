import { isScalar, parseDocument } from 'yaml';

/** Every editable string of a UI texts file, by path: `nav.work`, `contact.channels[1].v`. */
export function flatten(tree: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (v: unknown, path: string) => {
    if (typeof v === 'string') out[path] = v;
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (v && typeof v === 'object')
      for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k);
    // numbers and booleans are not texts: left alone
  };
  walk(tree, '');
  return out;
}

const parts = (path: string): (string | number)[] =>
  [...path.matchAll(/([^.[\]]+)|\[(\d+)\]/g)].map((m) =>
    m[2] !== undefined ? Number(m[2]) : m[1],
  );

/**
 * Replaces one string of a JSON file in place: only that literal changes, byte for byte the rest of
 * the file stays as committed (Prettier keeps short lists such as `"cats": ["Todo", "Proceso"]` on
 * one line, which re-serialising with JSON.stringify would expand). JSON is YAML, so `yaml` gives
 * the source position of the value.
 */
export function setLeaf(fileText: string, path: string, value: string): string {
  const doc = parseDocument(fileText);
  if (doc.errors.length) throw new Error(`not valid JSON: ${doc.errors[0].message}`);
  const node = doc.getIn(parts(path), true);
  if (!isScalar(node) || typeof node.value !== 'string' || !node.range)
    throw new Error(`no text at ${path}`);
  const [start, end] = node.range;
  return fileText.slice(0, start) + JSON.stringify(value) + fileText.slice(end);
}

// The site fills these in when it builds: {{email}}, {{EMAIL}} (build-time) and {date} (home.ts).
const TOKEN = /\{\{\w+\}\}|\{\w+\}/g;

const count = (text: string) => {
  const c = new Map<string, number>();
  for (const t of text.match(TOKEN) ?? []) c.set(t, (c.get(t) ?? 0) + 1);
  return c;
};

/**
 * A text that lost a placeholder would print it raw or drop the value: every token in `before` (the
 * published text) must still be in `after`, as many times. One message per missing token.
 */
export function tokenErrors(before: string, after: string): string[] {
  const have = count(after);
  return [...count(before)]
    .filter(([token, n]) => (have.get(token) ?? 0) < n)
    .map(([token]) => `Falta ${token}: el sitio lo reemplaza al construirse.`);
}
