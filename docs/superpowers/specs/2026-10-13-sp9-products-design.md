# SP9 Products — design

Status: draft for owner review · 2026-10-13 · planned, not scheduled for development yet

## Goal

A public catalogue of products the owner has already built, so visitors can ask for a specific one instead of describing a project from scratch. There are two kinds of product:

- **Install:** the owner adapts and deploys it for the client, for example a membership system built on ChurchApp or an inventory system built on Chapel. Visitors request these through the existing contact form, with the product preselected.
- **Download:** a template, starter or script that the visitor buys and downloads. An external hosted checkout (merchant of record) handles payment, taxes, delivery and the licence.

The site stays static. No new backend, no new dependencies.

## Owner decisions (2026-10-13)

| Question                      | Decision                                                                                                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| What is a product             | Both kinds: install (adapted by the owner) and download (self-serve)                                                                                                                       |
| Payment for downloads         | External hosted checkout (Lemon Squeezy, Gumroad or Polar). Each product links to its checkout URL. Which provider is chosen when the first download product exists; only the URL changes. |
| Requesting an install product | The existing contact form, with the product preselected via `?product=PR-NN`                                                                                                               |
| Placement                     | A section of its own (index + one page per product) that joins the nav when enabled                                                                                                        |

Assumption to confirm with real content: the first products derive from shipped work (FM-01 ChurchApp, FM-02 Chapel). The owner writes the product content before the flag is turned on.

## Content model

New collection `products`, at `src/content/products/{en,es}/*.md`, using the same loader and `generateId` pattern as `work`.

| Field                              | Type                      | Notes                                                       |
| ---------------------------------- | ------------------------- | ----------------------------------------------------------- |
| `id`                               | `PR-NN` (regex)           | Same id in EN and ES                                        |
| `slug`, `lang`, `title`, `summary` | string                    | As in `work`                                                |
| `kind`                             | `'install' \| 'download'` | Drives the badge and the CTA                                |
| `from`                             | positive integer, USD     | Rendered with `formatUsd` (`src/lib/offer.ts`)              |
| `includes`                         | string[], at least 1      | What the client gets                                        |
| `stack`                            | string[]                  |                                                             |
| `delivery`                         | string                    | **Install only**, e.g. "1–2 weeks" / "1–2 semanas"          |
| `format`                           | string                    | **Download only**, e.g. "Next.js starter · MIT licence"     |
| `checkoutUrl`                      | `https://` URL            | **Download only, required**                                 |
| `provider`                         | string                    | **Download only**, shown as "Secure checkout by {provider}" |
| `case`                             | `FM-NN`, optional         | Links to the case study behind the product                  |
| `cover`, `shots`                   | as in `work`              | 16:10 assets under `src/assets/products/`                   |
| `order`, `draft`                   | number, boolean           | As in `work`                                                |

The schema is a discriminated union on `kind`: an `install` entry with `checkoutUrl`, or a `download` entry without it, fails the build. Every product exists in both EN and ES with matching `id`, `kind` and `from`, enforced by a test (like `offer-content`); so a product page's language switch always has a twin.

## Pages and navigation

- **Routes** in `ROUTES`, the single place URLs are written: `products: { en: '/en/products', es: '/es/productos' }`. Product pages are `/en/products/<slug>` and `/es/productos/<slug>`.
- **Nav:** `PRODUCTS / PRODUCTOS` joins the nav only when the catalogue is enabled, placed after CONTACT and before NOTES (so existing numbers never shift: 06 PRODUCTS, 07 NOTES when both are on). The nav must not overflow at 1024 and 1280 with every item present. If it does, the plan resolves it in `SiteNav`, not by dropping items.
- **Index:**
  - `SheetHeader` "SHEET 09 — PRODUCTS" / "LÁMINA 09 — PRODUCTOS" (08 is Privacy), an H1 and a lead paragraph.
  - Two groups in this order: "Installed for you" / "Lo instalo para ti" (`install`), then "Download" / "Descarga" (`download`). A group with no entries is not rendered. No filter.
  - New `ProductCard` built from the `PackageCard` and `ProjectCard` vocabulary:
    - an accent id, a kind badge (`INSTALL` / `DOWNLOAD`), the 16:10 cover through `Figure`, a title and a summary;
    - "FROM $X" / "DESDE $X" and a CTA;
    - a 1px ink border, radius 0 and no shadow;
    - hover turns the border cobalt in 200 ms, as in C08.
