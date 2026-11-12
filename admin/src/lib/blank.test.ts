import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { splitFrontmatter, validateFiles, type Files } from '../../../src/lib/snapshot.ts';
import { blankFor, nextNumber, OTHER_WORK } from './blank.ts';

const files: Files = JSON.parse(
  readFileSync(new URL('../../../tests/fixtures/content.snapshot.json', import.meta.url), 'utf8'),
).files;

test('the next number is the next free FM-nn / OW-nn', () => {
  assert.equal(nextNumber(files, 'work'), 3); // FM-01 and FM-02 exist
  const owners = (JSON.parse(files[OTHER_WORK]) as unknown[]).length;
  assert.equal(nextNumber(files, 'otherWork'), owners + 1);
  assert.equal(nextNumber({}, 'work'), 1);
  assert.equal(nextNumber({}, 'otherWork'), 1);
});

test('a blank project is a draft pair that passes the schema', () => {
  const blank = blankFor('work', 3);
  const paths = Object.keys(blank).sort();
  assert.deepEqual(paths, [
    'src/content/work/en/fm-03-proyecto.mdx',
    'src/content/work/es/fm-03-proyecto.mdx',
  ]);
  for (const [path, text] of Object.entries(blank)) {
    const data = splitFrontmatter(text).data as Record<string, unknown>;
    assert.equal(data.id, 'FM-03');
    assert.equal(data.slug, 'proyecto-03');
    assert.equal(data.lang, path.includes('/en/') ? 'en' : 'es');
    assert.equal(data.draft, true);
    assert.equal(typeof data.year, 'number');
  }
  // as a draft it needs nothing filled in
  assert.deepEqual(validateFiles({ ...files, ...blank }), []);
});

// The expected errors of a blank project: its texts and cover, once it is no longer a draft.
test('a published blank project asks for exactly the texts the owner must fill', () => {
  const blank = blankFor('work', 3);
  const published = Object.fromEntries(
    Object.entries(blank).map(([p, t]) => [p, t.replace('draft: true', 'draft: false')]),
  );
  const errors = validateFiles({ ...files, ...published });
  for (const path of Object.keys(published))
    for (const k of ['title', 'summary', 'client', 'role', 'timeline', 'cover.src'])
      assert.ok(errors.includes(`${path}: ${k}: required text`), `${path} ${k}`);
  assert.equal(errors.length, 12, errors.join('\n')); // 6 per language, nothing else
});

test('a second blank project does not clash with the first', () => {
  const first = blankFor('work', 3);
  const n = nextNumber({ ...files, ...first }, 'work');
  assert.equal(n, 4);
  const errors = validateFiles({ ...files, ...first, ...blankFor('work', n) });
  assert.deepEqual(errors, []);
});

test('a blank other-work entry is the list plus one item, and needs its repository', () => {
  const n = nextNumber(files, 'otherWork');
  const blank = blankFor('otherWork', n, files);
  const list = JSON.parse(blank[OTHER_WORK]) as { id: string; repo: string }[];
  const before = (JSON.parse(files[OTHER_WORK]) as unknown[]).length;
  assert.equal(list.length, before + 1);
  assert.equal(list.at(-1)!.id, `OW-${String(n).padStart(2, '0')}`);
  const errors = validateFiles({ ...files, ...blank });
  assert.equal(errors.length, 1);
  assert.match(errors[0], new RegExp(`other-work\\.json\\[${before}\\]: repo`));
});
