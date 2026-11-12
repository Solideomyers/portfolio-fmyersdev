import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { bodyText, editFrontmatter, setBody } from './yaml-edit.ts';

const fixture: { files: Record<string, string> } = JSON.parse(
  readFileSync(new URL('../../../tests/fixtures/content.snapshot.json', import.meta.url), 'utf8'),
);

const doc = '---\n# keep me\nid: P-01\nname: Old\nfrom: 3200\n---\n\nBody **text**\n';
const frontmatter = (t: string) => parse(/^---\n([\s\S]*?)\n---/.exec(t)![1]);
const body = (t: string) => t.slice(t.indexOf('\n---', 4) + 4);

// Review Focus 1: a typed value with YAML-significant characters is written quoted and parses back.
test('values with YAML-significant characters round-trip as the same string', () => {
  const values = [
    'a: b',
    '- x',
    '# c',
    'x #y',
    'Fast, cheap',
    '*star',
    '"q"',
    '@at',
    'key:',
    'true',
    '123',
    'null',
    ' padded ',
    'multi\nline',
  ];
  for (const v of values) {
    const out = editFrontmatter(doc, { name: v });
    assert.equal(frontmatter(out).name, v, JSON.stringify(v));
    assert.equal(frontmatter(out).from, 3200);
    assert.match(out, /# keep me/);
    assert.equal(body(out), body(doc));
  }
});

test('arrays and nested keys are written and read back', () => {
  const out = editFrontmatter(doc, {
    includes: ['One: 1', 'Two'],
    'service.proof': 'Recent: ChurchApp',
  });
  assert.deepEqual(frontmatter(out).includes, ['One: 1', 'Two']);
  assert.equal(frontmatter(out).service.proof, 'Recent: ChurchApp');
});

test('only the edited line changes', () => {
  const out = editFrontmatter(doc, { name: 'New' });
  assert.equal(out, doc.replace('name: Old', 'name: New'));
});

// The panel must not reformat what the owner did not touch ("a case study round-trips unchanged").
const content = Object.entries(fixture.files).filter(([p]) => /^src\/content\/.+\.mdx?$/.test(p));

test('an empty patch returns every content file, case studies included, byte for byte', () => {
  assert.ok(content.length > 0);
  for (const [path, text] of content) assert.equal(editFrontmatter(text, {}), text, path);
});

// Every single value of every file (nested ones and list items too): change it, put it back, and the
// file is exactly as it was. The in-place edit keeps the quoting and the layout of the literal.
test('changing any single value and changing it back leaves the file byte for byte', () => {
  const paths = (v: unknown, at: string[] = []): string[][] =>
    v && typeof v === 'object' ? Object.entries(v).flatMap(([k, x]) => paths(x, [...at, k])) : [at];
  let checked = 0;
  for (const [file, text] of content) {
    const data = frontmatter(text);
    for (const path of paths(data)) {
      const value = path.reduce((o: unknown, k) => (o as Record<string, unknown>)[k], data);
      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean')
        continue;
      const key = path.join('.');
      const other =
        typeof value === 'string' ? 'zz' : typeof value === 'number' ? value + 1 : !value;
      const edited = editFrontmatter(text, { [key]: other });
      assert.notEqual(edited, text, `${file} ${key} should change`);
      assert.equal(editFrontmatter(edited, { [key]: value }), text, `${file} ${key}`);
      // and an identical value does not move a character
      assert.equal(editFrontmatter(text, { [key]: value }), text, `${file} ${key} (same)`);
      checked++;
    }
  }
  assert.ok(checked > 100, `checked ${checked} values`);
});

const FM01_ES = 'src/content/work/es/fm-01-churchapp.mdx';
const changedLines = (a: string, b: string) => {
  const [x, y] = [a.split('\n'), b.split('\n')];
  assert.equal(x.length, y.length);
  return y.filter((line, i) => line !== x[i]);
};

test('editing one value of a case study changes only its line', () => {
  const text = fixture.files[FM01_ES];
  const out = editFrontmatter(text, {
    timeline: 'Primera versión pública en 10 días: y sigue',
    'cover.alt': 'Portada nueva',
    'shots.1.caption': 'Pie nuevo',
    'metrics.0.value': '11 días',
    year: 2027,
    featured: false,
  });
  // the multi-line flow mappings and lists stay as written; each edit is one line
  assert.equal(changedLines(text, out).length, 6);
  const [was, now] = [frontmatter(text), frontmatter(out)];
  assert.equal(now.timeline, 'Primera versión pública en 10 días: y sigue');
  assert.equal(now.cover.alt, 'Portada nueva');
  assert.equal(now.shots[1].caption, 'Pie nuevo');
  assert.equal(now.metrics[0].value, '11 días');
  assert.equal(now.year, 2027);
  assert.equal(now.featured, false);
  assert.deepEqual(
    { ...now, timeline: 0, cover: 0, year: 0, featured: 0, shots: 0, metrics: 0 },
    {
      ...was,
      timeline: 0,
      cover: 0,
      year: 0,
      featured: 0,
      shots: 0,
      metrics: 0,
    },
  );
  assert.equal(now.shots[0].caption, was.shots[0].caption);
  assert.equal(now.metrics[1].value, was.metrics[1].value); // '12' stays a string
});

test('a quoted number stays a string; the quote style of the value is kept', () => {
  const text = fixture.files[FM01_ES];
  const out = editFrontmatter(text, { 'metrics.1.value': '15' });
  assert.equal(frontmatter(out).metrics[1].value, '15');
  assert.ok(out.includes("value: '15'"), 'single quotes kept');
});

test('a list or a new key is written by yaml; the other keys keep their values', () => {
  const text = fixture.files[FM01_ES];
  const out = editFrontmatter(text, { modules: ['Uno', 'Dos: dos'], 'cover.extra': 'x' });
  const [was, now] = [frontmatter(text), frontmatter(out)];
  assert.deepEqual(now.modules, ['Uno', 'Dos: dos']);
  assert.equal(now.cover.extra, 'x');
  assert.deepEqual({ ...now, modules: 0, cover: 0 }, { ...was, modules: 0, cover: 0 });
});

test('a missing top-level key is appended; null removes a key', () => {
  const FM02_EN = 'src/content/work/en/fm-02-chapel.mdx';
  const added = editFrontmatter(fixture.files[FM02_EN], { version: 'v2.0.0' });
  assert.equal(frontmatter(added).version, 'v2.0.0');
  assert.equal(added.split('\n').length, fixture.files[FM02_EN].split('\n').length + 1);
  const removed = editFrontmatter(added, { version: undefined });
  assert.equal('version' in frontmatter(removed), false);
});

test('the narrative is replaced without touching the frontmatter', () => {
  const text = fixture.files[FM01_ES];
  assert.ok(bodyText(text).startsWith('## Contexto'));
  const out = setBody(text, '## Nuevo\n\nTexto con `código` y <Figure n={1} />.\n');
  assert.equal(out.slice(0, out.indexOf('\n---\n', 4)), text.slice(0, text.indexOf('\n---\n', 4)));
  assert.equal(bodyText(out), '## Nuevo\n\nTexto con `código` y <Figure n={1} />.\n');
  assert.equal(setBody(text, bodyText(text)), text); // same body back: identical file
});
