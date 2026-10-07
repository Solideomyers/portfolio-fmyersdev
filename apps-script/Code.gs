/**
 * fmyers.dev contact backend (Google Apps Script, bound to the "Briefs" spreadsheet).
 * Called only by the Vercel function /api/contact with a shared key. See README.md.
 */
const SHEET = 'Briefs';
const HEADER = ['timestamp', 'lang', 'name', 'email', 'type', 'budget', 'message', 'noJs'];
const NO_JS_DAILY_CAP = 20;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const COPY = {
  en: {
    subject: 'Your brief to fmyers.dev',
    body: "Thanks for your brief. I'll reply within 2 business days (Venezuela time, UTC−4).\nThis is a copy of what you sent:",
  },
  es: {
    subject: 'Tu resumen para fmyers.dev',
    body: 'Gracias por tu resumen. Te respondo en 2 días hábiles (hora de Venezuela, UTC−4).\nEsta es una copia de lo que enviaste:',
  },
};

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const props = PropertiesService.getScriptProperties();
    if (!safeEqual(String(body.key || ''), String(props.getProperty('FORM_KEY') || ''))) {
      return out({ ok: false, reason: 'key' });
    }
    const email = String(body.email || '').trim();
    const message = String(body.message || '').trim();
    if (!EMAIL_RE.test(email) || email.length > 254 || !message || message.length > 5000) {
      return out({ ok: false, reason: 'invalid' });
    }
    const lang = body.lang === 'es' ? 'es' : 'en';
    const name = String(body.name || '')
      .trim()
      .slice(0, 200);
    const type = String(body.type || '').slice(0, 20);
    const budget = String(body.budget || '').slice(0, 20);
    const noJs = body.noJs === true;

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = getSheet();
      if (noJs && countNoJsToday(sheet) >= NO_JS_DAILY_CAP)
        return out({ ok: false, reason: 'cap' });
      sheet.appendRow([
        new Date(),
        lang,
        cell(name),
        cell(email),
        type,
        budget,
        cell(message),
        noJs,
      ]);
    } finally {
      lock.releaseLock();
    }

    MailApp.sendEmail({
      to: props.getProperty('NOTIFY_TO'),
      replyTo: email,
      subject: 'New brief · ' + (type || 'no type') + ' · ' + (name || email),
      body: [
        'From: ' + name + ' <' + email + '>',
        'Type: ' + type,
        'Budget: ' + budget,
        'Lang: ' + lang,
        'No-JS: ' + noJs,
        '',
        message,
      ].join('\n'),
    });
    MailApp.sendEmail({
      to: email,
      replyTo: 'hola@fmyers.dev',
      name: 'Francisco Myers',
      subject: COPY[lang].subject,
      body: COPY[lang].body + '\n\n— — —\n\n' + message,
    });
    return out({ ok: true });
  } catch (err) {
    console.error(err);
    return out({ ok: false, reason: 'error' });
  }
}

function getSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(SHEET);
  if (!sheet) {
    sheet = book.insertSheet(SHEET);
    sheet.appendRow(HEADER);
  }
  return sheet;
}

/** Counts today's (UTC) no-JS rows; only the last 200 rows can be from today under the cap. */
function countNoJsToday(sheet) {
  const last = sheet.getLastRow();
  if (last < 2) return 0;
  const start = Math.max(2, last - 199);
  const today = Utilities.formatDate(new Date(), 'UTC', 'yyyy-MM-dd');
  return sheet
    .getRange(start, 1, last - start + 1, HEADER.length)
    .getValues()
    .filter(
      (r) =>
        r[0] instanceof Date &&
        Utilities.formatDate(r[0], 'UTC', 'yyyy-MM-dd') === today &&
        r[7] === true,
    ).length;
}

/** Stores user text as text: a leading = + - @ would otherwise be evaluated as a formula. */
function cell(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function safeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
