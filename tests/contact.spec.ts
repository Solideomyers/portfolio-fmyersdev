import { test, expect, type Page } from '@playwright/test';

const pages = [
  {
    lang: 'en',
    url: '/en/contact',
    sent: '/en/contact/sent',
    err: 'Write the full address, e.g. you@company.com',
  },
  {
    lang: 'es',
    url: '/es/contacto',
    sent: '/es/contacto/enviado',
    err: 'Escribe la dirección completa, p. ej. tu@empresa.com',
  },
] as const;

// Never reach Cloudflare or the real endpoint from tests.
async function isolate(page: Page) {
  await page.route('**/challenges.cloudflare.com/**', (r) => r.abort());
}
async function fillFields(page: Page) {
  await page.fill('input[name=email]', 'ana@example.com');
  await page.fill('textarea[name=message]', 'We need an MVP.');
}
// Fields plus a solved Turnstile (the real widget is blocked in tests).
async function fill(page: Page) {
  await fillFields(page);
  await page.evaluate(() => {
    const t = document.createElement('input');
    t.type = 'hidden';
    t.name = 'cf-turnstile-response';
    t.value = 'tok';
    document.querySelector('form.contact-form')!.append(t);
    (window as unknown as { turnstile: object }).turnstile = { reset() {} };
  });
}

for (const p of pages) {
  test(`${p.lang} contact: layout, channels, chips, honeypot`, async ({ page }) => {
    await isolate(page);
    await page.goto(p.url);
    await expect(page.locator('.channels a')).toHaveCount(3);
    await expect(page.locator('.channels a').first()).toHaveAttribute(
      'href',
      /^https:\/\/wa\.me\//,
    );
    await expect(page.locator('fieldset.chips').nth(0).locator('input[type=radio]')).toHaveCount(4);
    await expect(page.locator('fieldset.chips').nth(1).locator('input[type=radio]')).toHaveCount(5);
    await expect(page.locator('.cf-turnstile')).toHaveCount(1);
    const hp = page.locator('input[name=website]');
    await expect(hp).toHaveAttribute('tabindex', '-1');
    expect(await hp.evaluate((e) => e.getBoundingClientRect().right)).toBeLessThan(0);
    await expect(page.locator('form.contact-form')).toHaveAttribute('action', '/api/contact');
  });

  test(`${p.lang} contact: client validation shows field errors and focuses email`, async ({
    page,
  }) => {
    await isolate(page);
    await page.goto(p.url);
    await page.fill('input[name=email]', 'ana@example');
    await page.click('button[type=submit]');
    const field = page.locator('.field[data-field=email]');
    await expect(field).toHaveClass(/is-error/);
    await expect(page.locator('input[name=email]')).toHaveAttribute('aria-invalid', 'true');
    await expect(field.locator('[role=alert]')).toHaveText(p.err);
    await expect(page.locator('input[name=email]')).toBeFocused();
    await expect(page.locator('.field[data-field=message]')).toHaveClass(/is-error/);
  });

  test(`${p.lang} contact: success navigates to the sent page`, async ({ page }) => {
    await isolate(page);
    await page.route('**/api/contact', (r) => r.fulfill({ json: { ok: true, copy: true } }));
    await page.goto(p.url);
    await fill(page);
    await page.click('button[type=submit]');
    await expect(page).toHaveURL(new RegExp(`${p.sent}/?$`));
  });
}

test('chips: select, then click again to clear', async ({ page }) => {
  await isolate(page);
  await page.goto('/en/contact');
  const chip = page.locator('label.chip', { hasText: 'Automation' });
  await chip.click();
  await expect(chip.locator('input')).toBeChecked();
  await chip.click();
  await expect(chip.locator('input')).not.toBeChecked();
});

test('sending state, double submit ignored, error restores the button', async ({ page }) => {
  await isolate(page);
  let calls = 0;
  await page.route('**/api/contact', async (r) => {
    calls++;
    await new Promise((res) => setTimeout(res, 600));
    await r.fulfill({ status: 502, json: { ok: false } });
  });
  await page.goto('/en/contact');
  await fill(page);
  const btn = page.locator('button[type=submit]');
  await btn.click();
  await expect(btn).toHaveClass(/is-sending/);
  await expect(btn.locator('.label')).toHaveText('Sending…');
  await btn.click({ force: true });
  await expect(page.locator('#send-error')).toBeVisible();
  await expect(btn.locator('.label')).toHaveText('Send brief →');
  await expect(btn).not.toHaveClass(/is-sending/);
  expect(calls).toBe(1);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('the error anchor shows the ERR box', async ({ page }) => {
    await page.goto('/es/contacto#send-error');
    await expect(page.locator('#send-error')).toBeVisible();
  });
  test('the ERR box is hidden on a normal visit', async ({ page }) => {
    await page.goto('/en/contact');
    await expect(page.locator('#send-error')).toBeHidden();
  });
});

