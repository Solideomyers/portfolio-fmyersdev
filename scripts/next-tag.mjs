// Next release tag for .github/workflows/tag.yml (run on every merge to develop).
// Default: bump the minor of the highest vX.Y.Z tag. Override: a "Release-As: vX.Y.Z" line in the
// merged commit message (the squash body is the PR body); it must be greater than every tag.
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const SEMVER = /^v(\d+)\.(\d+)\.(\d+)$/;
const parse = (t) => {
  const m = SEMVER.exec(t);
  return m ? m.slice(1).map(Number) : null;
};
const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

export function nextTag({ tags, message }) {
  const last = tags.map(parse).filter(Boolean).sort(cmp).at(-1) ?? [0, 0, 0];
  const asked = /^Release-As:\s*(\S+)\s*$/m.exec(message);
  if (asked) {
    const v = parse(asked[1]);
    if (!v) throw new Error(`Release-As "${asked[1]}" is not vX.Y.Z`);
    if (cmp(v, last) <= 0)
      throw new Error(`Release-As ${asked[1]} must be greater than v${last.join('.')}`);
    return asked[1];
  }
  return `v${last[0]}.${last[1] + 1}.0`;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  // No shell: the same arguments on Linux CI and on Windows (cmd.exe keeps single quotes).
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
  try {
    console.log(
      nextTag({
        tags: git('tag', '--list', 'v*').split('\n').filter(Boolean),
        message: git('log', '-1', '--format=%B'),
      }),
    );
  } catch (e) {
    console.error(`::error::${e.message}`);
    process.exit(1);
  }
}
