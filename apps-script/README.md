# Contact backend: Google Apps Script

The site's `/api/contact` (Vercel function) validates the form, checks Turnstile and forwards each brief here. This script appends it to a private Sheet, emails you, and sends the sender a copy.

## 1. Sheet and script

1. Create a Google Sheet named **fmyers.dev — Briefs** (the script creates the `Briefs` tab and its header).
2. **Extensions → Apps Script**. Replace the default code with [`Code.gs`](Code.gs). Save.

## 2. Script properties

**Project Settings → Script properties → Add**:

| Property    | Value                                                                                         |
| ----------- | --------------------------------------------------------------------------------------------- |
| `FORM_KEY`  | A long random string (e.g. `openssl rand -hex 32`). Also used as `APPS_SCRIPT_KEY` in Vercel. |
| `NOTIFY_TO` | The inbox that receives new briefs (e.g. `fmyersdev@gmail.com`).                              |

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

## Updating the script

Edit `Code.gs` in the repo first, paste it into the editor, then **Deploy → Manage deployments → Edit → New version**. The URL stays the same.
