import { ROUTES, type Lang } from '../i18n/routes';

export const TYPES = ['saas', 'automation', 'contract', 'other'] as const;
export const BUDGETS = ['lt1k', '1-5k', '5-10k', '10k+', 'unsure'] as const;
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export interface Brief {
  lang: Lang;
  name: string;
  email: string;
  type: (typeof TYPES)[number] | '';
  budget: (typeof BUDGETS)[number] | '';
  message: string;
}
export type FieldError = 'invalid' | 'required' | 'too-long';
export type Errors = Partial<Record<'name' | 'email' | 'type' | 'budget' | 'message', FieldError>>;
type Input = FormData | Record<string, string | undefined>;

const str = (input: Input, key: string) => {
  const v = input instanceof FormData ? input.get(key) : input[key];
  return typeof v === 'string' ? v.trim() : '';
};

/** Validates a contact brief. Shared by the form script and /api/contact. */
export function parseBrief(
  input: Input,
): { ok: true; data: Brief } | { ok: false; errors: Errors } {
  const email = str(input, 'email');
  const message = str(input, 'message');
  const name = str(input, 'name');
  const type = str(input, 'type');
  const budget = str(input, 'budget');
  const lang: Lang = str(input, 'lang') === 'es' ? 'es' : 'en';
  const errors: Errors = {};
  if (!email) errors.email = 'required';
  else if (email.length > 254) errors.email = 'too-long';
  else if (!EMAIL_RE.test(email)) errors.email = 'invalid';
  if (!message) errors.message = 'required';
  else if (message.length > 5000) errors.message = 'too-long';
  if (name.length > 200) errors.name = 'too-long';
  if (type && !(TYPES as readonly string[]).includes(type)) errors.type = 'invalid';
  if (budget && !(BUDGETS as readonly string[]).includes(budget)) errors.budget = 'invalid';
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      lang,
      name,
      email,
      type: type as Brief['type'],
      budget: budget as Brief['budget'],
      message,
    },
  };
}

/** The off-screen "website" field is only ever filled by bots. */
export const isSpam = (input: Input) => str(input, 'website') !== '';
export const sentUrl = (lang: Lang) => ROUTES.contactSent[lang];
export const errorUrl = (lang: Lang) => `${ROUTES.contact[lang]}#send-error`;
