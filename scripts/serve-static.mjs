// Minimal static server for e2e tests: serves the build's static output with a 404.html fallback.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { brotliCompressSync } from 'node:zlib';

const root = resolve(process.argv[2] ?? '.vercel/output/static');
const port = Number(process.argv[3] ?? 4329);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};

async function find(pathname) {
  const full = resolve(root, '.' + pathname);
  if (!full.startsWith(root)) return null; // no path traversal
  for (const candidate of [full, join(full, 'index.html'), `${full}.html`]) {
    try {
      if ((await stat(candidate)).isFile()) return candidate;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  const file = await find(decodeURIComponent(pathname));
  if (file) {
    const type = types[extname(file)] ?? 'application/octet-stream';
    let body = await readFile(file);
    // Like Vercel: Brotli for text, long-lived cache for hashed assets and fonts. Without these,
    // Lighthouse measures this test server instead of the site.
    const headers = { 'Content-Type': type };
    if (
      /^(text|application\/(json|xml)|image\/svg)/.test(type) &&
      /\bbr\b/.test(req.headers['accept-encoding'] ?? '')
    ) {
      body = brotliCompressSync(body);
      headers['Content-Encoding'] = 'br';
    }
    if (/^\/(_astro|fonts)\//.test(pathname))
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    res.writeHead(200, headers);
    res.end(body);
    return;
  }
  res.writeHead(404, { 'Content-Type': types['.html'] });
  res.end(await readFile(join(root, '404.html')));
}).listen(port, () => console.log(`static on http://localhost:${port}`));
