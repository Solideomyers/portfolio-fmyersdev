// CI: the default build (BLOG_ENABLED unset) must neither contain nor link the notes section.
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const root = process.argv[2] ?? '.vercel/output/static';
const BLOG = /^\/(en\/notes|es\/notas|og\/notes)(\/|$)/;
const LINK = /href="\/(en\/notes|es\/notas)(["/?#])/;
const found = [];

async function walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    const rel = '/' + relative(root, full).split(sep).join('/');
    if (BLOG.test(rel)) {
      found.push(rel);
      continue;
    }
    if (e.isDirectory()) await walk(full);
    else if (e.name.endsWith('.html') && LINK.test(await readFile(full, 'utf8')))
      found.push(`${rel} links to the blog`);
  }
}

await walk(root);
if (found.length) {
  console.error(
    `The blog is off (BLOG_ENABLED=false) but the build contains:\n${found.join('\n')}`,
  );
  process.exit(1);
}
console.log('blog hidden: ok');
