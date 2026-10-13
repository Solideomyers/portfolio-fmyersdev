import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

// OG card, 1200×630, light sheet style. Literal hex = the light-theme tokens (no CSS here).
const INK = '#15181C';
const fonts = () =>
  Promise.all(
    ['Archivo-Regular.woff', 'Archivo-Bold.woff', 'JetBrainsMono-Medium.woff'].map((f) =>
      readFile(resolve(process.cwd(), 'src/assets/fonts', f)),
    ),
  );

type Child = Node | string;
interface Node {
  type: string;
  props: { style: Record<string, unknown>; children?: Child | Child[] };
}
const h = (style: Record<string, unknown>, children?: Child | Child[]): Node => ({
  type: 'div',
  props: { style, children },
});

/** The sheet card shared by every OG image: header row (sheet · meta), title, dek, wordmark. */
export async function renderSheetOg(n: {
  lang: 'en' | 'es';
  sheet: string;
  meta: string;
  title: string;
  dek: string;
}): Promise<Uint8Array> {
  const [regular, bold, mono] = await fonts();
  const tree = h(
    { width: 1200, height: 630, display: 'flex', padding: 56, background: '#F2F3EF' },
    [
      h(
        {
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          border: `2px solid ${INK}`,
          padding: 44,
          gap: 24, // keeps the wordmark clear of a 3-line title + 2-line dek
          fontFamily: 'Archivo',
          color: INK,
        },
        [
          h({ display: 'flex', flexDirection: 'column', gap: 24 }, [
            h(
              {
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: 'JetBrains Mono',
                fontSize: 22,
                letterSpacing: 2,
                paddingBottom: 14,
                borderBottom: `1px solid ${INK}`,
              },
              [h({}, n.sheet), h({}, n.meta)],
            ),
            h(
              {
                display: 'block',
                fontWeight: 700,
                fontSize: 64,
                lineHeight: 1,
                letterSpacing: -1.9,
                lineClamp: 3,
              },
              n.title,
            ),
            h(
              { display: 'block', fontSize: 28, lineHeight: 1.4, color: '#5B626A', lineClamp: 2 },
              n.dek,
            ),
          ]),
          h({ fontWeight: 700, fontSize: 28, letterSpacing: -0.8 }, 'fmyers.dev'),
          h({
            position: 'absolute',
            right: -2,
            bottom: -2,
            width: 40,
            height: 40,
            background: '#2B55C8',
          }),
        ],
      ),
    ],
  );
  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Archivo', data: regular, weight: 400, style: 'normal' },
      { name: 'Archivo', data: bold, weight: 700, style: 'normal' },
      { name: 'JetBrains Mono', data: mono, weight: 500, style: 'normal' },
    ],
  });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}

export const renderNoteOg = (n: {
  id: string;
  lang: 'en' | 'es';
  category: string;
  title: string;
  dek: string;
}) =>
  renderSheetOg({
    lang: n.lang,
    sheet: `${n.lang === 'es' ? 'LÁMINA 07 — NOTAS' : 'SHEET 07 — NOTES'} · ${n.id}`,
    meta: n.category.toUpperCase(),
    title: n.title,
    dek: n.dek,
  });
