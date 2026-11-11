// Content snapshot CLI.  node scripts/content.mjs export <out.json>   disk → { revision: 0, files }
//                         node scripts/content.mjs write <in.json> [root]   snapshot → disk
//                         node scripts/content.mjs import                   disk → Supabase revision 1 (once)
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
} else if (cmd === 'import') {
  // One-time seed: disk → revision 1 through rpc/import_snapshot, using the service-role key from .env.
  process.loadEnvFile('.env');
  const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env;
  if (!url || !key) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env');
    process.exit(1);
  }
  const files = readFiles('.');
  const errors = validateFiles(files);
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  // Legacy service_role keys are JWTs and also go in Authorization; sb_secret_ keys go in apikey only.
  const headers = { 'content-type': 'application/json', apikey: key };
  if (key.startsWith('eyJ')) headers.authorization = `Bearer ${key}`;
  const res = await fetch(`${url}/rest/v1/rpc/import_snapshot`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ p_files: files }),
  });
  if (!res.ok) {
    console.error(`import failed: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  console.log(`imported ${Object.keys(files).length} files as revision ${await res.text()}`);
} else {
  console.error('usage: content.mjs export <out.json> | write <in.json> [root] | import');
  process.exit(2);
}
