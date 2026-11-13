import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { flatten, setLeaf, tokenErrors } from './texts.ts';

const files: Record<string, string> = JSON.parse(
  readFileSync(new URL('../../../tests/fixtures/content.snapshot.json', import.meta.url), 'utf8'),
).files;
const ES = 'src/i18n/ui.es.json';
const EN = 'src/i18n/ui.en.json';

test('flatten gives dot paths and [n] for arrays, and skips what is not text', () => {
  assert.deepEqual(flatten({ a: { b: 'x', c: ['p', { d: 'q' }] }, n: 3, ok: true, z: [] }), {
    'a.b': 'x',
    'a.c[0]': 'p',
    'a.c[1].d': 'q',
  });
});

test('setLeaf changes one leaf and nothing else', () => {
  const before = flatten(JSON.parse(files[ES]));
  const out = setLeaf(files[ES], 'nav.work', 'PROYECTOS NUEVOS');
  const after = flatten(JSON.parse(out));
  assert.deepEqual(
    Object.keys(after).filter((k) => after[k] !== before[k]),
    ['nav.work'],
  );
  assert.equal(after['nav.work'], 'PROYECTOS NUEVOS');
  // exactly one line of the file differs: no reformatting anywhere else
  const [a, b] = [files[ES].split('\n'), out.split('\n')];
  assert.equal(a.length, b.length);
  assert.deepEqual(
    b.filter((line, i) => line !== a[i]),
    ['    "work": "PROYECTOS NUEVOS",'],
  );
});

// Prettier keeps short lists on one line ("cats": ["Todo", ...]); editing a leaf must not expand them.
test('setLeaf edits one item of an inline list and keeps the list on its line', () => {
  const lineOf = (t: string) => t.split('\n').find((l) => l.includes('"cats"'));
  const out = setLeaf(files[ES], 'notes.cats[1]', 'Método "nuevo"');
  assert.equal(
    lineOf(out),
    '    "cats": ["Todo", "Método \\"nuevo\\"", "Automatización", "Ingeniería", "Casos"],',
  );
  assert.equal(flatten(JSON.parse(out))['notes.cats[1]'], 'Método "nuevo"');
});

test('setLeaf reaches into arrays and writes back every leaf unchanged', () => {
  for (const file of [ES, EN]) {
    const flat = flatten(JSON.parse(files[file]));
    assert.ok(
      Object.keys(flat).some((k) => k.includes('[')),
      'the file has array leaves',
    );
    for (const [k, v] of Object.entries(flat))
      assert.equal(setLeaf(files[file], k, v), files[file], `${file} ${k}`);
  }
});

test('setLeaf refuses a path that is not an existing text', () => {
  assert.throws(() => setLeaf(files[ES], 'nav.nope', 'x'), /nav\.nope/);
  assert.throws(() => setLeaf(files[ES], 'nav', 'x'), /no text at nav/);
  assert.throws(() => setLeaf(files[ES], 'nope.deeper', 'x'), /nope\.deeper/);
});

// Review Focus 2: removing a placeholder must be refused.
test('tokenErrors names a removed token and accepts a kept one', () => {
  assert.equal(tokenErrors('Write to {{email}}', 'Write to us').length, 1);
  assert.match(tokenErrors('Write to {{email}}', 'Write to us')[0], /\{\{email\}\}/);
  assert.deepEqual(tokenErrors('Write to {{email}}', 'Escribe a {{email}} ya'), []);
  assert.deepEqual(tokenErrors('no tokens', 'anything'), []);
});

test('tokenErrors covers {{EMAIL}} and {date} too, and counts repeats', () => {
  assert.equal(tokenErrors('{{EMAIL}}', '').length, 1);
  assert.equal(tokenErrors('From {date}', 'From soon').length, 1);
  assert.deepEqual(tokenErrors('From {date}', 'Desde {date}'), []);
  assert.equal(tokenErrors('{{a}} and {{a}}', '{{a}}').length, 1);
  assert.equal(tokenErrors('{{email}}', '{email}').length, 1); // one brace is not the same token
});

test('every placeholder in the real texts is recognised as a token', () => {
  for (const file of [ES, EN])
    for (const [k, v] of Object.entries(flatten(JSON.parse(files[file])))) {
      const rest = v.replace(/\{\{\w+\}\}|\{\w+\}/g, '');
      assert.ok(!/[{}]/.test(rest), `${file} ${k}: stray brace in "${v}"`);
    }
});