- **Product page:**
  - A header with id, kind badge and title, then the figure and the summary.
  - "What's included" / "Qué incluye" (the `includes` list).
  - A `SpecGrid` with STACK, DELIVERY or FORMAT, and CASE (a link to the case study when `case` is set).
  - Additional `shots`.
  - CTA:
    - **install:** "Request this product →" / "Solicitar este producto →" goes to `path('contact', lang) + '?product=PR-NN'`. Below it: "No JavaScript? Mention PR-NN in your message." / "¿Sin JavaScript? Menciona PR-NN en tu mensaje."
    - **download:** "Buy ↗" / "Comprar ↗" goes to `checkoutUrl`, `target="_blank" rel="noopener"`, with visually hidden "(opens in a new tab)" / "(se abre en una pestaña nueva)". Below it: "Secure checkout and delivery by {provider}."
- **Entry points** (enabled only):
  - Services gets "Ready-made products →" / "Productos listos →".
  - A case study whose id is referenced by a product's `case` gets "Want one like this? See PR-NN →".
  - Home is unchanged.

## Request flow (install)

1. `ContactForm`'s script reads `?product=` on load. The page embeds the known products as `data-products` (id → title, current language). For a known id it:
   - shows a line above the fields: "Product: PR-01 · {title}" with a "Remove" `<button>`;
   - fills a hidden `<input name="product">`;
   - leaves the user's own Type and Budget fields untouched.

   An unknown or malformed id is ignored silently.

2. `src/lib/contact.ts`: `product` is an optional field. If present it must match `^PR-\d{2}$`; otherwise the request gets the existing invalid-input response (422 JSON, or 303 to the error anchor without JS) with `errors.product = 'invalid'`. It is passed to Apps Script with the rest of the brief.
3. Apps Script (owner pastes and redeploys):
   - `Code.gs` appends a **`Product` column at the end** of `HEADER`; existing columns keep their positions;
   - `Email.gs` adds a "PRODUCT / PRODUCTO" row to the owner notification;
   - the sender copy names the product in its summary.

   Old rows simply have an empty cell.

## Launch flag

- `PRODUCTS_ENABLED`: an `astro:env` server boolean, default `false`, exposed by `src/config/products.ts`. This mirrors `src/config/blog.ts`.
- When off:
  - no product routes or OG images;
  - no nav item, sitemap entries, entry links or `data-products`;
  - `?product=` is ignored.
- `scripts/check-products-hidden.mjs` runs in the CI build job against the default build. It mirrors `check-blog-hidden.mjs`, including any-host absolute URLs.
- Playwright builds with the flag on, as it does for the blog.

## SEO

- The sitemap gets the index plus each product, with EN/ES alternates, only when enabled.
- `og:type` is `product`. The OG image is generated per product with `renderSheetOg` (`src/pages/og/products/[lang]/[slug].png.ts`), like notes.
- JSON-LD `Product` + `Offer` (`price` = `from`, `priceCurrency` = `USD`, `url` = `checkoutUrl`) goes on **download** pages only. Install products are tailored services, so they get no `Offer`.

## Accessibility

- 44px touch targets; "Remove" is a real `<button>` with an accessible name.
- The new-tab warning on "Buy ↗"; the kind badge meets 4.5:1 in both themes.
- No new motion beyond the C08 hover border.

## Testing

- **Schema / content:**
  - an `install` entry with `checkoutUrl` and a `download` entry without it fail validation;
  - the id matches `PR-NN`;
  - EN and ES parity on `id`, `kind` and `from`.
- **Index:** both groups render in order, an empty group is hidden, and each card shows the price and CTA.
- **Product page:**
  - an install page links to contact with `?product=`;
  - a download page links to `checkoutUrl` with `target=_blank`, `rel=noopener` and the hidden new-tab text;
  - JSON-LD appears on download pages only;
  - the language twin is correct.
- **Contact:**
  - `?product=PR-01` shows the line and posts `product`;
  - "Remove" clears both the line and the field;
  - an unknown id is ignored.
- **API:** a malformed `product` returns 422; a valid one reaches the Apps Script payload.
- **Email:** the owner and sender emails include the product (`tests/email.spec.ts`).
- **Flag:**
  - the default build passes `check-products-hidden`;
  - the enabled build shows the nav item, the sitemap entries and the entry links;
  - no overflow at 375, 768, 1024 and 1280, light and dark.

## Out of scope

- Own checkout, cart, accounts, discounts, coupons, licence management and conversion analytics.
- Subscription (recurring) products.
- Real product content and assets: the owner writes them before enabling the flag.
- Choosing the checkout provider.
- A Home section for products.
