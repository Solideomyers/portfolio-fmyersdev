import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { availabilityText, priceLine } from './preview.ts';

const files = JSON.parse(
  readFileSync(new URL('../../../tests/fixtures/content.snapshot.json', import.meta.url), 'utf8'),
).files;
const ui = {
  es: JSON.parse(files['src/i18n/ui.es.json']),
  en: JSON.parse(files['src/i18n/ui.en.json']),
};

test('the price line reads the unit from the language files', () => {
  assert.deepEqual(priceLine(ui.es, 3200, 'month'), {
    from: 'DESDE',
    price: '$3,200',
    unit: 'AL MES',
  });
  assert.deepEqual(priceLine(ui.en, 900, 'project'), {
    from: 'FROM',
    price: '$900',
    unit: 'PER PROJECT',
  });
});

test('availability is dated until the month starts, then dateless; bad input shows a dash', () => {
  const before = new Date('2026-10-15T00:00:00Z');
  // the site writes months abbreviated: lower case in Spanish, capitalised in English
  assert.match(availabilityText(ui.es, '2026-11', 'es', before), /desde nov 2026$/);
  assert.match(availabilityText(ui.en, '2026-11', 'en', before), /from Nov 2026$/);
  assert.equal(
    availabilityText(ui.en, '2026-11', 'en', new Date('2026-11-01T00:00:00Z')),
    ui.en.home.availableNow,
  );
  assert.equal(availabilityText(ui.en, 'soon', 'en'), '—');
  assert.equal(availabilityText(ui.en, '2026-13', 'en'), '—');
});
