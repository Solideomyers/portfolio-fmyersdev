import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { otherWorkSchema, workSchema } from '../../../src/lib/content-schemas.ts';
import { validateFiles, type Files } from '../../../src/lib/snapshot.ts';
import { blankFor, nextNumber, restoreEntry } from './blank.ts';
import { draftRows, itemsOf, removedItems } from './collections.ts';
import { blankItem, formFields } from './fields.ts';
import { applyEdit, BODY, readItem } from './twins.ts';
import { bodyText } from './yaml-edit.ts';

const files: Files = JSON.parse(
  readFileSync(new URL('../../../tests/fixtures/content.snapshot.json', import.meta.url), 'utf8'),
).files;

const W_EN = 'src/content/work/en/fm-01-churchapp.mdx';
const W_ES = 'src/content/work/es/fm-01-churchapp.mdx';
const OTHER = 'src/content/other-work.json';
const changed = (a: Files, b: Files) => Object.keys(b).filter((p) => a[p] !== b[p]);

// ---- twins: writing a case study ----

test('a case study: shared keys reach both languages, the rest only its own', () => {
  const status = applyEdit(files, W_EN, 'status', 'in-use');
  assert.deepEqual(changed(files, status), [W_EN, W_ES]);
  assert.equal(readItem(status, W_ES).status, 'in-use');
  assert.deepEqual(validateFiles(status), []);

  const summary = applyEdit(files, W_ES, 'summary', 'Resumen nuevo');
  assert.deepEqual(changed(files, summary), [W_ES]);

  const shot = applyEdit(files, W_EN, 'shots.0.alt', 'New alt');
  assert.deepEqual(changed(files, shot), [W_EN]);
  assert.equal((readItem(shot, W_EN).shots as { alt: string }[])[0].alt, 'New alt');
  assert.deepEqual(validateFiles(shot), []);
});

test('the narrative is its own key and leaves the frontmatter alone', () => {
  const out = applyEdit(files, W_ES, BODY, '## Hola\n');
  assert.deepEqual(changed(files, out), [W_ES]);
  assert.equal(bodyText(out[W_ES]), '## Hola\n');
  assert.equal(out[W_ES].split('\n---\n')[0], files[W_ES].split('\n---\n')[0]);
});

test('an optional key left empty is removed from both languages', () => {
  const out = applyEdit(files, W_EN, 'version', undefined);
  assert.deepEqual(changed(files, out), [W_EN, W_ES]);
  assert.equal('version' in readItem(out, W_ES), false);
  assert.deepEqual(validateFiles(out), []);
});

test('other work: a text is replaced where it stands, a list rewrites the entry', () => {
  const list = JSON.parse(files[OTHER]) as { id: string }[];
  const text = applyEdit(files, OTHER, 'title', 'Nuevo título', list[0].id);
  assert.deepEqual(changed(files, text), [OTHER]);
  assert.equal(text[OTHER].split('\n').length, files[OTHER].split('\n').length); // layout kept
  assert.equal((JSON.parse(text[OTHER]) as { title: string }[])[0].title, 'Nuevo título');

  const stack = applyEdit(files, OTHER, 'stack', ['A', 'B'], list[0].id);
  assert.deepEqual((JSON.parse(stack[OTHER]) as { stack: string[] }[])[0].stack, ['A', 'B']);
  assert.deepEqual(validateFiles(stack), []);
});

// ---- fields ----

test('a case study form: texts, lists, a group and lists of objects', () => {
  const fields = formFields(workSchema);
  const get = (key: string) => fields.find((f) => f.key === key)!;
  assert.equal(get('summary').type, 'text');
  assert.equal(get('sector').type, 'list');
  assert.equal(get('year').type, 'number');
  assert.equal(get('draft').type, 'boolean');
  const status = get('status');
  assert.deepEqual(status.type === 'select' && status.options, ['live', 'in-use', 'wip']);

  const cover = get('cover');
  assert.deepEqual(cover.type === 'group' && cover.fields.map((f) => f.key), ['src', 'alt']);
  const shots = get('shots');
  assert.deepEqual(shots.type === 'items' && shots.fields.map((f) => f.key), [
    'src',
    'alt',
    'caption',
  ]);
  const metrics = get('metrics');
  assert.deepEqual(metrics.type === 'items' && metrics.fields.map((f) => f.key), [
    'label',
    'value',
    'date',
  ]);
  assert.ok(shots.type === 'items');
  assert.deepEqual(blankItem(shots.fields), { src: '', alt: '', caption: '' });
});

test('other work: a repository, a stack list and both descriptions', () => {
  assert.deepEqual(
    formFields(otherWorkSchema).map((f) => [f.key, f.type]),
    [
      ['id', 'text'],
      ['title', 'text'],
      ['repo', 'text'],
      ['stack', 'list'],
      ['en', 'text'],
      ['es', 'text'],
    ],
  );
});

// ---- the dashboard rows and the list of removed items ----

test('an edited case study is one row with what changed, narrative included', () => {
  let working = applyEdit(files, W_ES, 'timeline', 'Nuevo plazo');
  working = applyEdit(working, W_ES, BODY, '## Otro\n');
  working = applyEdit(working, W_EN, 'status', 'in-use'); // shared: both files
  const draft = Object.fromEntries(changed(files, working).map((p) => [p, working[p]]));
  assert.deepEqual(draftRows(files, working, draft), [
    { collection: 'work', id: 'FM-01', title: 'ChurchApp', what: 'Estado, Plazo, Narrativa' },
  ]);
});

test('a new project is "Nuevo"; a removed published one is "Quitado" and listed to restore', () => {
  const blank = blankFor('work', nextNumber(files, 'work'));
  const rows = draftRows(files, { ...files, ...blank }, blank);
  assert.deepEqual(
    rows.map((r) => [r.id, r.what, r.removed]),
    [['FM-03', 'Nuevo', undefined]],
  );

  const removed = { ...files };
  delete removed[W_EN];
  delete removed[W_ES];
  const gone = draftRows(files, removed, { [W_EN]: null, [W_ES]: null });
  assert.deepEqual(gone, [
    { collection: 'work', id: 'FM-01', title: 'ChurchApp', what: 'Quitado', removed: true },
  ]);
  assert.deepEqual(
    removedItems('work', files, removed).map((i) => i.id),
    ['FM-01'],
  );
  assert.deepEqual(
    itemsOf('work', removed).map((i) => i.id),
    ['FM-02'],
  );
});

test('other work: new and removed entries are rows; a removed one is restored in its place', () => {
  const list = JSON.parse(files[OTHER]) as { id: string }[];
  const added = { ...files, ...blankFor('otherWork', nextNumber(files, 'otherWork'), files) };
  assert.deepEqual(
    draftRows(files, added, { [OTHER]: added[OTHER] }).map((r) => [r.id, r.what]),
    [[`OW-${String(list.length + 1).padStart(2, '0')}`, 'Nuevo']],
  );

  const cut = { ...files, [OTHER]: JSON.stringify(list.slice(1), null, 2) + '\n' };
  const rows = draftRows(files, cut, { [OTHER]: cut[OTHER] });
  assert.deepEqual(
    rows.map((r) => [r.id, r.what, r.removed]),
    [[list[0].id, 'Quitado', true]],
  );
  assert.deepEqual(
    removedItems('other', files, cut).map((i) => i.id),
    [list[0].id],
  );

  const back = restoreEntry(files[OTHER], cut[OTHER], list[0].id);
  assert.deepEqual(JSON.parse(back), list); // same entries, same order
  assert.equal(restoreEntry(files[OTHER], back, list[0].id), back); // already there: nothing to do
});
