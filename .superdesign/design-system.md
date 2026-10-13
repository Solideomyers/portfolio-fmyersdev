# fmyers.dev — design system (email edition)

## Product context

fmyers.dev is the bilingual (EN/ES) portfolio of Francisco Myers, a freelance full-stack developer in Venezuela (UTC−4) who builds SaaS MVPs, automations and contract work. Visitors send a short project brief from the Contact page. Two transactional emails follow:

1. **Sender copy** (to the visitor, EN or ES): confirms the brief was received, promises a reply within 2 business days, and repeats what they sent.
2. **Owner notification** (to Francisco): a new brief arrived; who sent it, project type, budget, language, and the message, with a one-tap reply.

Tone: calm, precise, engineering-drawing. The site reads like a set of technical drawing sheets ("SHEET 06 — CONTACT"), not a marketing page.

## Visual language (hard constraints)

- **Light only**, fixed colours (emails must not depend on CSS variables or prefers-color-scheme).
- Colours (hex, use only these):
  - paper (page background) `#F2F3EF`
  - paper-raised (card/sheet surface) `#F8F9F6`
  - hatch (subtle fill) `#E4E7E1`
  - rule (hairlines) `#C4C9C1`
  - graphite (muted text, labels) `#5B626A`
  - ink (text, strong borders) `#15181C`
  - cobalt (accent, links, primary button) `#2B55C8`, text on cobalt `#FFFFFF`
  - signal (success / "received") `#1F8A4C`
- **Typography:** Archivo (sans; headings weight 700, slightly wide, tight negative letter-spacing ≈ −0.03em, line-height ≈ 1.0) with fallback `Helvetica, Arial, sans-serif`. Labels in JetBrains Mono 500, UPPERCASE, letter-spacing 1px, 11–13px, fallback `'Courier New', monospace`. Body 16–17px, line-height 1.5, ink; secondary text graphite.
- **Geometry:** border-radius 0 everywhere. No shadows. No gradients. Borders: 1px rule `#C4C9C1` for dividers, 1px ink `#15181C` for cells, 2px ink for the main sheet frame.
- **Signature details:** a mono "sheet header" row (e.g. `SHEET 06b — BRIEF RECEIVED` left, meta right) with a 1px ink rule under it; a 28×28px solid cobalt square at the bottom-right corner of the main framed sheet ("corner mark"); key/value "spec grid" cells (mono 11px graphite key above a 16px ink value) in bordered cells.
- **Glyphs only:** → ↗ ← — · ✓. No emoji, no icons, no images, no logo image — the brand is the text wordmark **fmyers.dev** (Archivo 700, ~18px).

## Email layout rules

- Single column, max width 600px, centred on paper `#F2F3EF`; generous 32–40px padding inside the sheet.
- Structure top→bottom: wordmark row → sheet header → framed sheet (status label, headline, paragraph, spec grid, message block, CTA) with corner mark → mono footer (channels and legal line).
- Build as an HTML email: table-based layout, inline styles, no external CSS besides an optional Google Fonts `<link>`, no JS, no background images, buttons as bulletproof table cells (cobalt fill, white text, radius 0, ~14×22px padding).
- The visitor's message renders in a quoted block: hatch `#E4E7E1` left bar (3px ink or cobalt) or a 1px rule frame, pre-wrapped text.
- Copy must stay short; every label is mono uppercase.
