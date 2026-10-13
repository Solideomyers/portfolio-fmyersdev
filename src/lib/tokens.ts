/**
 * Replaces {{name}} tokens with config values, so content files can mention single-source values
 * (the public email) without hardcoding them. Used on a Markdown entry's rendered HTML: Astro 7's
 * default Markdown processor (Sätteri) doesn't run remark plugins without an extra dependency.
 */
export const fillTokens = (text: string, tokens: Record<string, string>) =>
  text.replace(/\{\{(\w+)\}\}/g, (all, k: string) => tokens[k] ?? all);
