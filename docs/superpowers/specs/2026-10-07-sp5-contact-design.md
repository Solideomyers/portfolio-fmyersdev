# SP5 — Contact · Design

Date: 2026-10-07 · Roadmap: [../roadmap.md](../roadmap.md) · Branch: `feature/sp5-contact`

## Goal

A working contact path:

- **Pages:** the Contact page (P05) with the ContactForm (C02/C03) and the confirmation page (P05b), ported from `docs/handoff/design/Contact.dc.html`.
- **Endpoint:** a single on-demand Vercel function, `/api/contact`, that validates the submission, checks spam and forwards it to a Google Apps Script web app.
- **Storage:** the Apps Script appends to a private Sheet and sends the notification plus the sender's copy.
- **Coverage:** works with and without JavaScript.

## Decisions (approved in brainstorming)

- **Infrastructure doesn't exist yet (A).** The Apps Script code and deploy instructions live in the repo (`apps-script/`). Until the user deploys it and sets the env vars, production submissions end in the network-error state.
- **No-JS submissions are accepted (A).**
  - They carry no Turnstile token (Turnstile needs JS), so they're marked `noJs`.
  - The honeypot protects them, plus an Apps Script cap of **20 `noJs` rows per day** (UTC).
  - They're still saved and notified. Rows show `noJs = TRUE` so they can be filtered.
- **A Vercel function in front of Apps Script (B).** This gives no-JS posts a real 303 redirect, keeps the Turnstile secret and the Apps Script URL/key server-side, and lets the client read structured results.
  - New dependency: `@astrojs/vercel`.
  - The site stays static (`output: 'static'`); only `src/pages/api/contact.ts` has `prerender = false`.
  - The handoff's "POSTs to a Google Apps Script web app" becomes "POSTs to `/api/contact`, which forwards to the Apps Script web app". The Sheet, the email and the latency budget are unchanged.
- **Message is required** (README: "consider requiring the message"). Name stays optional. Email must match `^[^@\s]+@[^@\s]+\.[^@\s]+$`.
- **Chips are native radios** styled as chips. They work without JS and announce their checked state. JS adds the handoff behaviour "clicking the selected chip clears it". This deviates from the README's `aria-pressed`: radios are the correct semantics for single-select.
- **Turnstile** is the real Cloudflare widget (`size: flexible`, theme following the page), placed in the design's slot. The design's static box was a placeholder. The widget script loads only on the Contact pages.
- **Out of scope:**
  - Shake fine-tuning, the check stroke draw (D11), the sending blur transitions beyond the existing `motion.css` rules: SP6.
  - Copy-email toast (D12): SP6.

## Configuration — `astro:env`

```js
env: {
  schema: {
    PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public', default: '1x00000000000000000000AA' }),
    TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
    APPS_SCRIPT_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
    APPS_SCRIPT_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
  },
}
```

- The public default is Cloudflare's always-pass test site key.
- **Server secrets have no defaults.** In development and tests the function falls back to the always-pass test secret (`1x0000000000000000000000000000000AA`) **only when `import.meta.env.DEV` or `process.env.CONTACT_TEST_MODE === '1'`**.
- In production a missing secret, URL or key → **503** (the client shows the network error).
- `.env.example` lists the four names with dummy values. `.env` stays gitignored.

## Shared validation — `src/lib/contact.ts` (unit-tested, used by client and server)

- `TYPES = ['saas', 'automation', 'contract', 'other']`, `BUDGETS = ['lt1k', '1-5k', '5-10k', '10k+', 'unsure']`. These are stable values; labels come from `ui`.
- `parseBrief(input: FormData | Record<string,string>): { ok: true; data: Brief } | { ok: false; errors: Partial<Record<'email' | 'message' | 'type' | 'budget' | 'name', 'invalid' | 'required' | 'too-long'>> }`
  - Trims every field.
  - `email`: required and matching the regex, ≤ 254.
  - `message`: required, ≤ 5000.
  - `name`: ≤ 200.
  - `type`: empty or one of `TYPES`.
  - `budget`: empty or one of `BUDGETS`.
  - `lang`: `en`/`es`, default `en`.
- `isSpam(input)`: the `website` honeypot is non-empty.
- `sentUrl(lang)`, `errorUrl(lang)`: `/{lang}/contact/sent` | `/es/contacto/enviado`, and `/{lang}/contact#send-error` | `/es/contacto#send-error` (from `ROUTES`).

