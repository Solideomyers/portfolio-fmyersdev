import { test } from 'node:test';
import assert from 'node:assert/strict';
import { faqItemSchema, pricingSchema } from '../../../src/lib/content-schemas.ts';
import { formFields } from './fields.ts';

const byKey = (fields: ReturnType<typeof formFields>, key: string) => {
  const f = fields.find((x) => x.key === key);
  assert.ok(f, `no field ${key}`);
  return f;
};

test('pricing: number, select, string list and a nested group', () => {
  const fields = formFields(pricingSchema);
  assert.equal(byKey(fields, 'from').type, 'number');
  assert.deepEqual(byKey(fields, 'billing'), {
    key: 'billing',
    type: 'select',
    options: ['project', 'month'],
  });
  assert.equal(byKey(fields, 'includes').type, 'list');
  assert.equal(byKey(fields, 'featured').type, 'boolean');
  assert.equal(byKey(fields, 'name').type, 'text');

  const service = byKey(fields, 'service');
  assert.equal(service.type, 'group');
  if (service.type === 'group') {
    assert.equal(byKey(service.fields, 'scope').type, 'list');
    assert.equal(byKey(service.fields, 'proof').type, 'text');
  }
});

test('faq: page is a select, order a number', () => {
  const fields = formFields(faqItemSchema);
  const page = byKey(fields, 'page');
  assert.deepEqual(page.type === 'select' && page.options, ['pricing', 'services', 'both']);
  assert.equal(byKey(fields, 'order').type, 'number');
});
