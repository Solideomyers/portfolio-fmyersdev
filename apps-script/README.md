# Contact backend: Google Apps Script

The site's `/api/contact` (Vercel function) validates the form, checks Turnstile and forwards each brief here. This script appends it to a private Sheet, emails you, and sends the sender a copy.

## 1. Sheet and script

1. Create a Google Sheet named **fmyers.dev — Briefs** (the script creates the `Briefs` tab and its header).
2. **Extensions → Apps Script**. Replace the default code with [`Code.gs`](Code.gs). Then **Files → + → Script**, name it `Email`, and paste [`Email.gs`](Email.gs) (the HTML email templates; both files share one scope). Save.

## 2. Script properties

**Project Settings → Script properties → Add**:

| Property    | Value                                                                                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FORM_KEY`  | A long random string (e.g. `openssl rand -hex 32`). Also used as `APPS_SCRIPT_KEY` in Vercel.                                                                                                           |
| `NOTIFY_TO` | The inbox that receives new briefs (e.g. `fmyersdev@gmail.com`).                                                                                                                                        |
| `REPLY_TO`  | The public address shown to senders: their copy replies to it. Today `fmyersdev@gmail.com`; `hola@fmyers.dev` once the domain and Email Routing exist. Must match `site.email` in `src/config/site.ts`. |
| `SITE_URL`  | The production URL, no trailing slash (today the `.vercel.app` one). Used for the links in the sender's copy.                                                                                           |

## 3. Deploy

1. **Deploy → New deployment → Web app**. Execute as: **Me**. Who has access: **Anyone**.
2. Authorize (Sheets + Gmail send).
3. Copy the **Web app URL** (`https://script.google.com/macros/s/…/exec`).

Anyone can reach the URL, but every request without the exact `FORM_KEY` is rejected. Only the Vercel function knows the URL and the key.

## 4. Turnstile

Cloudflare dashboard → **Turnstile → Add widget**: hostnames `fmyers.dev`, `www.fmyers.dev` and your Vercel preview domain (`*.vercel.app` is not allowed, so add `fmyers-dev-git-develop-solideomyers-projects.vercel.app` or test with the always-pass keys). Mode: Managed. Copy the **site key** and **secret key**.

## 5. Vercel env (Production and Preview), from the repo root

```bash
vercel env add PUBLIC_TURNSTILE_SITE_KEY   # site key
vercel env add TURNSTILE_SECRET_KEY        # secret key
vercel env add APPS_SCRIPT_URL             # web app URL
vercel env add APPS_SCRIPT_KEY             # same value as FORM_KEY
```

Then redeploy (push a commit or **Redeploy** in Vercel).

## 6. Test

Submit the form on the preview. Expected: a row in `Briefs`, an email to `NOTIFY_TO`, and a copy in the sender's inbox. Without JS (disable it in the browser), you get the same plus `noJs = TRUE`. After 20 no-JS briefs in a day (UTC), further no-JS posts show the error box.

## Abuse limits

- **Sender copy:** never sent for no-JS briefs, and at most 30 per day (UTC) otherwise. The sent page says "Your brief is in" instead of promising a copy (`#no-copy`). This keeps the form from relaying mail from your account.
- **No-JS briefs:** at most 20 per day (UTC); after that they show the error box.
- **Email failures** (for example MailApp's daily quota) are logged in **Executions** but never fail the submission: the row in `Briefs` is the source of truth.
- **Vercel Firewall:** add a rate-limit rule (Project → Firewall → Rules): path equals `/api/contact`, 5 requests per 60s per IP, action Deny. This protects the function and the script lock from floods.

## Updating the script

Edit `Code.gs` / `Email.gs` in the repo first, paste them into the editor, then **Deploy → Manage deployments → Edit → New version**. The URL stays the same.

Since SP8a the sender copy needs `REPLY_TO` and `SITE_URL`. Without them the brief is still saved and you are notified, but no copy is sent.
