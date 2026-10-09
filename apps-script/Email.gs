/**
 * HTML email templates for the contact backend (design: Superdesign "fmyers.dev — Emails").
 * Site tokens, light only. Email-safe: tables, inline styles, no classes or positioning.
 * Every user value goes through esc(). Shares global scope with Code.gs (uses COPY).
 */
const INK = '#15181C';
const MUTED = '#5B626A';
const COBALT = '#2B55C8';
const SIGNAL = '#1F8A4C';
const SANS = 'Archivo, Helvetica, Arial, sans-serif';
const MONO = "'JetBrains Mono', 'Courier New', Courier, monospace";
const LABELS = {
  en: {
    types: { saas: 'SaaS MVP', automation: 'Automation', contract: 'Contract', other: 'Other' },
    budgets: {
      lt1k: '< $1k',
      '1-5k': '$1–5k',
      '5-10k': '$5–10k',
      '10k+': '$10k+',
      unsure: 'Not sure yet',
    },
    language: 'English',
  },
  es: {
    types: { saas: 'SaaS MVP', automation: 'Automatización', contract: 'Contrato', other: 'Otro' },
    budgets: {
      lt1k: '< $1k',
      '1-5k': '$1–5k',
      '5-10k': '$5–10k',
      '10k+': '$10k+',
      unsure: 'No lo sé aún',
    },
    language: 'Español',
  },
};
const SENDER = {
  en: {
    sheet: 'SHEET 06b — BRIEF RECEIVED',
    received: 'BRIEF RECEIVED',
    h1: "Thanks. I'll reply within 2 business days.",
    p: 'I read every brief myself and reply from {email} (Venezuela time, UTC−4). This is a copy of what you sent.',
    keys: ['PROJECT TYPE', 'BUDGET', 'LANGUAGE'],
    message: 'YOUR MESSAGE',
    cta: 'See selected work →',
    work: '/en/work',
    why: 'You get this because you sent a brief at {host}/en/contact. No newsletter, no tracking.',
  },
  es: {
    sheet: 'LÁMINA 06b — RESUMEN RECIBIDO',
    received: 'RESUMEN RECIBIDO',
    h1: 'Gracias. Te respondo en 2 días hábiles.',
    p: 'Leo cada resumen personalmente y respondo desde {email} (hora de Venezuela, UTC−4). Esta es una copia de lo que enviaste.',
    keys: ['TIPO DE PROYECTO', 'PRESUPUESTO', 'IDIOMA'],
    message: 'TU MENSAJE',
    cta: 'Ver proyectos →',
    work: '/es/proyectos',
    why: 'Recibes esto porque enviaste un resumen en {host}/es/contacto. Sin boletín, sin rastreo.',
  },
};
const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function esc(value) {
  return String(value).replace(/[&<>"']/g, (c) => ENTITIES[c]);
}

function mono(size, color) {
  return `font-family:${MONO};font-weight:500;letter-spacing:1px;font-size:${size}px;color:${color};`;
}

function specGrid(cells) {
  const tds = cells
    .map(
      ([k, v]) =>
        `<td bgcolor="#F8F9F6" valign="top" style="padding:12px 16px;">` +
        `<div style="${mono(11, MUTED)}margin-bottom:4px;">${esc(k)}</div>` +
        `<div style="font-family:${SANS};font-size:16px;color:${INK};">${esc(v || '—')}</div></td>`,
    )
    .join(`<td width="1" bgcolor="${INK}"></td>`);
  return `<table width="100%" border="0" cellpadding="0" cellspacing="0" style="border:1px solid ${INK};margin-bottom:32px;"><tr>${tds}</tr></table>`;
}

function messageBlock(label, message) {
  return (
    `<div style="${mono(13, MUTED)}margin-bottom:8px;">${esc(label)}</div>` +
    `<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:40px;"><tr>` +
    `<td width="3" bgcolor="${INK}"></td>` +
    `<td bgcolor="#E4E7E1" style="padding:16px;font-family:${SANS};font-size:16px;line-height:1.5;color:${INK};">` +
    `${esc(message).replace(/\r?\n/g, '<br>')}</td></tr></table>`
  );
}

function actions(primaryHref, primaryLabel, linkHref, linkLabel) {
  return (
    `<table border="0" cellpadding="0" cellspacing="0"><tr>` +
    `<td bgcolor="${COBALT}" style="padding:14px 22px;"><a href="${esc(primaryHref)}" ` +
    `style="font-family:${SANS};font-weight:600;font-size:16px;color:#FFFFFF;text-decoration:none;">${esc(primaryLabel)}</a></td>` +
    `<td style="padding-left:16px;"><a href="${esc(linkHref)}" style="${mono(13, COBALT)}text-decoration:none;">${esc(linkLabel)}</a></td>` +
    `</tr></table>`
  );
}

function headline(text) {
  return `<h1 style="margin:0 0 16px;font-family:${SANS};font-weight:700;font-size:34px;line-height:1;letter-spacing:-0.03em;color:${INK};">${esc(text)}</h1>`;
}

/** Wordmark, sheet header, framed sheet with the cobalt corner mark (a cell: Gmail drops positioning), footer. */
function shell({ lang, title, sheet, meta, inner, footer }) {
  return (
    `<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="x-apple-disable-message-reformatting">` +
    `<title>${esc(title)}</title>` +
    `<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700&amp;family=JetBrains+Mono:wght@500&amp;display=swap" rel="stylesheet">` +
    `</head><body style="margin:0;padding:0;background-color:#F2F3EF;">` +
    `<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F2F3EF" style="background-color:#F2F3EF;"><tr><td align="center" style="padding:40px 20px;">` +
    `<table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">` +
    `<tr><td style="padding-bottom:24px;"><table width="100%" border="0" cellpadding="0" cellspacing="0"><tr>` +
    `<td style="font-family:${SANS};font-weight:700;font-size:18px;letter-spacing:-0.03em;color:${INK};">fmyers.dev</td>` +
    `<td align="right" style="${mono(11, MUTED)}">REV 2026.10</td></tr></table></td></tr>` +
    `<tr><td style="padding-bottom:10px;border-bottom:1px solid ${INK};"><table width="100%" border="0" cellpadding="0" cellspacing="0"><tr>` +
    `<td style="${mono(12, INK)}">${esc(sheet)}</td><td align="right" style="${mono(12, MUTED)}">${esc(meta)}</td>` +
    `</tr></table></td></tr>` +
    `<tr><td height="24"></td></tr>` +
    `<tr><td><table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F8F9F6" style="background-color:#F8F9F6;border:2px solid ${INK};">` +
    `<tr><td colspan="2" style="padding:40px 40px 12px;">${inner}</td></tr>` +
    `<tr><td></td><td width="28" height="28" bgcolor="${COBALT}" style="font-size:0;line-height:0;">&nbsp;</td></tr>` +
    `</table></td></tr>` +
    `<tr><td height="32"></td></tr>` +
    `<tr><td align="center" style="padding:0 20px;">${footer}</td></tr>` +
    `</table></td></tr></table></body></html>`
  );
}

/** b: { lang, name, email, type, budget, message, noJs, when, sheetUrl, replyTo, siteUrl } */
function renderSender(b) {
  const c = SENDER[b.lang];
  // The reply address and the site URL come from script properties (REPLY_TO, SITE_URL).
  const host = b.siteUrl.replace(/^https?:\/\//, '');
  const fill = (s) => s.replace('{email}', b.replyTo).replace('{host}', host);
  const l = LABELS[b.lang];
  const inner =
    `<table width="44" height="44" border="0" cellpadding="0" cellspacing="0" style="border:2px solid ${SIGNAL};margin-bottom:12px;">` +
    `<tr><td align="center" valign="middle" style="color:${SIGNAL};font-size:24px;">✓</td></tr></table>` +
    `<div style="${mono(13, SIGNAL)}margin-bottom:20px;">${esc(c.received)}</div>` +
    headline(c.h1) +
    `<p style="margin:0 0 32px;font-family:${SANS};font-size:17px;line-height:1.5;color:${MUTED};">${esc(fill(c.p))}</p>` +
    specGrid([
      [c.keys[0], l.types[b.type]],
      [c.keys[1], l.budgets[b.budget]],
      [c.keys[2], l.language],
    ]) +
    messageBlock(c.message, b.message) +
    actions(b.siteUrl + c.work, c.cta, 'https://wa.me/584249080683', 'WHATSAPP ↗');
  const footer =
    `<div style="${mono(11, MUTED)}line-height:1.6;margin-bottom:12px;">WHATSAPP +58 424 908 0683 · ${esc(b.replyTo.toUpperCase())} · IN/FRANCISCOMYERS</div>` +
    `<div style="font-family:${SANS};font-size:12px;line-height:1.5;color:${MUTED};">${esc(fill(c.why))}</div>`;
  return shell({
    lang: b.lang,
    title: COPY[b.lang].subject,
    sheet: c.sheet,
    meta: b.when,
    inner,
    footer,
  });
}

function renderOwner(b) {
  const l = LABELS.en;
  const who = b.name || b.email;
  const first = b.name ? b.name.split(' ')[0] : b.email;
  const inner =
    `<div style="${mono(13, SIGNAL)}margin-bottom:20px;">NEW BRIEF · ${esc((l.types[b.type] || 'no type').toUpperCase())}</div>` +
    headline(who) +
    `<p style="margin:0 0 32px;font-family:${SANS};font-size:17px;line-height:1.5;">` +
    `<a href="mailto:${esc(b.email)}" style="color:${COBALT};text-decoration:none;">${esc(b.email)}</a></p>` +
    specGrid([
      ['PROJECT TYPE', l.types[b.type]],
      ['BUDGET', l.budgets[b.budget]],
      ['LANGUAGE', LABELS[b.lang].language],
      ['JAVASCRIPT', b.noJs ? 'NO-JS' : 'YES'],
    ]) +
    messageBlock('MESSAGE', b.message) +
    actions(
      `mailto:${b.email}?subject=${encodeURIComponent('Re: ' + COPY[b.lang].subject)}`,
      `Reply to ${first} →`,
      b.sheetUrl,
      'OPEN SHEET ↗',
    );
  return shell({
    lang: 'en',
    title: 'New brief · ' + who,
    sheet: 'NEW BRIEF',
    meta: b.when,
    inner,
    footer: `<div style="${mono(11, MUTED)}">FMYERS.DEV · CONTACT FORM · /API/CONTACT</div>`,
  });
}
