import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateFiles, type Files } from '../../../src/lib/snapshot.ts';
import { applyEdit, readItem, twinPath } from './twins.ts';
import { editFrontmatter } from './yaml-edit.ts';

const files: Files = JSON.parse(
  readFileSync(new URL('../../../tests/fixtures/content.snapshot.json', import.meta.url), 'utf8'),
).files;

const EN = 'src/content/pricing/en/p-01-saas-mvp.md';
const ES = 'src/content/pricing/es/p-01-saas-mvp.md';
const changed = (a: Files, b: Files) => Object.keys(b).filter((p) => a[p] !== b[p]);

test('twinPath swaps the language in folders and in file names', () => {
  assert.equal(twinPath(EN), ES);
  assert.equal(twinPath(ES), EN);
  assert.equal(twinPath('src/content/faq/en.json'), 'src/content/faq/es.json');
  assert.equal(twinPath('src/i18n/ui.es.json'), 'src/i18n/ui.en.json');
});

// Review Focus 3: from/billing can only change in both languages at once.
test('a shared key writes both twins, any other key writes one', () => {
  const price = applyEdit(files, EN, 'from', 4500);
  assert.deepEqual(changed(files, price), [EN, ES]);
  assert.equal(readItem(price, ES).from, 4500);
  assert.deepEqual(validateFiles(price), []);

  const name = applyEdit(files, EN, 'name', 'SaaS MVP, v2');
  assert.deepEqual(changed(files, name), [EN]);
  assert.equal(readItem(name, EN).name, 'SaaS MVP, v2');
  assert.deepEqual(validateFiles(name), []);
});

test('validation refuses a shared key changed in only one twin', () => {
  const only = { ...files, [EN]: editFrontmatter(files[EN], { from: 1 }) };
  assert.ok(validateFiles(only).some((m) => /from differs/.test(m)));
});

test('a faq item: shared keys reach both languages, text only its own', () => {
  const EN_FAQ = 'src/content/faq/en.json';
  const ES_FAQ = 'src/content/faq/es.json';
  const order = applyEdit(files, EN_FAQ, 'order', 9, 'Q-01');
  assert.deepEqual(changed(files, order), [EN_FAQ, ES_FAQ]);
  assert.equal(readItem(order, ES_FAQ, 'Q-01').order, 9);

  const q = applyEdit(files, EN_FAQ, 'q', 'How long: really?', 'Q-01');
  assert.deepEqual(changed(files, q), [EN_FAQ]);
  assert.equal(readItem(q, EN_FAQ, 'Q-01').q, 'How long: really?');
  assert.equal(readItem(q, EN_FAQ, 'Q-02').q, readItem(files, EN_FAQ, 'Q-02').q);
  assert.deepEqual(validateFiles(q), []);
});

test('site facts have no twin and keep the file formatting', () => {
  const SITE = 'src/config/site.data.json';
  const next = applyEdit(files, SITE, 'availableFrom', '2027-01');
  assert.deepEqual(changed(files, next), [SITE]);
  assert.equal(next[SITE], files[SITE].replace('2026-11', '2027-01'));
});

test('editing an item that does not exist fails loudly', () => {
  assert.throws(() => applyEdit(files, 'src/content/faq/en.json', 'q', 'x', 'Q-99'), /Q-99/);
});
