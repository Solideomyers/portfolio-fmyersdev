import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// The .gs files run on Apps Script (one shared global scope); the pure render functions run here.
const ctx = vm.createContext({});
const src = ['apps-script/Code.gs', 'apps-script/Email.gs'].map((f) => readFileSync(f, 'utf8'));
vm.runInContext(src.join('\n') + '\nthis.api = { renderSender, renderOwner };', ctx);
const { renderSender, renderOwner } = (
  ctx as unknown as { api: Record<string, (b: object) => string> }
).api;

const brief = {
  lang: 'en',
  name: 'Ana Pérez',
  email: 'ana@example.com',
  type: 'saas',
  budget: '1-5k',
  message: 'Line one\n<script>alert(1)</script> & "quotes"',
  noJs: false,
  when: '2026-10-07 · 14:32 VET',
  sheetUrl: 'https://docs.google.com/spreadsheets/d/x',
};

test('sender copy: EN content, escaped message, email-safe markup', () => {
  const html = renderSender(brief);
  expect(html).toContain('SHEET 06b — BRIEF RECEIVED');
  expect(html).toContain('Thanks. I&#39;ll reply within 2 business days.');
  expect(html).toContain('SaaS MVP');
  expect(html).toContain('$1–5k');
  expect(html).toContain(
    'Line one<br>&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;quotes&quot;',
  );
  expect(html).not.toContain('<script>');
  expect(html).toContain('href="https://fmyers.dev/en/work"');
  expect(html).not.toMatch(
    /position:\s*absolute|border-radius:\s*[1-9]|box-shadow|gradient|class="/,
  );
});

test('sender copy: ES copy and links; empty optional fields show a dash', () => {
  const html = renderSender({ ...brief, lang: 'es', type: '', budget: 'unsure' });
  expect(html).toContain('LÁMINA 06b — RESUMEN RECIBIDO');
  expect(html).toContain('Gracias. Te respondo en 2 días hábiles.');
  expect(html).toContain('No lo sé aún');
  expect(html).toContain('TIPO DE PROYECTO');
  expect(html).toMatch(/TIPO DE PROYECTO<\/div>\s*<div[^>]*>—</);
  expect(html).toContain('href="https://fmyers.dev/es/proyectos"');
  expect(html).toContain('lang="es"');
});

test('owner notification: sender, flags, reply link and escaped name', () => {
  const html = renderOwner({ ...brief, name: 'Ana <b>', noJs: true });
  expect(html).toContain('NEW BRIEF · SAAS MVP');
  expect(html).toContain('Ana &lt;b&gt;');
  expect(html).toContain('NO-JS');
  expect(html).toContain('href="mailto:ana@example.com?subject=');
  expect(html).toContain(`href="${brief.sheetUrl}"`);
  expect(html).not.toContain('<b>');
});
