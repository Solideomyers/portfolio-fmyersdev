// Content snapshot CLI.  node scripts/content.mjs export <out.json>   disk → { revision: 0, files }
//                         node scripts/content.mjs write <in.json> [root]   snapshot → disk
//                         node scripts/content.mjs pull [root]              CONTENT_SOURCE fixture|live → disk + public/rev.json
//                         node scripts/content.mjs import                   disk → Supabase revision 1 (once)
// Node 24 strips types, so the .ts modules are imported directly.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readFiles, writeFiles } from '../src/lib/snapshot-fs.ts';
import { validateFiles } from '../src/lib/snapshot.ts';

const [cmd, file, root = '.'] = process.argv.slice(2);

// Legacy anon/service_role keys are JWTs and also go in Authorization; sb_ keys go in apikey only.
const keyHeaders = (key) => ({
  apikey: key,
  ...(key.startsWith('eyJ') && { authorization: `Bearer ${key}` }),
});

// { revision, files } from the committed fixture (default) or the live Supabase snapshot.
const loadSnapshot = async () => {
  const source = process.env.CONTENT_SOURCE ?? 'fixture';
  if (source === 'fixture')
    return JSON.parse(
      readFileSync(new URL('../tests/fixtures/content.snapshot.json', import.meta.url), 'utf8'),
    );
  if (source !== 'live') throw new Error(`unknown CONTENT_SOURCE "${source}" (fixture or live)`);
  const { SUPABASE_URL: url, SUPABASE_ANON_KEY: key } = process.env;
  if (!url || !key) throw new Error('CONTENT_SOURCE=live needs SUPABASE_URL and SUPABASE_ANON_KEY');
  const res = await fetch(`${url}/rest/v1/rpc/get_current_snapshot`, { headers: keyHeaders(key) });
  if (res.status !== 200) throw new Error(`Supabase answered ${res.status}`);
  const snap = await res.json();
  if (!snap || typeof snap.revision !== 'number' || !snap.files)
    throw new Error('Supabase returned no published snapshot');
  return snap;
};

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
} else if (cmd === 'pull') {
  // Everything is validated before anything is written, so a failure leaves the tree untouched.
  try {
    const dest = file ?? '.';
    const { revision, files } = await loadSnapshot();
    const errors = validateFiles(files);
    if (errors.length) throw new Error(errors.join('\n'));
    writeFiles(files, dest);
    mkdirSync(join(dest, 'public'), { recursive: true });
    writeFileSync(join(dest, 'public/rev.json'), JSON.stringify({ rev: revision }) + '\n');
  } catch (e) {
    console.error(`content pull failed: ${e.message}`);
    process.exitCode = 1;
  }
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
  const res = await fetch(`${url}/rest/v1/rpc/import_snapshot`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...keyHeaders(key) },
    body: JSON.stringify({ p_files: files }),
  });
  if (!res.ok) {
    console.error(`import failed: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  console.log(`imported ${Object.keys(files).length} files as revision ${await res.text()}`);
} else {
  console.error(
    'usage: content.mjs export <out.json> | write <in.json> [root] | pull [root] | import',
  );
  process.exit(2);
}
