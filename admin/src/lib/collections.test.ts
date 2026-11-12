import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Files } from '../../../src/lib/snapshot.ts';
import { draftRows, itemsOf } from './collections.ts';
import { setLeaf } from './texts.ts';
import { applyEdit } from './twins.ts';

const files: Files = JSON.parse(
  readFileSync(new URL('../../../tests/fixtures/content.snapshot.json', import.meta.url), 'utf8'),
).files;

const EN = 'src/content/pricing/en/p-01-saas-mvp.md';
const ES = 'src/content/pricing/es/p-01-saas-mvp.md';

test('collections list their items with a readable summary', () => {
  const pricing = itemsOf('pricing', files);
  assert.equal(pricing.length, 3);
  assert.deepEqual(pricing[0], {
    id: 'P-01',
    title: 'SaaS MVP',
    meta: '$3,200 · por proyecto',
    paths: [EN, ES],
  });
  assert.equal(itemsOf('faq', files)[0].id, 'Q-01');
  assert.deepEqual(
    itemsOf('site', files).map((i) => i.id),
    ['site'],
  );
  assert.deepEqual(itemsOf('work', files), []);
});

test('an edited item is one draft row, however many files it touched', () => {
  const working = applyEdit(files, EN, 'from', 4500);
  const draft = { [EN]: working[EN], [ES]: working[ES] };
  assert.deepEqual(draftRows(files, working, draft), [
    { collection: 'pricing', id: 'P-01', title: 'SaaS MVP', what: 'Precio · USD' },
  ]);
});

test('faq, site facts and files without an editor yet each get a row', () => {
  const faq = applyEdit(files, 'src/content/faq/en.json', 'q', 'Changed?', 'Q-01');
  assert.deepEqual(
    draftRows(files, faq, { 'src/content/faq/en.json': faq['src/content/faq/en.json'] }),
    [{ collection: 'faq', id: 'Q-01', title: 'Changed?', what: 'Pregunta' }],
  );

  const site = applyEdit(files, 'src/config/site.data.json', 'email', 'a@b.co');
  const [row] = draftRows(files, site, {
    'src/config/site.data.json': site['src/config/site.data.json'],
  });
  assert.equal(row.what, 'Correo de contacto');

  const ui = { 'src/i18n/ui.en.json': '{}' };
  assert.equal(draftRows(files, { ...files, ...ui }, ui)[0].collection, 'texts');
});

test('the texts collection is one editable item, and its edits are one draft row', () => {
  const [item] = itemsOf('texts', files);
  assert.equal(item.id, 'texts');
  assert.match(item.meta, /^\d+ cadenas · ES · EN$/);
  assert.deepEqual(item.paths, ['src/i18n/ui.en.json', 'src/i18n/ui.es.json']);

  const en = setLeaf(files['src/i18n/ui.en.json'], 'nav.work', 'WORK!');
  const es = setLeaf(files['src/i18n/ui.es.json'], 'nav.work', 'PROYECTOS!');
  const es2 = setLeaf(es, 'nav.about', 'SOBRE MÍ!');
  const working = { ...files, 'src/i18n/ui.en.json': en, 'src/i18n/ui.es.json': es2 };
  const draft = { 'src/i18n/ui.en.json': en, 'src/i18n/ui.es.json': es2 };
  assert.deepEqual(draftRows(files, working, draft), [
    { collection: 'texts', id: 'texts', title: 'Textos de la interfaz', what: '3 cadenas' },
  ]);
});
