// Content snapshot CLI.  node scripts/content.mjs export <out.json>   disk → { revision: 0, files }
//                         node scripts/content.mjs write <in.json> [root]   snapshot → disk
// Node 24 strips types, so the .ts modules are imported directly.
import { readFileSync, writeFileSync } from 'node:fs';
import { readFiles, writeFiles } from '../src/lib/snapshot-fs.ts';
import { validateFiles } from '../src/lib/snapshot.ts';

const [cmd, file, root = '.'] = process.argv.slice(2);

if (cmd === 'export' && file) {
  const files = readFiles('.');
  const errors = validateFiles(files);
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  writeFileSync(file, JSON.stringify({ revision: 0, files }, null, 2) + '\n');
} else if (cmd === 'write' && file) {
  writeFiles(JSON.parse(readFileSync(file, 'utf8')).files, root);
} else {
  console.error('usage: content.mjs export <out.json> | write <in.json> [root]');
  process.exit(2);
}
