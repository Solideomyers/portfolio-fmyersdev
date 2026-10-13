import { test, expect } from '@playwright/test';
import { parseBrief, isSpam, sentUrl, errorUrl } from '../src/lib/contact';

const base = { email: 'ana@example.com', message: 'We need an MVP.', lang: 'en' };

test('parseBrief: valid input is trimmed and typed', () => {
  const r = parseBrief({
    ...base,
    name: '  Ana  ',
    type: 'saas',
    budget: '1-5k',
    email: ' ana@example.com ',
  });
  expect(r).toEqual({
    ok: true,
    data: {
      lang: 'en',
      name: 'Ana',
      email: 'ana@example.com',
      type: 'saas',
      budget: '1-5k',
      message: 'We need an MVP.',
    },
  });
});

test('parseBrief: required, invalid and too-long fields', () => {
  expect(parseBrief({ ...base, email: '' })).toEqual({ ok: false, errors: { email: 'required' } });
  expect(parseBrief({ ...base, email: 'ana@example' })).toEqual({
    ok: false,
    errors: { email: 'invalid' },
  });
  expect(parseBrief({ ...base, message: '   ' })).toEqual({
    ok: false,
    errors: { message: 'required' },
  });
  expect(parseBrief({ ...base, message: 'x'.repeat(5001) })).toEqual({
    ok: false,
    errors: { message: 'too-long' },
  });
  expect(parseBrief({ ...base, name: 'x'.repeat(201) })).toEqual({
    ok: false,
    errors: { name: 'too-long' },
  });
  expect(parseBrief({ ...base, type: 'crypto' })).toEqual({
    ok: false,
    errors: { type: 'invalid' },
  });
  expect(parseBrief({ ...base, budget: '1M' })).toEqual({
    ok: false,
    errors: { budget: 'invalid' },
  });
});

test('parseBrief: optional fields may be empty; unknown lang falls back to en; FormData works', () => {
  const fd = new FormData();
  fd.set('email', 'ana@example.com');
  fd.set('message', 'Hi');
  fd.set('lang', 'fr');
  const r = parseBrief(fd);
  expect(r.ok && r.data).toEqual({
    lang: 'en',
    name: '',
    email: 'ana@example.com',
    type: '',
    budget: '',
    message: 'Hi',
  });
});

test('isSpam and redirect URLs', () => {
  expect(isSpam({ website: 'http://spam' })).toBe(true);
  expect(isSpam({ website: '' })).toBe(false);
  expect(isSpam({})).toBe(false);
  expect(sentUrl('en')).toBe('/en/contact/sent');
  expect(sentUrl('es')).toBe('/es/contacto/enviado');
  expect(errorUrl('es')).toBe('/es/contacto#send-error');
});