## Function — `src/pages/api/contact.ts`

`POST` only. Any other method → 405. It decides between JSON and redirect from `Accept: application/json` (set by the client script).

1. Read `request.formData()`. An unparseable body → 400 / redirect to error.
2. `isSpam` → respond success (JSON `{ok:true}` or 303 to `sentUrl`) **without forwarding**.
3. `parseBrief` fails → JSON 422 `{ok:false, errors}`, or 303 to `errorUrl`.
4. Turnstile:
   - If `cf-turnstile-response` is present, verify it with `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` (`secret`, `response`, `remoteip` from `x-forwarded-for`). Failure → JSON 403, or 303 to `errorUrl`.
   - If absent → `noJs = true`. A JSON request without a token is treated as a failure (403): JS clients always render the widget.
5. Forward to Apps Script: `POST APPS_SCRIPT_URL` with JSON `{ key, lang, name, email, type, budget, message, noJs }`, timeout 10s.
   - Expect `{ ok: boolean, reason?: 'cap' | 'key' | 'invalid' }`.
   - Non-OK or a network error → JSON 502, or 303 to `errorUrl`.
6. Success → JSON 200 `{ok:true}`, or 303 to `sentUrl(lang)`.

No secrets or upstream bodies are echoed in responses. Errors are logged with `console.error` (Vercel logs) without the message body.

## Apps Script — `apps-script/Code.gs` + `apps-script/README.md`

- **`doPost(e)`:**
  1. Parse the JSON from `e.postData.contents`.
  2. Constant-time compare `key` against Script Property `FORM_KEY` → mismatch `{ok:false, reason:'key'}`.
  3. Re-validate email and message (defense in depth) → `{ok:false, reason:'invalid'}`.
  4. If `noJs`, count today's `noJs` rows (UTC) in the sheet. At ≥ 20 → `{ok:false, reason:'cap'}`.
  5. Append `[ISO timestamp, lang, name, email, type, budget, message, noJs]` to the sheet named `Briefs` (created with a header row if missing).
  6. `MailApp.sendEmail` to Script Property `NOTIFY_TO` (subject `New brief · {type} · {name|email}`), with `replyTo: email`.
  7. Send the copy to the sender (EN/ES text, `replyTo: hola@fmyers.dev`).
  8. Return `ContentService` JSON `{ok:true}`.
- **README:** step-by-step instructions.
  1. Create the Sheet, open Extensions → Apps Script, paste `Code.gs`.
  2. Set Script Properties `FORM_KEY` (a long random string) and `NOTIFY_TO`.
  3. Deploy as a web app (execute as me, access: anyone).
  4. Copy the URL.
  5. Create a Turnstile widget for `fmyers.dev` and the preview domains.
  6. Set the Vercel env vars (`vercel env add …`) for Production and Preview.
  7. Redeploy and run a test submission.

## UI (values from `Contact.dc.html`)

**ContactPage** (main gap 24):

- **Header:** SheetHeader `SHEET 06 — CONTACT` / `REPLY IN 2 BUSINESS DAYS`. Below it, a row with flex wrap, gap 32×64, align start.
- **Left** (flex 1 1 300px, gap 20):
  - h1 `clamp(40px,5.2cqi,66px)` 700 stretch 110% ls −0.035em lh .95 balance.
  - lead `clamp(17px,1.5cqi,19px)`/1.45 muted.
  - Availability line (shared with Home: extract `Availability.astro` from HeroSheet).
  - Channels: ink top border; rows are `<a>` with grid `110px minmax(0,1fr) auto`, gap 12, min-height 52, rule bottom, `--text`.
    - Key: mono 11 ls 1 muted. Value: 16px with `overflow-wrap: anywhere`. Glyph: mono accent.
    - Hover: accent.
    - Links: WhatsApp `wa.me` ↗, email `mailto:` →, LinkedIn ↗.
