import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { editFrontmatter } from './yaml-edit.ts';

const fixture: { files: Record<string, string> } = JSON.parse(
  readFileSync(new URL('../../../tests/fixtures/content.snapshot.json', import.meta.url), 'utf8'),
);

const doc = '---\n# keep me\nid: P-01\nname: Old\nfrom: 3200\n---\n\nBody **text**\n';
const frontmatter = (t: string) => parse(/^---\n([\s\S]*?)\n---/.exec(t)![1]);
const body = (t: string) => t.slice(t.indexOf('\n---', 4) + 4);

// Review Focus 1: a typed value with YAML-significant characters is written quoted and parses back.
test('values with YAML-significant characters round-trip as the same string', () => {
  const values = [
    'a: b',
    '- x',
    '# c',
    'x #y',
    'Fast, cheap',
    '*star',
    '"q"',
    '@at',
    'key:',
    'true',
    '123',
    'null',
    ' padded ',
    'multi\nline',
  ];
  for (const v of values) {
    const out = editFrontmatter(doc, { name: v });
    assert.equal(frontmatter(out).name, v, JSON.stringify(v));
    assert.equal(frontmatter(out).from, 3200);
    assert.match(out, /# keep me/);
    assert.equal(body(out), body(doc));
  }
});

test('arrays and nested keys are written and read back', () => {
  const out = editFrontmatter(doc, {
    includes: ['One: 1', 'Two'],
    'service.proof': 'Recent: ChurchApp',
  });
  assert.deepEqual(frontmatter(out).includes, ['One: 1', 'Two']);
  assert.equal(frontmatter(out).service.proof, 'Recent: ChurchApp');
});

test('only the edited line changes', () => {
  const out = editFrontmatter(doc, { name: 'New' });
  assert.equal(out, doc.replace('name: Old', 'name: New'));
});

// The panel must not reformat what the owner did not touch. Pricing, notes and pages hold.
// Case studies (src/content/work) do not yet: they use Prettier's multi-line flow lists and padded
// `{ a: b }` mappings, which `yaml` re-serialises differently. The project editor (plan Task 9,
// "a case study round-trips unchanged") has to patch those files in place instead of re-serialising.
test('an empty patch returns pricing, notes and pages byte for byte', () => {
  const md = Object.entries(fixture.files).filter(([p]) =>
    /^src\/content\/(pricing|notes|pages)\/.+\.mdx?$/.test(p),
  );
  assert.ok(md.length > 0);
  for (const [path, text] of md) assert.equal(editFrontmatter(text, {}), text, path);
});