for (const s of [
  { url: '/en/contact/sent', received: 'BRIEF RECEIVED', home: '/en' },
  { url: '/es/contacto/enviado', received: 'RESUMEN RECIBIDO', home: '/es' },
]) {
  test(`${s.url}: confirmation sheet`, async ({ page }) => {
    await page.goto(s.url);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    await expect(page.locator('.sent svg')).toHaveCount(1);
    await expect(page.locator('.sent .received')).toHaveText(s.received);
    await expect(page.locator('.sent .spec-grid .cell')).toHaveCount(3);
    await expect(page.locator('.sent a.secondary')).toHaveAttribute('href', s.home);
    await expect(page.locator('.sent .corner')).toHaveCount(1);
  });
}

test('selected chip is inverted (ink background)', async ({ page }) => {
  await page.route('**/challenges.cloudflare.com/**', (r) => r.abort());
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/en/contact');
  const chip = page.locator('label.chip', { hasText: 'SaaS MVP' });
  await chip.click();
  await page.mouse.move(0, 0);
  await expect(chip).toHaveCSS('background-color', 'rgb(21, 24, 28)');
  await expect(chip).toHaveCSS('color', 'rgb(242, 243, 239)');
});

test('sent page: #no-copy swaps the copy sentence (works without JS)', async ({ page }) => {
  await page.goto('/en/contact/sent');
  await expect(page.locator('.sent .with-copy')).toBeVisible();
  await expect(page.locator('.sent .no-copy')).toBeHidden();
  await page.goto('/en/contact/sent#no-copy');
  await expect(page.locator('.sent .no-copy')).toBeVisible();
  await expect(page.locator('.sent .with-copy')).toBeHidden();
});

test('success without a sender copy lands on #no-copy', async ({ page }) => {
  await isolate(page);
  await page.route('**/api/contact', (r) => r.fulfill({ json: { ok: true, copy: false } }));
  await page.goto('/en/contact');
  await fill(page);
  await page.click('button[type=submit]');
  await expect(page).toHaveURL(/\/en\/contact\/sent\/?#no-copy$/);
});

test('Turnstile blocked: falls back to a native post instead of a dead end', async ({ page }) => {
  await isolate(page);
  let accept = 'unset';
  await page.route('**/api/contact', async (r) => {
    accept = r.request().headers()['accept'] ?? '';
    await r.fulfill({ status: 303, headers: { location: '/en/contact/sent#no-copy' } });
  });
  await page.goto('/en/contact');
  await fillFields(page);
  await page.click('button[type=submit]');
  await expect(page).toHaveURL(/\/en\/contact\/sent/);
  expect(accept).not.toContain('application/json');
});

test('error text is only described when the field is invalid', async ({ page }) => {
  await isolate(page);
  await page.goto('/en/contact');
  const email = page.locator('input[name=email]');
  await expect(email).not.toHaveAttribute('aria-describedby', /.+/);
  await email.fill('bad');
  await page.click('button[type=submit]');
  await expect(email).toHaveAttribute('aria-describedby', 'err-email');
  await email.fill('ana@example.com');
  await page.fill('textarea[name=message]', 'Hi');
  await page.route('**/api/contact', (r) => r.fulfill({ status: 502, json: { ok: false } }));
  await page.evaluate(() => {
    const t = document.createElement('input');
    t.type = 'hidden';
    t.name = 'cf-turnstile-response';
    t.value = 'tok';
    document.querySelector('form.contact-form')!.append(t);
    (window as unknown as { turnstile: object }).turnstile = { reset() {} };
  });
  await page.click('button[type=submit]');
  await expect(page.locator('#send-error')).toBeVisible();
  await expect(email).not.toHaveAttribute('aria-describedby', /.+/);
});

test('restoring the page from the back/forward cache resets a sending button', async ({ page }) => {
  await isolate(page);
  await page.goto('/en/contact');
  await page.evaluate(() => {
    const btn = document.querySelector('form.contact-form button[type=submit]')!;
    btn.classList.add('is-sending');
    btn.setAttribute('aria-disabled', 'true');
    btn.querySelector('.label')!.textContent = 'Sending…';
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
  });
  const btn = page.locator('button[type=submit]');
  await expect(btn).toHaveAttribute('aria-disabled', 'false');
  await expect(btn.locator('.label')).toHaveText('Send brief →');
});