- **Right — `ContactForm.astro`** (flex 1.4 1 420px, min-width 0): `<form method="post" action="/api/contact">` with `--border-frame`, `--surface`, relative, column.
  - **Text fields** (`.field`): label wrapper, padding 14×20, rule bottom, gap 6. Label span mono 12 ls 1 muted.
    - Input/textarea: 0 border, transparent, 17px, min-height 28, no outline. Focus: `box-shadow: inset 0 -2px 0 var(--accent)` on the input.
    - Textarea: 4 rows, lh 1.5, resize vertical.
    - Native attributes: `name`, `type="email"`, `required` (email, message), `autocomplete`.
  - **Error state** (`.field.is-error`):
    - `box-shadow: inset 3px 0 0 var(--danger)`, label in `--danger`.
    - Message `<span role="alert">` 14px `--danger`.
    - `aria-invalid="true"` and `aria-describedby` on the control.
    - The shake comes from `motion.css` (`.field.is-error`).
  - **Chip groups** (type, budget): `<fieldset>` without border, padding 14×20, rule bottom, gap 10. Legend mono 12 muted.
    - Each chip: `<label class="chip">` wrapping a visually hidden `<input type="radio">` + text.
    - Mono 13, min-height 40 (44 on coarse pointers), padding 0×12, 1px ink. Checked = invert. Focus-visible ring on the label.
    - Press scale comes from `motion.css` (`.chip`).
  - **Footer** (padding 16×20, gap 14):
    - Turnstile container.
    - Row (space-between, wrap, gap 14): privacy note 14 muted with a link to Privacy; submit `button.btn.primary` (17/600, accent, padding 16×24, min-width 200) with `<span class="label">`.
    - ERR box `#send-error`: hidden by default and shown via `:target` or the JS class `.is-visible`. It has `role="alert"`, a 1px danger border, padding 10×12, 15px danger text and a mono 12 `ERR` tag.
  - **Honeypot:** `<input name="website" tabindex="-1" autocomplete="off" aria-hidden="true">`, positioned off-screen.
  - Hidden `lang` input.
- **Client script** (progressive enhancement):
  - Validate with `parseBrief`; on errors, set the error state on fields and focus the first invalid one.
  - Sending: add `.is-sending` to the button, swap the label to `Sending…`, set `aria-disabled`. The width is kept by min-width.
  - Send `fetch('/api/contact', { method: 'POST', body: FormData, headers: { Accept: 'application/json' } })`.
  - On `{ok:true}`, `location.assign(sentUrl)`. Otherwise show ERR and reset the button. A 422 maps the errors onto fields.
  - Chips: clicking the checked radio unchecks it.
  - A Turnstile reset follows a failure.

**ContactSentPage** (routes `contactSent`: `/en/contact/sent`, `/es/contacto/enviado`; `noindex`):

- SheetHeader `SHEET 06 — CONTACT` / `06b`.
- Section: `--border-frame`, `--surface`, padding `clamp(28px,5cqi,64px)`, gap 20, max 860, corner 28.
  - Check SVG 56×56 (square + path, `--ok`, static).
  - `BRIEF RECEIVED` mono 13 ls 1 `--ok`.
  - h1 `clamp(36px,4.6cqi,58px)` lh 1.
  - p lead, max 600.
  - Spec grid (`auto-fit minmax(min(100%,180px),1fr)`, cells on `--bg`).
  - Actions: secondary `← Back home` and link `SEE SELECTED WORK →`.

**Routes:** `ROUTES.contactSent = { en: '/en/contact/sent', es: '/es/contacto/enviado' }`. Not in `NAV`; the nav highlights CONTACT through `navKeyOf`'s prefix match. The Contact stub is replaced, which ends the last use of `Stub.astro`; it is deleted.

**Copy:** `ui[lang].contact`, verbatim from `COPY`. Chip labels map to `TYPES`/`BUDGETS`.

## Error handling summary

| Case                         | JS                              | No JS                                     |
| ---------------------------- | ------------------------------- | ----------------------------------------- |
| Invalid fields (client)      | Inline field errors, no request | Native `required`/`type=email` validation |
| Invalid fields (server)      | 422 → field errors              | 303 → `#send-error`                       |
| Honeypot                     | Fake success                    | Fake success                              |
| Turnstile fail               | 403 → ERR + widget reset        | (no token) → `noJs` path                  |
| Apps Script down, cap or key | 502 → ERR                       | 303 → `#send-error`                       |
| Missing env in production    | 503 → ERR                       | 303 → `#send-error`                       |
| Network failure              | ERR                             | Browser error page                        |

