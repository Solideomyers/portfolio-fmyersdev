# SP8b Go live — design

Status: approved by the owner · 2026-10-13 · branch `feature/sp8b-go-live`

## Goal

Replace the last placeholders with real assets and prices, then ship the site to production as **v1.0.0** on the Vercel domain (`https://fmyers-dev.vercel.app`). The custom domain is not bought yet; when it is, the CONTRIBUTING "Domain day" checklist applies (no code change).

## Owner decisions (2026-10-13)

| Item                  | Decision                                                                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Portrait              | B&W studio portrait supplied by the owner (`profile-photo-mochrome.jpg`, 896×1195)                                                                        |
| ChurchApp screenshots | Captured from production by the agent: public landing and staff panel overview, both free of personal data (checked: no names, emails or phones in frame) |
| Prices                | More modest, "without giving the work away": MVP **$3,200**, Automation **$600**, Fractional contract **$2,000 / mo**, Maintenance **from $100 / month**  |
| FM-02 metric dates    | `2026-10` confirmed; no change                                                                                                                            |
| N-02 date and figure  | Out of scope: the blog stays off (`BLOG_ENABLED=false`)                                                                                                   |
| Domain + `hola@`      | Not bought; launch on the Vercel domain with `fmyersdev@gmail.com`                                                                                        |

## Changes

1. **Portrait.** Crop to 4:5 (884×1105, centred, starting below the light ceiling strip that ends at y≈80) and save as `src/assets/portrait.jpg`. `Portrait.astro` already globs that path and swaps the hatch for an optimised `<Image>`; no component change.
2. **ChurchApp screenshots.** 1254×784 PNGs (16:10, the C12 Figure ratio) at `src/assets/work/fm-01/churchapp.png` and `churchapp-panel.png`. The case frontmatter (EN + ES) points the second shot at `.png` instead of `.jpg`. Captions and alts stay as written (they match what the captures show).
3. **Prices.** Content only, in every place they appear:
   - `src/content/pricing/{en,es}/p-01-saas-mvp.md` `from: 3200`; `p-02-automation.md` `from: 600`; `p-03-fullstack.md` `from: 2000`;
   - maintenance "From $100/month" / "Desde $100/mes" in the four pricing files that carry it;
   - `src/content/faq/{en,es}.json` and the two `ui.ts` strings ("from $100 a month" / "desde $100 al mes").
     `docs/handoff/content/` keeps the original drafts (handoff is a record, not live content). Tests that assert the old content prices (`home.spec`, `offer.spec`) move to the new ones; `offer-unit` tests the formatter with literal numbers and stays.
4. **Release v1.0.0.**
   - This SP's PR body contains the line `Release-As: v1.0.0` (exact, own line; `next-tag` fails the job on any near miss). The squash body is the PR body (repo setting `squash_merge_commit_message = PR_BODY`, verified), so `tag.yml` tags the merge `v1.0.0`.
   - Then the first release PR: `release/v1.0.0` from tag `v1.0.0` → `main`, title `chore: release v1.0.0`, merge commit. `release-source` validates it.
   - Production deploys from `main`.

## Owner gates before the release PR is merged

1. Vercel Web Analytics enabled for the project.
2. Apps Script: new `Code.gs`/`Email.gs` pasted, `REPLY_TO` and `SITE_URL=https://fmyers-dev.vercel.app` set, new version deployed.
3. Turnstile widget hostnames include `fmyers-dev.vercel.app`.

## After the release

- Lighthouse on production (home, work, a case, contact, pricing; mobile + desktop); every category ≥ 95 is the bar SP8a set.
- One real contact submission on production: owner notification and sender copy arrive, with links on the production host.
- Roadmap: SP8b `done (v1.0.0)`.

## Testing

- `about`: the portrait renders an `<img>` (no hatch) with the existing alt, at 4:5.
- `work`/`case`: both ChurchApp figures render images (no hatch).
- Price assertions updated; a guard that no `$150`, `4,500`, `$900` or `2,800` remains in `src/` content or `ui.ts`.
- Full suite, `lint:check`, `check`, flag-off build (`check-blog-hidden`).

## Out of scope

The custom domain and `hola@fmyers.dev` (Domain day checklist), the blog (N-02 date/figure, the note author mini-portrait), issues #8, #9, #11.