## Testing

- **Harness check first.**
  - `astro build` + `astro preview` with the Vercel adapter must still serve static pages.
  - If preview is unsupported, `playwright.config.ts` switches to `node scripts/serve-static.mjs` (no dependency) serving `.vercel/output/static` on 4329 with `404.html` fallback.
  - Either way, e2e intercepts `/api/contact` with `page.route`.
- **Unit** (`tests/contact-unit.spec.ts`):
  - `parseBrief`: every rule, trimming, length caps, allowed values.
  - `isSpam`, `sentUrl`/`errorUrl`.
- **Function** (`tests/contact-api.spec.ts`): import `POST`, call it with `Request` objects, stub `fetch` for Cloudflare and Apps Script, `CONTACT_TEST_MODE=1`.
  - Honeypot → success without upstream calls.
  - Invalid → 422 / 303 error.
  - Turnstile fail → 403.
  - JSON without token → 403.
  - No-JS without token → forwards `noJs:true` and 303s to sent.
  - Upstream `{ok:false, reason:'cap'}` → 502 / 303 error.
  - Upstream throws → 502.
  - Missing env with test mode off → 503.
  - Non-POST → 405.
  - The forwarded body never includes `cf-turnstile-response` or `website`.
- **e2e** (`tests/contact.spec.ts`, EN/ES):
  - Layout: channels with hrefs, 2 chip groups (4 + 5), honeypot off-screen, Turnstile container present.
  - Invalid email → `.field.is-error`, `aria-invalid`, alert text, focus on email.
  - Empty message → error.
  - Chip select, then click again to clear.
  - Submit with the route mocked `{ok:true}` → URL is the sent page.
  - Mocked 502 → ERR visible, button label restored.
  - Sending label shown while the mocked response is delayed.
  - `/en/contact#send-error` without JS → ERR visible.
  - Sent page: check svg, received label, 3 spec cells, links; `noindex`.
  - Overflow and heading-order checks include both new routes.
- `routes.spec.ts`: `contactSent` added to `ROUTES` is covered automatically. That spec's alternate check needs a 200 for the twin.

## Docs

The `CLAUDE.md` stack line becomes: "Astro (static output; the only on-demand route is `/api/contact` via `@astrojs/vercel`)", plus a rule that secrets live only in Vercel env / Apps Script properties, never in the repo. The `CONTRIBUTING.md` setup gains `.env.example`.

## Done when

- **Tests:** all pass locally and in CI.
- **Preview:** shows both pages, and a real submission through the preview works **once the user has deployed the Apps Script and set the env vars**. That manual step goes in the PR body.
- **Screenshots** match `Contact.dc.html` (form and sent) at 1280/375.
- **Roadmap:** SP5 done.

## Amendment after the final review (2026-10-07)

- The sender copy is skipped for `noJs` briefs and capped at 30/day (UTC). Apps Script returns `{ok, copy}`; the endpoint returns `{ok, copy}` (JSON) or redirects to the sent URL with `#no-copy` when no copy was sent, and the sent page swaps `sentP` for `sentNoCopy` via `:target`.
- The row is the source of truth: email failures are logged and never fail the submission. `waitLock` is 5s.
- Apps Script accepts only known `type`/`budget` values and flattens newlines in `name`.
- Client: with no Turnstile token (widget blocked or unfinished after 8s), the form falls back to a native post (the no-JS path). `aria-describedby` points at the error text only while the field is invalid. A bfcache restore resets the sending state.
- A Vercel Firewall rate-limit rule on `/api/contact` is part of the deploy steps.

## Amendment: HTML emails (2026-10-07)

- Both emails (sender copy EN/ES and owner notification) are HTML, designed in Superdesign (project "fmyers.dev — Emails") from `.superdesign/design-system.md` and approved by the owner. Plain text stays as the fallback part.
- Templates live in `apps-script/Email.gs` (pure functions `renderSender`, `renderOwner`); `Code.gs` passes `htmlBody`. Light only; Archivo/JetBrains Mono with Helvetica/Arial and Courier fallbacks; tables and inline styles only. The corner mark is a 28px cobalt cell inside the frame (email clients drop positioning).
- Every user value is HTML-escaped. `tests/email.spec.ts` renders both templates in a Node vm and checks copy, escaping and email-safe markup.
